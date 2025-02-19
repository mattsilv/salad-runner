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

    // Load the cloud asset
    if (window.GAME_CONFIG?.enableClouds) {
      this.load.image("cloud", "cloud.png");
    }
  }

  create() {
    // Basic setup
    this.cameras.main.setBackgroundColor("#87CEEB"); // Sky blue background
    this.floorY = this.scale.height - window.SPRITE_CONFIG.player.offsetY;

    // Create game container for gameplay elements only (not UI)
    this.gameContainer = this.add.container(0, 0);
    this.gameContainer.setDepth(10); // Set higher depth for game elements

    // Initialize cloud background if enabled
    if (window.GAME_CONFIG?.enableClouds) {
      try {
        this.cloudBackground = new CloudBackground(this);
      } catch (error) {
        console.error("Failed to create cloud background:", error);
        this.cloudBackground = null;
      }
    }

    // Create UI (these will stay outside the game container)
    this.createTitle();
    this.createScoreText();
    this.createInstructions();

    // Create the bowl (player)
    this.createPlayer();

    // Add only the player to the game container
    this.gameContainer.add(this.player);

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
    this.headerContainer.setDepth(1);

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
      .setOrigin(0, 0.3)
      .setDepth(1); // Ensure score is always visible

    this.headerContainer.add(this.scoreText);
  }

  createInstructions() {
    // Calculate available width for instructions
    const instructionsWidth = Math.min(500, this.scale.width - 40);

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
          fontSize: "14px",
          color: "#333",
          align: "center",
          resolution: 2,
          wordWrap: { width: instructionsWidth, useAdvancedWrap: true },
        }
      )
      .setOrigin(0.5)
      .setDepth(1);

    // Add bonus items legend
    const bonusItems = window.FLOATING_VEGGIES.join(" ");
    this.bonusLegend = this.add
      .text(
        this.scale.width / 2,
        this.instructions.y + this.instructions.height + 20,
        `Bonus Items (+20 pts):\n${bonusItems}`,
        {
          fontFamily: "'Press Start 2P'",
          fontSize: "12px",
          color: "#2d5a27",
          align: "center",
          resolution: 2,
        }
      )
      .setOrigin(0.5)
      .setDepth(1);

    // Add dangerous items legend
    const dangerousItems = window.DANGEROUS_SYMBOLS.join(" ");
    this.dangerLegend = this.add
      .text(
        this.scale.width / 2,
        this.bonusLegend.y + this.bonusLegend.height + 10,
        `Avoid These!\n${dangerousItems}`,
        {
          fontFamily: "'Press Start 2P'",
          fontSize: "12px",
          color: "#ff0000",
          align: "center",
          resolution: 2,
        }
      )
      .setOrigin(0.5)
      .setDepth(1);

    // Add a temporary tip that fades out
    this.tempTip = this.add
      .text(
        this.scale.width / 2,
        this.dangerLegend.y + this.dangerLegend.height + 15,
        "TIP: Jump early to catch the floating veggies!",
        {
          fontFamily: "'Press Start 2P'",
          fontSize: "11px",
          color: "#666",
          align: "center",
          resolution: 2,
        }
      )
      .setOrigin(0.5)
      .setDepth(1);

    // Store all instruction elements in an array for easy access
    this.allInstructions = [
      this.instructions,
      this.bonusLegend,
      this.dangerLegend,
      this.tempTip,
    ];

    // Fade out all instructions after 8 seconds
    this.time.delayedCall(8000, () => {
      this.tweens.add({
        targets: this.allInstructions,
        alpha: 0,
        duration: 1000,
        ease: "Power2",
        onComplete: () => {
          // Destroy all instruction elements
          this.allInstructions.forEach((element) => {
            if (element) element.destroy();
          });
          this.allInstructions = null;
        },
      });
    });
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

    // Update legend positions
    if (this.bonusLegend) {
      this.bonusLegend.setPosition(
        gameSize.width / 2,
        this.instructions.y + this.instructions.height + 20
      );
    }
    if (this.dangerLegend) {
      this.dangerLegend.setPosition(
        gameSize.width / 2,
        this.bonusLegend.y + this.bonusLegend.height + 10
      );
    }
    if (this.tempTip) {
      this.tempTip.setPosition(
        gameSize.width / 2,
        this.dangerLegend.y + this.dangerLegend.height + 15
      );
    }

    this.player.setPosition(100, this.floorY);
  }

  update() {
    if (this.isGameOver) return;

    // Current speed for this frame
    const baseSpeed = window.SPEED_CONFIG.initialSpeed;
    const currentSpeed = baseSpeed * this.speedMultiplier;

    // Update cloud background if enabled and working
    if (this.cloudBackground && !this.cloudBackground.failed) {
      this.cloudBackground.update(currentSpeed);
    }

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
      this.playerVelocity = -12;
      this.isJumping = true;
    }
  }

  spawnDangerousItem() {
    const symbol = Phaser.Math.RND.pick(window.DANGEROUS_SYMBOLS);
    const item = this.add
      .text(this.scale.width, this.floorY, symbol, {
        fontFamily: "'Press Start 2P'",
        fontSize: "45px",
      })
      .setOrigin(0.5, 1)
      .setDepth(1);

    if (Phaser.Math.Between(0, 100) < 20) {
      item.setScale(1.2);
    }
    this.dangerousItems.push(item);
    this.gameContainer.add(item);
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
      .setOrigin(0.5)
      .setDepth(1);

    if (Phaser.Math.Between(0, 100) < 20) {
      veg.setScale(1.2);
    }
    this.floatingVeggies.push(veg);
    this.gameContainer.add(veg);
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
    const fontSize = Math.min(72, Math.max(32, gameWidth / 10));
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
      // Destroy all game over UI elements before restarting
      [gameOverText, finalScore, buttonBg, buttonText].forEach((element) => {
        if (element) element.destroy();
      });
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
