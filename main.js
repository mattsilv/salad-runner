// Initialize Phaser once everything is loaded
(function () {
  const config = {
    type: Phaser.AUTO,
    width: window.GAME_WIDTH,
    height: window.GAME_HEIGHT,
    backgroundColor: "#ebf7d9",
    parent: "game-container",
    scene: [window.SaladScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: "100%",
      height: "100%",
      autoCenter: Phaser.Scale.CENTER_BOTH,
      autoRound: true,
    },
    resolution: window.devicePixelRatio,
  };

  new Phaser.Game(config);
})();
