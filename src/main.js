import "@fontsource-variable/outfit";
import "./style.css";
import "./preferences.css";
import "./polish.css";
import "./skins.css";
import "./game-ui.css";
import { Capacitor, SystemBars } from "@capacitor/core";
import { version } from "../package.json";
import { SKINS, drawSkinCell, skinCards, paintPreviews } from "./skins.js";
import { bindBoardGestures } from "./gestures.js";
import { canvasContext } from "./canvas.js";
let boardGestures;
import { icon, brandLogo, brandMark, blockArt } from "./visuals.js";
import { Game, SHAPES, COLORS, DIFFICULTIES, rulesFor } from "./engine.js";
import { load, persist } from "./storage.js";
import { api, configured, photoUrl } from "./api.js";
import { Effects } from "./effects.js";
import { queueRecord } from "./records.js";
let effects;
const app = document.querySelector("#app");
let data = load(),
  game = null,
  screen = "home",
  paused = true,
  last = 0,
  saveClock = 0,
  finishing = false,
  audio;
const number = (n) => Number(n).toLocaleString("pt-BR");
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const best = () => Math.max(0, ...data.records.map((r) => r.score));
const REPOSITORY = "https://github.com/caio-vinicius-dmc/tetriz";
function fullscreen() {
  if (Capacitor.isNativePlatform()) SystemBars.hide().catch(() => {});
}
function save() {
  if (!persist(data))
    toast("Armazenamento cheio. Libere espaço para salvar o progresso.");
}
function toast(s) {
  document.querySelector(".toast")?.remove();
  const e = document.createElement("div");
  e.className = "toast";
  e.role = "status";
  e.textContent = s;
  document.body.append(e);
  setTimeout(() => e.remove(), 5000);
}
function logo() {
  return brandLogo();
}
function shell(content) {
  boardGestures?.dispose();
  boardGestures = null;
  document.body.dataset.screen = screen;
  document.body.dataset.skin = data.settings.skin;
  const skin = SKINS.find((s) => s.id === data.settings.skin);
  document.body.style.setProperty("--skin-accent", skin.accent);
  document.body.style.setProperty("--skin-radius", `${skin.radius}px`);
  document.body.dataset.theme = data.settings.theme;
  app.innerHTML = `<div class="ambient"></div><main>${content}</main>${screen === "game" ? "" : "<footer><span>Criado por Caio Vinícius</span></footer>"}`;
  document.body.classList.toggle("reduced", !data.settings.motion);
}
function home() {
  screen = "home";
  paused = true;
  shell(
    `<header><a class="brand" href="#" aria-label="Tetriz">${brandMark()}</a><span class="badge">${icon("offline")} 100% OFFLINE</span></header><section class="hero"><div class="hero-copy"><div class="eyebrow"><span></span> SEU PRÓXIMO RECORDE COMEÇA AQUI</div>${logo()}<p class="tagline">Desconecte do mundo.<br><strong>Entre no jogo.</strong></p></div><div class="hero-art">${blockArt()}<div class="art-caption"><i></i> CLÁSSICO NA ESSÊNCIA. NOVO EM CADA PARTIDA.</div></div><div class="home-actions"><div class="best">${icon("trophy")}<div><span>SEU RECORDE</span><strong>${number(best())} <small>PTS</small></strong></div><span class="best-detail">O próximo<br>é com você.</span></div><button id="play" class="primary">${icon("play")} <span>${data.session ? "Continuar partida" : "Jogar"}</span>${icon("right")}</button>${data.session ? `<button id="new-game" class="new-game">${icon("reset")}<span>Começar partida nova</span>${icon("right")}</button>` : ""}<div class="record-buttons"><button id="local" class="menu-tile"><span class="tile-icon">${icon("trophy")}</span><span>Meus recordes</span></button><button id="global" class="menu-tile"><span class="tile-icon">${icon("globe")}</span><span>Ranking global</span></button></div><div class="home-links"><button id="settings" class="menu-tile"><span class="tile-icon">${icon("settings")}</span><span>Configurações</span></button><button id="about" class="menu-tile"><span class="tile-icon">${icon("info")}</span><span>Sobre o Tetriz</span></button></div></div></section>`,
  );
  document.querySelector("#play").onclick = start;
  const newGameButton = document.querySelector("#new-game");
  if (newGameButton) newGameButton.onclick = newGame;
  document.querySelector("#settings").onclick = settings;
  document.querySelector("#local").onclick = () => records(false);
  document.querySelector("#global").onclick = () => records(true);
  document.querySelector("#about").onclick = about;
}
function settings() {
  screen = "settings";
  paused = true;
  shell(
    `<header><button id="back">← Voltar</button><span class="badge">DO SEU JEITO</span></header><section class="panel settings-panel"><div class="eyebrow">SEU JOGO. SEU RITMO.</div><h1>Configurações</h1><fieldset><legend>Nível</legend><div class="choice-grid">${Object.entries(
      DIFFICULTIES,
    )
      .map(
        ([key, item]) =>
          `<label><input type="radio" name="difficulty" value="${key}" ${data.settings.difficulty === key ? "checked" : ""}><span>${item.label}</span></label>`,
      )
      .join(
        "",
      )}</div><p class="setting-help">Muda a velocidade inicial e o tempo para ajustar a peça antes de encaixar. A dificuldade continua aumentando durante a partida.</p><label class="setting"><span>Soltar automática<small>Encaixa a peça assim que tocar a base, sem a espera para ajuste.</small></span><input id="auto-drop" type="checkbox" ${data.settings.autoDrop ? "checked" : ""}></label><p class="setting-help">Estas opções valem para novas partidas. A partida salva mantém seu modo.</p></fieldset><fieldset><legend>Tema</legend><div class="choice-grid theme-options"><label><input type="radio" name="theme" aria-label="Claro" value="light" ${data.settings.theme === "light" ? "checked" : ""}><span>☀ Claro</span></label><label><input type="radio" name="theme" aria-label="Escuro" value="dark" ${data.settings.theme === "dark" ? "checked" : ""}><span>☾ Escuro</span></label></div>${skinCards(data.settings.skin)}</fieldset><fieldset><legend>Controles e efeitos</legend>${[
      ["sound", "Som"],
      ["vibration", "Vibração"],
      ["patterns", "Padrões nas peças"],
      ["motion", "Animações da interface"],
      ["specialEffects", "Efeitos especiais"],
      ["gestures", "Gestos no tabuleiro"],
    ]
      .map(
        ([key, title]) =>
          `<label class="setting"><span>${title}</span><input data-option="${key}" type="checkbox" ${data.settings[key] ? "checked" : ""}></label>`,
      )
      .join(
        "",
      )}<label class="setting"><span>Sensibilidade dos gestos<small>Menor distância exige movimentos mais curtos.</small></span><input id="gesture-range" type="range" min="15" max="70" value="${data.settings.sensitivity}"></label><p class="setting-help">Toque na peça que está caindo e arraste para os lados. Ela continua descendo durante o movimento. Gire o aparelho para jogar na horizontal ou na vertical.</p></fieldset><fieldset><legend>Recordes</legend><p>${data.records.length} resultados neste aparelho · ${data.pending.length} envios pendentes.</p><button id="upload-local" class="settings-action" ${data.records.length ? "" : "disabled"}>${icon("globe")} Aplicar recorde local no global</button><button id="clear-local" class="settings-action danger" ${data.records.length || data.pending.length ? "" : "disabled"}>Limpar recorde local</button><p class="setting-help">Limpar remove o histórico local e os envios pendentes. Recordes já publicados continuam no ranking global.</p></fieldset><p class="saved-note">Suas preferências são salvas automaticamente.</p></section><div id="settings-overlay"></div>`,
  );
  document.querySelector("#back").onclick = home;
  document.querySelectorAll('[name="difficulty"]').forEach(
    (e) =>
      (e.onchange = () => {
        data.settings.difficulty = e.value;
        save();
      }),
  );
  document.querySelectorAll('[name="theme"]').forEach(
    (e) =>
      (e.onchange = () => {
        data.settings.theme = e.value;
        document.body.dataset.theme = e.value;
        paintPreviews(e.value === "light");
        save();
      }),
  );
  paintPreviews(data.settings.theme === "light");
  document.querySelectorAll('[name="skin"]').forEach(
    (e) =>
      (e.onchange = () => {
        data.settings.skin = e.value;
        document.body.dataset.skin = e.value;
        save();
      }),
  );
  document.querySelector("#auto-drop").onchange = (e) => {
    data.settings.autoDrop = e.target.checked;
    save();
  };
  document.querySelectorAll("[data-option]").forEach(
    (e) =>
      (e.onchange = () => {
        data.settings[e.dataset.option] = e.checked;
        document.body.classList.toggle("reduced", !data.settings.motion);
        save();
      }),
  );
  document.querySelector("#gesture-range").oninput = (e) => {
    data.settings.sensitivity = Number(e.target.value);
    save();
  };
  document.querySelector("#clear-local").onclick = () => {
    if (syncing) {
      toast("Aguarde o envio em andamento terminar.");
      return;
    }
    if (
      confirm(
        "Apagar os recordes deste aparelho e cancelar os envios pendentes?",
      )
    ) {
      data.records = [];
      data.pending = [];
      save();
      settings();
      toast("Recordes locais removidos.");
    }
  };
  document.querySelector("#upload-local").onclick = publishLocal;
}
function publishLocal() {
  const target = document.querySelector("#settings-overlay");
  target.innerHTML = `<div class="scrim"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="publish-title"><h2 id="publish-title">Seu recorde no mundo</h2><label>Escolha o resultado<select id="local-record">${data.records.map((r) => `<option value="${esc(r.id)}">${number(r.score)} pts · ${esc(r.name || "Jogador")} · ${DIFFICULTIES[r.difficulty || "medium"]?.label || "Médio"}${r.published ? " · Publicado" : ""}</option>`).join("")}</select></label><p>O nome, avatar ou foto e resultado selecionados ficarão públicos. Sem conexão, o envio ficará na fila.</p><button id="confirm-publish" class="primary">Publicar este recorde</button><button id="cancel-publish">Cancelar</button></section></div>`;
  document.querySelector("#cancel-publish").onclick = () =>
    (target.innerHTML = "");
  document.querySelector("#confirm-publish").onclick = () => {
    const record = data.records.find(
      (r) => r.id === document.querySelector("#local-record").value,
    );
    if (!record) return;
    const status = queueRecord(data, record);
    save();
    target.innerHTML = "";
    settings();
    toast(
      status === "published"
        ? "Este recorde já foi publicado."
        : status === "pending"
          ? "Este recorde já está na fila de envio."
          : "Recorde na fila. Será enviado quando o ranking estiver disponível.",
    );
    sync();
  };
  document.querySelector("#local-record").focus();
}
function about() {
  screen = "about";
  shell(
    `<header><button id="back">← Voltar</button><span class="badge">VERSÃO ${version}</span></header><section class="panel about-panel">${logo()}<h1>Pequenas peças.<br>Grandes possibilidades.</h1><p>Um jogo de blocos para jogar onde quiser, mesmo sem internet.</p><h2>Criado por</h2><p class="about-author"><strong>Caio Vinícius</strong><br>Tetriz · Versão ${version}</p><h2>Código aberto</h2><p>O código-fonte completo está no GitHub:</p><a class="about-link" href="${REPOSITORY}" target="_blank" rel="noopener">${icon("code")}<span><strong>Ver no GitHub</strong><small>github.com/caio-vinicius-dmc/tetriz</small></span>${icon("right")}</a><h2>Licença</h2><p>Distribuído sob a <strong>licença MIT</strong>: você pode usar, copiar, modificar e distribuir o jogo livremente, inclusive para fins comerciais, desde que mantenha o aviso de copyright e de licença. O software é fornecido "no estado em que se encontra", sem garantias.</p><p class="about-small">Copyright © 2026 Caio Vinícius. A fonte Outfit é distribuída sob a SIL Open Font License 1.1, e as demais dependências mantêm suas próprias licenças.</p><h2>Seus dados, suas escolhas</h2><p>Partidas e recordes ficam neste aparelho. Ao publicar, nome, avatar ou foto e resultado ficam visíveis no ranking global. A publicação é opcional. Desinstalar o aplicativo pode apagar os dados locais.</p><p>O ranking recebe resultados de partidas offline, sujeitos a verificações de plausibilidade.</p></section>`,
  );
  document.querySelector("#back").onclick = home;
}
let rankingRequest = 0;
async function records(global, page = 1) {
  const request = ++rankingRequest;
  screen = global ? "global" : "local";
  shell(
    `<header><button id="back">← Voltar</button><span class="badge">${global ? "CONECTE. COMPARE. SUPERE." : "SALVOS NESTE APARELHO"}</span></header><section class="panel"><div class="eyebrow">CADA PARTIDA CONTA</div><h1>${global ? "Além do seu<br>próprio recorde." : "Sua melhor<br>versão."}</h1><div class="tabs"><button id="mine" class="${!global ? "selected" : ""}">Meus recordes</button><button id="world" class="${global ? "selected" : ""}">Global</button></div><p id="status" role="status"></p><div id="list"></div><div id="pages"></div></section>`,
  );
  document.querySelector("#back").onclick = home;
  document.querySelector("#mine").onclick = () => records(false);
  document.querySelector("#world").onclick = () => records(true);
  let rows = data.records;
  if (global) {
    document.querySelector("#status").textContent = "Buscando novos recordes…";
    try {
      const rule = rulesFor(data.settings.difficulty, data.settings.autoDrop);
      const result = await api(
        "/index.php?route=records&page=" + page + "&rules=" + rule,
      );
      if (screen !== "global" || request !== rankingRequest) return;
      if (!Array.isArray(result.records) || result.rules !== rule)
        throw new Error(
          "A API do ranking precisa ser atualizada para esta versão do jogo.",
        );
      rows = result.records;
      data.cache = { rows, rules: rule, page, date: new Date().toISOString() };
      save();
      document.querySelector("#status").textContent =
        `Ranking global · ${DIFFICULTIES[data.settings.difficulty].label}${data.settings.autoDrop ? " · Soltar automática" : ""}`;
      document.querySelector("#pages").innerHTML =
        `<button id="prev" aria-label="Página anterior" ${page === 1 ? "disabled" : ""}>${icon("arrow")}<span>Anterior</span></button><span class="page-number" aria-live="polite">Página <strong>${page}</strong></span><button id="next" aria-label="Próxima página" ${rows.length < 20 ? "disabled" : ""}><span>Próxima</span>${icon("right")}</button>`;
      document.querySelector("#prev").onclick = () => records(true, page - 1);
      document.querySelector("#next").onclick = () => records(true, page + 1);
    } catch (e) {
      if (screen !== "global" || request !== rankingRequest) return;
      rows =
        data.cache?.rules ===
        rulesFor(data.settings.difficulty, data.settings.autoDrop)
          ? data.cache.rows
          : [];
      if (rows.length) page = data.cache.page || 1;
      document.querySelector("#status").textContent =
        e.message +
        (data.cache
          ? " Última consulta: " +
            new Date(data.cache.date).toLocaleString("pt-BR")
          : "");
    }
  }
  document.querySelector("#list").innerHTML = rows.length
    ? rows
        .map(
          (r, i) =>
            `<article class="record"><b class="position">${String((page - 1) * 20 + i + 1).padStart(2, "0")}</b><span class="avatar">${r.has_photo ? '<img src="' + esc(photoUrl(r.id)) + '" alt="Foto do jogador">' : r.photo && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(r.photo) ? '<img src="' + r.photo + '" alt="Foto do jogador">' : ["◆", "◈", "✦", "⬡"][r.avatar || 0] || "◆"}</span><div><strong>${esc(r.name || "Jogador")}</strong><small>Nível ${number(r.level)} · ${number(r.lines)} linhas · ${Math.floor(r.duration / 60)} min</small></div><strong class="points">${number(r.score)}<small>pontos</small></strong></article>`,
        )
        .join("")
    : '<div class="empty">✦<h2>O primeiro recorde é seu.</h2><p>Jogue uma partida para começar essa história.</p></div>';
}
function newGame() {
  if (data.session && !confirm("Encerrar a partida salva e começar uma nova?"))
    return;
  data.session = null;
  save();
  start();
}
function start() {
  const restored = Game.restore(data.session);
  const resuming = !!restored && !restored.over;
  game = restored || new Game(Math.random, data.settings);
  if (game.over) game = new Game(Math.random, data.settings);
  paused = false;
  effects = new Effects(game.clearSerial);
  finishing = false;
  screen = "game";
  shell(
    `<header class="game-header"><button id="exit" class="icon-button" aria-label="Voltar ao início">${icon("arrow")}</button><div class="game-title"><span class="wordmark">TETRIZ</span><div id="combo" role="status" aria-live="polite"></div></div><div class="game-header-actions"><button id="game-theme" class="icon-button theme-toggle" role="switch" aria-label="Tema escuro" aria-checked="${data.settings.theme === "dark"}"><span aria-hidden="true">☀</span><span aria-hidden="true">☾</span></button><button id="pause" class="icon-button" aria-label="Pausar partida">${icon("pause")}</button></div></header><section class="game"><div class="stats"><div class="score-stat"><small>Pontos</small><strong id="score">0</strong></div><div><small>Nível</small><strong id="level">1</strong></div><div><small>Linhas</small><strong id="lines">0</strong></div></div><div class="arena"><div class="board-wrap"><canvas id="board" width="300" height="600" aria-label="Tabuleiro do Tetriz"></canvas><canvas id="effects" width="300" height="600" aria-hidden="true"></canvas></div><aside class="game-rail"><div class="rail-card reserve-card"><small>Reserva</small><canvas id="hold" width="96" height="96"></canvas></div><div class="rail-card next-card"><small>Próximas</small><canvas id="next-piece" width="96" height="280"></canvas></div><div class="rail-card rail-best">${icon("trophy")}<small>Recorde</small><strong>${number(best())}</strong></div></aside></div><div class="controls"><button id="hold-button" aria-label="Reservar ou trocar peça">${icon("swap")}<span>Trocar</span></button><button data-action="left" aria-label="Mover para esquerda">${icon("arrow")}<span>Esquerda</span></button><button data-action="rotate" aria-label="Girar peça">${icon("rotate")}<span>Girar</span></button><button data-action="right" aria-label="Mover para direita">${icon("right")}<span>Direita</span></button><button data-action="soft" aria-label="Acelerar queda">${icon("down")}<span>Acelerar</span></button><button class="drop" data-action="drop">${icon("drop")} <span>Soltar</span></button></div></section><div id="overlay"></div>`,
  );
  document.querySelector("#game-theme").onclick = (e) => {
    data.settings.theme = data.settings.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = data.settings.theme;
    e.currentTarget.setAttribute(
      "aria-checked",
      String(data.settings.theme === "dark"),
    );
    save();
    draw();
  };
  document.querySelector("#pause").onclick = () => pause();
  document.querySelector("#exit").onclick = () => {
    checkpoint();
    home();
  };
  document.querySelector("#hold-button").onclick = () => act("hold");
  document.querySelectorAll("[data-action]").forEach((b) => {
    let timer, delay;
    const stop = () => {
      clearTimeout(delay);
      clearInterval(timer);
    };
    b.onpointerdown = (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      act(b.dataset.action);
      if (["left", "right", "soft"].includes(b.dataset.action))
        delay = setTimeout(
          () => (timer = setInterval(() => act(b.dataset.action), 80)),
          190,
        );
    };
    b.onclick = (e) => {
      if (e.detail === 0) act(b.dataset.action);
    };
    b.onpointerup = stop;
    b.onpointercancel = stop;
    b.onlostpointercapture = stop;
  });
  boardGestures = bindBoardGestures(document.querySelector("#board"), {
    getGame: () => game,
    enabled: () =>
      screen === "game" && !paused && !game.over && data.settings.gestures,
    threshold: () => data.settings.sensitivity,
    action: act,
    render: draw,
  });
  draw();
  if (resuming) pause();
}
function sound() {
  if (!data.settings.sound) return;
  try {
    audio ??= new AudioContext();
    audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.connect(g);
    g.connect(audio.destination);
    o.frequency.value = 430;
    g.gain.setValueAtTime(0.025, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.06);
    o.start();
    o.stop(audio.currentTime + 0.06);
  } catch {}
}
function act(action) {
  if (screen !== "game" || paused || game.over) return;
  if (action === "left") game.move(-1);
  if (action === "right") game.move(1);
  if (action === "rotate") game.rotate();
  if (action === "soft") game.soft();
  if (action === "drop") game.drop();
  if (action === "hold") game.hold();
  sound();
  if (action === "drop" && data.settings.vibration) navigator.vibrate?.(15);
  draw();
  if (game.over) finish();
}
function checkpoint() {
  if (game && screen === "game" && !game.over) {
    data.session = game.save();
    save();
  }
}
function pause() {
  if (screen !== "game" || game.over) return;
  paused = true;
  boardGestures?.cancel();
  checkpoint();
  document.querySelector("#overlay").innerHTML =
    `<div class="scrim"><section class="modal"><div class="eyebrow">RESPIRE UM POUCO</div><h1>No seu tempo.</h1><p>Sua partida está salva.</p>${[
      ["sound", "Som"],
      ["vibration", "Vibração"],
      ["patterns", "Padrões nas peças"],
      ["motion", "Animações da interface"],
      ["specialEffects", "Efeitos especiais"],
      ["gestures", "Gestos no tabuleiro"],
    ]
      .map(
        ([k, n]) =>
          `<label class="setting">${n}<input type="checkbox" data-setting="${k}" ${data.settings[k] ? "checked" : ""}></label>`,
      )
      .join(
        "",
      )}<label class="setting">Sensibilidade dos gestos<input id="sensitivity" type="range" min="15" max="70" value="${data.settings.sensitivity}"></label><button id="resume" class="primary">Continuar ▶</button><button id="menu">Salvar e sair</button><button id="restart" class="text-button">Começar nova partida</button></section></div>`;
  document.querySelectorAll("[data-setting]").forEach(
    (e) =>
      (e.onchange = () => {
        data.settings[e.dataset.setting] = e.checked;
        save();
        document.body.classList.toggle("reduced", !data.settings.motion);
      }),
  );
  document.querySelector("#sensitivity").oninput = (e) => {
    data.settings.sensitivity = Number(e.target.value);
    save();
  };
  document.querySelector("#resume").onclick = () => {
    document.querySelector("#overlay").innerHTML = "";
    paused = false;
    last = performance.now();
  };
  document.querySelector("#menu").onclick = home;
  document.querySelector("#restart").onclick = () => {
    if (confirm("Encerrar esta partida e começar outra?")) {
      data.session = null;
      save();
      start();
    }
  };
}
function cell(ctx, x, y, size, type, ghost = false) {
  if (data.settings.skin !== "standard")
    return drawSkinCell(
      ctx,
      x,
      y,
      size,
      type,
      data.settings.skin,
      data.settings.theme === "light",
      ghost,
      data.settings.patterns,
    );
  const light = data.settings.theme === "light";
  const color = light
    ? {
        I: "#159dbb",
        J: "#5874d7",
        L: "#db862b",
        O: "#cfa12c",
        S: "#60a948",
        T: "#995ecc",
        Z: "#d95475",
      }[type]
    : COLORS[type];
  ctx.save();
  if (ghost) {
    ctx.fillStyle = color + "12";
    ctx.strokeStyle = color + "70";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, size - 4, size - 4, 3);
    ctx.fill();
    ctx.stroke();
  } else {
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + "bb");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, size - 2, size - 2, 3);
    ctx.fill();
    ctx.strokeStyle = light ? "#30476b55" : "#ffffff60";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    const bevel = ctx.createLinearGradient(x, y, x, y + size);
    bevel.addColorStop(0, "#ffffff55");
    bevel.addColorStop(0.45, "#ffffff05");
    bevel.addColorStop(1, "#00000035");
    ctx.fillStyle = bevel;
    ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
    ctx.strokeStyle = "#ffffff90";
    ctx.beginPath();
    ctx.moveTo(x + 4, y + size - 5);
    ctx.lineTo(x + 4, y + 4);
    ctx.lineTo(x + size - 5, y + 4);
    ctx.stroke();
    ctx.fillStyle = "#ffffff66";
    ctx.fillRect(x + 7, y + 6, size - 14, 1);
    if (data.settings.patterns) {
      ctx.fillStyle = "#132135";
      ctx.font = `${size * 0.5}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(
        ["•", "+", "/", "○", "×", "◇", "−"][Object.keys(SHAPES).indexOf(type)],
        x + size / 2,
        y + size * 0.7,
      );
    }
  }
  ctx.restore();
}
function piece(ctx, p, size, ghost = false) {
  p.m.forEach((r, y) =>
    r.forEach((v, x) => {
      if (v) cell(ctx, (p.x + x) * size, (p.y + y) * size, size, p.type, ghost);
    }),
  );
}
function draw() {
  if (screen !== "game") return;
  const c = document.querySelector("#board"),
    ctx = canvasContext(c, 300, 600);
  ctx.clearRect(0, 0, 300, 600);
  ctx.strokeStyle = data.settings.theme === "light" ? "#26375b12" : "#ffffff06";
  ctx.lineWidth = 1;
  for (let x = 0; x <= 300; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 600);
    ctx.stroke();
  }
  for (let y = 0; y <= 600; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(300, y);
    ctx.stroke();
  }
  game.board.forEach((r, y) =>
    r.forEach((v, x) => {
      if (v) cell(ctx, x * 30, y * 30, 30, v);
    }),
  );
  if (!game.over) {
    piece(ctx, game.ghost(), 30, true);
    piece(ctx, game.active, 30);
  }
  effects?.draw(
    game,
    !matchMedia("(prefers-reduced-motion: reduce)").matches,
    data.settings.specialEffects,
  );
  document.querySelector("#hold-button").disabled = game.usedHold;
  document.querySelector("#score").textContent = number(game.score);
  document.querySelector("#level").textContent = game.level;
  document.querySelector("#lines").textContent = game.lines;
  for (const [id, types] of [
    ["hold", [game.held]],
    ["next-piece", game.queue.slice(0, 3)],
  ]) {
    const c = document.getElementById(id),
      ct = canvasContext(c, 96, id === "hold" ? 96 : 280);
    ct.clearRect(0, 0, c.width, c.height);
    types.forEach((t, i) => {
      if (t)
        piece(
          ct,
          {
            type: t,
            m: SHAPES[t],
            x: (4 - SHAPES[t].length) / 2,
            y: i * 4 + 0.5,
          },
          24,
        );
    });
  }
}
async function photo(file) {
  if (!file) return null;
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 5e6
  )
    throw new Error("Escolha uma imagem JPG, PNG ou WebP de até 5 MB.");
  const bitmap = await createImageBitmap(file),
    c = document.createElement("canvas");
  c.width = c.height = 128;
  const s = Math.min(bitmap.width, bitmap.height);
  c.getContext("2d").drawImage(
    bitmap,
    (bitmap.width - s) / 2,
    (bitmap.height - s) / 2,
    s,
    s,
    0,
    0,
    128,
    128,
  );
  bitmap.close();
  return c.toDataURL("image/jpeg", 0.8);
}
function finish() {
  if (finishing) return;
  finishing = true;
  paused = true;
  const isBest = game.score > best();
  const r = {
    id: crypto.randomUUID(),
    score: game.score,
    lines: game.lines,
    level: game.level,
    duration: Math.floor(game.elapsed / 1000),
    rules: game.rules,
    difficulty: game.difficulty,
    autoDrop: game.autoDrop,
    date: new Date().toISOString(),
    name: "Jogador",
    avatar: 0,
    photo: null,
  };
  data.records.push(r);
  data.records.sort((a, b) => b.score - a.score);
  data.records = data.records.slice(0, 100);
  data.session = null;
  save();
  document.querySelector("#overlay").innerHTML =
    `<div class="scrim"><section class="modal"><div class="eyebrow">${isBest ? "SEU NOVO RECORDE" : "CADA PARTIDA É UM RECOMEÇO"}</div><h1>${number(r.score)} <small>pontos</small></h1><p>Nível ${r.level} · ${r.lines} linhas</p><label>Seu nome (opcional)<input id="name" maxlength="24" placeholder="Jogador" autocomplete="nickname"></label><label>Seu avatar<select id="avatar"><option value="0">◆ Cristal</option><option value="1">◈ Órbita</option><option value="2">✦ Estrela</option><option value="3">⬡ Colmeia</option></select></label><label>Foto opcional<input id="photo" type="file" accept="image/jpeg,image/png,image/webp"></label><label class="setting"><span>Publicar no ranking global<br><small>Seu nome, imagem e resultado serão públicos.</small></span><input id="publish" type="checkbox"></label><button id="save-record" class="primary">Salvar e continuar</button><button id="skip">Pular</button></section></div>`;
  document.querySelector("#skip").onclick = home;
  document.querySelector("#save-record").onclick = async () => {
    const button = document.querySelector("#save-record");
    button.disabled = true;
    try {
      r.name = document.querySelector("#name").value.trim() || "Jogador";
      if (!/^[\p{L}\p{N} ._\-]{1,24}$/u.test(r.name))
        throw new Error(
          "Use até 24 letras, números, espaços, pontos ou traços.",
        );
      r.avatar = Number(document.querySelector("#avatar").value);
      r.photo = await photo(document.querySelector("#photo").files[0]);
      if (document.querySelector("#publish").checked) {
        queueRecord(data, r);
        toast(
          "Recorde salvo. O envio será tentado quando o ranking estiver disponível.",
        );
      }
      save();
      home();
      sync();
    } catch (e) {
      toast(e.message);
      button.disabled = false;
    }
  };
}
let syncing = false;
async function sync() {
  if (syncing || !configured || !navigator.onLine) return;
  syncing = true;
  try {
    for (const r of [...data.pending]) {
      try {
        if (!data.pending.some((x) => x.id === r.id)) continue;
        await api("/index.php?route=records", r);
        const local = data.records.find((x) => x.id === r.id);
        if (local) local.published = true;
        data.pending = data.pending.filter((x) => x.id !== r.id);
        save();
        toast("Recorde publicado!");
      } catch (e) {
        if (e.status === 422) {
          data.pending = data.pending.filter((x) => x.id !== r.id);
          save();
          toast(
            "Um recorde não passou pela validação. Ele continua salvo no aparelho.",
          );
        }
        break;
      }
    }
  } finally {
    syncing = false;
  }
}
document.addEventListener("keydown", (e) => {
  if (e.target.matches("input,select")) return;
  if (screen !== "game" || paused) return;
  const keys = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowDown: "soft",
    ArrowUp: "rotate",
    " ": "drop",
    c: "hold",
    C: "hold",
  };
  if (keys[e.key]) {
    e.preventDefault();
    if (!e.repeat || !["drop", "hold", "rotate"].includes(keys[e.key]))
      act(keys[e.key]);
  }
  if (e.key === "Escape") pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
window.addEventListener("pagehide", checkpoint);
window.addEventListener("online", sync);
function frame(t) {
  const dt = last ? t - last : 0;
  last = t;
  if (screen === "game" && !paused) {
    game.tick(dt);
    draw();
    saveClock += dt;
    if (saveClock > 1000) {
      checkpoint();
      saveClock = 0;
    }
    if (game.over) finish();
  }
  requestAnimationFrame(frame);
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) fullscreen();
});
fullscreen();
home();
sync();
requestAnimationFrame(frame);
