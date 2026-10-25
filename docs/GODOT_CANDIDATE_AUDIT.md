# Upstream Godot candidate audit — 25 October 2026

## Candidate

Repository: https://github.com/EnriqueGF/metin2-godot

The upstream README currently describes a traceable migration of the Metin2 0.4.1 client/server to Godot 4.7. It reports:
- a minimal shared client/server project;
- terrain conversion for six maps and audit of Shinsoo, Chunjo and Jinno City1/City2;
- a couple of rigid GR2 props/buildings imported into Godot;
- documented smoke commands for client and server.

The same README explicitly says this is a feasibility baseline, not a migrated/finished game. Actors and animations, SPT/MSE, collision, gameplay, networking, persistence and distribution rights remain open. It distributes no original game assets and says users must provide their own local source/assets.

## Build commands documented upstream

Source audit:
```sh
cp config/source-layout.example.json config/source-layout.local.json
python3 tools/audit_sources.py --config config/source-layout.local.json --output reports/source-audit.json
```

Server/client smoke tests:
```sh
godot --headless --path godot -- --smoke-test --expect-role=server
godot --headless --path godot -- --role=client --smoke-test --expect-role=client
```

These commands are documented by upstream; they have **not** been run in this repository or in this project's GitHub Actions. The source audit requires a local copy of source/assets and therefore cannot be assumed to pass in a clean cloud checkout.

## Decision

Do not copy the upstream project or proprietary game assets into this repository yet. First verify the upstream code license and exact files needed for a clean headless smoke test; separate tests that require local game data. Then create an isolated CI job pinned to a specific upstream commit, with no secrets and no proprietary files. A green headless smoke test only establishes basic project startup, not iOS export, gameplay completeness, or rights to distribute Metin2 content.

## Evidence

- Upstream README and documented state: https://github.com/EnriqueGF/metin2-godot
- Godot iOS export documentation: https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_ios.html
- Godot licence compliance guidance: https://docs.godotengine.org/en/latest/about/complying_with_licenses.html

## Current project status

The repository this document lives in still contains the separate ASHEN REALM browser prototype plus project planning documents. It does not yet contain the upstream Godot migration or a Metin2 client/server.
