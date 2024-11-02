class ParticleSystem extends PIXI.Container {
  constructor() {
    super();

    // Initialize
    this.start = 0;
    this.duration = 10000;
    this.numCoins = 100;
    this.coins = [];

    for (let i = 0; i < this.numCoins; i++) {
      // Create a sprite, from center and scale 0
      let sp = game.sprite("CoinsGold000");
      sp.pivot.x = sp.width / 2;
      sp.pivot.y = sp.height / 2;
      sp.scale.set(0);
      sp.x = 400;
      sp.y = 450;

      let coinStartTime = Math.random() * this.duration * 0.5; // Random start time for each coin
      sp.startTime = coinStartTime;

      // Random starting speed in x y direction
      sp.vx = (Math.random() - 0.5) * 600;
      sp.vy = -Math.random() * 600 - 400;

      // Random rotation speed
      sp.rotationSpeed = (Math.random() - 0.5) * 0.4;

      // Add the sprite particle to our particle effect
      this.addChild(sp);

      // Add the coin sprite to the coins array
      this.coins.push(sp);
    }
  }

  animTick(nt, lt, gt) {
    // Time variables:
    // nt: Normalized time (0.0 to 1.0)
    // lt: Local time in milliseconds, from 0 to this.duration
    // gt: Global time in milliseconds

    // physical variables:
    const gravity = 1000;
    const scaleDuration = 500;

    // Loop through each coin in the particle system
    for (let i = 0; i < this.coins.length; i++) {
      const sp = this.coins[i];

      // Calculate the elapsed time
      const coinElapsedTime = lt - sp.startTime;

      // only play animation for started coin
      if (coinElapsedTime < 0 || coinElapsedTime > this.duration) continue;

      // Convert elapsed time to seconds for kinematic
      const t = coinElapsedTime / 1000;

      // use kinematic equations to look real
      sp.x = 400 + sp.vx * t;
      sp.y = 450 + sp.vy * t + 0.5 * gravity * t * t;

      // update rotation axis for different coin rotations
      sp.rotation += sp.rotationSpeed;

      // coin self rotation speed
      const rotationCycle = 500;

      // Animate the coin's texture to simulate on axis rotation
      const animationProgress =
        (coinElapsedTime % rotationCycle) / rotationCycle; // Progress from 0 to 1
      const frameIndex = Math.floor(animationProgress * 8); // Frame index from 0 to 8
      const textureName = "CoinsGold" + ("000" + frameIndex).substr(-3);
      game.setTexture(sp, textureName);

      // Calculate normalized time for scaling (0 to 1)
      let cnt = coinElapsedTime / scaleDuration;
      cnt = Math.min(cnt, 1); // Cap at 1

      // Set the coin's scale based on cnt
      sp.scale.x = sp.scale.y = cnt * 0.2; // Max scale is 0.2

      // Remove the coin if it moves off the bottom of the screen or the effect is ending
      if (sp.y > 500 || lt >= this.duration) {
        this.removeChild(sp);
        this.coins.splice(i, 1);
        i--; // Adjust the index after removal to not skip next coin
      }

      // ToDo: re-assign the starting position of each coin to re-use the assest
    }
  }
}

class Game {
  constructor(props) {
    this.totalDuration = 0;
    this.effects = [];
    this.renderer = new PIXI.WebGLRenderer(800, 450);
    document.body.appendChild(this.renderer.view);
    this.stage = new PIXI.Container();
    this.loadAssets(props && props.onload);
  }
  loadAssets(cb) {
    console.log(this);
    let textureNames = [];
    // Load coin assets
    for (let i = 0; i <= 8; i++) {
      let num = ("000" + i).substr(-3);
      let name = "CoinsGold" + num;
      let url = "gfx/CoinsGold/" + num + ".png";
      textureNames.push(name);
      PIXI.loader.add(name, url);
    }
    PIXI.loader.load(
      function (loader, res) {
        // Access assets by name, not url
        let keys = Object.keys(res);
        for (let i = 0; i < keys.length; i++) {
          var texture = res[keys[i]].texture;
          if (!texture) continue;
          PIXI.utils.TextureCache[keys[i]] = texture;
        }
        // Assets are loaded and ready!
        this.start();
        cb && cb();
      }.bind(this)
    );
  }
  start() {
    this.isRunning = true;
    this.t0 = Date.now();
    update.bind(this)();
    function update() {
      if (!this.isRunning) return;
      this.tick();
      this.render();
      requestAnimationFrame(update.bind(this));
    }
  }
  addEffect(eff) {
    this.totalDuration = Math.max(
      this.totalDuration,
      eff.duration + eff.start || 0
    );
    this.effects.push(eff);
    this.stage.addChild(eff);
  }
  render() {
    this.renderer.render(this.stage);
  }
  tick() {
    let gt = Date.now();
    let lt = (gt - this.t0) % this.totalDuration;
    for (let i = 0; i < this.effects.length; i++) {
      let eff = this.effects[i];
      if (lt > eff.start + eff.duration || lt < eff.start) continue;
      let elt = lt - eff.start;
      let ent = elt / eff.duration;
      eff.animTick(ent, elt, gt);
    }
  }
  sprite(name) {
    return new PIXI.Sprite(PIXI.utils.TextureCache[name]);
  }
  setTexture(sp, name) {
    sp.texture = PIXI.utils.TextureCache[name];
    if (!sp.texture) console.warn("Texture '" + name + "' don't exist!");
  }
}

window.onload = function () {
  window.game = new Game({
    onload: function () {
      game.addEffect(new ParticleSystem());
    },
  });
};
