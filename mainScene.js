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
    this.cameras.main.setBackgroundColor("#ebf7d9");
    this.floorY = this.scale.height - window.SPRITE_CONFIG.player.offsetY;

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

  createTitle() {
    // Create container for both title and score
    this.headerContainer = this.add.container(this.scale.width / 2, 60);

    const titleText = this.add
      .text(0, 0, "JUST\nSALAD\nRUNNER", {
        fontFamily: "'Press Start 2P'",
        fontSize: "32px",
        color: "#2d5a27",
        align: "center",
        resolution: 2,
      })
      .setOrigin(0.5);

    this.titleText = titleText;
    this.headerContainer.add(titleText);
  }

  createScoreText() {
    // Add score to the same container, positioned relative to title
    this.scoreText = this.add
      .text(this.titleText.width / 2 + 40, 0, "Score:\n" + window.score, {
        fontFamily: "'Press Start 2P'",
        fontSize: "16px",
        color: "#333",
        align: "center",
        resolution: 2,
      })
      .setOrigin(0, 0.3); // Adjust vertical alignment to match title

    this.headerContainer.add(this.scoreText);
  }

  createInstructions() {
    // Calculate available width for instructions
    const instructionsWidth = Math.min(500, this.scale.width - 40); // 20px padding on each side

    this.instructions = this.add
      .text(
        this.scale.width / 2,
        Math.max(
          this.titleText.y + this.titleText.height,
          this.scoreText.y + this.scoreText.height
        ) + 40,
        "Tap or SPACE to jump\nCatch veggies above, avoid junk below",
        {
          fontFamily: "'Press Start 2P'",
          fontSize: "16px",
          color: "#333",
          align: "center",
          resolution: 2,
          wordWrap: { width: instructionsWidth, useAdvancedWrap: true },
        }
      )
      .setOrigin(0.5);
  }

  createPlayer() {
    const playerX = 100; // can vary if mobile or desktop
    const pCfg = window.SPRITE_CONFIG.player;

    this.player = this.add
      .sprite(playerX, this.floorY, pCfg.key)
      .setScale(pCfg.scale)
      .setOrigin(0.5, 1); // bottom-center

    this.playerY = this.floorY;
  }

  handleResize(gameSize) {
    this.floorY = gameSize.height - window.SPRITE_CONFIG.player.offsetY;

    // Center the entire header container
    this.headerContainer.setPosition(gameSize.width / 2, 60);

    // Update instructions position relative to header container
    this.instructions.setPosition(
      gameSize.width / 2,
      this.headerContainer.y + this.titleText.height + 40
    );

    // Update instruction text wrap width
    this.instructions.setWordWrapWidth(Math.min(500, gameSize.width - 40));

    this.player.setPosition(100, this.floorY);
  }

  update() {
    if (this.isGameOver) return;

    // Jump logic
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.jump();
    }

    // Gravity
    this.playerVelocity += this.gravity;
    this.playerY += this.playerVelocity;
    if (this.playerY > this.floorY) {
      this.playerY = this.floorY;
      this.playerVelocity = 0;
      this.isJumping = false;
    }
    this.player.setPosition(this.player.x, this.playerY);

    // Current speed
    const baseSpeed = window.SPEED_CONFIG.initialSpeed;
    const currentSpeed = baseSpeed * this.speedMultiplier;

    // Move "dangerous" items left
    for (let i = this.dangerousItems.length - 1; i >= 0; i--) {
      const item = this.dangerousItems[i];
      item.x -= currentSpeed;
      if (item.x < -50) {
        // If it goes off screen, remove it and +5 points
        item.destroy();
        this.dangerousItems.splice(i, 1);
        window.score += 5;
        this.scoreText.setText("Score:\n" + window.score);
      }
    }

    // Move "floating" veggies left
    for (let j = this.floatingVeggies.length - 1; j >= 0; j--) {
      const veg = this.floatingVeggies[j];
      veg.x -= currentSpeed;
      if (veg.x < -50) {
        veg.destroy();
        this.floatingVeggies.splice(j, 1);
        // no penalty, just remove
      }
    }

    // Check collisions
    this.checkCollisions();
  }

  jump() {
    if (!this.isJumping) {
      this.playerVelocity = -10;
      this.isJumping = true;
    }
  }

  spawnDangerousItem() {
    // e.g. unhealthy junk food
    const symbol = Phaser.Math.RND.pick(window.DANGEROUS_SYMBOLS);
    const item = this.add
      .text(this.scale.width, this.floorY, symbol, {
        fontFamily: "'Press Start 2P'",
        fontSize: "45px", // Reduced from 64px to make items smaller
      })
      .setOrigin(0.5, 1);

    // Possibly scale it randomly but keep it smaller
    if (Phaser.Math.Between(0, 100) < 20) {
      item.setScale(1.2); // Reduced from 1.5 to maintain smaller size
    }
    this.dangerousItems.push(item);
  }

  spawnFloatingVeggie() {
    // e.g. healthy veggies in the sky
    const symbol = Phaser.Math.RND.pick(window.FLOATING_VEGGIES);

    // Calculate maximum height based on jump physics
    // Using jump velocity and gravity from the game
    const jumpVelocity = 10; // From jump() method
    const gravity = 0.35; // From create() method
    // Maximum jump height = v²/2g where v is initial velocity and g is gravity
    const maxJumpHeight = (jumpVelocity * jumpVelocity) / (2 * gravity);

    // Position veggies within reachable height
    // floorY - maxJumpHeight gives us the highest reachable point
    const minY = this.floorY - maxJumpHeight + 50; // Add offset to ensure reachability
    const maxY = this.floorY - 100; // Keep some distance from the ground

    const skyY = Phaser.Math.Between(minY, maxY);

    const veg = this.add
      .text(this.scale.width, skyY, symbol, {
        fontFamily: "'Press Start 2P'",
        fontSize: "32px", // Reduced from 64px to make veggies 50% smaller
      })
      .setOrigin(0.5);

    if (Phaser.Math.Between(0, 100) < 20) {
      veg.setScale(1.2); // Reduced from 1.5 to maintain smaller proportions
    }
    this.floatingVeggies.push(veg);
  }

  checkCollisions() {
    // 1) Player bounding box (smaller for leniency)
    const pCfg = window.SPRITE_CONFIG.player;
    const px = this.player.x;
    const py = this.player.y;
    const bw = pCfg.bounds.width * 0.8; // 80% wide
    const bh = pCfg.bounds.height * 0.8; // 80% tall
    const playerBounds = new Phaser.Geom.Rectangle(
      px - bw / 2,
      py - bh,
      bw,
      bh
    );

    // 2) Check dangerous items => game over if collision
    for (let i = 0; i < this.dangerousItems.length; i++) {
      const item = this.dangerousItems[i];
      const itemBounds = item.getBounds();
      // Shrink bounding box a bit
      const itemRect = new Phaser.Geom.Rectangle(
        itemBounds.x + itemBounds.width * 0.2,
        itemBounds.y + itemBounds.height * 0.2,
        itemBounds.width * 0.6,
        itemBounds.height * 0.6
      );

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, itemRect)) {
        this.gameOver();
        return;
      }
    }

    // 3) Check floating veggies => if collision, add points, remove them
    for (let j = this.floatingVeggies.length - 1; j >= 0; j--) {
      const veg = this.floatingVeggies[j];
      const vegBounds = veg.getBounds();
      const vegRect = new Phaser.Geom.Rectangle(
        vegBounds.x + vegBounds.width * 0.2,
        vegBounds.y + vegBounds.height * 0.2,
        vegBounds.width * 0.6,
        vegBounds.height * 0.6
      );

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, vegRect)) {
        // Add bonus points for catching a veggie
        window.score += 20;
        this.scoreText.setText("Score:\n" + window.score);
        // Remove it
        veg.destroy();
        this.floatingVeggies.splice(j, 1);
      }
    }
  }

  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Show big woozy face
    const bigWoozy = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        window.SPRITE_CONFIG.gameOver.woozyBig,
        {
          fontSize: window.SPRITE_CONFIG.gameOver.sizeBig,
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
        // drop emojis
        for (let i = 0; i < 8; i++) {
          this.time.delayedCall(i * 150, () => {
            this.createFallingWoozy();
          });
        }
        // after short delay, show UI
        this.time.delayedCall(1200, () => {
          this.showGameOverUI();
        });
      },
    });
  }

  createFallingWoozy() {
    const sizeF = parseInt(window.SPRITE_CONFIG.gameOver.sizeFalling, 10);
    const xPos = Phaser.Math.Between(50, this.scale.width - 50);
    const yPos = sizeF / 2;
    const fallingEmoji = this.add.text(
      xPos,
      yPos,
      window.SPRITE_CONFIG.gameOver.falling,
      { fontSize: window.SPRITE_CONFIG.gameOver.sizeFalling }
    );
    fallingEmoji.setOrigin(0.5);

    this.tweens.add({
      targets: fallingEmoji,
      y: yPos + window.SPRITE_CONFIG.gameOver.dropDistance,
      rotation: Phaser.Math.Between(-2, 2),
      duration: 1500,
      ease: "Bounce.easeOut",
    });
  }

  showGameOverUI() {
    // Calculate responsive sizes based on screen width
    const gameWidth = this.scale.width;
    const fontSize = Math.min(72, Math.max(32, gameWidth / 10)); // Responsive font size
    const finalScoreFontSize = Math.min(36, Math.max(24, gameWidth / 20));
    const buttonWidth = Math.min(300, gameWidth - 40);

    const gameOverText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.3, "GAME OVER!", {
        fontSize: fontSize + "px",
        fontFamily: "'Press Start 2P'",
        color: "#ff0000",
        stroke: "#000000",
        strokeThickness: Math.max(2, fontSize / 12),
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: gameOverText,
      y: this.scale.height * 0.25,
      duration: 1000,
      ease: "Bounce.easeOut",
    });

    const finalScore = this.add
      .text(
        this.scale.width / 2,
        this.scale.height * 0.4,
        `Final Score: ${window.score}`,
        {
          fontSize: finalScoreFontSize + "px",
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

    // A simple restart "button"
    const buttonBg = this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height * 0.6,
        buttonWidth,
        80,
        0xddffdd
      )
      .setStrokeStyle(6, 0x2d5a27)
      .setOrigin(0.5)
      .setInteractive()
      .setAlpha(0);

    const buttonText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.6, "Try Again!", {
        fontSize: Math.min(24, gameWidth / 20) + "px",
        fontFamily: "'Press Start 2P'",
        color: "#2d5a27",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    buttonBg.on("pointerover", () => {
      buttonBg.setFillStyle(0xc1f4c1);
    });
    buttonBg.on("pointerout", () => {
      buttonBg.setFillStyle(0xddffdd);
    });
    buttonBg.on("pointerdown", () => {
      window.score = 0;
      this.scene.restart();
    });

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

// Make the scene available globally
window.SaladScene = SaladScene;
