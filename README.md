# Just Salad Runner

A retro-style endless runner game where you control a salad bowl, catching healthy ingredients while avoiding junk food.

## Development Setup

1. No build process required - pure HTML/JS using Phaser 3.60.0
2. Open `index.html` in a web browser to run the game
3. Font requirements: "Press Start 2P" (loaded via Google Fonts)

## Project Structure

- `index.html` - Entry point and font loading
- `config.js` - Game configuration and constants
- `mainScene.js` - Main game scene with core gameplay logic
- `cloudBackground.js` - Cloud background implementation
- `bowl.png` - Player sprite
- `cloud.png` - Cloud sprite

## Game Features

- Endless runner mechanics
- Score system (+20 for catching veggies, +5 for avoiding junk food)
- Progressive difficulty (speed increases over time)
- Responsive design (scales to fit screen)
- Retro pixel art style
- Cloud background parallax effect

## TODO List

1. Code Organization

   - [ ] Split game logic into more modular components
   - [ ] Create separate classes for player, obstacles, and UI
   - [ ] Implement proper asset preloading system

2. Gameplay Improvements

   - [ ] Add power-ups or special items
   - [ ] Implement combo system for catching multiple veggies
   - [ ] Add different types of jumps (double jump, etc.)
   - [ ] Create difficulty levels

3. Visual Improvements

   - [ ] Add particle effects for collecting items
   - [ ] Improve game over animation
   - [ ] Add background parallax layers (buildings, etc.)
   - [ ] Create proper sprite animations

4. Audio

   - [ ] Add background music
   - [ ] Add sound effects for jumping, collecting, game over
   - [ ] Implement audio controls (mute, volume)

5. Technical Debt

   - [ ] Add proper TypeScript support
   - [ ] Implement proper asset management
   - [ ] Add testing framework
   - [ ] Improve error handling
   - [ ] Add proper build process

6. Features
   - [ ] Add high score system
   - [ ] Implement save/load game state
   - [ ] Add achievements
   - [ ] Create tutorial/onboarding

## Making Updates

1. Game Configuration

   - Adjust game settings in `config.js`
   - Speed settings: `SPEED_CONFIG`
   - Item types: `DANGEROUS_SYMBOLS` and `FLOATING_VEGGIES`
   - Player config: `SPRITE_CONFIG`

2. Adding New Features

   - Main game logic is in `mainScene.js`
   - Background elements can follow pattern in `cloudBackground.js`
   - Add new assets to root directory and preload in `mainScene.js`

3. Testing
   - Test on different screen sizes
   - Check performance with Chrome DevTools
   - Verify mobile touch controls work
