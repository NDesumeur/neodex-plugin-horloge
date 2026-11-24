// Horloge mondiale : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoDex sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoDex.
// Elle tourne dans le bac à sable de NeoDex, avec ses outils d'interface (ctx.host) et seulement les autorisations de son plugin.json.
const HTML = "<div class=\"appWrap wide\">\n      <div class=\"agHead\"><span class=\"label\">Horloge mondiale</span><input class=\"f\" id=\"wcAdd\" placeholder=\"Ajouter une ville… (Entrée)\" spellcheck=\"false\" style=\"width:clamp(220px,24vw,380px);margin-left:auto;font-size:16px;padding:9px 12px\"></div>\n      <div class=\"sysCard px\"><div class=\"bdPlan\">Décaler de <input type=\"range\" id=\"wcShift\" min=\"-24\" max=\"24\" value=\"0\" style=\"flex:1;accent-color:var(--magenta)\"><b id=\"wcShiftVal\"></b><button class=\"btn px\" id=\"wcNow\">MAINTENANT</button></div></div>\n      <div id=\"wcGrid\" class=\"sysGrid wcGrid\"></div>\n      <div class=\"sysCard px wcPlanCard\"><div class=\"bdPlan\"><b class=\"label\">PLANIFIER UNE RÉUNION</b><input type=\"date\" class=\"f\" id=\"wcPlanDay\" style=\"width:170px\"><span class=\"hint\" id=\"wcPlanBest\"></span></div><div id=\"wcPlan\" class=\"wcPlan\"></div><div id=\"wcPlanPick\" class=\"wcPick\"></div></div>\n    </div>";
/*CSS-MOVED*/ const CSS = `.wcCard{position:relative}
.wcHead{display:flex;align-items:center;justify-content:space-between}
.wcTime{font:clamp(24px,2vw,34px) var(--title);color:#fff;margin:0;white-space:nowrap}
.wcGrid{grid-template-columns:repeat(auto-fill,minmax(clamp(270px,22vw,380px),1fr));gap:clamp(12px,1.4vw,22px)}
.wcBody{display:flex;align-items:center;gap:clamp(10px,1vw,18px);min-width:0}
.wcBody>div{min-width:0}
.wcSky{width:clamp(108px,8.5vw,160px);aspect-ratio:3/2;image-rendering:pixelated;flex:none;box-shadow:0 0 0 2px var(--line),3px 3px 0 2px #05010b}
.wcCard .hint{font-size:15px}
.wcCard .label{font-size:15px}
.wcCard .x{position:absolute;top:8px;right:8px;font-size:12px;visibility:hidden}
.wcCard:hover .x{visibility:visible}
.wcCard .x:hover{color:var(--red)}
.wcPlanCard{margin-top:clamp(12px,1.4vw,22px)}
.wcPlan{display:grid;grid-template-columns:minmax(90px,max-content) repeat(24,minmax(26px,1fr));gap:2px;margin-top:12px;overflow-x:auto;font-size:13px}
.wcPlan .n{color:var(--lilac);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:5px 8px 5px 0;align-self:center}
.wcPlan .c{all:unset;cursor:var(--cp,pointer);text-align:center;padding:5px 0;color:#fff;font-variant-numeric:tabular-nums;box-shadow:inset 0 0 0 1px rgba(0,0,0,.35)}
.wcPlan .k0{background:#1a1238;color:#8f7bb8}.wcPlan .k1{background:#6a5a1e}.wcPlan .k2{background:#2f7a3a}
.wcPlan .best{box-shadow:inset 0 -3px 0 #7ee07a}.wcPlan .on{outline:2px solid #ffd34f;outline-offset:-2px;position:relative;z-index:1}
.wcPlan .c:hover{filter:brightness(1.3)}.wcPlan .c:focus-visible{outline:2px solid #fff;outline-offset:-2px}
.wcPick{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px;color:#fff;min-height:36px}
.bdPlan{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:18px;color:var(--lilac)}
.bdPlan .f{width:110px;font-size:15px;padding:7px 10px}
.bdPlan select.f{width:160px}
`;  // le style de ce plugin (il utilise les variables du thème de NeoDex)
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = ctx.host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => id === "clockApp" ? view : view.querySelector('#' + id);  // les identifiants de ta vue, sans toucher à ceux du reste de NeoDex
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  let prefs = await doc('prefs');
  if (prefs == null) {  // première ouverture : tu retrouves tes réglages d'avant
    prefs = {}; const old = legacy.settings ? await legacy.settings().catch(() => ({})) : {};
    for (const k of ["worldClocks"]) if (old[k] !== undefined && old[k] !== '' && !(Array.isArray(old[k]) && !old[k].length)) prefs[k] = old[k];
    if (Object.keys(prefs).length) await folder.write('prefs', prefs);
  }
  const neo = { win: a => ctx.host.win?.(a), getSettings: async () => prefs, setSettings: async s => { Object.assign(prefs, s); await folder.write('prefs', prefs); return prefs; } };
  // ---- ton code d'origine ----
  /* ---------- Horloge mondiale app: cities in settings.worldClocks [{name, tz}], a shift to answer "what time will it be there if…" ---------- */
  let wcTimer = null, wcShift = 0;
  const WC_DEFAULT = [{name: 'New York', tz: 'America/New_York'}, {name: 'Los Angeles', tz: 'America/Los_Angeles'}, {name: 'Londres', tz: 'Europe/London'}, {name: 'Tokyo', tz: 'Asia/Tokyo'}, {name: 'Séoul', tz: 'Asia/Seoul'}];
  const wcList = () => [{name: 'Ici', tz: Intl.DateTimeFormat().resolvedOptions().timeZone, here: true}, ...(prefs.worldClocks?.length ? prefs.worldClocks : WC_DEFAULT)];
  const wcOffset = (tz, d) => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}).formatToParts(d).map(x => [x.type, x.value])); return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(d / 1000) * 1000) / 60000; };
  // la petite scène pixel art de chaque ville : 48 × 32 points agrandis sans lissage ; le ciel suit l'heure locale, le soleil ou la lune suivent leur arc, l'horloge à aiguilles devant
  const SKY = [[0, '#0b1030'], [5, '#141a48'], [6.5, '#e8875a'], [8, '#5aa8e8'], [17, '#5aa8e8'], [19, '#d9644f'], [20.5, '#2a1f5a'], [22, '#0b1030'], [24, '#0b1030']];
  const hex = s => [1, 3, 5].map(i => parseInt(s.substr(i, 2), 16)), mix = (a, c, t) => a.map((v, i) => Math.round(v + (c[i] - v) * t));
  const skyAt = h => { for (let i = 1; i < SKY.length; i++) if (h <= SKY[i][0]) return mix(hex(SKY[i - 1][1]), hex(SKY[i][1]), (h - SKY[i - 1][0]) / (SKY[i][0] - SKY[i - 1][0])); return hex(SKY[0][1]); };
  const rgb = a => `rgb(${a.join()})`;
  function scene(c, h, m, s, seed) {  // h, m, s : l'heure locale ; seed : les étoiles propres à la ville
    const g = c.getContext('2d'), W = 48, H = 32, t = h + m / 60, top = skyAt(t), bot = mix(top, [255, 214, 170], t > 5 && t < 21 ? .35 : .12), night = t < 5.5 || t > 20.8;
    for (let y = 0; y < H; y += 2) { g.fillStyle = rgb(mix(top, bot, y / H)); g.fillRect(0, y, W, 2); }  // le ciel en bandes
    if (night || t < 6.2 || t > 20) { let r = seed; g.fillStyle = night ? '#fff' : 'rgba(255,255,255,.5)'; for (let i = 0; i < 14; i++) { r = r * 16807 % 2147483647; const x = r % W; r = r * 16807 % 2147483647; const y = r % 20; if (Math.abs(x - 24) > 13 || y < 2) g.fillRect(x, y, 1, 1); } }
    const day = t >= 6 && t < 20, a = day ? (t - 6) / 14 : ((t + 4) % 24) / 10, bx = Math.round(3 + 42 * a), by = Math.round(25 - 21 * Math.sin(Math.PI * a));  // le soleil le jour, la lune la nuit
    g.fillStyle = day ? '#ffd34f' : '#e8e4ff'; g.fillRect(bx - 1, by - 2, 3, 5); g.fillRect(bx - 2, by - 1, 5, 3);
    if (!day) { g.fillStyle = rgb(mix(top, bot, by / H)); g.fillRect(bx, by - 2, 2, 3); g.fillRect(bx + 1, by - 1, 2, 2); }
    g.fillStyle = '#120b22'; for (let x = 0; x < W; x++) g.fillRect(x, 29 - Math.round(1.5 + 1.5 * Math.sin(x / 5 + seed % 7)), 1, 4);  // les collines
    const cx = 24, cy = 15, R = 12;  // le cadran : un disque sombre et transparent, son bord et les 12 repères
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y); if (d <= R + .3) { g.fillStyle = d > R - .9 ? '#f4eaff' : 'rgba(5,1,11,.55)'; g.fillRect(cx + x, cy + y, 1, 1); } }
    g.fillStyle = '#d9c6ff'; for (let k = 0; k < 12; k++) { const q = k * Math.PI / 6, r = k % 3 ? 9.6 : 9; g.fillRect(Math.round(cx + Math.sin(q) * r), Math.round(cy - Math.cos(q) * r), 1, 1); if (!(k % 3)) g.fillRect(Math.round(cx + Math.sin(q) * 10), Math.round(cy - Math.cos(q) * 10), 1, 1); }
    const hand = (turn, len, col) => { const q = turn * 2 * Math.PI; g.fillStyle = col; for (let i = 0; i <= len * 2; i++) g.fillRect(Math.round(cx + Math.sin(q) * i / 2), Math.round(cy - Math.cos(q) * i / 2), 1, 1); };
    hand((h % 12 + m / 60) / 12, 5.5, '#ffffff'); hand((m + s / 60) / 60, 8.5, '#ffffff'); hand(s / 60, 9, '#ff4fb0');
    g.fillStyle = '#ffd34f'; g.fillRect(cx, cy, 1, 1);
  }
  function wcRender() {
    clearTimeout(wcTimer);
    if (!view.classList.contains('on')) return;
    wcTimer = setTimeout(wcRender, 1000 - Date.now() % 1000);
    const d = new Date(Date.now() + wcShift * 3600e3), here = wcOffset(wcList()[0].tz, d);
    $('wcShiftVal').textContent = wcShift ? (wcShift > 0 ? 'dans ' : 'il y a ') + Math.abs(wcShift) + ' h' : 'maintenant';
    $('wcGrid').replaceChildren(...wcList().map(c => {
      const card = el('div', 'sysCard px wcCard'), off = wcOffset(c.tz, d), diff = (off - here) / 60, h = +d.toLocaleString('fr-FR', {timeZone: c.tz, hour: '2-digit', hourCycle: 'h23'});
      const sky = document.createElement('canvas'); sky.className = 'wcSky'; sky.width = 48; sky.height = 32; const lm = new Date(d.getTime() + off * 60000);  // lm : l'heure de la ville lue en UTC
      scene(sky, lm.getUTCHours(), lm.getUTCMinutes(), lm.getUTCSeconds(), [...c.tz].reduce((s, ch) => s * 31 + ch.charCodeAt(0) | 0, 7) >>> 0 || 1);
      sky.dataset.h = lm.getUTCHours(); sky.dataset.m = lm.getUTCMinutes();
      const ic = el('span', 'wcIc'), k = h >= 7 && h < 20 ? 'sun' : 'moon'; ic.innerHTML = pixIcon(WX[k][1], 3); ic.style.color = WX[k][0];
      const head = el('div', 'wcHead'); head.append(el('span', 'label', c.name), ic);
      const txt = el('div'), body = el('div', 'wcBody'); body.append(sky, txt);
      txt.append(el('div', 'hint', d.toLocaleDateString('fr-FR', {timeZone: c.tz, weekday: 'long', day: 'numeric', month: 'long'})), el('div', 'hint', c.here ? 'ton heure' : diff === 0 ? 'même heure' : (diff > 0 ? '+' : '') + String(diff).replace('.', ',') + ' h'));
      card.append(head, el('div', 'wcTime', d.toLocaleTimeString('fr-FR', {timeZone: c.tz, hour: '2-digit', minute: '2-digit', second: '2-digit'})), body);
      if (!c.here) { const x = el('button', 'x', 'X'); x.title = 'Retirer'; x.onclick = () => setClocks(wcList().slice(1).filter(o => o !== c)); card.append(x); }
      return card;
    }));
  }
  // ---- le planificateur de réunion : chaque colonne est une heure de ta journée, chaque ligne une ville ;
  // vert : heures de bureau (9 h - 18 h), jaune : encore possible (7 h - 22 h), sombre : la nuit. Les colonnes soulignées vont à tout le monde.
  let planDay = ymd(new Date()), planPick = null;
  const wcHourIn = (tz, t) => { const lm = new Date(t + wcOffset(tz, new Date(t)) * 60000); return lm.getUTCHours() + lm.getUTCMinutes() / 60; };
  const slotKind = h => h >= 9 && h < 18 ? 2 : h >= 7 && h < 22 ? 1 : 0;
  const hhmm = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round(h % 1 * 60)).padStart(2, '0');
  function planSlots(list, day) {  // pour chaque heure du jour : l'instant, l'heure et le genre dans chaque ville, le score
    const [y, mo, da] = day.split('-').map(Number);
    return [...Array(24)].map((_, i) => { const t = new Date(y, mo - 1, da, i).getTime(), hs = list.map(c => wcHourIn(c.tz, t)), ks = hs.map(slotKind);
      return {i, t, hs, ks, min: Math.min(...ks), sum: ks.reduce((a, b) => a + b, 0)}; });
  }
  console.assert((() => { const sl = planSlots([{tz: 'Europe/Paris'}, {tz: 'America/New_York'}], '2027-01-12'); return sl[15].hs[1] === 9 && sl[15].min === 2 && sl[3].min === 0 && wcHourIn('Asia/Kolkata', Date.UTC(2027, 0, 12, 0)) === 5.5; })(), 'horloge : planificateur');
  const spans = set => { const out = []; for (const i of [...set].sort((a, b) => a - b)) { const l = out[out.length - 1]; if (l && l[1] === i) l[1] = i + 1; else out.push([i, i + 1]); } return out.map(([a, b]) => b - a > 1 ? hhmm(a) + ' – ' + hhmm(b) : hhmm(a)).join(', '); };
  function planRender() {
    const list = wcList(), slots = planSlots(list, planDay), top = Math.max(...slots.map(x => x.min)), topSum = Math.max(...slots.filter(x => x.min === top).map(x => x.sum));
    const best = new Set(slots.filter(x => x.min === top && x.sum === topSum && top > 0).map(x => x.i));
    $('wcPlanBest').textContent = !best.size ? 'Aucune heure ne va à tout le monde ce jour-là.' : top === 2 ? 'Heures de bureau pour tous : ' + spans(best) + ' (ton heure)' : 'Le moins gênant : ' + spans(best) + ' (ton heure)';
    const cells = [];
    list.forEach((c, r) => { cells.push(el('span', 'n', c.here ? 'Ici' : c.name));
      for (const x of slots) { const b = el('button', 'c k' + x.ks[r] + (best.has(x.i) ? ' best' : '') + (planPick === x.i ? ' on' : ''), x.hs[r] % 1 ? hhmm(x.hs[r]) : String(Math.floor(x.hs[r])));
        b.title = c.name + ' : ' + hhmm(x.hs[r]) + ' (' + ['la nuit', 'possible', 'heures de bureau'][x.ks[r]] + ')'; b.onclick = () => { planPick = x.i; planRender(); }; cells.push(b); } });
    $('wcPlan').style.gridTemplateColumns = 'minmax(90px,max-content) repeat(24,minmax(26px,1fr))'; $('wcPlan').replaceChildren(...cells);
    const pick = $('wcPlanPick'); if (planPick === null) { pick.replaceChildren(el('span', 'hint', 'Clique une heure pour voir la réunion dans chaque ville.')); return; }
    const x = slots[planPick], when = new Date(x.t).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
    const text = 'Réunion le ' + when + ' : ' + list.map((c, r) => (c.here ? 'ici' : c.name) + ' ' + hhmm(x.hs[r]) + (x.ks[r] ? '' : ' (nuit)')).join(' · ');
    const cp = el('button', 'btn px', 'COPIER'), see = el('button', 'btn px', 'VOIR SUR LES HORLOGES');
    cp.onclick = () => navigator.clipboard.writeText(text).then(() => toast('Copié'), () => toast('Copie impossible', true));
    see.onclick = () => { wcShift = Math.round((x.t - Date.now()) / 3600e3); wcShift = Math.max(-24, Math.min(24, wcShift)); $('wcShift').value = wcShift; wcRender(); view.scrollTo?.({top: 0, behavior: 'smooth'}); };
    see.disabled = Math.abs(x.t - Date.now()) > 24.5 * 3600e3; see.title = see.disabled ? 'Les horloges se décalent de 24 h au plus' : 'Décaler les horloges à cette heure';
    pick.replaceChildren(el('span', '', text), cp, see);
  }
  $('wcPlanDay').value = planDay; $('wcPlanDay').onchange = e => { if (e.target.value) { planDay = e.target.value; planPick = null; planRender(); } };
  view.__wc = {planSlots, planRender, wcHourIn};  // pour le test « local »
  const setClocks = list => neo.setSettings({worldClocks: list.map(({name, tz}) => ({name, tz}))}).then(s => { prefs = s; wcRender(); planRender(); });
  $('wcAdd').onkeydown = async e => {
    if (e.key !== 'Enter' || !e.target.value.trim()) return;
    try {
      const r = (await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=fr&name=' + encodeURIComponent(e.target.value.trim())).then(r => r.json())).results?.[0];
      if (!r?.timezone) return toast('Ville introuvable', true);
      e.target.value = ''; setClocks([...wcList().slice(1), {name: r.name, tz: r.timezone}]);
    } catch (err) { toast('Recherche impossible : ' + err.message, true); }
  };
  $('wcShift').oninput = e => { wcShift = +e.target.value; wcRender(); };
  $('wcNow').onclick = () => { wcShift = 0; $('wcShift').value = 0; wcRender(); };
  // ---- fin ----
  ctx.onOpen(() => { wcRender(); planRender(); });
  ctx.onClose(() => { clearTimeout(wcTimer); });
}
