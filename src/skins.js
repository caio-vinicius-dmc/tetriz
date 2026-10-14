export const SKINS = [
  ["standard", "PADRÃO", "Cristal e brilho", "#90dfcd", 14],
  ["three", "3D", "Volume esculpido", "#76b9f5", 12],
  ["lego", "LEGO", "Encaixes e cores vivas", "#f4bc42", 18],
  ["flat", "LISO", "Formas puras, visual suave", "#92c7b5", 22],
  ["neon", "NEON", "Luz elétrica", "#d78af9", 8],
  ["board", "TABULEIRO", "Mosaico artesanal", "#cda979", 4],
  ["classic", "CLÁSSICO", "Uma viagem aos arcades", "#a2cb72", 0],
  ["hollow", "VAZADO", "Molduras abertas", "#77cbd0", 10],
  ["gradient", "DEGRADE", "Cores em movimento", "#ab9bff", 20],
  ["space", "STARWARS", "Painéis de uma galáxia distante", "#f09872", 3],
  ["voxel", "MINECRAF", "Um mundo de pixels", "#98c46d", 0],
  ["shadow", "SOMBREADO", "Camadas e profundidade", "#b6acd7", 16],
  ["outline", "OUTLINE", "Traços essenciais", "#87b9cd", 6],
].map(([id, label, description, accent, radius]) => ({
  id,
  label,
  description,
  accent,
  radius,
}));
const colors = {
  I: "#25b9d0",
  J: "#6587e4",
  L: "#ed9b43",
  O: "#e0bd43",
  S: "#77bc61",
  T: "#ac77dc",
  Z: "#e66c89",
};
export function drawSkinCell(
  ctx,
  x,
  y,
  size,
  type,
  skin,
  light,
  ghost = false,
  patterns = false,
) {
  const c = colors[type] || colors.I;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 30, size / 30);
  const rect = (a, b, w, h, r = 0) => {
    ctx.beginPath();
    ctx.roundRect(a, b, w, h, r);
  };
  const fill = (color, a = 1, b = 1, w = 28, h = 28, r = 3) => {
    ctx.fillStyle = color;
    rect(a, b, w, h, r);
    ctx.fill();
  };
  const stroke = (color, width = 1, a = 2, b = 2, w = 26, h = 26, r = 2) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    rect(a, b, w, h, r);
    ctx.stroke();
  };
  if (ghost) {
    ctx.setLineDash([3, 3]);
    fill(c + "12", 3, 3, 24, 24);
    stroke(light ? "#43556d80" : "#ffffff70", 1, 3, 3, 24, 24);
    ctx.restore();
    return;
  }
  switch (skin) {
    case "three":
      fill(c, 1, 1, 28, 28, 2);
      fill("#ffffff70", 3, 3, 23, 5, 0);
      fill("#00000050", 23, 8, 5, 19, 0);
      fill("#00000035", 3, 23, 20, 5, 0);
      fill(c, 7, 8, 15, 14, 1);
      break;
    case "lego":
      fill("#00000035", 2, 3, 27, 27, 4);
      fill(c, 1, 1, 26, 26, 4);
      for (const a of [9, 20])
        for (const b of [8, 19]) {
          ctx.fillStyle = "#00000035";
          ctx.beginPath();
          ctx.arc(a, b + 1.5, 4.4, 0, 7);
          ctx.fill();
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.arc(a, b, 4.1, 0, 7);
          ctx.fill();
          ctx.strokeStyle = "#ffffff80";
          ctx.beginPath();
          ctx.arc(a, b, 3, -2.8, -0.4);
          ctx.stroke();
        }
      break;
    case "flat":
      fill(c, 2, 2, 26, 26, 7);
      break;
    case "neon":
      fill(light ? "#eef0ff" : "#140e28", 2, 2, 26, 26, 2);
      ctx.shadowColor = c;
      ctx.shadowBlur = 7;
      stroke(c, 2);
      ctx.shadowBlur = 0;
      stroke(light ? c : "#ffffffbb", 0.7, 5, 5, 20, 20);
      break;
    case "board":
      fill("#533d2a", 1, 1, 28, 28, 1);
      fill(c, 3, 3, 24, 24, 0);
      for (let a = 0; a < 4; a++)
        for (let b = 0; b < 4; b++) {
          if ((a + b) % 2 === 0)
            fill("#ffffff30", 3 + a * 6, 3 + b * 6, 6, 6, 0);
        }
      stroke("#ffffff90", 1, 5, 5, 20, 20, 0);
      break;
    case "classic":
      fill("#121c22", 0, 0, 30, 30, 0);
      fill(c, 2, 2, 26, 26, 0);
      fill("#ffffff80", 3, 3, 23, 3, 0);
      fill("#00000060", 5, 24, 22, 3, 0);
      stroke("#18262e", 2, 8, 8, 14, 14, 0);
      break;
    case "hollow":
      stroke(c, 5, 4, 4, 22, 22, 3);
      ctx.clearRect(11, 0, 8, 8);
      ctx.clearRect(11, 22, 8, 8);
      fill(c, 12, 12, 6, 6, 1);
      break;
    case "gradient": {
      const g = ctx.createLinearGradient(2, 1, 27, 29);
      g.addColorStop(0, c);
      g.addColorStop(0.5, "#ba8ee7");
      g.addColorStop(1, "#4b99d6");
      fill(g, 1, 1, 28, 28, 8);
      stroke("#ffffff60", 1, 3, 3, 24, 24, 6);
      break;
    }
    case "space":
      fill(light ? "#dce3eb" : "#26323e", 1, 1, 28, 28, 0);
      stroke(c, 1.4, 2, 2, 26, 26, 0);
      fill(c, 4, 4, 3, 17, 0);
      fill("#ffffff88", 10, 5, 12, 2, 0);
      fill("#00000050", 10, 11, 15, 11, 0);
      fill(c, 17, 24, 7, 2, 0);
      break;
    case "voxel":
      fill(c, 1, 1, 28, 28, 0);
      fill("#ffffff70", 1, 1, 28, 6, 0);
      fill("#00000045", 1, 21, 28, 8, 0);
      for (const [a, b] of [
        [4, 9],
        [17, 12],
        [10, 22],
        [23, 5],
      ])
        fill("#00000028", a, b, 5, 5, 0);
      break;
    case "shadow":
      ctx.shadowColor = light ? "#23334c70" : "#000000cc";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 3;
      fill(c, 3, 1, 23, 23, 5);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      fill("#ffffff30", 5, 3, 19, 9, 3);
      break;
    case "outline":
      stroke(c, 1.6, 3, 3, 24, 24, 7);
      fill(c, 12, 12, 6, 6, 3);
      break;
    default: {
      const g = ctx.createLinearGradient(0, 0, 30, 30);
      g.addColorStop(0, c);
      g.addColorStop(1, c + "bb");
      fill(g);
      stroke("#ffffff60", 0.8, 1, 1, 28, 28, 3);
      const b = ctx.createLinearGradient(0, 0, 0, 30);
      b.addColorStop(0, "#ffffff55");
      b.addColorStop(0.45, "#ffffff05");
      b.addColorStop(1, "#00000035");
      fill(b, 4, 4, 22, 22, 0);
      ctx.strokeStyle = "#ffffff90";
      ctx.beginPath();
      ctx.moveTo(4, 25);
      ctx.lineTo(4, 4);
      ctx.lineTo(25, 4);
      ctx.stroke();
    }
  }
  if (patterns) {
    ctx.fillStyle = light ? "#101a28" : "#101a28";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      ["•", "+", "/", "○", "×", "◇", "−"][Object.keys(colors).indexOf(type)],
      15,
      21,
    );
  }
  ctx.restore();
}
export function skinCards(selected) {
  return `<h2 class="skin-heading">Modelos de blocos</h2><p class="setting-help">Peças e cenário com a sua personalidade.</p><div class="skin-grid">${SKINS.map((s) => `<label class="skin-card"><input type="radio" name="skin" value="${s.id}" aria-label="${s.label}" ${selected === s.id ? "checked" : ""}><span class="skin-preview" style="--preview-accent:${s.accent}"><canvas data-skin-preview="${s.id}" width="160" height="90" aria-hidden="true"></canvas><span class="skin-check" aria-hidden="true">✓</span></span><strong>${s.label}</strong><small>${s.description}</small></label>`).join("")}</div>`;
}
export function paintPreviews(light) {
  for (const canvas of document.querySelectorAll("[data-skin-preview]")) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 160, 90);
    const id = canvas.dataset.skinPreview;
    for (const [x, y, t] of [
      [35, 15, "T"],
      [15, 35, "T"],
      [35, 35, "T"],
      [55, 35, "T"],
      [85, 35, "L"],
      [85, 55, "L"],
      [105, 55, "L"],
    ])
      drawSkinCell(ctx, x, y, 20, t, id, light);
  }
}
