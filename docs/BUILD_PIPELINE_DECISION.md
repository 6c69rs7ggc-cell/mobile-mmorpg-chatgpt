# Build Pipeline Decision — 25 October 2026

## What the current repository actually is

The default branch currently contains `index.html`, a standalone browser RPG prototype named **ASHEN REALM**. It is not a Metin2 client and it does not connect to a multiplayer server. The Metin2 research documents are planning material; no Godot migration source has been imported into this repository.

## Can an iPhone-only owner build the iOS app?

Not directly on the iPhone. Godot's official export guide requires macOS with Xcode to export an iOS project. A remote macOS build host or a macOS CI runner can do the build steps, but signing and installation on a real iPhone still need Apple signing credentials and an appropriate distribution path.

Official docs:
- https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_ios.html
- https://docs.godotengine.org/en/latest/tutorials/export/exporting_for_ios.html

## Low-cost decision

1. **Do not purchase a VPS or paid game client yet.**
2. First run the candidate Godot project’s documented headless client/server smoke tests in a Linux CI runner. This checks basic project integrity, not iOS compatibility or full gameplay.
3. If the source audit and smoke tests pass, investigate whether a macOS CI runner can export an unsigned iOS project. Do not put Apple secrets into the repository; use encrypted CI secrets only if the owner chooses to configure them.
4. A successful build is not the same as a working game. Require an actual iPhone launch and a connection to a server we control before proceeding.
5. The candidate migration project explicitly says gameplay, networking, persistence, actor animations and distribution-rights checks remain open. Its visual evidence is not proof of a finished game.

## Current status

- [x] Identify the current repository's existing web prototype.
- [x] Identify a potential open-source Godot migration research candidate.
- [x] Document the iOS/macOS/Xcode requirement.
- [ ] Obtain and inspect a clean copy of the candidate repository.
- [ ] Run its documented smoke tests in CI.
- [ ] Complete source/assets licensing review.
- [ ] Build and launch an iOS test app.
- [ ] Connect that app to a server we control.
- [ ] Verify one server-authoritative monster fight and persistence.

## Important boundary

Do not claim the existing ASHEN REALM web prototype is Metin2. It can remain a separate mobile-browser experiment, but the requested Metin2-like project must pass the client/server and content-rights gates above.
