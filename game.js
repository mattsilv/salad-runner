const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
let score = 0;

// Game speed configuration
const SPEED_CONFIG = {
  initialSpeed: 4.5,
  accelerationInterval: 5000, // Increase speed every 5 seconds
  speedIncrease: 0.05, // 5% increase each time
  maxSpeedMultiplier: 3.0, // Maximum 3x the initial speed
};

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

class SaladScene extends Phaser.Scene {
  constructor() {
    super({ key: "SaladScene" });
  }

  preload() {
    // Load the bowl image
    this.load.image(SPRITE_CONFIG.player.key, SPRITE_CONFIG.player.file);
  }

  create() {
    // Set the background color
    this.cameras.main.setBackgroundColor("#ebf7d9");

    // Figure out if we're on mobile (for responsive layout)
    const isMobile = this.game.device.os.android || this.game.device.os.iOS;

    // Decide where the "floor" is (the baseline for the bowl & obstacles)
    this.floorY = this.scale.height - SPRITE_CONFIG.player.offsetY;

    // 1) CREATE TITLE
    this.createTitle(isMobile);

    // 2) CREATE SCORE TEXT
    this.createScoreText(isMobile);

    // 3) CREATE INSTRUCTIONS
    this.createInstructions(isMobile);

    // 4) CREATE PLAYER (the bowl)
    this.createPlayer(isMobile);

    // 5) INITIALIZE GAME VARIABLES
    this.obstacles = [];
    this.obstacleSpeed = SPEED_CONFIG.initialSpeed;
    this.speedMultiplier = 1.0;
    this.obstacleDelay = 1800;
    this.isGameOver = false;

    // Set up speed increase timer
    this.time.addEvent({
      delay: SPEED_CONFIG.accelerationInterval,
      callback: () => this.increaseSpeed(),
      loop: true,
    });

    // 6) SET UP A TIMER TO SPAWN OBSTACLES
    //    Every 'obstacleDelay' ms, spawnObstacle() is called
    this.time.addEvent({
      delay: this.obstacleDelay,
      callback: () => this.spawnObstacle(),
      loop: true,
    });

    // 7) SET UP INPUTS
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.input.on("pointerdown", () => this.jump());
    this.input.setDefaultCursor("pointer");

    // 8) MAKE ENTIRE SCREEN INTERACTIVE (useful for mobile)
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0)
      .setOrigin(0, 0)
      .setInteractive();

