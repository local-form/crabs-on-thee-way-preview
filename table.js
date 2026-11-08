'use strict';
// The boil table: one paper plate per person dealt around the edge, their real boil trays dropped on the butcher paper,
// party trays as deli stickers. Listens for 'crew:change' from planner.js; tells steam.js where the trays are ('table:laid').
(() => {
  const sp = document.getElementById('spread'); if (!sp) return;
  const platesEl = sp.querySelector('.plates'), traysEl = sp.querySelector('.trays'), stickEl = sp.querySelector('.stickers'), paper = sp.querySelector('.paper');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PHOTOS = ['tray-1', 'tray-2', 'tray-3', 'tray-4'];
  const MAXP = 60, MAXT = 12;
  const rnd = i => { const x = Math.sin(i * 91.7 + 13.1) * 43758.5; return x - Math.floor(x); };   // fixed jitter per slot
  for (let i = 0; i < MAXP; i++) { const p = document.createElement('span'); p.className = 'plate'; p.style.setProperty('--r', (rnd(i) * 40 - 20) + 'deg'); platesEl.appendChild(p); }
  // the first 4 trays (one per photo) are in the HTML so the photos load with the page; repeats are made here
  const trays = [...traysEl.children];
  for (let i = trays.length; i < MAXT; i++) { const t = document.createElement('span'); t.className = 'tray'; t.innerHTML = `<img data-src="assets/${PHOTOS[i % PHOTOS.length]}.webp" alt="" decoding="sync">`; traysEl.appendChild(t); trays.push(t); }
  trays.forEach((t, i) => t.style.setProperty('--r', (rnd(i + 70) * 10 - 5) + 'deg'));
  let state = null, shownP = 0, shownT = 0, first = true;

  function lay() {
    if (!state) return;
    const { n, rows } = state;
    const W = sp.clientWidth, H = sp.clientHeight; if (!W || !H) return;
    const band = W < 600 ? 44 : 64;
    // plates: evenly round the rim
    const iw = W - band, ih = H - band, per = 2 * (iw + ih);
    const size = Math.max(15, Math.min(band * .82, per / n * .8));
    const plates = platesEl.children;
    for (let i = 0; i < MAXP; i++) {
      const p = plates[i];
      if (i < n) {
        let d = ((i + .5) / n) * per, x, y;
        if (d < iw) { x = band / 2 + d; y = band / 2; }
        else if ((d -= iw) < ih) { x = band / 2 + iw; y = band / 2 + d; }
        else if ((d -= ih) < iw) { x = band / 2 + iw - d; y = band / 2 + ih; }
        else { d -= iw; x = band / 2; y = band / 2 + ih - d; }
        p.style.cssText += `;--s:${size.toFixed(1)}px;left:${(x - size / 2).toFixed(1)}px;top:${(y - size / 2).toFixed(1)}px;transition-delay:${reduce ? 0 : Math.max(0, i - shownP) * 22}ms`;
        p.classList.add('on');
      } else { p.style.transitionDelay = '0ms'; p.classList.remove('on'); }
    }
    shownP = n;
    // stickers for party trays
    const extras = rows.filter(r => r.kind === 'extra');
    stickEl.innerHTML = extras.map((r, i) => `<span class="sticker s${i % 3}" style="--r:${(rnd(i + 30) * 8 - 4).toFixed(1)}deg">${r.q > 1 ? r.q + '× ' : ''}${r.n.split(',')[0]}<small>${r.size}</small></span>`).join('');
    // trays: one per boil order, in a grid on the paper
    const T = Math.min(MAXT, rows.filter(r => r.kind === 'boil').reduce((s, r) => s + r.q, 0));
    const pad = W < 600 ? 10 : 18, stripH = extras.length ? stickEl.offsetHeight * .45 : 0;   // stickers sit over the tray edges, like on a real table
    const PX = band + pad, PY = band + pad, PW = W - 2 * PX, PH = H - 2 * PY - stripH;
    // a few trays crowd the paper and overlap a little, like a real spread; many trays keep a gap
    const fill = T <= 6 ? 1.1 : .98;
    let best = { w: 0 };
    for (let cols = 1; cols <= T; cols++) {
      const rowsN = Math.ceil(T / cols), cw = PW / cols, ch = PH / rowsN, w = Math.min(cw * fill, ch * fill * 4 / 3);
      if (w > best.w) best = { w, cols, rowsN, cw, ch };
    }
    const tw = Math.min(best.w, W < 600 ? 250 : 340), th = tw * 3 / 4, src = [];
    const offY = (PH - best.rowsN * best.ch) / 2;
    trays.forEach((t, i) => {
      if (i < T) {
        const r = Math.floor(i / best.cols), inRow = Math.min(best.cols, T - r * best.cols), c = i % best.cols;
        const rowOff = (PW - inRow * best.cw) / 2;
        const cx = PX + rowOff + (c + .5) * best.cw + (rnd(i + 5) - .5) * best.cw * .08;
        const cy = PY + offY + (r + .5) * best.ch + (rnd(i + 9) - .5) * best.ch * .08;
        t.style.cssText += `;width:${tw.toFixed(1)}px;height:${th.toFixed(1)}px;left:${(cx - tw / 2).toFixed(1)}px;top:${(cy - th / 2).toFixed(1)}px`;
        const im = t.firstChild; if (!im.getAttribute('src')) im.src = im.dataset.src;
        // some browsers (seen in embedded/background views) leave a loaded photo unpainted until it is decoded: force it
        if (!im.dataset.dec) { im.dataset.dec = 1; const dec = () => im.decode && im.decode().catch(() => {}).then(() => { im.style.opacity = '.999'; requestAnimationFrame(() => im.style.opacity = ''); }); im.complete ? dec() : im.addEventListener('load', dec, { once: true }); }
        if (!t.classList.contains('on')) { t.style.animationDelay = reduce ? '0ms' : (i - shownT) * 90 + 'ms'; t.classList.add('on'); }
        if (src.length < 8) src.push([cx, cy - th * .42, tw * .8]);
      } else t.classList.remove('on');
    });
    shownT = T;
    sp.dispatchEvent(new CustomEvent('table:laid', { detail: { src, W, H } }));
    const boilRow = rows.find(r => r.kind === 'boil');
    sp.setAttribute('aria-label', `The table for ${n}: a paper plate for each person, ${T} tray${T > 1 ? 's' : ''} of Crabs on Thee Way ${boilRow ? boilRow.n.toLowerCase() : 'boil'}${extras.length ? ', plus ' + extras.map(r => r.n.split(',')[0].toLowerCase()).join(', ') : ''}`);
    const pn = document.getElementById('party-n'); if (pn) pn.textContent = n;
  }
  // the first lay is drawn still (class "still" from the HTML); only later changes animate
  document.addEventListener('crew:change', e => { state = e.detail; if (!first) sp.classList.remove('still'); first = false; lay(); });
  // re-lay whenever the table's box changes (fonts, late CSS, rotation), not only on window resize
  let lastW = 0, lastH = 0;
  const relay = () => { if (sp.clientWidth !== lastW || sp.clientHeight !== lastH) { lastW = sp.clientWidth; lastH = sp.clientHeight; lay(); } };
  if ('ResizeObserver' in window) new ResizeObserver(relay).observe(sp); else addEventListener('resize', relay);
})();
