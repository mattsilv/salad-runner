class GameUI {
  constructor(scene) {
    this.scene = scene;
    this.createTitle();
    this.createScoreText();
    this.createInstructions();
  }

  createTitle() {
    // Create container for both title and score
    this.headerContainer = this.scene.add.container(
      this.scene.scale.width / 2,
      60
    );
    this.headerContainer.setDepth(1);

    const titleText = this.scene.add
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
    this.scoreText = this.scene.add
      .text(this.titleText.width / 2 + 40, 0, "Score:\n" + window.score, {
        fontFamily: "'Press Start 2P'",
        fontSize: "16px",
        color: "#333",
        align: "center",
        resolution: 2,
      })
      .setOrigin(0, 0.3)
      .setDepth(1);

    this.headerContainer.add(this.scoreText);
  }

  createInstructions() {
    // Calculate available width for instructions
    const instructionsWidth = Math.min(500, this.scene.scale.width - 40);

    this.instructions = this.scene.add
      .text(
        this.scene.scale.width / 2,
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
    this.bonusLegend = this.scene.add
      .text(
        this.scene.scale.width / 2,
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
    this.dangerLegend = this.scene.add
      .text(
        this.scene.scale.width / 2,
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
    this.tempTip = this.scene.add
      .text(
        this.scene.scale.width / 2,
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
    this.scene.time.delayedCall(8000, () => {
      this.scene.tweens.add({
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

  updateScore() {
    this.scoreText.setText("Score:\n" + window.score);
  }

  handleResize(gameSize) {
    // Center the entire header container
    this.headerContainer.setPosition(gameSize.width / 2, 60);

    // Update instructions position relative to header container
    if (this.instructions) {
      this.instructions.setPosition(
        gameSize.width / 2,
        this.headerContainer.y + this.titleText.height + 40
      );
      this.instructions.setWordWrapWidth(Math.min(500, gameSize.width - 40));
    }

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
  }

  showGameOver() {
    // Calculate responsive sizes based on screen width
    const gameWidth = this.scene.scale.width;
    const fontSize = Math.min(72, Math.max(32, gameWidth / 10));
    const finalScoreFontSize = Math.min(36, Math.max(24, gameWidth / 20));
    const buttonWidth = Math.min(300, gameWidth - 40);

    const gameOverText = this.scene.add
      .text(
        this.scene.scale.width / 2,
        this.scene.scale.height * 0.3,
        "GAME OVER!",
        {
          fontSize: fontSize + "px",
          fontFamily: "'Press Start 2P'",
          color: "#ff0000",
          stroke: "#000000",
          strokeThickness: Math.max(2, fontSize / 12),
        }
      )
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: gameOverText,
      y: this.scene.scale.height * 0.25,
      duration: 1000,
      ease: "Bounce.easeOut",
    });

    const finalScore = this.scene.add
      .text(
        this.scene.scale.width / 2,
        this.scene.scale.height * 0.4,
        `Final Score: ${window.score}`,
        {
          fontSize: finalScoreFontSize + "px",
          fontFamily: "'Press Start 2P'",
          color: "#333",
        }
      )
      .setOrigin(0.5)
      .setScale(0);

    this.scene.tweens.add({
      targets: finalScore,
      scale: 1,
      duration: 500,
      delay: 300,
      ease: "Back.easeOut",
    });

    // A simple restart "button"
    const buttonBg = this.scene.add
      .rectangle(
        this.scene.scale.width / 2,
        this.scene.scale.height * 0.6,
        buttonWidth,
        80,
        0xddffdd
      )
      .setStrokeStyle(6, 0x2d5a27)
      .setOrigin(0.5)
      .setInteractive()
      .setAlpha(0);

    const buttonText = this.scene.add
      .text(
        this.scene.scale.width / 2,
        this.scene.scale.height * 0.6,
        "Try Again!",
        {
          fontSize: Math.min(24, gameWidth / 20) + "px",
          fontFamily: "'Press Start 2P'",
          color: "#2d5a27",
        }
      )
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
      this.scene.scene.restart();
    });

    this.scene.tweens.add({
      targets: [buttonBg, buttonText],
      alpha: 1,
      duration: 500,
      delay: 800,
    });
  }

  createFloatingScore(x, y, score) {
    const scoreText = this.scene.add
      .text(x, y, `+${score}`, {
        fontFamily: "'Press Start 2P'",
        fontSize: "24px",
        color: "#2d5a27",
        stroke: "#ffffff",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.scene.tweens.add({
      targets: scoreText,
      y: y - 80,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: "Cubic.easeOut",
      onComplete: () => {
        scoreText.destroy();
      },
    });

    const particles = this.scene.add.particles(x, y, "star", {
      speed: { min: 50, max: 100 },
      scale: { start: 0.4, end: 0 },
      quantity: 1,
      lifespan: 800,
      gravityY: 100,
      emitting: false,
    });

    particles.explode(8);

    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }
}

window.GameUI = GameUI;
