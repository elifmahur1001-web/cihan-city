import {CONFIG} from "./config.js";
import {clamp,random,angleTo,distance} from "./utils.js";

/*
  CIHAN CITY — GELİŞMİŞ ARAÇ SİSTEMİ
  entities.js — Bölüm 1/4
*/

const CAR_SPECS = {
  Sedan: {
    acceleration: 0.18,
    brake: 0.22,
    reverse: 3.2,
    maxSpeed: 8.2,
    nitroSpeed: 11.8,
    steering: 0.037,
    grip: 0.986,
    width: 58,
    height: 30
  },

  SUV: {
    acceleration: 0.16,
    brake: 0.24,
    reverse: 3.0,
    maxSpeed: 7.4,
    nitroSpeed: 10.4,
    steering: 0.032,
    grip: 0.989,
    width: 62,
    height: 34
  },

  Coupe: {
    acceleration: 0.21,
    brake: 0.23,
    reverse: 3.4,
    maxSpeed: 9.2,
    nitroSpeed: 12.7,
    steering: 0.041,
    grip: 0.984,
    width: 57,
    height: 28
  },

  Pickup: {
    acceleration: 0.155,
    brake: 0.25,
    reverse: 3.0,
    maxSpeed: 7.1,
    nitroSpeed: 10.1,
    steering: 0.031,
    grip: 0.99,
    width: 65,
    height: 33
  },

  Sport: {
    acceleration: 0.24,
    brake: 0.25,
    reverse: 3.8,
    maxSpeed: 10.6,
    nitroSpeed: 14.2,
    steering: 0.044,
    grip: 0.981,
    width: 60,
    height: 27
  }
};

function getSpec(model) {
  return CAR_SPECS[model] || CAR_SPECS.Sedan;
}

export class Player {
  constructor() {
    this.x = 720;
    this.y = 720;
    this.angle = 0;

    this.health = 100;
    this.armor = 0;
    this.money = 1200;
    this.ammo = 45;

    this.car = null;
  }

  update(keys) {
    if (this.car) {
      this.x = this.car.x;
      this.y = this.car.y;
      this.angle = this.car.angle;
      return;
    }

    const dx =
      (keys.right ? 1 : 0) -
      (keys.left ? 1 : 0);

    const dy =
      (keys.down ? 1 : 0) -
      (keys.up ? 1 : 0);

    if (dx || dy) {
      const length = Math.hypot(dx, dy);

      const speed = keys.run
        ? CONFIG.PLAYER_RUN_SPEED
        : CONFIG.PLAYER_SPEED;

      this.x += (dx / length) * speed;
      this.y += (dy / length) * speed;

      this.angle = Math.atan2(dy, dx);
    }

    this.x = clamp(
      this.x,
      15,
      CONFIG.WORLD_WIDTH - 15
    );

    this.y = clamp(
      this.y,
      15,
      CONFIG.WORLD_HEIGHT - 15
    );
  }

