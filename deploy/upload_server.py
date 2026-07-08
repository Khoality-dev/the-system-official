#!/usr/bin/env python3
"""Minimal authenticated APK upload endpoint for the own-site download channel.

The release CI (`.github/workflows/android-release.yml`) PUTs the signed release APK here after a
build; the file is written atomically to the shared download volume, from where nginx serves it at
`/dl/the-system.apk`. Auth is a bearer token (`DEPLOY_TOKEN`) compared in constant time. Stdlib only
(no third-party deps), so it runs on a bare `python:3.12-slim` with no build step.

Env:
  DEPLOY_TOKEN   required — the shared secret the CI presents as `Authorization: Bearer <token>`
  APK_DEST       output path (default /data/the-system.apk); its dir is the nginx-served volume
  APK_MAX_BYTES  reject bodies larger than this (default 200 MiB)
  PORT           listen port (default 9000)
"""
from __future__ import annotations

import hmac
import os
import sys
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOKEN = os.environ.get("DEPLOY_TOKEN", "")
DEST = os.environ.get("APK_DEST", "/data/the-system.apk")
MAX_BYTES = int(os.environ.get("APK_MAX_BYTES", str(200 * 1024 * 1024)))


class Handler(BaseHTTPRequestHandler):
    server_version = "apk-uploader/1"

    def _reply(self, code: int, msg: str) -> None:
        body = (msg + "\n").encode()
        self.send_response(code)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _authed(self) -> bool:
        # Constant-time compare; an unset token means the endpoint is disabled (never authorize).
        return bool(TOKEN) and hmac.compare_digest(
            self.headers.get("Authorization", ""), f"Bearer {TOKEN}"
        )

    def do_PUT(self) -> None:
        self._upload()

    def do_POST(self) -> None:
        self._upload()

    def _drain(self, length: int) -> None:
        # Read and discard the request body. Rejecting before consuming the body would
        # break the (proxied) connection mid-stream and surface as a 502; nginx already
        # caps the size (client_max_body_size), so this is bounded.
        remaining = length
        while remaining > 0:
            chunk = self.rfile.read(min(65536, remaining))
            if not chunk:
                break
            remaining -= len(chunk)

    def _upload(self) -> None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = -1
        if length < 0:
            self._reply(400, "bad content-length")
            return
        if not self._authed():
            self._drain(length)
            self._reply(401, "unauthorized")
            return
        if length == 0:
            self._reply(400, "empty body")
            return
        if length > MAX_BYTES:
            self._drain(length)
            self._reply(413, "body too large")
            return

        dest_dir = os.path.dirname(DEST) or "."
        os.makedirs(dest_dir, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=dest_dir, suffix=".part")
        try:
            remaining = length
            with os.fdopen(fd, "wb") as f:
                while remaining > 0:
                    chunk = self.rfile.read(min(65536, remaining))
                    if not chunk:
                        raise OSError("short read from client")
                    f.write(chunk)
                    remaining -= len(chunk)
            os.chmod(tmp, 0o644)  # world-readable so the nginx worker can serve it
            os.replace(tmp, DEST)  # atomic — a concurrent download never sees a partial file
        except Exception as exc:  # noqa: BLE001 — report any write failure to the caller
            try:
                os.unlink(tmp)
            except OSError:
                pass
            self._reply(500, f"write failed: {exc}")
            return
        self._reply(200, f"ok {length}")

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("[apk-uploader] " + (fmt % args) + "\n")


def main() -> None:
    if not TOKEN:
        sys.stderr.write("DEPLOY_TOKEN not set — refusing to start\n")
        raise SystemExit(1)
    port = int(os.environ.get("PORT", "9000"))
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
