class CloudBackground {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    try {
      // Create a container for clouds with depth just above background
      this.container = this.scene.add.container(0, 0);
      this.container.setDepth(-10); // Set very low depth so it's just above background
      this.createClouds();
    } catch (error) {
      console.error("Failed to create cloud background:", error);
      this.failed = true;
    }
  }

  createClouds() {
    if (this.failed) return;

    // Create initial set of clouds at random positions
    const numClouds = 4; // Reduced from 6 to 4 clouds
    const sectionWidth = this.scene.scale.width / numClouds;

    for (let i = 0; i < numClouds; i++) {
      // Place each cloud within its own section with some random offset
      const sectionStart = i * sectionWidth;
      const x = sectionStart + Phaser.Math.Between(50, sectionWidth - 50);
      this.spawnCloudAt(x);
    }
  }

  spawnCloud() {
    if (this.failed) return;
    // Spawn new clouds further to the right to maintain spacing
    this.spawnCloudAt(this.scene.scale.width + Phaser.Math.Between(100, 300));
  }

  spawnCloudAt(x) {
    if (this.failed) return;
    try {
      // Increased vertical range for more dispersion (was 20 to height/3)
      const y = Phaser.Math.Between(10, this.scene.scale.height / 2.5);
      // Increased scale by ~25% (was 0.4 to 0.6)
      const scale = Phaser.Math.FloatBetween(0.5, 0.75);

      const cloud = this.scene.add.image(x, y, "cloud");
      cloud.setScale(scale);
      cloud.setAlpha(0.7);
      this.clouds.push(cloud);
      this.container.add(cloud);
    } catch (error) {
      console.error("Failed to spawn cloud:", error);
      this.failed = true;
    }
  }

  update(speed) {
    if (this.failed) return;

    // Move clouds and remove when off screen
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];
      cloud.x -= speed * 0.2;

      if (cloud.x < -100) {
        cloud.destroy();
        this.clouds.splice(i, 1);
        this.spawnCloud();
      }
    }
  }
}

// Make it available globally
window.CloudBackground = CloudBackground;
