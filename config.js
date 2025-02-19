// Basic game dimensions
window.GAME_WIDTH = 800;
window.GAME_HEIGHT = 600;

// Track the score globally
window.score = 0;

// Speed configuration for difficulty ramp
window.SPEED_CONFIG = {
  initialSpeed: 4.5,
  accelerationInterval: 5000, // Increase speed every 5 seconds
  speedIncrease: 0.05, // 5% increase each time
  maxSpeedMultiplier: 3.0, // Maximum 3x the initial speed
};

// 1) "Dangerous" items you want to AVOID
//    e.g. unhealthy junk food
window.DANGEROUS_SYMBOLS = ["🍔", "🍟", "🍕", "🍩", "🍪"];

// 2) "Floating" veggies you want to CATCH for bonus points
//    e.g. healthy items that appear in the sky
window.FLOATING_VEGGIES = ["🥕", "🍅", "🥒", "🌽", "🍄", "🥦", "🥑"];

// Player sprite config (the bowl)
window.SPRITE_CONFIG = {
  player: {
    type: "image",
    key: "bowl",
    file: "bowl.png",
    offsetY: 80,
    scale: 0.28,
    bounds: { width: 160, height: 76 }, // bounding box
  },
  // Additional gameOver or other config can remain if you want
  gameOver: {
    woozyBig: "🥴",
    falling: "🥴",
    sizeBig: "128px",
    sizeFalling: "96px",
    dropDistance: 800,
  },
};
