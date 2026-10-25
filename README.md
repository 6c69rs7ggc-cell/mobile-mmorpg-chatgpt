# ASHEN REALM — Mobile RPG Prototype

Playable mobile-first browser RPG prototype. The game runs in a single `index.html` file and needs no build tools or external libraries.

## Run the game
Open `index.html` in a modern browser. On a phone, use the left joystick to move and the buttons on the right to attack, use a special strike, drink a potion, or toggle the map. Open **INVENTÁR** in the top-right panel to buy weapon and armor upgrades. On desktop, use WASD or arrow keys; Space attacks, Q uses the special strike, and E drinks a potion.

## Features
- Canvas-rendered forest, winding path, trees, rocks, and a following camera
- Touch joystick and keyboard movement
- Collision with trees and rocks
- Slime enemies that pursue and damage the player
- Basic and area attacks with hit effects and damage numbers
- Health, XP, levels, gold, potions, kill count, and a five-kill quest with a reward
- Inventory panel with weapon and armor upgrades purchased using gold
- Local browser save for character progression and equipment upgrades
- Minimap and mobile-friendly HUD

## Honest status
This is an early single-player prototype, **not yet an online multiplayer MMORPG**. There is no account system, server, shared world, cloud save, NPC dialogue, or multiplayer synchronization yet. Progress is saved only in the same browser on the same device.

## Roadmap
1. Test and polish mobile controls, combat, and collision.
2. Add NPCs, dialogue, vendors, item drops, and more enemy types.
3. Add persistent inventory and equipment variety.
4. Split code into modules and add automated checks.
5. Build a backend with authentication, authoritative combat, and a shared multiplayer world.
