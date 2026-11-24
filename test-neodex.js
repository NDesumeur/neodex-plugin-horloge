// lancé par le test « local » de NeoDex : une scène pixel art par ville, à la bonne heure ; le ciel de nuit est sombre, celui de midi clair ; rien ne déborde
module.exports = async ({ pj, sleep }) => {
  await sleep(1200);
  const r = await pj(`(() => {
    const cards = [...document.querySelectorAll('.wcCard')], sk = cards.map(c => c.querySelector('canvas.wcSky'));
    const bad = cards.filter((c, i) => { const t = c.querySelector('.wcTime').textContent.split(':'); return !sk[i] || +t[0] !== +sk[i].dataset.h || Math.abs(+t[1] - +sk[i].dataset.m) > 1 && Math.abs(+t[1] - +sk[i].dataset.m) < 59; }).map(c => c.querySelector('.label').textContent);
    const over = [...document.querySelectorAll('.appWrap *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length + [...document.querySelectorAll('.wcCard *')].filter(e => e.getBoundingClientRect().right > e.closest('.wcCard').getBoundingClientRect().right + 1).length;
    return { n: cards.length, bad, over, w: sk[0]?.getBoundingClientRect().width, px: sk[0]?.getContext('2d').getImageData(0, 0, 48, 32).data.some(v => v) };
  })()`);
  if (r.n < 2 || !r.px) throw new Error('scènes absentes : ' + JSON.stringify(r));
  if (r.bad.length) throw new Error('aiguilles à la mauvaise heure : ' + r.bad.join(', '));
  if (r.over) throw new Error(r.over + ' élément(s) débordent à droite');
  // le ciel suit le décalage : on avance jusqu'à ce qu'il soit midi puis minuit ici, et on compare la clarté du haut du ciel
  const sky = await pj(`(async () => {
    const s = document.getElementById('wcShift'), hh = new Date().getHours(), out = {};
    for (const [k, target] of [['midi', 12], ['minuit', 0]]) { let d = (target - hh + 24) % 24; if (d > 12) d -= 24; s.value = d; s.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 80));
      const p = document.querySelector('.wcCard canvas.wcSky').getContext('2d').getImageData(0, 0, 48, 1).data; let m = 999; for (let i = 0; i < p.length; i += 4) m = Math.min(m, p[i] + p[i + 1] + p[i + 2]); out[k] = m; }  // le minimum de la rangée du haut : le ciel, pas une étoile
    document.getElementById('wcNow').click(); await new Promise(r => setTimeout(r, 100)); out.label = document.getElementById('wcShiftVal').textContent; return out; })()`);
  if (!(sky.midi > 350 && sky.minuit < 150) || sky.label !== 'maintenant') throw new Error('ciel : ' + JSON.stringify(sky));
  // le planificateur : une ligne par ville, 24 heures ; un clic sur une heure donne la réunion dans chaque ville, à copier
  const plan = await pj(`(async () => { const g = document.getElementById('wcPlan'), cells = g.querySelectorAll('.c'); cells[14].click(); await new Promise(r => setTimeout(r, 50));
    return { cells: g.querySelectorAll('.c').length, rows: g.querySelectorAll('.n').length, pick: document.getElementById('wcPlanPick').textContent, best: document.getElementById('wcPlanBest').textContent }; })()`);
  if (plan.cells !== plan.rows * 24 || plan.rows !== r.n || !/^Réunion le .* ici 14:00/.test(plan.pick)) throw new Error('planificateur : ' + JSON.stringify(plan));
  return 'planificateur de réunion (' + plan.best.slice(0, 60) + ') · ' + r.n + ' horloges pixel art à l’heure, scène de ' + Math.round(r.w) + ' px, ciel de midi ' + sky.midi + ' / minuit ' + sky.minuit;
};
