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
  const splash = /splash/i.test(file);
  const foreground = /foreground/.test(file);
  const result = await page.evaluate(
    ({ w, h, splash, foreground }) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const g = c.getContext("2d");
      if (!foreground) {
        g.fillStyle = "#080c1c";
        g.fillRect(0, 0, w, h);
      }
      const size = Math.min(w, h) * (splash ? 0.22 : 0.52),
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
    },
    { w, h, splash, foreground },
  );
  fs.writeFileSync(file, Buffer.from(result, "base64"));
}
console.log(`Generated ${files.length} native icons and splash assets.`);
await browser.close();
