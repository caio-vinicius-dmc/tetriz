// Pointer capture keeps a drag active outside the board; physics never pauses.
export function bindBoardGestures(
  canvas,
  { getGame, enabled, threshold, action, render },
) {
  let pointer = null;
  const abort = new AbortController(),
    options = { signal: abort.signal };
  const cancel = () => {
    if (pointer && canvas.hasPointerCapture(pointer.id))
      canvas.releasePointerCapture(pointer.id);
    pointer = null;
    canvas.classList.remove("dragging");
  };
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      if (!enabled() || pointer || !e.isPrimary || e.button !== 0) return;
      const g = getGame(),
        r = canvas.getBoundingClientRect(),
        cx = ((e.clientX - r.left) * 10) / r.width,
        cy = ((e.clientY - r.top) * 20) / r.height;
      const hit = g.active.m.some((row, y) =>
        row.some(
          (v, x) =>
            v &&
            cx >= g.active.x + x - 0.25 &&
            cx <= g.active.x + x + 1.25 &&
            cy >= g.active.y + y - 0.25 &&
            cy <= g.active.y + y + 1.25,
        ),
      );
      pointer = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        anchor: e.clientX,
        serial: g.pieceSerial,
        hit,
        moved: false,
      };
      canvas.setPointerCapture(e.pointerId);
      if (hit) canvas.classList.add("dragging");
      e.preventDefault();
    },
    options,
  );
  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (!pointer || pointer.id !== e.pointerId) return;
      const g = getGame();
      if (!enabled() || g.pieceSerial !== pointer.serial) {
        cancel();
        return;
      }
      if (!pointer.hit) return;
      const unit = canvas.getBoundingClientRect().width / 10,
        delta = e.clientX - pointer.anchor,
        steps = Math.trunc(delta / unit);
      if (!steps) return;
      pointer.moved = true;
      pointer.anchor += steps * unit;
      for (let i = 0; i < Math.min(10, Math.abs(steps)); i++)
        if (!g.move(Math.sign(steps))) break;
      render();
      e.preventDefault();
    },
    options,
  );
  canvas.addEventListener(
    "pointerup",
    (e) => {
      if (!pointer || pointer.id !== e.pointerId) return;
      const p = pointer;
      cancel();
      if (!enabled() || getGame().pieceSerial !== p.serial) return;
      const dx = e.clientX - p.x,
        dy = e.clientY - p.y,
        t = threshold();
      if (p.hit) {
        if (!p.moved && Math.max(Math.abs(dx), Math.abs(dy)) < Math.min(t, 12))
          action("rotate");
        return;
      }
      if (Math.max(Math.abs(dx), Math.abs(dy)) < t) action("rotate");
      else if (Math.abs(dx) > Math.abs(dy)) action(dx > 0 ? "right" : "left");
      else action(dy > 0 ? "drop" : "hold");
    },
    options,
  );
  canvas.addEventListener("pointercancel", cancel, options);
  canvas.addEventListener(
    "lostpointercapture",
    () => {
      pointer = null;
      canvas.classList.remove("dragging");
    },
    options,
  );
  window.addEventListener("resize", cancel, options);
  window.addEventListener("blur", cancel, options);
  return {
    cancel,
    dispose() {
      cancel();
      abort.abort();
    },
  };
}
