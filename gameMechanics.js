class GameMechanics {
  constructor(scene) {
    this.scene = scene;
    this.dangerousItems = [];
    this.floatingVeggies = [];
    this.fallingHazards = [];
    this.gameTimers = [];
    this.speedMultiplier = 1.0;
    this.isGameOver = false;
    this.lastHazardX = 0;
    this.setupTimers();
  }

  setupTimers() {
    // Remove fixed interval for dangerous items
    this.spawnNextHazard();

    // 2) "Floating" veggies appear less frequently up in the sky
    this.gameTimers.push(
      this.scene.time.addEvent({
        delay: 4000, // every 4s
        callback: () => this.spawnFloatingVeggie(),
        loop: true,
      })
    );

    // Timer to increase speed over time
    this.gameTimers.push(
      this.scene.time.addEvent({
        delay: window.SPEED_CONFIG.accelerationInterval,
        callback: () => this.increaseSpeed(),
        loop: true,
      })
    );

    // Add timer for falling hazards
    this.gameTimers.push(
      this.scene.time.addEvent({
        delay: 2000, // Check every 2 seconds
        callback: () => this.checkSpawnFallingHazard(),
        loop: true,
      })
    );
  }

  spawnDangerousItem() {
    const mobileScale = this.isMobileDevice() ? 0.5 : 1;
    // Simple random spacing between 2-4x bowl width, adjusted for mobile
    const minSpacing =
      window.SPRITE_CONFIG.player.bounds.width * 2 * mobileScale;
    const maxSpacing =
      window.SPRITE_CONFIG.player.bounds.width * 4 * mobileScale;
    const spacing = Phaser.Math.Between(minSpacing, maxSpacing);

    // Only spawn if we're far enough from the last hazard
    if (this.lastHazardX - spacing > this.scene.scale.width) {
      return;
    }

    const symbol = Phaser.Math.RND.pick(window.DANGEROUS_SYMBOLS);
    const fontSize = this.isMobileDevice() ? "35px" : "45px";
    const item = this.scene.add
      .text(this.scene.scale.width, this.scene.floorY, symbol, {
        fontFamily: "'Press Start 2P'",
        fontSize: fontSize,
      })
      .setOrigin(0.5, 1)
      .setDepth(1);

    if (Phaser.Math.Between(0, 100) < 20) {
      item.setScale(1.2 * mobileScale);
    }
    this.dangerousItems.push(item);
    this.scene.gameContainer.add(item);
    this.lastHazardX = item.x;

    // Schedule next spawn with random delay
    this.spawnNextHazard();
  }

  spawnNextHazard() {
    if (this.isGameOver) return;

    // Random delay between 1-2 seconds
    const delay = Phaser.Math.Between(1000, 2000);
    this.gameTimers.push(
      this.scene.time.addEvent({
        delay: delay,
        callback: () => this.spawnDangerousItem(),
        loop: false,
      })
    );
  }

  spawnFloatingVeggie() {
    const mobileScale = this.isMobileDevice() ? 0.5 : 1;
    const symbol = Phaser.Math.RND.pick(window.FLOATING_VEGGIES);
    const jumpVelocity = 12;
    const gravity = 0.35;
    const maxJumpHeight = (jumpVelocity * jumpVelocity) / (2 * gravity);

    // Increased range of heights while keeping within jump range
    const minY = this.scene.floorY - maxJumpHeight + 40 * mobileScale; // Adjusted for mobile
    const maxY = this.scene.floorY - 100 * mobileScale;
    const skyY = Phaser.Math.Between(minY, maxY);

    // Create container for veggie and points text
    const container = this.scene.add.container(this.scene.scale.width, skyY);
    container.setDepth(1);

    const fontSize = this.isMobileDevice() ? "24px" : "32px";
    const veg = this.scene.add
      .text(0, 0, symbol, {
        fontFamily: "'Press Start 2P'",
        fontSize: fontSize,
      })
      .setOrigin(0.5);

    // Add points indicator with adjusted size
    const pointsFontSize = this.isMobileDevice() ? "12px" : "16px";
    const pointsText = this.scene.add
      .text(veg.width / 2 + 10, -15, "+20", {
        fontFamily: "'Press Start 2P'",
        fontSize: pointsFontSize,
        color: "#2d5a27",
        stroke: "#ffffff",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5);

    container.add([veg, pointsText]);

    if (Phaser.Math.Between(0, 100) < 20) {
      container.setScale(1.2 * mobileScale);
    }

    this.floatingVeggies.push(container);
    this.scene.gameContainer.add(container);
  }

  increaseSpeed() {
    if (this.isGameOver) return;
    this.speedMultiplier = Math.min(
      this.speedMultiplier * (1 + window.SPEED_CONFIG.speedIncrease),
      window.SPEED_CONFIG.maxSpeedMultiplier
    );
  }

  checkSpawnFallingHazard() {
    // Don't spawn falling hazards on mobile devices
    if (this.isMobileDevice()) {
      return;
    }

    // Original falling hazard logic
    if (window.score >= 100) {
      // Start at 100 points
      const baseChance = 0.2; // 20% base chance
      const extraChance = Math.floor((window.score - 100) / 40) * 0.1; // +10% every 40 points
      const finalChance = Math.min(baseChance + extraChance, 0.6); // Cap at 60%

      if (Math.random() < finalChance) {
        this.spawnFallingHazard();
      }
    }
  }

  isMobileDevice() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth / window.innerHeight < 0.8 // Portrait mode ratio check
    );
  }

  spawnFallingHazard() {
    const maxX = this.scene.scale.width - 50;
    const x = Phaser.Math.Between(100, maxX);

    const hazard = {
      sprite: this.scene.add
        .text(x, -50, "😡", {
          fontFamily: "'Press Start 2P'",
          fontSize: "35px",
        })
        .setOrigin(0.5),
      velocityY: 0,
    };

    hazard.sprite.setDepth(1);
    this.scene.gameContainer.add(hazard.sprite);
    this.fallingHazards.push(hazard);
  }

  update() {
    if (this.isGameOver) return;

    const baseSpeed = window.SPEED_CONFIG.initialSpeed;
    const currentSpeed = baseSpeed * this.speedMultiplier;

    // Update falling hazards
    for (let i = this.fallingHazards.length - 1; i >= 0; i--) {
      const hazard = this.fallingHazards[i];

      // Apply gravity
      hazard.velocityY += 0.2; // Simplified gravity
      hazard.sprite.y += hazard.velocityY;

      // Remove if hits floor or goes off screen
      if (hazard.sprite.y >= this.scene.floorY || hazard.sprite.x < -50) {
        hazard.sprite.destroy();
        this.fallingHazards.splice(i, 1);
        continue;
      }

      // Move left with game speed
      hazard.sprite.x -= currentSpeed * 0.7; // Slightly slower than other hazards
    }

    // Move "dangerous" items left
    for (let i = this.dangerousItems.length - 1; i >= 0; i--) {
      const item = this.dangerousItems[i];
      item.x -= currentSpeed;
      if (item.x < -50) {
        item.destroy();
        this.dangerousItems.splice(i, 1);
        window.score += 5;
        this.scene.ui.updateScore();
      }
    }

    // Move "floating" veggies left
    for (let j = this.floatingVeggies.length - 1; j >= 0; j--) {
      const container = this.floatingVeggies[j];
      container.x -= currentSpeed;
      if (container.x < -50) {
        container.destroy();
        this.floatingVeggies.splice(j, 1);
      }
    }
  }

  cleanup() {
    // Stop all game timers
    this.gameTimers.forEach((timer) => {
      timer.destroy();
    });
    this.gameTimers = [];

    // Clean up existing items
    this.dangerousItems.forEach((item) => {
      item.destroy();
    });
    this.floatingVeggies.forEach((item) => {
      item.destroy();
    });
    this.dangerousItems = [];
    this.floatingVeggies = [];

    this.fallingHazards.forEach((hazard) => {
      hazard.sprite.destroy();
    });
    this.fallingHazards = [];
  }

  getCurrentSpeed() {
    return window.SPEED_CONFIG.initialSpeed * this.speedMultiplier;
  }
}

window.GameMechanics = GameMechanics;
