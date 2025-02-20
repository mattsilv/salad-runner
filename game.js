// Global score tracking
let score = 0;

class SaladScene extends Phaser.Scene {
  constructor() {
    super({ key: "SaladScene" });
  }

  preload() {
    // Load the bowl image
    this.load.image(
      window.SPRITE_CONFIG.player.key,
      window.SPRITE_CONFIG.player.file
    );
  }

  create() {
    // Basic setup
    this.cameras.main.setBackgroundColor("#87CEEB"); // Sky blue background
    this.floorY = this.scale.height - window.SPRITE_CONFIG.player.offsetY;

    // Initialize background if enabled
    if (window.GAME_CONFIG?.enableCityBackground) {
      this.cityBackground = new CityBackground(this);
    }

    // Create UI
    this.createTitle();
    this.createScoreText();
    this.createInstructions();

    // Create the bowl (player)
    this.createPlayer();

    // Prepare arrays for items
    this.dangerousItems = [];
    this.floatingVeggies = [];

    // Initial speeds
    this.speedMultiplier = 1.0;
    this.isGameOver = false;
    this.playerVelocity = 0;
    this.gravity = 0.35;
    this.isJumping = false;

    // Timers to spawn items
    // 1) "Dangerous" items (junk food) appear near the floor
    this.time.addEvent({
      delay: 1500, // every 1.5s
      callback: () => this.spawnDangerousItem(),
      loop: true,
    });

    // 2) "Floating" veggies appear less frequently up in the sky
    this.time.addEvent({
      delay: 4000, // every 4s
      callback: () => this.spawnFloatingVeggie(),
      loop: true,
    });

    // Timer to increase speed over time
    this.time.addEvent({
      delay: window.SPEED_CONFIG.accelerationInterval,
      callback: () => this.increaseSpeed(),
      loop: true,
    });

    // Input
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.input.on("pointerdown", () => this.jump());
    this.input.setDefaultCursor("pointer");

    // Full screen interactive
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0)
      .setOrigin(0, 0)
      .setInteractive();

    // Handle resizing
    this.scale.on("resize", (gameSize) => this.handleResize(gameSize));
  }

  // ----------------
  // SCENE CREATION HELPERS
  // ----------------

  createTitle() {
    const titleY = 80;
    const titleFontSize = 32; // from LAYOUT_CONFIG
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

  createScoreText() {
    const scoreFontSize = 18; // from LAYOUT_CONFIG
    this.scoreText = this.add
      .text(30, 30, "Score: 0", {
        fontSize: scoreFontSize,
        color: "#333",
        resolution: 2,
      })
      .setOrigin(0, 0);
  }

  createInstructions() {
    const instructionsFontSize = 18;
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

  createPlayer() {
    const playerX = 100;
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

  handleResize(gameSize) {
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
    const playerX = 100;
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

  spawnDangerousItem() {
    const symbol = Phaser.Math.RND.pick(window.DANGEROUS_SYMBOLS);
    const item = this.add
      .text(this.scale.width, this.floorY, symbol, {
        fontFamily: "'Press Start 2P'",
        fontSize: "45px",
      })
      .setOrigin(0.5, 1);

    if (Phaser.Math.Between(0, 100) < 20) {
      item.setScale(1.2);
    }
    this.dangerousItems.push(item);
  }

  spawnFloatingVeggie() {
    const symbol = Phaser.Math.RND.pick(window.FLOATING_VEGGIES);
    const jumpVelocity = 12;
    const gravity = 0.35;
    const maxJumpHeight = (jumpVelocity * jumpVelocity) / (2 * gravity);
    const minY = this.floorY - maxJumpHeight + 70;
    const maxY = this.floorY - 120;
    const skyY = Phaser.Math.Between(minY, maxY);

    const veg = this.add
      .text(this.scale.width, skyY, symbol, {
        fontFamily: "'Press Start 2P'",
        fontSize: "32px",
      })
      .setOrigin(0.5);

    if (Phaser.Math.Between(0, 100) < 20) {
      veg.setScale(1.2);
    }
    this.floatingVeggies.push(veg);
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
    this.speedMultiplier = Math.min(
      this.speedMultiplier * (1 + window.SPEED_CONFIG.speedIncrease),
      window.SPEED_CONFIG.maxSpeedMultiplier
    );
  }
}

// Initialize the game with the config from config.js
const config = {
  ...window.PHASER_CONFIG,
  scene: [SaladScene],
};

// Initialize the game
const game = new Phaser.Game(config);
