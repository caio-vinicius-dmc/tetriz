// Rolling window measured in active game time: pausing does not advance a combo.
import { canvasContext } from "./canvas.js";
export class Combo {
  constructor() {
    this.events = [];
  }
  add(lines, time) {
    this.events = this.events.filter((e) => time - e.time < 3000);
    this.events.push({ lines, time });
    return this.status(time);
  }
  status(time) {
    const lines = this.events
      .filter((e) => time - e.time < 3000)
      .reduce((s, e) => s + e.lines, 0);
    const tier =
      lines >= 10 ? 4 : lines >= 6 ? 3 : lines >= 4 ? 2 : lines >= 2 ? 1 : 0;
    return {
      lines,
      tier,
      label: [
        "Linha completa",
        "Em chamas",
        "Alta voltagem",
        "Tempestade",
        "Imparável",
      ][tier],
    };
  }
}
export class Effects {
  constructor(serial = 0) {
    this.serial = serial;
    this.combo = new Combo();
    this.particles = [];
    this.bands = [];
    this.lastTime = 0;
    this.expire = 0;
  }
  draw(game, motion, enabled = true) {
    const canvas = document.querySelector("#effects");
    if (!canvas) return;
    const ctx = canvasContext(canvas, 300, 600),
      time = game.elapsed;
    const dt = Math.min(100, Math.max(0, time - this.lastTime)) / 1000;
    this.lastTime = time;
    const wrap = document.querySelector(".board-wrap"),
      label = document.querySelector("#combo");
    if (!enabled) {
      this.serial = game.clearSerial;
      this.combo = new Combo();
      this.particles = [];
      this.bands = [];
      this.expire = 0;
      ctx.clearRect(0, 0, 300, 600);
      label.classList.remove("visible");
      wrap.dataset.energy = 0;
      return;
    }
    if (game.clearSerial !== this.serial) {
      this.serial = game.clearSerial;
      const status = this.combo.add(game.lastClear, time);
      this.expire = time + 1800;
      label.textContent = `${status.label} · ${status.lines} ${status.lines === 1 ? "linha" : "linhas"}`;
      label.dataset.tier = status.tier;
      label.classList.add("visible");
      wrap.dataset.energy = motion ? status.tier : 0;
      this.bands = motion
        ? [
            ...this.bands,
            ...game.clearedRows.map((y) => ({
              y,
              born: time,
              tier: status.tier,
              until: time + 850 + status.tier * 150,
            })),
          ].slice(-12)
        : [];
      const color = ["#8feaca", "#ffad53", "#b4a0ff", "#5de2ff", "#ff80cd"][
        status.tier
      ];
      if (motion)
        for (const y of game.clearedRows)
          for (let i = 0; i < 20 + status.tier * 8; i++)
            this.particles.push({
              x: Math.random() * 300,
              y: y * 30 + 15,
              vx: (Math.random() - 0.5) * 160,
              vy: -40 - Math.random() * (90 + status.tier * 30),
              life: 0.7 + Math.random() * 0.5,
              color,
            });
      this.particles = this.particles.slice(-140);
    }
    ctx.clearRect(0, 0, 300, 600);
    if (time > this.expire) {
      label.classList.remove("visible");
      wrap.dataset.energy = 0;
    }
    if (!motion) {
      this.particles = [];
      this.bands = [];
      wrap.dataset.energy = 0;
      return;
    }
    this.bands = this.bands.filter((b) => b.until > time);
    for (const b of this.bands)
      drawBurst(ctx, b, time, document.body.dataset.theme === "light");
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 6);
    }
    ctx.globalAlpha = 1;
    const status = this.combo.status(time);
    if (status.tier >= 2 && time < this.expire) {
      ctx.strokeStyle = status.tier >= 3 ? "#7be9ff80" : "#c1a4ff70";
      ctx.lineWidth = 1.5;
      for (const x of [5, 295]) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        for (let y = 0; y < 600; y += 35)
          ctx.lineTo(
            x + (x < 150 ? 1 : -1) * (5 + Math.sin(y * 0.3 + time / 120) * 6),
            y,
          );
        ctx.stroke();
      }
    }
  }
}

function drawBurst(ctx, b, time, light) {
  const progress = (time - b.born) / (b.until - b.born),
    fade = 1 - progress,
    y = b.y * 30 + 15;
  const color = ["#30cde7", "#ff932e", "#b58aff", "#28d9ee", "#f65ec2"][b.tier];
  ctx.save();
  ctx.globalAlpha = fade;
  // The beam and shockwave follow the eliminated row, not a fixed screen edge.
  const glow = ctx.createLinearGradient(0, y - 18, 0, y + 18);
  glow.addColorStop(0, color + "00");
  glow.addColorStop(0.5, color + (light ? "55" : "88"));
  glow.addColorStop(1, color + "00");
  ctx.fillStyle = glow;
  ctx.fillRect(0, y - 18, 300, 36);
  ctx.shadowColor = color;
  ctx.shadowBlur = light ? 6 : 14 + b.tier * 3;
  ctx.fillStyle = light ? color : "#f3fcff";
  ctx.fillRect(0, y - 1.5, 300, 3 + b.tier * 0.5);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(
    150,
    y,
    30 + progress * 190,
    3 + progress * (12 + b.tier * 5),
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  if (b.tier >= 1) {
    const fire = ctx.createLinearGradient(0, y + 12, 0, y - 70);
    fire.addColorStop(0, "#ffbc45");
    fire.addColorStop(0.35, "#ff712f");
    fire.addColorStop(1, "#ff4b1b00");
    ctx.fillStyle = fire;
    for (let i = 0; i < 13; i++) {
      const x = i * 25,
        h =
          (25 + b.tier * 9) * (1 - progress * 0.65) +
          Math.sin(i * 2 + time / 150) * 9;
      ctx.beginPath();
      ctx.moveTo(x - 13, y + 11);
      ctx.bezierCurveTo(x - 17, y - 8, x + 8, y - h * 0.7, x + 3, y - h);
      ctx.bezierCurveTo(x + 18, y - h * 0.4, x + 10, y - 6, x + 14, y + 11);
      ctx.closePath();
      ctx.fill();
    }
  }
  if (b.tier >= 2) {
    ctx.strokeStyle = light ? "#7144c9" : "#ece1ff";
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;
    for (let bolt = 0; bolt < b.tier - 1; bolt++) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 300; x += 12)
        ctx.lineTo(
          x,
          y +
            Math.sin(x * 0.63 + Math.floor(time / 100) + bolt) * (7 + bolt * 5),
        );
      ctx.stroke();
    }
  }
  if (b.tier >= 3) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = light ? "#237e96" : "#ccfaff";
    for (const x of [progress * 300, 300 - progress * 300])
      ctx.fillRect(x - 2, y - 24, 4, 48);
  }
  ctx.restore();
}
