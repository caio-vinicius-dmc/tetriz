// Gera os ícones nativos a partir de resources/icon-source.jpg e as telas de abertura.
// Uso: node scripts/generate-icons.mjs (requer o Google Chrome instalado no Windows).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage();
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
}
const source =
  "data:image/jpeg;base64," +
  fs.readFileSync("resources/icon-source.jpg").toString("base64");

// Recorta a moldura arredondada da logo e torna os cantos brancos transparentes.
const art = await page.evaluate(async (source) => {
  // createImageBitmap usa os pixels reais; <img> aplicaria a resolução EXIF (dpi).
  const img = await createImageBitmap(await (await fetch(source)).blob());
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const { data } = g.getImageData(0, 0, c.width, c.height);
  const ink = (x, y) => {
    const i = (y * c.width + x) * 4;
    return Math.min(data[i], data[i + 1], data[i + 2]) < 200;
  };
  const midY = c.height >> 1,
    midX = c.width >> 1;
  let left = 0,
    right = c.width - 1,
    top = 0,
    bottom = c.height - 1;
  while (!ink(left, midY)) left++;
  while (!ink(right, midY)) right--;
  while (!ink(midX, top)) top++;
  while (!ink(midX, bottom)) bottom--;
  let d = 0;
  while (!ink(left + d, top + d)) d++;
  const inset = 3,
    radius = d / (1 - Math.SQRT1_2),
    w = right - left + 1 - inset * 2,
    h = bottom - top + 1 - inset * 2;
  const out = document.createElement("canvas");
  out.width = out.height = Math.max(w, h);
  const o = out.getContext("2d");
  o.beginPath();
  o.roundRect(
    (out.width - w) / 2,
    (out.height - h) / 2,
    w,
    h,
    Math.max(0, radius - inset),
  );
  o.clip();
  o.drawImage(
    img,
    left + inset,
    top + inset,
    w,
    h,
    (out.width - w) / 2,
    (out.height - h) / 2,
    w,
    h,
  );
  // Cor da moldura, usada como fundo do ícone adaptativo e do iOS.
  const i = (midY * c.width + left + 6) * 4;
  const hex = (n) => n.toString(16).padStart(2, "0");
  return {
    png: out.toDataURL("image/png"),
    frame: "#" + hex(data[i]) + hex(data[i + 1]) + hex(data[i + 2]),
    size: out.width,
  };
}, source);
fs.writeFileSync(
  "resources/icon.png",
  Buffer.from(art.png.split(",")[1], "base64"),
);

const files = [
  ...walk("android/app/src/main/res"),
  ...walk("ios/App/App/Assets.xcassets"),
].filter(
  (p) => p.endsWith(".png") && /ic_launcher|splash|Splash|AppIcon/.test(p),
);
for (const file of files) {
  const png = fs.readFileSync(file),
    w = png.readUInt32BE(16),
    h = png.readUInt32BE(20);
  const kind = /splash/i.test(file)
    ? "splash"
    : /foreground/.test(file)
      ? "foreground"
      : /round/.test(file)
        ? "round"
        : /AppIcon/.test(file)
          ? "ios"
          : "legacy";
  const result = await page.evaluate(
    async ({ w, h, kind, art }) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const g = c.getContext("2d");
      g.imageSmoothingQuality = "high";
      if (kind === "splash") {
        g.fillStyle = "#080c1c";
        g.fillRect(0, 0, w, h);
        const size = Math.min(w, h) * 0.22,
          b = size / 3,
          gap = b * 0.07,
          x = (w - size) / 2,
          y = (h - size) / 2;
        const blocks = [
          [0, 0, "#39d7ef"],
          [1, 0, "#88ed77"],
          [2, 0, "#ffe56b"],
          [1, 1, "#bc86ff"],
          [1, 2, "#ff6888"],
        ];
        for (const [col, row, color] of blocks) {
          g.fillStyle = color;
          g.fillRect(
            x + col * b + gap,
            y + row * b + gap,
            b - gap * 2,
            b - gap * 2,
          );
          g.fillStyle = "#ffffff88";
          g.fillRect(
            x + col * b + gap * 2,
            y + row * b + gap * 2,
            b - gap * 4,
            Math.max(1, b * 0.04),
          );
        }
        return c.toDataURL("image/png").split(",")[1];
      }
      const img = new Image();
      img.src = art.png;
      await img.decode();
      // Reduz em etapas para manter a nitidez nos tamanhos pequenos.
      const scaled = (size) => {
        let src = img,
          s = img.width;
        while (s / 2 > size) {
          s = Math.round(s / 2);
          const step = document.createElement("canvas");
          step.width = step.height = s;
          const sg = step.getContext("2d");
          sg.imageSmoothingQuality = "high";
          sg.drawImage(src, 0, 0, s, s);
          src = step;
        }
        return src;
      };
      const draw = (scale) => {
        const size = Math.round(w * scale);
        g.drawImage(scaled(size), (w - size) / 2, (h - size) / 2, size, size);
      };
      if (kind === "foreground") {
        // Área visível do ícone adaptativo: 72 de 108 dp.
        draw(0.66);
      } else if (kind === "round") {
        g.beginPath();
        g.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
        g.clip();
        g.fillStyle = art.frame;
        g.fillRect(0, 0, w, h);
        draw(1);
      } else if (kind === "ios") {
        // A App Store exige ícone sem transparência.
        g.fillStyle = art.frame;
        g.fillRect(0, 0, w, h);
        draw(1);
      } else {
        draw(0.96);
      }
      return c.toDataURL("image/png").split(",")[1];
    },
    { w, h, kind, art },
  );
  fs.writeFileSync(file, Buffer.from(result, "base64"));
}
fs.writeFileSync(
  "android/app/src/main/res/values/ic_launcher_background.xml",
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${art.frame.toUpperCase()}</color>\n</resources>\n`,
);
console.log(
  `Generated ${files.length} native icons and splash assets (logo ${art.size}px, frame ${art.frame}).`,
);
await browser.close();