    // 9) HANDLE RESIZING
    this.scale.on("resize", (gameSize) => {
      this.handleResize(gameSize, isMobile);
    });
  }

  // ----------------
  // SCENE CREATION HELPERS
  // ----------------

  createTitle(isMobile) {
    const titleY = 80;
    const titleFontSize = isMobile ? 28 : 32; // from LAYOUT_CONFIG
    const titleContainer = this.add.container(this.scale.width / 2, titleY);
    const titleText = this.add
      .text(0, 0, "JUST\nSALAD\nRUNNER", {
        fontSize: titleFontSize,
        fontFamily: "'Press Start 2P'",
        color: "#2d5a27",
        align: "center",
        resolution: 2,
      })
      .setOrigin(0.5);
    titleContainer.add(titleText);
    this.titleText = titleText; // Keep a reference if we need it
  }

  createScoreText(isMobile) {
    const scoreFontSize = isMobile ? 20 : 18; // from LAYOUT_CONFIG
    this.scoreText = this.add
      .text(30, 30, "Score: 0", {
        fontSize: scoreFontSize,
        color: "#333",
        resolution: 2,
      })
      .setOrigin(0, 0);
  }

  createInstructions(isMobile) {
    const instructionsFontSize = isMobile ? 16 : 18;
    this.instructions = this.add
      .text(
        this.scale.width / 2,
        // place below the title
        this.titleText.y + this.titleText.height + 60,
        "Tap screen or press SPACE to jump",
        {
          fontSize: instructionsFontSize,
          color: "#333",
          align: "center",
          resolution: 2,
          lineSpacing: 10,
        }
      )
      .setOrigin(0.5);
  }

  createPlayer(isMobile) {
    const playerX = isMobile ? 60 : 100;
    // If using an image, create a sprite
    if (SPRITE_CONFIG.player.type === "image") {
      this.player = this.add
        .sprite(playerX, this.floorY, SPRITE_CONFIG.player.key)
        .setScale(SPRITE_CONFIG.player.scale)
        .setOrigin(0.5, 1); // bottom-center so the "floor" lines up
    } else {
      // Otherwise, if we had an emoji or text-based player
      this.player = this.add
        .text(playerX, this.floorY, SPRITE_CONFIG.player.symbol, {
          fontSize: SPRITE_CONFIG.size.width + "px",
        })
        .setScale(SPRITE_CONFIG.player.scale)
        .setOrigin(0.5, 1);
    }

    // Basic "physics" for the player
    this.playerY = this.floorY;
    this.playerVelocity = 0;
    this.gravity = 0.35;
    this.isJumping = false;
  }

  handleResize(gameSize, isMobile) {
    const width = gameSize.width;
    const height = gameSize.height;
    // Recompute the "floor"
    this.floorY = height - SPRITE_CONFIG.player.offsetY;

    // Reposition UI
    this.titleText.x = 0;
    this.titleText.y = 0; // We re-add it to container if needed
    // or re-center a container if you want
    // For simplicity, just keep it as is:
    // (You might need to store the container if you want to re-center it)
    this.scoreText.setPosition(30, 30);
    this.instructions.setPosition(
      width / 2,
      this.titleText.y + this.titleText.height + 60
    );

    // Reposition the player on the floor
    const playerX = isMobile ? 60 : 100;
    this.player.setPosition(playerX, this.floorY);
  }

  // ----------------
  // CORE GAME LOOP
  // ----------------

  update(time, delta) {
    if (this.isGameOver) return;

    // Jump if space just pressed
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.jump();
    }

    // Apply gravity to the player
    this.playerVelocity += this.gravity;
    this.playerY += this.playerVelocity;

    // Stop the player from going below the floor
    if (this.playerY > this.floorY) {
      this.playerY = this.floorY;
      this.playerVelocity = 0;
      this.isJumping = false;
    }
    this.player.setPosition(this.player.x, this.playerY);

    // Calculate current speed based on multiplier and score
    this.obstacleSpeed = SPEED_CONFIG.initialSpeed * this.speedMultiplier;

    // Move obstacles with new speed
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.x -= this.obstacleSpeed;

      if (obstacle.x < -50) {
        obstacle.destroy();
        this.obstacles.splice(i, 1);
        score += 10;
        this.scoreText.setText(`Score: ${score}`);
      }
    }

    // Check collisions
    this.checkCollisions();
  }

  jump() {
    if (!this.isJumping) {
      // Negative velocity to go "up"
      this.playerVelocity = -10;
      this.isJumping = true;
    }
  }

  // ----------------
  // OBSTACLES
  // ----------------

  spawnObstacle() {
    // Pick a random veggie emoji
    const chosenEmoji = Phaser.Math.RND.pick(SPRITE_CONFIG.obstacles.symbols);

    // Create a text object at the right edge, at the floor
    const obstacle = this.add
      .text(this.scale.width, this.floorY, chosenEmoji, {
        fontSize: SPRITE_CONFIG.obstacles.size,
      })
      // bottom-center origin so it lines up on the same floor
      .setOrigin(0.5, 1);

    // 20% chance to be 50% larger
    let obstacleScale = SPRITE_CONFIG.obstacles.scale;
    if (Phaser.Math.Between(0, 100) < 20) {
      obstacleScale *= 1.5;
    }
    obstacle.setScale(obstacleScale);

    // Add to our array so we can move it in update()
    this.obstacles.push(obstacle);
  }

  // ----------------
  // COLLISIONS
  // ----------------

  checkCollisions() {
    // 1) Create a smaller bounding box for the bowl
    //    so collisions are more lenient.
    let playerBounds;
    if (SPRITE_CONFIG.player.type === "image") {
      // For the bowl image, we base it on our known width/height
      const bounds = SPRITE_CONFIG.player.bounds;
      // We'll shrink it by 20% horizontally and vertically
      playerBounds = new Phaser.Geom.Rectangle(
        this.player.x - bounds.width * 0.4, // shift left 40%
        this.player.y - bounds.height * 0.8, // shift up 80%
        bounds.width * 0.8, // 80% width
        bounds.height * 0.8 // 80% height
      );
    } else {
      // If your player were text/emoji, you could shrink
      // getBounds() in a similar way
      const rawBounds = this.player.getBounds();
      playerBounds = new Phaser.Geom.Rectangle(
        rawBounds.x + rawBounds.width * 0.1,
        rawBounds.y + rawBounds.height * 0.1,
        rawBounds.width * 0.8,
        rawBounds.height * 0.8
      );
    }

    // 2) For each obstacle, also shrink the collision box
    for (let i = 0; i < this.obstacles.length; i++) {
      const obstacle = this.obstacles[i];
      const obsBounds = obstacle.getBounds();

      // We'll shrink the obstacle bounding box by 40% total (20% each side)
      const shrunkObsBounds = new Phaser.Geom.Rectangle(
        obsBounds.x + obsBounds.width * 0.2,
        obsBounds.y + obsBounds.height * 0.2,
        obsBounds.width * 0.6,
        obsBounds.height * 0.6
      );

      // 3) Check the smaller boxes for overlap
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          playerBounds,
          shrunkObsBounds
        )
      ) {
        this.gameOver();
        return;
      }
    }
  }

  // ----------------
  // GAME OVER
  // ----------------

  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Pause obstacle spawning & motion
    // (Alternatively, you can just check isGameOver in update)
    // For clarity, we rely on "if (this.isGameOver) return;" in update()

    // 1) Big woozy emoji zoom in/out
    const bigWoozy = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        SPRITE_CONFIG.gameOver.woozyBig,
        {
          fontSize: SPRITE_CONFIG.gameOver.sizeBig,
        }
      )
      .setOrigin(0.5)
      .setScale(0);

    this.tweens.add({
      targets: bigWoozy,
      scale: 2,
      duration: 500,
      ease: "Sine.easeInOut",
      yoyo: true,
      onComplete: () => {
        bigWoozy.destroy();

        // 2) Spawn multiple falling woozy emojis
        for (let i = 0; i < 8; i++) {
          this.time.delayedCall(i * 150, () => {
            this.createFallingWoozy();
          });
        }

        // 3) Show "GAME OVER!" + Final Score + Restart
        this.time.delayedCall(1200, () => {
          this.showGameOverUI();
        });
      },
    });
  }

  createFallingWoozy() {
    const emojiSize = parseInt(SPRITE_CONFIG.gameOver.sizeFalling);
    const xPos = Phaser.Math.Between(50, this.scale.width - 50);
    const yPos = emojiSize / 2;
    const fallingEmoji = this.add.text(
      xPos,
      yPos,
      SPRITE_CONFIG.gameOver.falling,
      { fontSize: SPRITE_CONFIG.gameOver.sizeFalling }
    );
    fallingEmoji.setOrigin(0.5);

    this.tweens.add({
      targets: fallingEmoji,
      y: yPos + SPRITE_CONFIG.gameOver.dropDistance,
      rotation: Phaser.Math.Between(-2, 2),
      duration: 1500,
      ease: "Bounce.easeOut",
    });
  }

  showGameOverUI() {
    const gameOverText = this.add
      .text(this.scale.width / 2, 80, "GAME OVER!", {
        fontSize: "72px",
        fontFamily: "'Press Start 2P'",
        color: "#ff0000",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: gameOverText,
      y: this.scale.height / 2 - 150,
      duration: 1000,
      ease: "Bounce.easeOut",
    });

    const finalScore = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 50,
        `Final Score: ${score}`,
        {
          fontSize: "36px",
          fontFamily: "'Press Start 2P'",
          color: "#333",
        }
      )
      .setOrigin(0.5)
      .setScale(0);

    this.tweens.add({
      targets: finalScore,
      scale: 1,
      duration: 500,
      delay: 300,
      ease: "Back.easeOut",
    });

    // Create a background rectangle for the button
    const buttonBg = this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2 + 100,
        300,
        80,
        0xddffdd
      )
      .setStrokeStyle(6, 0x2d5a27)
      .setOrigin(0.5)
      .setInteractive()
      .setAlpha(0);

    // Add the button text
    const buttonText = this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 100, "Try Again!", {
        fontSize: "24px",
        fontFamily: "'Press Start 2P'",
        color: "#2d5a27",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Add hover effect
    buttonBg.on("pointerover", () => {
      buttonBg.setFillStyle(0xc1f4c1);
    });
    buttonBg.on("pointerout", () => {
      buttonBg.setFillStyle(0xddffdd);
    });

    // Add click handler
    buttonBg.on("pointerdown", () => {
      score = 0;
      this.scene.restart();
    });

    // Fade in animation for button
    this.tweens.add({
      targets: [buttonBg, buttonText],
      alpha: 1,
      duration: 500,
      delay: 800,
    });
  }

  increaseSpeed() {
    if (this.isGameOver) return;

    // Increase speed multiplier by percentage
    this.speedMultiplier = Math.min(
      this.speedMultiplier * (1 + SPEED_CONFIG.speedIncrease),
      SPEED_CONFIG.maxSpeedMultiplier
    );
  }
}

// The Phaser game config
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#ebf7d9",
  parent: "game-container",
  scene: [SaladScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: "100%",
    height: "100%",
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
  },
  resolution: window.devicePixelRatio,
};

// Finally, initialize the game
const game = new Phaser.Game(config);
