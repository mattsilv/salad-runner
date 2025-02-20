class CityBackground {
  constructor(scene) {
    this.scene = scene;
    this.scrollOffset = 0;
    this.TILE_WIDTH = 160;
    this.buildings = [];
    // Create a container for all background elements with depth -1
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(-1);
    this.createBackground();
  }

  createBackground() {
    const gameHeight = this.scene.scale.height;

    // Create graphics for each building type
    const buildingConfigs = [
      {
        width: 32,
        height: 100,
        color: 0x444444,
        windowColor: 0xffff88,
        x: 0,
      },
      {
        width: 32,
        height: 140,
        color: 0x222266,
        windowColor: 0xffffff,
        x: 40,
      },
      {
        width: 48,
        height: 120,
        color: 0x654321,
        windowColor: 0xccccaa,
        x: 80,
      },
      {
        width: 40,
        height: 80,
        color: 0x555555,
        windowColor: 0xdddd88,
        x: 136,
      },
    ];

    // Create one tile of buildings
    const tile = this.scene.add.container(0, 0);

    buildingConfigs.forEach((config) => {
      const building = this.scene.add.graphics();
      const buildingTop = gameHeight - config.height - 40;

      // Main building
      building.fillStyle(config.color);
      building.fillRect(config.x, buildingTop, config.width, config.height);

      // Windows
      building.fillStyle(config.windowColor);
      for (
        let wy = buildingTop + 10;
        wy < buildingTop + config.height - 10;
        wy += 20
      ) {
        for (
          let wx = config.x + 4;
          wx < config.x + config.width - 4;
          wx += 12
        ) {
          building.fillRect(wx, wy, 4, 4);
        }
      }

      // Add some details (optional)
      if (Math.random() > 0.5) {
        building.fillStyle(0x333333);
        building.fillRect(
          config.x + config.width / 4,
          buildingTop - 8,
          config.width / 2,
          8
        );
      }

      tile.add(building);
    });

    // Calculate how many tiles we need to cover the screen plus one extra
    const numTiles = Math.ceil(this.scene.scale.width / this.TILE_WIDTH) + 1;

    // Create copies of the tile
    for (let i = 0; i < numTiles; i++) {
      const tileClone = tile.list.map((building) => {
        return building.clone();
      });

      const container = this.scene.add.container(i * this.TILE_WIDTH, 0);
      tileClone.forEach((building) => container.add(building));
      this.buildings.push(container);
      this.container.add(container);
    }

    // Add a ground
    const ground = this.scene.add.graphics();
    ground.fillStyle(0x3a5a21);
    ground.fillRect(0, gameHeight - 40, this.scene.scale.width, 40);
    this.container.add(ground);
  }

  update(speed) {
    this.scrollOffset += speed;

    this.buildings.forEach((container) => {
      container.x -= speed;

      if (container.x < -this.TILE_WIDTH) {
        container.x += this.TILE_WIDTH * this.buildings.length;
      }
    });
  }
}

// Make it available globally
window.CityBackground = CityBackground;
