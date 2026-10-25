# iPhone Proof of Concept — Acceptance Checklist

This checklist prevents spending money before a working iOS client is demonstrated.

## Gate A — Client can be built
- [ ] Confirm the selected codebase's license and source provenance.
- [ ] Confirm the project opens and runs in its documented development environment.
- [ ] Build an iOS simulator target or a signed iPhone test build using a supported macOS/Xcode environment.
- [ ] Launch the build without crashing.

## Gate B — A real scene works
- [ ] Load one test map/terrain.
- [ ] Render at least one character or placeholder.
- [ ] Touch controls move the character.
- [ ] Camera responds correctly to touch.

## Gate C — Server connection works
- [ ] Start a server we control.
- [ ] Connect the iOS client to the server address without hard-coded third-party services.
- [ ] Log in with a test account.
- [ ] Enter a world/map and receive authoritative character state from the server.
- [ ] Verify reconnect and a second client/session.

## Gate D — First playable loop
- [ ] Spawn one monster.
- [ ] Attack it and receive server-validated damage.
- [ ] Gain EXP and level up.
- [ ] Drop and pick up one test item.
- [ ] Persist character progress after logout and login.

## Budget rule
No VPS subscription, paid client purchase or game-asset purchase until Gates A–C pass. Gate D must pass before calling the result a playable MMORPG.

## Practical limitation
An iPhone alone cannot compile a native Godot/iOS app locally. The build needs a compatible macOS/Xcode environment, such as a trusted Mac or a suitable remote build service. GitHub can hold the source and automate some checks, but it does not by itself provide Apple's signing credentials or prove that the app works on a physical iPhone.
