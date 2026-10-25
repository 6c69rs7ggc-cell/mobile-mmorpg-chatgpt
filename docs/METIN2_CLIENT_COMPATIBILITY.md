# Metin2 Mobile Client Compatibility — 25 October 2026

## Decision

**Do not buy hosting yet.** The project is blocked on a client that can run on iPhone and communicate with a server we control. A PC Metin2 server alone does not make an iPhone client compatible.

## Candidates checked

| Candidate | Evidence found | iPhone/custom-server status | Decision |
|---|---|---|---|
| Old2.pl iOS TestFlight | Operator announced iPhone/iPad + Android + PC cross-play on one account/server in October 2026 | Public evidence describes access to Old2's own server. No verified custom IP/server selection or permission to point the app at another server | Reference only; don't rely on it as our client |
| HeusMt2 mobile | Official page says Android and iOS clients are in development | Download buttons are not live; it is intended for their own server | Not usable now |
| Alesta2 Mobile | Android build announced; iOS described as awaiting approval in recent project coverage | No verified generally available iOS client or custom-server compatibility | Not a current iPhone solution |
| Cemre Android client | Public Android port with native client code and server setup guide | Android-focused, not an iOS build; compatibility depends on matching protocol/data/server | Not suitable for the iPhone-only workflow |
| metin2-godot | Open-source MIT migration project; Godot 4.7 client/server baseline, terrain and some assets pipeline demonstrated | Explicitly a feasibility baseline, not a finished game. iOS packaging, full gameplay/networking and rights gate remain open | Strongest research candidate for a legitimate engineering base, but not a ready game |
| QCX / Quantum Core X | Open-source C# server emulator, work in progress | Does not supply a finished iOS client or complete original game assets | Server-only experiment, not enough by itself |

## Sources

- Old2 mobile announcement: https://old2.pl/news
- HeusMt2 mobile status: https://heusmt2.com/en/mobile
- Alesta2 mobile page: https://alestamt2.com.tr/en/indir
- Android client build guide (Android only): https://metin2.gg/en/blog/metin2-android-client-build-server-setup
- Godot migration repository: https://github.com/EnriqueGF/metin2-godot
- Quantum Core X: https://github.com/MeikelLP/quantum-core-x

## Recommended route

1. Keep all spending at zero until the client gate is passed.
2. Inspect the Godot migration's README, plan and licensing gate; do not copy proprietary client source, game data, maps, textures or models into this repository.
3. Treat a **real iPhone test build** as the first pass/fail gate: it must launch on iOS, render a map, accept touch input, log in to a server we control and enter the world.
4. Only after that test succeeds, choose a small Linux server and configure EXP/drop/Yang rates.
5. If a legal iOS client cannot be built from available sources, pivot explicitly: either build an original browser MMORPG playable on iPhone (not claim it is original Metin2), or seek written permission/licensed client access. Do not spend money on VPS before this decision.

## What is not proven yet

- Old2's iOS app can connect to arbitrary servers.
- Any currently available public iOS client can connect to our own server.
- The Godot project is a complete or playable Metin2 replacement.
- Original Metin2 content can be redistributed legally just because a server/client source repository is public.
