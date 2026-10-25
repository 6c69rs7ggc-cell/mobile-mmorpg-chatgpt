# What is needed to run the full Metin2 world

## Why CI is green while the world server is not yet validated
The automated checks run without copyrighted game files. The current upstream candidate expects local source data to be converted into `generated/maps/`, and that directory is intentionally Git-ignored. A green asset-independent workflow proves code-level checks pass; it does not prove the map-backed server starts.

## Minimum local source material
For the currently audited Alpha cities (six maps: `metin2_map_a1`, `metin2_map_a3`, `metin2_map_b1`, `metin2_map_b3`, `metin2_map_c1`, `metin2_map_c3`), the migration documents identify these input families:

- Client terrain sectors and map properties/area data for the six city maps.
- Client `attr.atr` files and server `server_attr` files for authoritative collision.
- Server `Town.txt`, `npc.txt`, `regen.txt`, `stone.txt`, and `boss.txt` for town locations and NPC/mob/spawn rules.
- Matching source client/server 0.4.1 code is the reference oracle for the converters.
- Later, actor/monster GR2 models, materials/textures and animation mappings are needed for real character and monster visuals; these are not required for the asset-independent code tests.

The exact source roots and converter instructions are in the upstream project:
- [Canonical source map](https://github.com/EnriqueGF/metin2-godot/blob/078d39a41a3ef17c9e09fb9807956cb1a2f16641/docs/10-mapa-source.md)
- [Collision conversion contract](https://github.com/EnriqueGF/metin2-godot/blob/078d39a41a3ef17c9e09fb9807956cb1a2f16641/docs/06-city-collision-contract.md)
- [Server content conversion contract](https://github.com/EnriqueGF/metin2-godot/blob/078d39a41a3ef17c9e09fb9807956cb1a2f16641/docs/07-city-server-content-contract.md)
- [Upstream README and converter commands](https://github.com/EnriqueGF/metin2-godot/blob/078d39a41a3ef17c9e09fb9807956cb1a2f16641/README.md)

## Reproducible conversion commands
These commands must be run in a workspace that has the permitted source files and a Python 3 environment:

```bash
python3 tools/convert_city_attributes.py
python3 tools/convert_city_server_content.py
python3 tools/convert_city_terrain.py
godot --headless --path godot --script res://tools/validate_collision_registry.gd -- --collision-content-root="$PWD/generated/maps"
godot --headless --path godot --script res://tools/validate_city_content_catalog.gd -- --content-root="$PWD/generated/maps"
godot --headless --path godot -- --smoke-test --expect-role=server
```

The full source audit also needs `config/source-layout.local.json` configured from `config/source-layout.example.json`.

## Safe handling
- Do not commit original game files, extracted assets, credentials or generated private game data to this public repository.
- Do not assume a client/server binary from another private server can legally or technically be reused.
- Verify rights for any original assets and distribution before publishing or hosting the game.

## Current next gate
Run conversion in a machine/workspace with the source files, validate all six map manifests and collision grids, then run the real map-backed server smoke test. After that, connect a client over ENet and test login, character creation, movement, combat, persistence and reconnect. iOS export and TestFlight/device testing are separate gates.
