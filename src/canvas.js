export function canvasContext(canvas, width, height) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(width * ratio),
    h = Math.round(height * ratio);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(w / width, 0, 0, h / height, 0, 0);
  return ctx;
}
