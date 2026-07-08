# the-system-webpage — download/landing website

The public **website** for THE SYSTEM (the Android app lives in the sibling repo `../the-system/`).
Static HTML/CSS — no build step.

| File | Purpose |
|------|---------|
| `index.html` | Download / landing page |
| `privacy-policy.html` | Privacy policy (required by store listings) |
| `assets/` | Store + marketing graphics, app screenshots |
| `distribution.md`, `store-listing-en.md` | Store/distribution notes (not web pages) |
| `docker-compose.yml`, `nginx.conf` | Local preview / self-hosting |

## Run locally — Docker

nginx (alpine) serves this folder. From this directory:

```
docker compose up -d        # then open http://localhost:8080
docker compose down
```

`nginx.conf` hides the repo/meta files (`*.md`, `*.yml`, `*.conf`, dotfiles) so only the
actual site is served, gzips text, and long-caches image assets. Override the port with
`WEBSITE_PORT=9000 docker compose up -d`.

## Before / after launch

- The download button points at the app repo's **Releases** page
  (`github.com/Khoality-dev/the-system/releases`), which the `v*` release workflow
  fills with signed builds. Repoint it at a direct APK URL if you host the file yourself.
- The "Also available on" store links (Amazon / Samsung / itch.io) are still `#`
  placeholders — swap them for live listing URLs as each store goes live.
</content>
</invoke>
