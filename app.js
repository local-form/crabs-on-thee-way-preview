'use strict';
// Scroll reveal (house standard), live "open now" from the posted hours (New York time), and the pre-order form (front end only).
(() => {
  const els = [...document.querySelectorAll('[data-reveal]')];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-visible')); return; }
  const n = new Map();
  els.forEach(e => { const p = e.parentElement, i = n.get(p) || 0; e.style.setProperty('--d', i * .08 + 's'); n.set(p, i + 1); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: .01, rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
  setTimeout(() => els.forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('is-visible'); }), 1500);
})();

(() => {
  // minutes after midnight, Sun..Sat (Google + their menu flyer agree)
  const H = [[750, 1140], [690, 1200], [690, 1200], [690, 1200], [750, 1320], [750, 1410], [750, 1410]];
  const el = document.getElementById('open-now'); if (!el) return;
  const fmt = m => { const h = Math.floor(m / 60) % 24, mm = m % 60, ap = h >= 12 ? 'pm' : 'am', h12 = h % 12 || 12; return h12 + (mm ? ':' + String(mm).padStart(2, '0') : '') + ' ' + ap; };
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const d = now.getDay(), m = now.getHours() * 60 + now.getMinutes(), [o, c] = H[d];
  const row = document.querySelector(`.hours tr[data-d="${d}"]`); if (row) row.classList.add('today');
  if (m >= o && m < c) { el.innerHTML = `<span class="dot on"></span>Open now · until ${fmt(c)} today`; }
  else if (m < o) { el.innerHTML = `<span class="dot"></span>Opens ${fmt(o)} today · pre-orders by phone`; }
  else { const nd = (d + 1) % 7; el.innerHTML = `<span class="dot"></span>Closed for tonight · opens ${fmt(H[nd][0])} tomorrow`; }
})();

(() => {
  const f = document.getElementById('order-form'); if (!f) return;
  const warn = document.getElementById('order-warn'), done = document.getElementById('order-done');
  const ny = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  f.date.min = iso(ny);
  const trayWords = /pc|pan|tray|pasta,|deviled|scallop|cabbage|yams|mac n cheese/i;
  const check = () => {
    const today = iso(ny), tomorrow = iso(new Date(ny.getTime() + 864e5));
    const soon = f.date.value && f.date.value <= tomorrow && f.date.value >= today;
    const show = soon && trayWords.test(f.order.value) && /pc|pan/i.test(f.order.value);
    warn.hidden = !show;
    if (show) warn.textContent = 'Party trays need 24 hours. Pick a later day, or call to ask what they can do today.';
  };
  f.addEventListener('input', check);
  f.addEventListener('submit', e => {
    e.preventDefault();
    const name = f.name.value.trim(), phone = f.phone.value.trim();
    f.name.toggleAttribute('aria-invalid', !name); f.phone.toggleAttribute('aria-invalid', phone.replace(/\D/g, '').length < 10);
    if (!name) return f.name.focus();
    if (phone.replace(/\D/g, '').length < 10) return f.phone.focus();
    const day = f.date.value ? new Date(f.date.value + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'the day you pick on the phone';
    const first = name.split(/\s+/)[0];
    const lines = f.order.value.trim() ? f.order.value.trim().split('\n').map(l => `<li>${l.replace(/[<>&]/g, '')}</li>`).join('') : '<li>Order to talk through on the phone</li>';
    done.innerHTML = `<p class="done-h">Pre-order for ${first.replace(/[<>&]/g, '')}: ${f.people.value} people, ${day}, ${f.time.value.split(' (')[0].toLowerCase()}, heat ${f.heat.value.toLowerCase()}, ${f.how.value.toLowerCase()}.</p><ul>${lines}</ul><p class="done-note">Preview only: nothing was sent. On the real site, Crabs on Thee Way confirms by text or call.</p>`;
    done.hidden = false;
    done.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  });
})();

// Header: measure the sticky bar for scroll-margin, and the phone menu (opens, closes on a link, Escape, outside tap or going wide).
(() => {
  const top = document.querySelector('.top'), btn = top && top.querySelector('.menu-btn'), nav = document.getElementById('site-nav');
  if (!top) return;
  const setBar = () => document.documentElement.style.setProperty('--bar', top.offsetHeight + 'px');
  setBar(); addEventListener('resize', setBar); document.fonts && document.fonts.ready.then(setBar);
  if (!btn || !nav) return;
  const set = open => { top.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
  btn.addEventListener('click', () => set(!top.classList.contains('open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && top.classList.contains('open')) { set(false); btn.focus(); } });
  document.addEventListener('click', e => { if (top.classList.contains('open') && !top.contains(e.target)) set(false); });
  matchMedia('(min-width: 900px)').addEventListener('change', e => e.matches && set(false));
})();
