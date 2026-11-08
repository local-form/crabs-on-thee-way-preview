'use strict';
// "Feed the crew": head count + heat + extras -> an order ticket priced from Crabs on Thee Way's own posted menus.
// Menu (IG flyer): Double Snow Crab Boil $40; 10 Clusters (for parties of 4 or more) $150. All boils come with shrimp, corn & potatoes.
// Catering menu (IG, "please order 24 hours in advance"): pastas medium/large, fried 100/200 pc, sides by the pan.
// Portions per tray are our estimate and are labelled as one on the page.
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const range = $('#crew-n'); if (!range) return;
  const out = $('#crew-out'), lines = $('#t-lines'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = +range.min, MAX = +range.max, TRAYS_FROM = 10;
  const HEAT = { Mild: .2, Medium: .45, Hot: .7, Fire: 1 };
  const money = n => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 });

  // pieces trays: 100 pc / 200 pc. pans: medium / large (or one size).
  const pcs = (need, p100, p200) => { const out = []; let big = Math.floor(need / 200), r = need - big * 200; if (r > 100) { big++; r = 0; } if (big) out.push([big, '200 pc', p200]); if (r > 0) out.push([1, '100 pc', p100]); return out; };
  const pans = (n, med, lg, sMed, sLg) => { const out = []; let L = Math.floor(n / sLg), r = n - L * sLg; if (r > sMed || !med) { if (r > 0) L++; r = 0; } if (L) out.push([L, 'large pan', lg]); if (r > 0) out.push([1, 'medium pan', med]); return out; };
  const EXTRA = {
    shrimp:    { name: 'Fried shrimp', make: n => pcs(n * 6, 90, 165), sub: '~6 pieces each' },
    wings:     { name: 'Wings', make: n => pcs(n * 6, 125, 210), sub: '~6 pieces each' },
    crabpasta: { name: 'Crab meat pasta', make: n => pans(n, 100, 150, 12, 20), sub: 'medium ~12, large ~20' },
    mac:       { name: 'Mac n cheese', make: n => pans(n, 100, 150, 15, 25), sub: 'medium ~15, large ~25' },
    yams:      { name: 'Yams', make: n => pans(n, 0, 75, 0, 25), sub: 'large pan ~25' },
    cabbage:   { name: 'Cabbage', make: n => pans(n, 0, 75, 0, 25), sub: 'large pan ~25' },
    eggs:      { name: 'Deviled eggs', make: n => { const e = Math.ceil(n * 1.5), s = Math.floor(e / 60), r = e - s * 60; const o = []; if (r > 30) o.push([s + 1, '60 pc', 75]); else { if (s) o.push([s, '60 pc', 75]); if (r) o.push([1, '30 pc', 40]); } return o; }, sub: '~1½ each' }
  };

  function plan() {
    const n = +range.value, heat = ($('input[name=heat]:checked') || {}).value || 'Hot';
    const rows = [];
    let crabs;
    if (n < 4) { rows.push({ kind: 'boil', q: n, n: 'Double Snow Crab Boil', p: 40 * n, sub: 'one each · shrimp, corn & potatoes' }); crabs = n * 2; }
    else { const k = Math.ceil(n / 4); rows.push({ kind: 'boil', q: k, n: '10 Clusters boil', p: 150 * k, sub: `${k * 10} clusters ≈ ${k * 5} lb snow crab · shrimp, corn & potatoes` }); crabs = k * 10; }
    const trays = n >= TRAYS_FROM;
    if (trays) for (const i of $$('input[name=extra]:checked')) {
      const e = EXTRA[i.value];
      for (const [q, size, price] of e.make(n)) rows.push({ kind: "extra", key: i.value, size, q, n: `${e.name}, ${size}`, p: q * price, sub: e.sub });
    }
    const total = rows.reduce((s, r) => s + r.p, 0);
    return { n, heat, rows, total, crabs, trays };
  }

  let queued = false, last = [];
  function render() {
    queued = false;
    const { n, heat, rows, total, trays } = plan();
    out.textContent = n;
    range.setAttribute('aria-valuetext', n + (n === 1 ? ' person' : ' people'));
    range.style.setProperty('--p', ((n - MIN) / (MAX - MIN) * 100).toFixed(1) + '%');
    document.documentElement.style.setProperty('--heat', HEAT[heat]);
    $('#t-for').textContent = `ORDER FOR ${n}`;
    $('#t-heat').textContent = `HEAT: ${heat.toUpperCase()}`;
    const keys = rows.map(r => r.q + r.n);
    lines.innerHTML = rows.map((r, i) => `<li${!reduce && !last.includes(keys[i]) ? ' class="in"' : ''} style="animation-delay:${i * 50}ms"><span class="t-row"><span class="q">${r.q}×</span><span class="n">${r.n}</span><span class="p">${money(r.p)}</span></span><span class="t-sub">${r.sub}</span></li>`).join('');
    last = keys;
    $('#t-total').textContent = money(total);
    $('#t-per').textContent = n > 1 ? `about ${money(Math.round(total / n * 100) / 100)} a person` : '';
    const ex = $('.extras'); ex.classList.toggle('locked', !trays);
    $('#extras-note').textContent = trays ? 'party trays, order 24 hrs ahead' : `party trays start at ${TRAYS_FROM} people`;
    $$('.quick button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.n === n));
    document.dispatchEvent(new CustomEvent('crew:change', { detail: { n, heat, rows } }));
  }
  const update = () => { if (!queued) { queued = true; requestAnimationFrame(render); } };

  const q = +new URLSearchParams(location.search).get('n'); // ?n=40 opens the planner at 40 people
  if (q >= MIN && q <= MAX) range.value = Math.round(q);
  range.addEventListener('input', update);
  $$('.step').forEach(b => b.addEventListener('click', () => { range.value = Math.min(MAX, Math.max(MIN, +range.value + +b.dataset.step)); update(); }));
  $$('.quick button').forEach(b => b.addEventListener('click', () => { range.value = b.dataset.n; update(); }));
  $$('input[name=heat], input[name=extra]').forEach(i => i.addEventListener('change', update));
  render();
  last = plan().rows.map(r => r.q + r.n);

  // Carry the ticket into the pre-order form
  const to = $('#to-order');
  to && to.addEventListener('click', e => {
    const form = $('#order-form'); if (!form) return;
    const { n, heat, rows, total } = plan();
    e.preventDefault();
    form.people.value = n;
    form.heat.value = heat;
    form.order.value = rows.map(r => `${r.q} x ${r.n} (${money(r.p)})`).join('\n') + `\nEstimated total ${money(total)} from the posted menu. Please confirm.`;
    form.closest('section').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#order');
    form.classList.remove('flash'); void form.offsetWidth; form.classList.add('flash');
    setTimeout(() => form.name.focus({ preventScroll: true }), reduce ? 0 : 700);
  });
})();
