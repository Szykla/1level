// 1.Level Support. Text Reveal and Marquee follow Magic UI's 21st.dev components (MIT, (c) Magic UI), rebuilt without React.
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const WA = 'https://wa.me/41765259761?text=';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile menu
  const menuBtn = document.querySelector('.menu-btn'), mobileNav = document.getElementById('mobile-nav');
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
    open ? mobileNav.setAttribute('data-open', '') : mobileNav.removeAttribute('data-open');
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  mobileNav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Section entrance: only sections below the fold wait, so nothing is hidden at rest
  const rise = [...document.querySelectorAll('.rise')];
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove('wait'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    rise.forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('wait'); io.observe(el); } });
  }

  // Strike-through on error messages draws itself when seen
  const errs = document.querySelectorAll('.err');
  const strikeIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('struck'); strikeIO.unobserve(e.target); }
  }), { threshold: 1 });
  errs.forEach(el => reduced ? el.classList.add('struck') : strikeIO.observe(el));

  // Text Reveal: words light up one by one as the line scrolls through the viewport
  const rv = document.querySelector('[data-reveal]');
  if (rv && !reduced) {
    const wrapWords = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.append(part);
            else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.append(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrapWords(n);
      });
    };
    wrapWords(rv);
    const words = [...rv.querySelectorAll('.w')];
    let ticking = false;
    const paint = () => {
      ticking = false;
      const r = rv.getBoundingClientRect();
      const start = innerHeight * .85, end = innerHeight * .35;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * .5)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('dim', i >= lit));
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
    new IntersectionObserver(es => es.forEach(e => {
      e.isIntersecting ? addEventListener('scroll', onScroll, { passive: true }) : removeEventListener('scroll', onScroll);
      paint();
    })).observe(rv);
  }

  // Review filter
  const chips = document.querySelectorAll('.chip'), reviews = document.querySelectorAll('.rv'), count = document.getElementById('rv-count');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.setAttribute('aria-pressed', x === c));
    const f = c.dataset.f; let n = 0;
    reviews.forEach(r => { const show = f === 'alle' || r.dataset.t.split(' ').includes(f); r.hidden = !show; n += show; });
    count.textContent = `${n} Bewertungen angezeigt`;
  }));

  // Anfahrt map: municipalities from swisstopo/BFS boundaries, ZVV zone per municipality, price per zone
  const svg = document.getElementById('zh-map'), out = document.getElementById('map-out'), q = document.getElementById('map-q');
  // Travel flat rates from 1.11.2026 (plus the effective travel time, see note under the map)
  const BANDS = [[12, 'Stadt Zürich, Zonen 110 und 111'], [13, 'Zonen 112, 117, 121, 122, 130, 140, 150, 154, 155'], [15, 'Zonen 118, 120, 123, 131, 135'], [25, 'Alle anderen ZVV-Zonen']];
  const ZONE_PRICE = { 12: [110, 111], 13: [112, 117, 121, 122, 130, 140, 150, 154, 155], 15: [118, 120, 123, 131, 135] };
  const priceOf = z => { for (const p in ZONE_PRICE) if (ZONE_PRICE[p].includes(z)) return +p; return 25; };
  const extra = z => ZONE_PRICE[12].includes(z) ? 'Bis 15 Minuten Anfahrt. Bei längerer Anfahrt CHF 9 plus Anfahrtszeit.' : 'Pauschale plus effektive Anfahrtszeit';
  const NS = 'http://www.w3.org/2000/svg', el = (n, a) => { const x = document.createElementNS(NS, n); for (const k in a) x.setAttribute(k, a[k]); return x; };
  const munis = [];
  if (window.ZH && svg) {
    const d = window.ZH;
    svg.setAttribute('viewBox', `0 0 ${d.w} ${d.h}`);
    const g = el('g', {});
    d.munis.forEach((m, i) => { const p = el('path', { d: m.d, class: 'm', 'data-p': priceOf(m.z), 'data-z': m.z, 'data-i': i }); const t = el('title', {}); t.textContent = `${m.n}: ab CHF ${priceOf(m.z)}`; p.append(t); g.append(p); munis.push({ ...m, el: p }); });
    d.lakes.forEach(l => g.append(el('path', { d: l, class: 'lake' })));
    const [hx, hy] = d.home, home = el('g', { class: 'home' });
    home.append(el('circle', { cx: hx, cy: hy, r: 7 }));
    const ht = el('text', { x: hx, y: hy - 30, 'text-anchor': 'middle' });
    const t1 = el('tspan', { x: hx, dy: 0 }); t1.textContent = '1. Level Support';
    const t2 = el('tspan', { x: hx, dy: 17 }); t2.textContent = 'Oerlikon';
    ht.append(t1, t2); home.append(ht);
    svg.append(g, home);
    document.getElementById('map-towns').innerHTML = munis.map(m => `<option value="${m.n}">`).join('');
    document.getElementById('map-legend').innerHTML = BANDS.map(([p, t]) => `<li><i style="background:${getComputedStyle(svg.querySelector(`[data-p="${p}"]`)).fill}"></i><b>CHF ${p}</b> ${t}</li>`).join('');
  }
  let hot = null;
  const pick = (m, fill) => {
    if (hot) hot.el.classList.remove('hot');
    svg.querySelectorAll('.zone-hot').forEach(x => x.classList.remove('zone-hot'));
    hot = m; svg.classList.toggle('has-hot', !!m);
    if (!m) return;
    svg.querySelectorAll(`[data-z="${m.z}"]`).forEach(x => x.classList.add('zone-hot'));
    m.el.classList.add('hot');
    out.innerHTML = `<small>Zone ${m.z}${m.z === 110 ? ' · Stadt Zürich' : m.z === 120 ? ' · Stadt Winterthur' : ''}</small><span class="t">${m.n}</span><span class="p">CHF ${priceOf(m.z)}</span><small>${extra(m.z)}</small>`;
    if (fill) q.value = m.n;
  };
  svg && svg.addEventListener('click', e => { const p = e.target.closest('.m'); if (p) pick(munis[+p.dataset.i], true); });
  svg && svg.addEventListener('pointerover', e => { const p = e.target.closest('.m'); if (p && matchMedia('(hover: hover)').matches) pick(munis[+p.dataset.i]); });
  q && q.addEventListener('input', () => {
    const v = q.value.trim().toLowerCase(); if (!v) return;
    const m = munis.find(x => x.n.toLowerCase() === v) || (v.length > 2 && munis.find(x => x.n.toLowerCase().startsWith(v)));
    if (m) pick(m);
  });

  // Google Maps is embedded directly in index.html (loads lazily when scrolled near)

  // Callback form: next six days without Sunday, hours 10 to 18 (office hours end at 19:00)
  const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const daysBox = document.getElementById('cb-days'), timesBox = document.getElementById('cb-times');
  const now = new Date(); let day = null, time = null;
  const dates = []; for (let i = 0; dates.length < 6; i++) { const d = new Date(now); d.setDate(now.getDate() + i); if (d.getDay() !== 0) dates.push(d); }
  const label = d => `${LONG[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.`;
  daysBox.innerHTML = dates.map((d, i) => `<button type="button" class="slot" data-i="${i}" aria-pressed="false">${i === 0 && d.toDateString() === now.toDateString() ? 'Heute' : DAYS[d.getDay()]}<small>${d.getDate()}.${d.getMonth() + 1}.</small></button>`).join('');
  const drawTimes = () => {
    const hours = []; for (let h = 10; h <= 18; h++) hours.push(h);
    const isToday = day && day.toDateString() === now.toDateString();
    timesBox.innerHTML = hours.map(h => { const past = isToday && h <= now.getHours(); return `<button type="button" class="slot" data-h="${h}" aria-pressed="${time === h && !past}" ${past ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}>${h}:00</button>`; }).join('');
  };
  drawTimes();
  daysBox.addEventListener('click', e => { const b = e.target.closest('.slot'); if (!b) return; day = dates[+b.dataset.i]; daysBox.querySelectorAll('.slot').forEach(x => x.setAttribute('aria-pressed', x === b)); drawTimes(); });
  timesBox.addEventListener('click', e => { const b = e.target.closest('.slot'); if (!b || b.disabled) return; time = +b.dataset.h; timesBox.querySelectorAll('.slot').forEach(x => x.setAttribute('aria-pressed', x === b)); });

  const form = document.getElementById('cb-form'), errBox = document.getElementById('cb-err');
  const compose = () => {
    const f = new FormData(form);
    return `Grüezi, bitte rufen Sie mich zurück.\nName: ${f.get('name').trim()}\nTelefon: ${f.get('tel').trim()}\nWann: ${day ? label(day) : 'egal'}${time ? `, ${time}:00 Uhr` : ''}${f.get('msg').trim() ? `\nWorum es geht: ${f.get('msg').trim()}` : ''}`;
  };
  const check = () => {
    const missing = [];
    ['name', 'tel'].forEach(n => { const i = form.elements[n]; const bad = !i.value.trim() || (n === 'tel' && i.value.replace(/\D/g, '').length < 9); i.setAttribute('aria-invalid', bad); if (bad) missing.push(n === 'name' ? 'Ihren Namen' : 'eine Telefonnummer mit mindestens 9 Ziffern'); });
    errBox.hidden = !missing.length;
    errBox.textContent = missing.length ? `Bitte geben Sie ${missing.join(' und ')} ein.` : '';
    return !missing.length;
  };
  form.addEventListener('submit', e => { e.preventDefault(); if (check()) window.open(WA + encodeURIComponent(compose()), '_blank', 'noopener'); });
  document.getElementById('cb-mail').addEventListener('click', e => {
    if (!check()) { e.preventDefault(); return; }
    e.currentTarget.href = `mailto:support@1level.ch?subject=${encodeURIComponent('Rückruf bitte')}&body=${encodeURIComponent(compose())}`;
  });

  // Service links prefill the topic
  document.querySelectorAll('[data-topic]').forEach(a => a.addEventListener('click', () => { form.elements.msg.value = `${a.dataset.topic}: `; }));

  // Mobile call bar hides while the contact section is on screen
  const bar = document.getElementById('callbar');
  new IntersectionObserver(es => es.forEach(e => bar.classList.toggle('away', e.isIntersecting))).observe(document.getElementById('kontakt'));
})();

