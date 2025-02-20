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

    // Load star particle
    this.load.image("star", "star.png");
  }

  create() {
    // Basic setup
    this.cameras.main.setBackgroundColor("#87CEEB"); // Sky blue background
    this.floorY = this.scale.height - window.SPRITE_CONFIG.player.offsetY;

    // Create game container for gameplay elements only (not UI)
    this.gameContainer = this.add.container(0, 0);
    this.gameContainer.setDepth(10);

    // Initialize cloud background if enabled
    if (window.GAME_CONFIG?.enableClouds) {
      try {
        this.cloudBackground = new CloudBackground(this);
      } catch (error) {
        console.error("Failed to create cloud background:", error);
        this.cloudBackground = null;
      }
    }

    // Create UI manager
    this.ui = new GameUI(this);

    // Create the bowl (player)
    this.createPlayer();

    // Add only the player to the game container
    this.gameContainer.add(this.player);

    // Create game mechanics manager
    this.mechanics = new GameMechanics(this);

    // Input
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // Simple jump parameters
    this.playerVelocity = 0;
    this.gravity = 0.35;
    this.isJumping = false;
    this.jumpVelocity = -12; // Single jump power

    // Keep touch controls for mobile
    this.input.on("pointerdown", () => this.jump());

    // Full screen interactive
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0)
      .setOrigin(0, 0)
      .setInteractive();

    // Handle resizing
    this.scale.on("resize", (gameSize) => this.handleResize(gameSize));
  }

  createPlayer() {
    const playerX = 100;
    const pCfg = window.SPRITE_CONFIG.player;

    this.player = this.add
      .sprite(playerX, this.floorY, pCfg.key)
      .setScale(pCfg.scale)
      .setOrigin(0.5, 1);

    this.playerY = this.floorY;
  }

  handleResize(gameSize) {
    this.floorY = gameSize.height - window.SPRITE_CONFIG.player.offsetY;
    this.player.setPosition(100, this.floorY);
    this.ui.handleResize(gameSize);
  }

  update() {
    if (this.mechanics.isGameOver) return;

    // Update cloud background if enabled
    if (this.cloudBackground && !this.cloudBackground.failed) {
      this.cloudBackground.update(this.mechanics.getCurrentSpeed());
    }

    // Simple jump check
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

    // Update game mechanics
    this.mechanics.update();

    // Check collisions
    this.checkCollisions();
  }

  jump() {
    if (!this.isJumping) {
      this.playerVelocity = this.jumpVelocity;
      this.isJumping = true;
    }
  }

  checkCollisions() {
    // 1) Player bounding box (smaller for leniency)
    const pCfg = window.SPRITE_CONFIG.player;
    const px = this.player.x;
    const py = this.player.y;
    const bw = pCfg.bounds.width * 0.8;
    const bh = pCfg.bounds.height * 0.8;
    const playerBounds = new Phaser.Geom.Rectangle(
      px - bw / 2,
      py - bh,
      bw,
      bh
    );

    // 2) Check dangerous items => game over if collision
    for (let i = 0; i < this.mechanics.dangerousItems.length; i++) {
      const item = this.mechanics.dangerousItems[i];
      const itemBounds = item.getBounds();
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

    // Check falling hazards
    for (let i = 0; i < this.mechanics.fallingHazards.length; i++) {
      const hazard = this.mechanics.fallingHazards[i];
      const hazardBounds = hazard.sprite.getBounds();
      const hazardRect = new Phaser.Geom.Rectangle(
        hazardBounds.x + hazardBounds.width * 0.2,
        hazardBounds.y + hazardBounds.height * 0.2,
        hazardBounds.width * 0.6,
        hazardBounds.height * 0.6
      );

      if (
        Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, hazardRect)
      ) {
        this.gameOver();
        return;
      }
    }

    // 3) Check floating veggies => if collision, add points, remove them
    for (let j = this.mechanics.floatingVeggies.length - 1; j >= 0; j--) {
      const veg = this.mechanics.floatingVeggies[j];
      const vegBounds = veg.getBounds();
      const vegRect = new Phaser.Geom.Rectangle(
        vegBounds.x + vegBounds.width * 0.2,
        vegBounds.y + vegBounds.height * 0.2,
        vegBounds.width * 0.6,
        vegBounds.height * 0.6
      );

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, vegRect)) {
        // Create floating score animation
        this.ui.createFloatingScore(veg.x, veg.y - 20, 20);

        // Add bonus points for catching a veggie
        window.score += 20;
        this.ui.updateScore();

        // Remove it
        veg.destroy();
        this.mechanics.floatingVeggies.splice(j, 1);
      }
    }
  }

  gameOver() {
    if (this.mechanics.isGameOver) return;
    this.mechanics.isGameOver = true;

    // Clean up game mechanics
    this.mechanics.cleanup();

    // Show game over UI
    this.ui.showGameOver();
  }
}

// Make the scene available globally
window.SaladScene = SaladScene;
