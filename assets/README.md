# Store assets — v1

Graphics for the multi-store launch (Amazon, Samsung, itch.io, own site; Play later). See
`../store-listing-en.md` for copy and `../distribution.md` for the publishing steps.

| File | Spec | Use |
|---|---|---|
| `store-icon.png` | 512×512, 32-bit PNG | App/store icon — the blue gate-badge logo (matches the in-app launcher icon) |
| `app-icon-source.png` | 1254×1254 | High-res master for the app icon; re-derive launcher/store icons from here |
| `feature-graphic.png` | 1024×500, 24-bit (no alpha) | Store feature graphic / banner |
| `feature-graphic-source.png` | 1795×876 | High-res master for the feature graphic; re-crop from here |

The in-app launcher icon (`app/src/main/res`) is an **adaptive icon**: `drawable-nodpi/
ic_launcher_foreground.png` (the logo scaled to ~88% so the HUD ring stays inside the mask safe
zone) over the `@color/ic_launcher_bg` dark background. Launcher masking trims only the decorative
corner diamonds.

## Still needed
- **Phone screenshots** — ≥2, portrait 1080×1920 (QUEST + STATUS windows). Captured from the running
  app, not designed.

## Note
The feature graphic teases all four stat tiers (STRENGTH / AGILITY / VITALITY / INTELLIGENCE).
INTELLIGENCE is the **Mind pillar (INT)** — locked behind Enhanced and **not in the free v1** (body
only: STR/VIT/AGI). It reads as "more to unlock," not an available v1 feature.