// Remote-desktop graphic: a new computer problem on every loop
(() => {
  const cursor = document.querySelector('.rd-cursor');
  if (!cursor || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $ = id => document.getElementById(id);
  const ICON = {
    printer: 'M76 96v-8h20v8M72 96h28a2 2 0 0 1 2 2v12h-6v-4H76v4h-6V98a2 2 0 0 1 2-2zM76 106h20v8H76z',
    wifi: 'M70 96a24 24 0 0 1 32 0M75 102a16 16 0 0 1 22 0M80 108a8 8 0 0 1 12 0M86 113.5h0',
    laptop: 'M74 90h24v16H74zM68 110h36',
    photo: 'M72 90h28v22H72zM72 108l8-8 7 7 4-4 9 9M93 96h0',
    mail: 'M72 92h28v20H72zM72 92l14 11 14-11'
  };
  const CASES = [
    ['printer', 'Drucker im Wohnzimmer', 'Offline', 'Bereit ✓', 'Treiber neu installiert, Verbindung geprüft'],
    ['wifi', 'WLAN zu Hause', 'Kein Internet', 'Verbunden ✓', 'Router neu eingerichtet, Passwort gesichert'],
    ['laptop', 'Laptop', 'Sehr langsam', 'Wieder schnell ✓', 'Autostart aufgeräumt, Updates installiert'],
    ['photo', 'Ferienfotos', 'Nicht gefunden', 'Gerettet ✓', 'Fotos wiederhergestellt und gesichert'],
    ['mail', 'E-Mail', 'Senden fehlgeschlagen', 'Gesendet ✓', 'Postausgang richtig eingestellt']
  ];
  const fit = (bg, t) => bg.setAttribute('width', Math.ceil(t.getComputedTextLength()) + 24);
  let i = 0;
  cursor.addEventListener('animationiteration', () => {
    i = (i + 1) % CASES.length;
    const [ico, name, off, on, done] = CASES[i];
    $('rd-ico').setAttribute('d', ICON[ico]);
    $('rd-name').textContent = name;
    $('rd-offt').textContent = off; fit($('rd-offbg'), $('rd-offt'));
    $('rd-ont').textContent = on; fit($('rd-onbg'), $('rd-ont'));
    $('rd-done').textContent = done;
  });
})();

// Light/dark switch: follows the system until clicked, then remembered in this browser only
(function () {
  var root = document.documentElement, btn = document.querySelector('.theme-btn');
  if (!btn) return;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var isDark = function () { var t = root.getAttribute('data-theme'); return t ? t === 'dark' : mq.matches; };
  var sync = function () {
    var d = isDark();
    btn.setAttribute('aria-pressed', d ? 'true' : 'false');
    btn.setAttribute('aria-label', d ? 'Heller Modus' : 'Dunkler Modus');
  };
  btn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
  if (mq.addEventListener) mq.addEventListener('change', sync);
  sync();
})();

// Office hours: Monday to Saturday, 10:00 to 19:00, Zurich time
(function () {
  var els = document.querySelectorAll('[data-status]');
  if (!els.length) return;
  try {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Zurich', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
    var wd = 0, h = 0, IDX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    parts.forEach(function (p) { if (p.type === 'weekday') wd = IDX[p.value]; if (p.type === 'hour') h = parseInt(p.value, 10) % 24; });
    var open = wd >= 1 && wd <= 6 && h >= 10 && h < 19, text;
    if (open) text = 'Jetzt ist Bürozeit, bis 19:00 Uhr.';
    else {
      var when = (wd === 0 || (wd === 6 && h >= 19)) ? 'am Montag ab 10:00 Uhr' : (h < 10 ? 'heute ab 10:00 Uhr' : 'morgen ab 10:00 Uhr');
      text = 'Bürozeit wieder ' + when + '. Auf WhatsApp können Sie jederzeit schreiben.';
    }
    els.forEach(function (el) { el.setAttribute('data-state', open ? 'open' : 'closed'); el.querySelector('.status-text').textContent = text; });
  } catch (e) {}
})();
