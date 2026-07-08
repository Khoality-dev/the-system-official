# Phone screenshots — v1

Captured from the running app on a Pixel 6 emulator (1080×2400, Android 15). Portrait, well above
the Play minimum (320px); usable on Amazon / Samsung / itch.io / Play.

Captured from a **release** build, so the `BuildConfig.DEBUG`-only "▸ simulate missed deadline"
control is hidden — these are store-ready as-is. (The full-screen HUD bezel frame is deferred — see
issue #50 — so it is intentionally absent here.)

| File | Screen |
|---|---|
| `01-awakening.png` | Awakening — the System notification ("acquired the qualifications to be a Player") |
| `02-quest.png` | QUEST INFO — daily goals, auto rep-count, STR/VIT/AGI + locked INT/PER |
| `03-status.png` | STATUS — level, rank, HP/XP, stats, Hunter's Card, lifetime stats, achievements |
| `04-growth.png` | GROWTH — progression charts (total power, per-stat growth, weekly XP) |
| `05-shop.png` | REWARD SHOP — coin-earned cosmetics/consumables |

## Note before store upload
These come from a release build signed with the local **debug** keystore (for emulator capture only).
Before publishing, the upload artifact itself must be signed with the real **release** keystore — the
screenshots are unaffected (visually identical).