  draw(ctx) {
    if (this.car) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Karakterin gölgesi
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath();
    ctx.ellipse(
      0,
      17,
      13,
      7,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Karakterin gövdesi
    ctx.fillStyle = "#1b2948";
    ctx.fillRect(-9, 2, 18, 25);

    // Karakterin başı
    ctx.fillStyle = "#e4b78e";
    ctx.beginPath();
    ctx.arc(
      0,
      -6,
      10,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Silah
    ctx.fillStyle = "#252a32";
    ctx.fillRect(6, -2, 18, 4);

    ctx.restore();
  }
}

export class Car {
  constructor(
    id,
    x,
    y,
    color,
    model,
    owned = false,
    ai = false
  ) {
    this.id = id;

    this.x = x;
    this.y = y;
    this.angle = random(
      0,
      Math.PI * 2
    );

    this.speed = 0;
    this.lateralSlip = 0;
    this.engineRpm = 0;
    this.steerVisual = 0;

    this.color = color;
    this.model = model;

    this.owned = owned;
    this.ai = ai;

    this.nitro = 100;
    this.health = 100;
    this.fuel = 100;

    this.brakeLight = 0;
    this.nitroActive = false;
    this.lastDirection = 1;

    this.aiTurnTimer = random(80, 240);
    this.aiTargetSpeed = random(1.8, 3.0);
  }

  get spec() {
    return getSpec(this.model);
  }
    update(keys, active) {
    const spec = this.spec;

    if (active) {
      const forward = !!keys.up;
      const backward = !!keys.down;
      const steeringLeft = !!keys.left;
      const steeringRight = !!keys.right;

      this.nitroActive =
        !!keys.run &&
        this.nitro > 0 &&
        this.speed > 1.2;

      if (forward) {
        const speedRatio = Math.min(
          1,
          Math.abs(this.speed) / spec.maxSpeed
        );

        const torque =
          spec.acceleration *
          (1 - speedRatio * 0.52);

        this.speed += torque;
        this.lastDirection = 1;
      }

      if (backward) {
        if (this.speed > 0.65) {
          this.speed -= spec.brake;
          this.brakeLight = 1;
        } else {
          this.speed -=
            spec.acceleration * 0.72;

          this.lastDirection = -1;
        }
      } else {
        this.brakeLight *= 0.82;
      }

      if (this.nitroActive) {
        this.speed += 0.095;

        this.nitro = Math.max(
          0,
          this.nitro - 0.48
        );
      } else {
        this.nitro = Math.min(
          100,
          this.nitro + 0.065
        );
      }

      const maxForward =
        this.nitroActive
          ? spec.nitroSpeed
          : spec.maxSpeed;

      this.speed = clamp(
        this.speed,
        -spec.reverse,
        maxForward
      );

      const absoluteSpeed =
        Math.abs(this.speed);

      const speedRatio = Math.min(
        1.35,
        absoluteSpeed / spec.maxSpeed
      );

      const lowSpeedAssist =
        0.32 +
        Math.min(
          1,
          absoluteSpeed / 2.2
        ) * 0.68;

      const highSpeedLimiter =
        1 -
        Math.max(
          0,
          speedRatio - 0.65
        ) * 0.38;

      const steerAmount =
        spec.steering *
        lowSpeedAssist *
        highSpeedLimiter;

      let steerInput = 0;

      if (steeringLeft) {
        steerInput = -1;
      }

      if (steeringRight) {
        steerInput = 1;
      }

      this.steerVisual +=
        (steerInput - this.steerVisual) *
        0.2;

      if (
        steerInput !== 0 &&
        absoluteSpeed > 0.08
      ) {
        const direction = Math.sign(
          this.speed || this.lastDirection
        );

        this.angle +=
          steerAmount *
          steerInput *
          direction;

        const slipStrength =
          Math.max(
            0,
            speedRatio - 0.48
          );

        this.lateralSlip +=
          steerInput *
          slipStrength *
          0.026;
      }

      this.lateralSlip *= 0.88;

      const rollingResistance =
        forward || backward
          ? spec.grip
          : spec.grip - 0.004;

      this.speed *= rollingResistance;

      if (
        !forward &&
        !backward &&
        Math.abs(this.speed) < 0.035
      ) {
        this.speed = 0;
      }

      this.engineRpm +=
        (
          Math.abs(this.speed) /
          Math.max(1, spec.maxSpeed) -
          this.engineRpm
        ) * 0.15;

    } else if (this.ai) {
      this.updateAI();

    } else {
      this.nitroActive = false;
      this.speed *= 0.958;

      if (Math.abs(this.speed) < 0.025) {
        this.speed = 0;
      }

      this.engineRpm +=
        (0 - this.engineRpm) * 0.1;
    }

    this.x +=
      Math.cos(this.angle) *
      this.speed;

    this.y +=
      Math.sin(this.angle) *
      this.speed;

    if (
      Math.abs(this.lateralSlip) >
      0.001
    ) {
      this.x +=
        Math.cos(
          this.angle +
          Math.PI / 2
        ) *
        this.lateralSlip *
        Math.abs(this.speed);

      this.y +=
        Math.sin(
          this.angle +
          Math.PI / 2
        ) *
        this.lateralSlip *
        Math.abs(this.speed);
    }

    const oldX = this.x;
    const oldY = this.y;

    this.x = clamp(
      this.x,
      24,
      CONFIG.WORLD_WIDTH - 24
    );

    this.y = clamp(
      this.y,
      24,
      CONFIG.WORLD_HEIGHT - 24
    );

    if (
      oldX !== this.x ||
      oldY !== this.y
    ) {
      this.speed *= -0.22;

      this.health = Math.max(
        0,
        this.health - 1.5
      );
    }
  }

  updateAI() {
    const spec = this.spec;

    this.aiTurnTimer--;

    if (this.aiTurnTimer <= 0) {
      this.aiTurnTimer =
        random(90, 260);

      this.angle +=
        random(-0.6, 0.6);

      this.aiTargetSpeed =
        random(
          1.7,
          Math.min(
            3.2,
            spec.maxSpeed * 0.42
          )
        );
    }

    this.speed +=
      (
        this.aiTargetSpeed -
        this.speed
      ) * 0.025;

    const margin = 120;

    if (this.x < margin) {
      this.angle +=
        (0 - this.angle) * 0.05;

    } else if (
      this.x >
      CONFIG.WORLD_WIDTH - margin
    ) {
      this.angle +=
        (
          Math.PI -
          this.angle
        ) * 0.05;
    }

    if (this.y < margin) {
      const target = Math.PI / 2;

      this.angle +=
        (
          target -
          this.angle
        ) * 0.05;

    } else if (
      this.y >
      CONFIG.WORLD_HEIGHT - margin
    ) {
      const target = -Math.PI / 2;

      this.angle +=
        (
          target -
          this.angle
        ) * 0.05;
    }

    this.engineRpm +=
      (
        Math.abs(this.speed) /
        spec.maxSpeed -
        this.engineRpm
      ) * 0.08;
  }
    draw(ctx) {
    const spec = this.spec;
    const width = spec.width;
    const height = spec.height;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Araç gölgesi
    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.beginPath();
    ctx.ellipse(
      4,
      5,
      width * 0.53,
      height * 0.62,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Nitro alevi
    if (
      this.nitroActive &&
      this.speed > 2
    ) {
      const flameLength =
        12 + Math.random() * 12;

      ctx.fillStyle =
        "rgba(80,190,255,.9)";

      ctx.beginPath();
      ctx.moveTo(
        -width / 2 - 2,
        -6
      );

      ctx.lineTo(
        -width / 2 - flameLength,
        0
      );

      ctx.lineTo(
        -width / 2 - 2,
        6
      );

      ctx.fill();

      ctx.fillStyle =
        "rgba(255,245,180,.95)";

      ctx.beginPath();
      ctx.moveTo(
        -width / 2 - 1,
        -3
      );

      ctx.lineTo(
        -width / 2 -
        flameLength * 0.55,
        0
      );

      ctx.lineTo(
        -width / 2 - 1,
        3
      );

      ctx.fill();
    }

    // Ana araç gövdesi
    ctx.fillStyle = this.color;

    ctx.beginPath();

    ctx.roundRect(
      -width / 2,
      -height / 2,
      width,
      height,
      5
    );

    ctx.fill();

    // Ön ve arka tampon
    ctx.fillStyle =
      "rgba(20,25,32,.7)";

    ctx.fillRect(
      width / 2 - 5,
      -height / 2 + 3,
      5,
      height - 6
    );

    ctx.fillRect(
      -width / 2,
      -height / 2 + 4,
      4,
      height - 8
    );

    // Kabin ve camlar
    ctx.fillStyle = "#9fd0e4";

    ctx.beginPath();

    ctx.roundRect(
      -9,
      -height / 2 + 3,
      25,
      height - 6,
      4
    );

    ctx.fill();

    ctx.fillStyle =
      "rgba(28,55,72,.55)";

    ctx.fillRect(
      -5,
      -height / 2 + 5,
      8,
      height - 10
    );

    ctx.fillRect(
      7,
      -height / 2 + 5,
      7,
      height - 10
    );

    // Ön tekerlekler
    ctx.fillStyle = "#111";

    const wheelWidth = 13;
    const wheelHeight = 6;

    ctx.save();

    ctx.translate(
      width / 2 - 17,
      -height / 2 - 3
    );

    ctx.rotate(
      this.steerVisual * 0.35
    );

    ctx.fillRect(
      -wheelWidth / 2,
      -wheelHeight / 2,
      wheelWidth,
      wheelHeight
    );

    ctx.restore();

    ctx.save();

    ctx.translate(
      width / 2 - 17,
      height / 2 + 3
    );

    ctx.rotate(
      this.steerVisual * 0.35
    );

    ctx.fillRect(
      -wheelWidth / 2,
      -wheelHeight / 2,
      wheelWidth,
      wheelHeight
    );

    ctx.restore();

    // Arka tekerlekler
    ctx.fillRect(
      -width / 2 + 8,
      -height / 2 - 3,
      wheelWidth,
      wheelHeight
    );

    ctx.fillRect(
      -width / 2 + 8,
      height / 2 - 3,
      wheelWidth,
      wheelHeight
    );

    // Ön farlar
    ctx.fillStyle = "#fff7b2";

    ctx.fillRect(
      width / 2 - 3,
      -height / 2 + 4,
      4,
      7
    );

    ctx.fillRect(
      width / 2 - 3,
      height / 2 - 11,
      4,
      7
    );

    // Fren lambaları
    ctx.fillStyle =
      this.brakeLight > 0.1
        ? "#ff3030"
        : "#8d1515";

    ctx.fillRect(
      -width / 2 - 1,
      -height / 2 + 4,
      4,
      7
    );

    ctx.fillRect(
      -width / 2 - 1,
      height / 2 - 11,
      4,
      7
    );

    // Sport araç yarış şeridi
    if (this.model === "Sport") {
      ctx.fillStyle =
        "rgba(255,255,255,.72)";

      ctx.fillRect(
        -width / 2 + 4,
        -2,
        width - 8,
        4
      );
    }

    // Hasarlı araç dumanı
    if (this.health < 45) {
      const smokeCount =
        this.health < 20 ? 3 : 1;

      for (
        let i = 0;
        i < smokeCount;
        i++
      ) {
        ctx.fillStyle =
          `rgba(90,90,90,${
            0.25 +
            Math.random() * 0.25
          })`;

        ctx.beginPath();

        ctx.arc(
          -width / 2 -
          random(3, 15),
          random(-5, 5),
          random(4, 8),
          0,
          Math.PI * 2
        );

        ctx.fill();
      }
    }

    ctx.restore();
  }
}
export class NPC {
  constructor(x, y, police = false) {
    this.x = x;
    this.y = y;

    this.angle = random(
      0,
      Math.PI * 2
    );

    this.police = police;

    this.health = police
      ? 90
      : 50;

    this.speed = random(
      0.35,
      0.85
    );

    this.cooldown = 0;
  }

  update(player, bullets) {
    if (this.police) {
      this.angle = angleTo(
        this,
        player
      );

      this.x +=
        Math.cos(this.angle) *
        1.3;

      this.y +=
        Math.sin(this.angle) *
        1.3;

      this.cooldown--;

      if (
        distance(this, player) < 230 &&
        this.cooldown <= 0
      ) {
        bullets.push(
          new Bullet(
            this.x,
            this.y,
            this.angle,
            false
          )
        );

        this.cooldown = 95;
      }

    } else {
      if (Math.random() < 0.008) {
        this.angle +=
          random(-1.1, 1.1);
      }

      this.x +=
        Math.cos(this.angle) *
        this.speed;

      this.y +=
        Math.sin(this.angle) *
        this.speed;
    }

    this.x = clamp(
      this.x,
      15,
      CONFIG.WORLD_WIDTH - 15
    );

    this.y = clamp(
      this.y,
      15,
      CONFIG.WORLD_HEIGHT - 15
    );
  }

  draw(ctx) {
    // NPC gölgesi
    ctx.fillStyle =
      "rgba(0,0,0,.2)";

    ctx.beginPath();

    ctx.ellipse(
      this.x,
      this.y + 18,
      10,
      5,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    // Baş
    ctx.fillStyle =
      this.police
        ? "#2451a0"
        : "#d7ad88";

    ctx.beginPath();

    ctx.arc(
      this.x,
      this.y,
      10,
      0,
      Math.PI * 2
    );

    ctx.fill();

    // Gövde
    ctx.fillStyle =
      this.police
        ? "#163369"
        : "#5a4c74";

    ctx.fillRect(
      this.x - 7,
      this.y + 7,
      14,
      18
    );
  }
}

export class Bullet {
  constructor(
    x,
    y,
    angle,
    fromPlayer
  ) {
    this.x = x;
    this.y = y;

    this.vx =
      Math.cos(angle) *
      (fromPlayer ? 11 : 7);

    this.vy =
      Math.sin(angle) *
      (fromPlayer ? 11 : 7);

    this.life =
      fromPlayer
        ? 80
        : 90;

    this.fromPlayer = fromPlayer;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  draw(ctx) {
    ctx.fillStyle =
      this.fromPlayer
        ? "#ffe36d"
        : "#ff6e6e";

    ctx.beginPath();

    ctx.arc(
      this.x,
      this.y,
      3,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }
}
  
  