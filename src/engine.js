export const WIDTH = 10,
  HEIGHT = 20,
  RULES = 1;
export const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};
export const COLORS = {
  I: "#39d7ef",
  J: "#6488ff",
  L: "#ffab4b",
  O: "#ffe56b",
  S: "#88ed77",
  T: "#bc86ff",
  Z: "#ff6888",
};
const copy = (x) => JSON.parse(JSON.stringify(x));
export const DIFFICULTIES = {
  easy: { label: "Fácil", interval: 1150, lock: 600 },
  medium: { label: "Médio", interval: 800, lock: 450 },
  hard: { label: "Difícil", interval: 450, lock: 300 },
  pro: { label: "Profissional", interval: 220, lock: 180 },
};
export function rulesFor(difficulty = "medium", autoDrop = false) {
  if (difficulty === "medium" && !autoDrop) return RULES;
  return (
    10 + Object.keys(DIFFICULTIES).indexOf(difficulty) + (autoDrop ? 4 : 0)
  );
}
export class Game {
  constructor(random = Math.random, options = {}) {
    this.random = random;
    this.difficulty = Object.hasOwn(DIFFICULTIES, options.difficulty)
      ? options.difficulty
      : "medium";
    this.autoDrop = options.autoDrop === true;
    this.pieceSerial = 0;
    this.clearSerial = 0;
    this.clearedRows = [];
    this.board = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(null));
    this.queue = [];
    this.score = 0;
    this.lines = 0;
    this.elapsed = 0;
    this.over = false;
    this.held = null;
    this.usedHold = false;
    this.fall = 0;
    this.lockTime = 0;
    this.lockResets = 0;
    this.lastClear = 0;
    this.spawn();
  }
  get level() {
    return 1 + Math.floor(this.lines / 10);
  }
  get speed() {
    return (
      35 +
      (DIFFICULTIES[this.difficulty].interval - 35) *
        Math.exp(-(this.level - 1) / 9)
    );
  }
  get rules() {
    return rulesFor(this.difficulty, this.autoDrop);
  }
  refill() {
    while (this.queue.length < 7) {
      const bag = Object.keys(SHAPES);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.queue.push(...bag);
    }
  }
  spawn(type) {
    this.pieceSerial++;
    this.refill();
    const t = type || this.queue.shift();
    this.active = {
      type: t,
      m: copy(SHAPES[t]),
      x: Math.floor((WIDTH - SHAPES[t].length) / 2),
      y: 0,
    };
    this.fall = 0;
    this.lockTime = 0;
    this.lockResets = 0;
    if (!this.valid()) this.over = true;
  }
  valid(p = this.active) {
    return p.m.every((row, y) =>
      row.every(
        (v, x) =>
          !v ||
          (p.x + x >= 0 &&
            p.x + x < WIDTH &&
            p.y + y >= 0 &&
            p.y + y < HEIGHT &&
            !this.board[p.y + y][p.x + x]),
      ),
    );
  }
  move(dx, dy = 0) {
    if (this.over) return false;
    const p = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (!this.valid(p)) return false;
    this.active = p;
    if (dx && this.lockResets < 15) {
      this.lockTime = 0;
      this.lockResets++;
    }
    return true;
  }
  rotate() {
    if (this.over) return false;
    const m = this.active.m[0].map((_, x) =>
      this.active.m.map((r) => r[x]).reverse(),
    );
    for (const [x, y] of [
      [0, 0],
      [-1, 0],
      [1, 0],
      [-2, 0],
      [2, 0],
      [0, -1],
      [0, -2],
    ]) {
      const p = {
        ...this.active,
        m,
        x: this.active.x + x,
        y: this.active.y + y,
      };
      if (this.valid(p)) {
        this.active = p;
        if (this.lockResets < 15) {
          this.lockTime = 0;
          this.lockResets++;
        }
        return true;
      }
    }
    return false;
  }
  soft() {
    if (this.move(0, 1)) {
      this.score++;
      return true;
    }
    return false;
  }
  ghost() {
    let p = { ...this.active };
    while (this.valid({ ...p, y: p.y + 1 })) p.y++;
    return p;
  }
  drop() {
    if (this.over) return;
    const p = this.ghost();
    this.score += (p.y - this.active.y) * 2;
    this.active = p;
    this.lock();
  }
  hold() {
    if (this.over || this.usedHold) return;
    const t = this.active.type;
    this.spawn(this.held);
    this.held = t;
    this.usedHold = true;
  }
  lock() {
    if (this.over) return;
    for (let y = 0; y < this.active.m.length; y++)
      for (let x = 0; x < this.active.m[y].length; x++)
        if (this.active.m[y][x])
          this.board[this.active.y + y][this.active.x + x] = this.active.type;
    this.clearedRows = this.board.flatMap((r, y) =>
      r.every(Boolean) ? [y] : [],
    );
    const rows = this.board.filter((r) => r.some((v) => !v));
    const n = HEIGHT - rows.length;
    this.score += [0, 100, 300, 500, 800][n] * this.level;
    this.lines += n;
    this.lastClear = n;
    if (n) this.clearSerial++;
    while (rows.length < HEIGHT) rows.unshift(Array(WIDTH).fill(null));
    this.board = rows;
    this.usedHold = false;
    this.spawn();
  }
  tick(ms) {
    if (this.over) return;
    ms = Math.min(100, Math.max(0, ms));
    this.elapsed += ms;
    this.fall += ms;
    while (this.fall >= this.speed) {
      this.fall -= this.speed;
      if (!this.move(0, 1)) break;
    }
    if (!this.valid({ ...this.active, y: this.active.y + 1 })) {
      this.lockTime += ms;
      if (this.autoDrop || this.lockTime >= DIFFICULTIES[this.difficulty].lock)
        this.lock();
    } else this.lockTime = 0;
  }
  save() {
    const { random, ...state } = this;
    return copy(state);
  }
  static restore(state) {
    try {
      if (
        !state ||
        !Array.isArray(state.board) ||
        state.board.length !== HEIGHT ||
        !state.board.every(
          (r) =>
            Array.isArray(r) &&
            r.length === WIDTH &&
            r.every((v) => v === null || Object.hasOwn(SHAPES, v)),
        )
      )
        return null;
      for (const k of [
        "score",
        "lines",
        "elapsed",
        "fall",
        "lockTime",
        "lockResets",
      ])
        if (!Number.isFinite(state[k]) || state[k] < 0) return null;
      if (
        !Array.isArray(state.queue) ||
        state.queue.length > 20 ||
        !state.queue.every((v) => Object.hasOwn(SHAPES, v)) ||
        !Object.hasOwn(SHAPES, state.active?.type)
      )
        return null;
      if (state.held !== null && !Object.hasOwn(SHAPES, state.held))
        return null;
      const m = state.active.m;
      if (
        !Array.isArray(m) ||
        m.length < 2 ||
        m.length > 4 ||
        !m.every(
          (r) =>
            Array.isArray(r) &&
            r.length === m.length &&
            r.every((v) => v === 0 || v === 1),
        ) ||
        m.flat().reduce((a, b) => a + b, 0) !== 4
      )
        return null;
      const g = new Game();
      for (const key of Object.keys(g.save()))
        if (state[key] !== undefined) g[key] = copy(state[key]);
      if (
        !Object.hasOwn(DIFFICULTIES, g.difficulty) ||
        typeof g.autoDrop !== "boolean" ||
        !Number.isSafeInteger(g.clearSerial) ||
        g.clearSerial < 0 ||
        !Array.isArray(g.clearedRows) ||
        !g.clearedRows.every((y) => Number.isInteger(y) && y >= 0 && y < HEIGHT)
      )
        return null;
      if (
        !Number.isInteger(g.active.x) ||
        !Number.isInteger(g.active.y) ||
        (!g.over && !g.valid())
      )
        return null;
      return g;
    } catch {
      return null;
    }
  }
}
