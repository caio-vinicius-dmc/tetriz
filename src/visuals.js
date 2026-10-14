const paths = {
  settings:
    '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--icon-bg,#25213d)"/><circle cx="16" cy="17" r="3" fill="var(--icon-bg,#25213d)"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/><path d="M12 8v5l3 2"/>',
  play: '<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
  trophy:
    '<path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm4 10v5m-4 3h8M8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  arrow: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  right: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  down: '<path d="M12 4v16m-6-6 6 6 6-6"/>',
  drop: '<path d="M12 3v13m-5-5 5 5 5-5M5 21h14"/>',
  rotate: '<path d="M20 10a8 8 0 1 0-2 8M20 4v6h-6"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="4"/>',
  swap: '<path d="M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
  offline:
    '<path d="m3 3 18 18M2 8a17 17 0 0 1 4-2m4-1a17 17 0 0 1 12 3M5 12a12 12 0 0 1 5-2m5 0a12 12 0 0 1 4 2m-11 4a6 6 0 0 1 7 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/>',
};
export const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
export function brandLogo() {
  return `<div class="logo" aria-label="Tetriz">${[..."TETRIZ"].map((c, i) => `<span style="--c:${["#31dcff", "#9af05e", "#ff597c", "#ffb24b", "#cc77ff", "#ffe464"][i]}" data-letter="${c}">${c}</span>`).join("")}</div>`;
}
export function blockArt() {
  const colors = ["#2cd7f3", "#a1ed51", "#b86afa", "#ff577b", "#ffaf3c"];
  const block = (x, y, c, s = 32) =>
    `<g transform="translate(${x} ${y})"><rect x="1" y="5" width="${s - 2}" height="${s - 2}" rx="5" fill="${c}" opacity=".25"/><rect width="${s - 2}" height="${s - 2}" rx="5" fill="${c}"/><rect x="3" y="3" width="${s - 8}" height="${s - 8}" rx="3" fill="url(#jewel)"/><path d="M5 ${s - 8}V5h${s - 13}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/></g>`;
  const rows = ["000002222", "110033322", "111333442", "011144444"];
  return `<svg class="block-art" viewBox="0 0 520 450" fill="none" aria-hidden="true"><defs><linearGradient id="jewel" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".36"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient><linearGradient id="edge"><stop stop-color="#46dcff"/><stop offset="1" stop-color="#a46aff"/></linearGradient><radialGradient id="halo"><stop stop-color="#7654ff" stop-opacity=".27"/><stop offset="1" stop-color="#7654ff" stop-opacity="0"/></radialGradient></defs><ellipse cx="270" cy="270" rx="240" ry="170" fill="url(#halo)"/><g transform="translate(96 42) rotate(-9 150 180)"><rect x="-10" y="-10" width="310" height="376" rx="22" fill="var(--art-frame,#11172f)" stroke="url(#edge)" stroke-opacity=".4"/><rect width="290" height="356" rx="14" fill="var(--art-board,#090e24)"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${i * 32} 0v356" stroke="var(--art-grid,#9b9fee)" stroke-opacity="var(--art-grid-opacity,.07)"/>`).join("")}${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 32}h290" stroke="var(--art-grid,#9b9fee)" stroke-opacity="var(--art-grid-opacity,.07)"/>`).join("")}${rows.map((r, y) => [...r].map((v, x) => block(x * 32, 224 + y * 32, colors[+v])).join("")).join("")}<g class="art-falling">${[
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
  ]
    .map(([x, y]) => block(96 + x * 32, 55 + y * 32, colors[2]))
    .join(
      "",
    )}</g><path d="M100 135v60m30-50v50m30-60v60" stroke="#c693ff" stroke-opacity=".2" stroke-dasharray="3 8"/><rect x="96" y="190" width="94" height="30" rx="4" stroke="#be87fa" stroke-opacity=".4"/></g><g transform="translate(386 62) rotate(12)">${[
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ]
    .map(([x, y]) => block(x * 29, y * 29, colors[1], 29))
    .join("")}</g><g transform="translate(24 236) rotate(-16)">${[
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2],
  ]
    .map(([x, y]) => block(x * 27, y * 27, colors[0], 27))
    .join(
      "",
    )}</g><g fill="#b6baff"><circle cx="70" cy="100" r="2"/><circle cx="454" cy="290" r="2"/><circle cx="346" cy="422" r="2"/><path d="m450 178 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/><path d="m66 375 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z"/></g></svg>`;
}
