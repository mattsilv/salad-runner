// Game dimensions
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Track the score globally
window.score = 0;

// Game speed configuration
const SPEED_CONFIG = {
  initialSpeed: 4.5,
  accelerationInterval: 5000, // Increase speed every 5 seconds
  speedIncrease: 0.07, // Increased from 0.05 to 0.07 (7% increase each time)
  maxSpeedMultiplier: 3.0, // Maximum 3x the initial speed
};

// 1) "Dangerous" items you want to AVOID
//    e.g. unhealthy junk food
window.DANGEROUS_SYMBOLS = ["🍔", "🍟", "🍕", "🍩"];

// 2) "Floating" veggies you want to CATCH for bonus points
//    e.g. healthy items that appear in the sky
window.FLOATING_VEGGIES = ["🥕", "🍅", "🥒", "🌽", "🍄", "🥦", "🥑"];

// Centralized configuration for the bowl (player) and the veggies (obstacles)
const SPRITE_CONFIG = {
  player: {
    // Using an image for the bowl
    type: "image",
    key: "bowl",
    file: "bowl.png",
    // How high above the bottom the bowl is placed
    offsetY: 80,
    // Scaling factor for the bowl sprite
    scale: 0.28,
    // The approximate bounding box for collision detection
    bounds: { width: 160, height: 76 },
  },
  obstacles: {
    // Obstacles are emojis in this example
    symbols: ["🥕", "🍅", "🥒", "🌽", "🍄", "🥦", "🥑"],
    // Each obstacle is rendered as text with a certain font size
    size: "64px",
    // Scales them further after applying the font size
    scale: 0.5,
    // Same offset as the bowl so they line up on the same 'floor'
    offsetY: 80,
  },
  gameOver: {
    woozyBig: "🥴",
    falling: "🥴",
    sizeBig: "128px",
    sizeFalling: "96px",
    dropDistance: 800,
  },
};

// Game feature flags and settings
const GAME_CONFIG = {
  enableClouds: true, // Set to true to enable the cloud background
};

// Phaser game configuration
const PHASER_CONFIG = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#87CEEB",
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: "100%",
    height: "100%",
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
  },
  resolution: window.devicePixelRatio,
};

// Make configurations available globally
window.GAME_WIDTH = GAME_WIDTH;
window.GAME_HEIGHT = GAME_HEIGHT;
window.SPEED_CONFIG = SPEED_CONFIG;
window.SPRITE_CONFIG = SPRITE_CONFIG;
window.GAME_CONFIG = GAME_CONFIG;
window.PHASER_CONFIG = PHASER_CONFIG;
