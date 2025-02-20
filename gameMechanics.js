class GameMechanics {
  constructor(scene) {
    this.scene = scene;
    this.dangerousItems = [];
    this.floatingVeggies = [];
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
  }

  spawnDangerousItem() {
    const minSpacing = window.SPRITE_CONFIG.player.bounds.width * 2.5;
    const maxSpacing = minSpacing * 3.5; // Increased max spacing
    const spacing = Phaser.Math.Between(minSpacing, maxSpacing);

    // Only spawn if we're far enough from the last hazard
    if (this.lastHazardX - spacing > this.scene.scale.width) {
      return;
    }

    const symbol = Phaser.Math.RND.pick(window.DANGEROUS_SYMBOLS);
    const item = this.scene.add
      .text(this.scene.scale.width, this.scene.floorY, symbol, {
        fontFamily: "'Press Start 2P'",
        fontSize: "45px",
      })
      .setOrigin(0.5, 1)
      .setDepth(1);

    if (Phaser.Math.Between(0, 100) < 20) {
      item.setScale(1.2);
    }
    this.dangerousItems.push(item);
    this.scene.gameContainer.add(item);
    this.lastHazardX = item.x;

    // Schedule next spawn with random delay
    this.spawnNextHazard();
  }

  spawnNextHazard() {
    if (this.isGameOver) return;

    const baseDelay = 1500;
    const randomDelay = Phaser.Math.Between(-300, 300);
    this.gameTimers.push(
      this.scene.time.addEvent({
        delay: baseDelay + randomDelay,
        callback: () => this.spawnDangerousItem(),
        loop: false,
      })
    );
  }

  spawnFloatingVeggie() {
    const symbol = Phaser.Math.RND.pick(window.FLOATING_VEGGIES);
    const jumpVelocity = 12;
    const gravity = 0.35;
    const maxJumpHeight = (jumpVelocity * jumpVelocity) / (2 * gravity);

    // Increased range of heights while keeping within jump range
    const minY = this.scene.floorY - maxJumpHeight + 40; // Adjusted from 70 to 40
    const maxY = this.scene.floorY - 100;
    const skyY = Phaser.Math.Between(minY, maxY);

    // Create container for veggie and points text
    const container = this.scene.add.container(this.scene.scale.width, skyY);
    container.setDepth(1);

    const veg = this.scene.add
      .text(0, 0, symbol, {
        fontFamily: "'Press Start 2P'",
        fontSize: "32px",
      })
      .setOrigin(0.5);

    // Add points indicator
    const pointsText = this.scene.add
      .text(veg.width / 2 + 10, -15, "+20", {
        fontFamily: "'Press Start 2P'",
        fontSize: "16px",
        color: "#2d5a27",
        stroke: "#ffffff",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5);

    container.add([veg, pointsText]);

    if (Phaser.Math.Between(0, 100) < 20) {
      container.setScale(1.2);
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

  update() {
    if (this.isGameOver) return;

    const baseSpeed = window.SPEED_CONFIG.initialSpeed;
    const currentSpeed = baseSpeed * this.speedMultiplier;

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
  }

  getCurrentSpeed() {
    return window.SPEED_CONFIG.initialSpeed * this.speedMultiplier;
  }
}

window.GameMechanics = GameMechanics;
