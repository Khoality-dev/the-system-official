# the-system-official — download / landing website

The public **website** for THE SYSTEM — a daily-quest self-improvement RPG for Android.
Static HTML/CSS/JS, no build step. Hosted on **GitHub Pages**:

**https://khoality-dev.github.io/the-system-official/**

| File | Purpose |
|------|---------|
| `index.html` | Landing / overview |
| `the-system.html`, `about.html` | How it works · about |
| `download.html` | Download page (APK from GitHub Releases) |
| `privacy-policy.html` | Privacy policy (required by store listings) |
| `site/` | Shared CSS / JS / images |
| `assets/` | Store + marketing graphics, app screenshots |
| `docker-compose.yml`, `nginx.conf` | Optional local preview / self-hosting |

## The download

The APK is distributed via this repo's **[Releases](../../releases)**. `download.html` +
`site/site.js` read the **latest release** through the GitHub API and, when it finds an
asset ending in `.apk`, point the Download button straight at it and fill in the version +
size automatically — so each new release updates the page with no HTML edit. Until the first
release is published the button stays pending and links to the releases page.

**To publish a build:** create a release and attach the signed APK (an asset named
`the-system.apk` is ideal, but any `*.apk` asset is picked up).

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

- The "Also available on" store links (Amazon / Samsung / itch.io) are still `#`
  placeholders — swap them for live listing URLs as each store goes live.
