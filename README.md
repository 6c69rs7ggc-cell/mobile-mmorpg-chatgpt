# ASHEN REALM — Mobile RPG Prototype

Playable mobile-first browser RPG prototype. The game currently runs entirely in one `index.html` file and requires no build tools or external libraries.

## Run the game
Open `index.html` in a modern browser. On a phone, use the left joystick to move and the buttons on the right to attack, use a special strike, drink a potion, or toggle the map. On desktop, use WASD or arrow keys; Space attacks, Q uses the special strike, and E drinks a potion.

## Current features
- Canvas-rendered forest, winding path, trees, rocks, and a following camera
- Touch joystick and keyboard movement
- Slime enemies that pursue and damage the player
- Basic and area attacks with hit effects and damage numbers
- Health, XP, levels, gold, potions, kill count, and a five-kill quest
- Minimap and mobile-friendly HUD

## Honest status
This is an early single-player prototype, **not yet an online multiplayer MMORPG**. There is no account system, server, shared world, persistent save, inventory equipment, or multiplayer synchronization yet.

## Development roadmap
1. Stabilize the combat and add collision with world objects.
2. Add persistent save/load and a real inventory/equipment screen.
3. Add NPCs, quests, drops, and more enemy types.
4. Split code into modules and add automated checks.
5. Build a backend with authentication, authoritative combat, and a shared multiplayer world.
