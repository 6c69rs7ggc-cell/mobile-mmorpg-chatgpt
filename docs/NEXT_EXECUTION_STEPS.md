# Next execution steps — Metin2 mobile project

## Current verified boundary

The repository currently contains a browser RPG prototype and planning notes. The upstream candidate `EnriqueGF/metin2-godot` is separate and does not include original game assets. Its README documents headless client/server smoke commands, but these have not yet been executed by this project.

## Immediate sequence

1. Pin and inspect the upstream repository's current commit, license file, workflow and project layout.
2. Determine whether the server/client smoke tests can run without local proprietary assets.
3. If yes, create a separate GitHub Actions workflow that checks out a pinned upstream commit into a temporary directory and runs only the asset-independent smoke tests. Do not mirror upstream source into this repository without a clear reason.
4. If the smoke tests require proprietary assets or unverified tools, stop and document the exact blocker; do not download or commit them.
5. Only after the clean CI test passes, estimate the next client milestone. A real iOS build still requires a macOS/Xcode environment and an appropriate Apple signing path.
6. Do not purchase hosting until an iPhone client can connect to a server we control.

## Completion criteria for this phase

- [ ] Upstream commit and license recorded.
- [ ] CI prerequisites verified.
- [ ] Clean headless smoke test passes or its blocker is recorded.
- [ ] No proprietary assets or secrets committed.
- [ ] No claim of iPhone compatibility until a signed build is launched on a real device.
