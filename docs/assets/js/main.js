/* Lorenzo Mangini — interazioni del sito (nessuna libreria esterna) */
(function () {
  'use strict';

  var doc = document;
  var html = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- testo gigante che riempie la riga ---------- */

  function fit() {
    $$('[data-fit]').forEach(function (el) {
      var inner = el.querySelector('.fit');
      if (!inner) {
        inner = doc.createElement('span');
        inner.className = 'fit';
        while (el.firstChild) inner.appendChild(el.firstChild);
        el.appendChild(inner);
      }
      el.style.fontSize = '200px';
      var w = inner.getBoundingClientRect().width;
      var avail = el.clientWidth;
      if (w > 0 && avail > 0) el.style.fontSize = (200 * avail / w * 0.995).toFixed(2) + 'px';
    });
  }
  fit();
  addEventListener('resize', fit);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fit);

  /* ---------- wordmark: le lettere reagiscono al cursore ---------- */

  var word = $('.hero__word .fit');
  if (word && canHover && !reduced) {
    var text = word.textContent;
    word.textContent = '';
    var chars = text.split('').map(function (c) {
      var s = doc.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      s.setAttribute('aria-hidden', 'true');
      word.appendChild(s);
      return s;
    });
    var hero = word.parentNode;
    hero.addEventListener('pointermove', function (e) {
      chars.forEach(function (s) {
        var r = s.getBoundingClientRect();
        var d = Math.abs(e.clientX - (r.left + r.width / 2)) / r.width;
        var k = Math.max(0, 1 - d / 2.2);
        s.style.transform = 'translateY(' + (-k * k * 7).toFixed(2) + '%) scaleY(' + (1 + k * k * 0.08).toFixed(3) + ')';
      });
    });
    hero.addEventListener('pointerleave', function () {
      chars.forEach(function (s) { s.style.transform = ''; });
    });
  }

  /* ---------- header + menu mobile ---------- */

  var header = $('.header');
  var menu = $('#menu');
  var toggle = $('.nav__toggle');
  var lastY = scrollY;
  addEventListener('scroll', function () {
    var y = scrollY;
    if (menu && !menu.hidden) return;
    header.classList.toggle('is-hidden', y > 240 && y > lastY);
    lastY = y;
  }, { passive: true });

  function setMenu(open) {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    doc.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(menu.hidden); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
    matchMedia('(min-width: 721px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  $$('[data-top]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  });
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- comparsa allo scorrimento ---------- */

  var revealItems = $$('.card, .project__body > *, .gallery__item, .about__text > *');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 2) * 80 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- selettore lingua (English / Italiano) ---------- */

  $$('[data-lang]').forEach(function (box) {
    var tabs = $$('[data-lang-tab]', box);
    var panels = $$('[data-lang-panel]', box);
    var codes = tabs.map(function (t) { return t.getAttribute('data-lang-tab'); });
    function show(code, save) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-lang-tab') === code;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-pressed', String(on));
      });
      panels.forEach(function (p) { p.classList.toggle('is-off', p.getAttribute('data-lang-panel') !== code); });
      if (save) store.set('lm-lang', code);
    }
    // Prima visita: italiano se il browser è in italiano, altrimenti la prima lingua.
    var saved = store.get('lm-lang');
    var browser = (navigator.language || '').slice(0, 2).toLowerCase();
    show(codes.indexOf(saved) > -1 ? saved : codes.indexOf(browser) > -1 ? browser : codes[0], false);
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { show(t.getAttribute('data-lang-tab'), true); });
    });
  });

  /* ---------- Vertical ADV: lingua della pagina, telefono 3D, fila dei reel ---------- */

  $$('[data-vadv]').forEach(function (page) {
    // lingua: tutta la pagina in italiano o in inglese
    var tabs = $$('[data-vlang]', page);
    function setLang(code, save) {
      page.setAttribute('data-l', code);
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-vlang') === code;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-pressed', String(on));
      });
      if (save) store.set('lm-lang', code);
    }
    var saved = store.get('lm-lang');
    var browser = (navigator.language || '').slice(0, 2).toLowerCase();
    setLang(saved === 'it' || saved === 'en' ? saved : browser === 'it' ? 'it' : 'en', false);
    tabs.forEach(function (t) { t.addEventListener('click', function () { setLang(t.getAttribute('data-vlang'), true); }); });

    // fila dei reel: frecce su desktop, swipe su telefono
    var track = $('[data-vreels-track]', page);
    $$('[data-vreels]', page).forEach(function (b) {
      b.addEventListener('click', function () {
        track.scrollBy({ left: Number(b.getAttribute('data-vreels')) * track.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' });
      });
    });

    // palco: scorrendo, il telefono ruota, i reel scorrono sullo schermo e i testi si alternano
    var stage = $('[data-vstage]', page);
    var phone = $('[data-phone]', page);
    if (!stage || !phone || reduced) return;
    var panels = $$('[data-vpanel]', stage);
    var dots = $$('.vstage__dots i', stage);
    var strip = $('.phone__strip', phone);
    var screen = $('.phone__screen', phone);
    var ticking = false, active = -1;
    var shaded = $$('[data-n]', phone).map(function (el) { return { el: el, n: el.getAttribute('data-n').split(',').map(Number) }; });
    stage.classList.add('is-live');

    function update() {
      ticking = false;
      var r = stage.getBoundingClientRect();
      var total = r.height - innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      // il giro completo avviene nella parte centrale dello scorrimento: a "Riprese" si vede il retro con le fotocamere
      var t = Math.min(1, Math.max(0, (p - 0.26) / 0.62));
      var s = t * t * (3 - 2 * t);
      var ry = -22 + 368 * s; // da -22° a 346° (di nuovo quasi di fronte)
      phone.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      phone.style.setProperty('--rx', (4 * (1 - p)).toFixed(2) + 'deg');
      // luce da sinistra, in alto, davanti: ogni faccia e ogni striscia del bordo si schiarisce o si scurisce
      var ay = ry * Math.PI / 180, ax = 4 * (1 - p) * Math.PI / 180;
      var cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
      shaded.forEach(function (it) {
        var n = it.n;
        var y1 = n[1] * cx - n[2] * sx, z1 = n[1] * sx + n[2] * cx;
        var x2 = n[0] * cy + z1 * sy, z2 = -n[0] * sy + z1 * cy;
        var lit = Math.max(0, x2 * -0.36 + y1 * -0.28 + z2 * 0.89);
        it.el.style.setProperty('--b', (0.5 + 0.62 * lit).toFixed(3));
      });
      var room = Math.max(0, strip.scrollHeight - screen.clientHeight);
      phone.style.setProperty('--shift', (p * room).toFixed(1));
      var idx = Math.min(panels.length - 1, Math.floor(p * panels.length * 0.999));
      if (idx !== active) {
        active = idx;
        panels.forEach(function (el, n) { el.classList.toggle('is-on', n === idx); });
        dots.forEach(function (el, n) { el.classList.toggle('is-on', n === idx); });
      }
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request);
    $$('img', strip).forEach(function (im) { im.addEventListener('load', request); });
    update();
  });

  /* ---------- filtri ---------- */

  var filters = $$('.filter');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      $$('#grid .card').forEach(function (card) {
        var cats = (card.getAttribute('data-category') || '').split(' ');
        var show = f === 'all' || cats.indexOf(f) > -1;
        // nel filtro DoP i lavori di sola fotografia vengono prima
        card.style.order = f === 'dop' && show && cats.length === 1 ? '-1' : '';
        card.classList.toggle('is-out', !show);
        if (show) card.classList.add('is-in');
      });
    });
  });

  /* ---------- etichetta che segue il cursore ---------- */

  if (canHover) {
    var cursor = doc.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(cursor);
    addEventListener('pointermove', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cursor]') : null;
      if (t && !t.closest('.is-playing')) {
        cursor.textContent = '[ ' + t.getAttribute('data-cursor') + ' ]';
        cursor.style.transform = 'translate(' + (e.clientX + 14) + 'px,' + (e.clientY + 16) + 'px)';
        cursor.classList.add('is-on');
      } else {
        cursor.classList.remove('is-on');
      }
    }, { passive: true });
    doc.addEventListener('pointerleave', function () { cursor.classList.remove('is-on'); });
    addEventListener('scroll', function () { cursor.classList.remove('is-on'); }, { passive: true });
  }

  /* ---------- cookie + video ---------- */

  var COOKIE = 'lm-cookie';
  var banner = $('#cookie');
  if (banner) {
    if (!store.get(COOKIE)) banner.hidden = false;
    $$('[data-cookie]', banner).forEach(function (b) {
      b.addEventListener('click', function () {
        store.set(COOKIE, b.getAttribute('data-cookie'));
        banner.hidden = true;
      });
    });
  }

  // I player partono solo al click: prima non viene caricato nulla da YouTube/Vimeo.
  // Se i cookie sono stati rifiutati, il video si apre sulla piattaforma in una nuova scheda.
  $$('.video__frame[data-embed]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (store.get(COOKIE) === 'no') return;
      e.preventDefault();
      var frame = doc.createElement('iframe');
      frame.src = a.getAttribute('data-embed');
      frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      frame.allowFullscreen = true;
      frame.title = a.getAttribute('aria-label') || 'Video';
      var holder = doc.createElement('div');
      holder.className = 'video__frame';
      holder.appendChild(frame);
      a.parentNode.classList.add('is-playing');
      a.parentNode.replaceChild(holder, a);
    });
  });

  /* ---------- lightbox per le gallery ---------- */

  $$('[data-gallery]').forEach(function (gallery) {
    var items = $$('.gallery__item', gallery);
    var box, img, counter, index = 0, opener;

    function show(i) {
      index = (i + items.length) % items.length;
      img.src = items[index].href;
      counter.textContent = pad(index + 1) + ' / ' + pad(items.length);
    }
    function close() {
      box.hidden = true;
      doc.body.style.overflow = '';
      removeEventListener('keydown', onKey);
      if (opener) opener.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
    }
    function build() {
      box = doc.createElement('div');
      box.className = 'lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Photo viewer');
      box.innerHTML =
        '<div class="lightbox__bar"><span class="lightbox__count"></span><button type="button" class="lightbox__close">[ Close ]</button></div>' +
        '<img alt="">' +
        '<button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Previous photo"><span>← Prev</span></button>' +
        '<button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Next photo"><span>Next →</span></button>';
      doc.body.appendChild(box);
      img = $('img', box);
      counter = $('.lightbox__count', box);
      $('.lightbox__close', box).addEventListener('click', close);
      $('.lightbox__nav--prev', box).addEventListener('click', function () { show(index - 1); });
      $('.lightbox__nav--next', box).addEventListener('click', function () { show(index + 1); });
      var startX = null;
      box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
        startX = null;
      });
    }
    items.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (!box) build();
        opener = a;
        box.hidden = false;
        doc.body.style.overflow = 'hidden';
        show(i);
        addEventListener('keydown', onKey);
        $('.lightbox__close', box).focus();
      });
    });
  });

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- contatti: scrivi email ----------
     Il link mailto apre il programma di posta solo se sul computer ce n'è uno configurato.
     Se la pagina resta in primo piano (cioè non si è aperto nulla) copiamo l'indirizzo e lo diciamo. */

  $$('[data-mail]').forEach(function (link) {
    link.addEventListener('click', function () {
      var email = link.getAttribute('data-mail');
      var status = $('.contact__status');
      var left = false;
      var onBlur = function () { left = true; };
      addEventListener('blur', onBlur);
      setTimeout(function () {
        removeEventListener('blur', onBlur);
        if (left || doc.hidden) return;
        var say = function (copied) {
          if (status) status.textContent = 'No mail app opened? ' + (copied ? 'The address ' + email + ' has been copied — paste it in your email, or use Gmail.' : 'Write to ' + email + ' or use the Gmail button.');
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(email).then(function () { say(true); }, function () { say(false); });
        else say(false);
      }, 900);
    });
  });

  /* ---------- contatti: copia email ---------- */

  $$('[data-copy]').forEach(function (btn) {
    var label = btn.textContent;
    var status = $('.contact__status');
    btn.addEventListener('click', function () {
      var email = btn.getAttribute('data-copy');
      var ok = function () {
        btn.textContent = 'Copied ✓';
        if (status) status.textContent = email + ' copied to clipboard';
        setTimeout(function () { btn.textContent = label; }, 2200);
      };
      var fallback = function () {
        var t = doc.createElement('textarea');
        t.value = email;
        t.style.position = 'fixed';
        t.style.opacity = '0';
        doc.body.appendChild(t);
        t.select();
        try { doc.execCommand('copy'); ok(); } catch (e) { if (status) status.textContent = email; }
        doc.body.removeChild(t);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(email).then(ok, fallback);
      else fallback();
    });
  });

  /* ---------- intro: la cinepresa ----------
     Sul monitor della cinepresa scorrono i lavori. Scorrendo (o da sola dopo un attimo)
     la ripresa entra nel monitor finché riempie lo schermo, poi si apre il sito.
     Scorrere verso l'alto la riporta indietro. [ Entra ] accelera la sequenza. */

  if (html.classList.contains('has-intro')) intro();

  function intro() {
    var covers = [];
    try { covers = JSON.parse($('#intro-data').textContent); } catch (e) {}
    var root = doc.body.getAttribute('data-root') || './';
    var it = (navigator.language || '').slice(0, 2).toLowerCase() === 'it';
    var T = it ? { enter: 'Entra', hint: 'Scorri' } : { enter: 'Enter', hint: 'Scroll' };
    // misure della foto (pixel): dimensioni, centro e ingombro dello schermo, proiezione del contenuto sullo schermo
    var CAM = { w: 995, h: 775, sx: 676.38, sy: 430.12, sw: 204.5, sh: 157.5,
      matrix: 'matrix3d(0.135828035,0.00206173661,0,1.02961268e-05,0.00212009839,0.17360975,0,2.7233121e-06,0,0,1,0,574,354.5,0,1)' };
    var big = covers.map(function (c) { return root + c.replace(/-800\.webp$/, '.webp'); });

    var el = doc.createElement('div');
    el.className = 'intro';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Intro');
    el.innerHTML =
      '<div class="intro__name"><span class="intro__first">Lorenzo</span><span class="intro__last">Mangini</span><span class="intro__role">Director · Director of Photography</span></div>' +
      '<div class="intro__cam" style="width:' + CAM.w + 'px;height:' + CAM.h + 'px">' +
        '<div class="intro__body" style="transform-origin:' + CAM.sx + 'px ' + CAM.sy + 'px">' +
          '<img class="intro__photo" src="' + root + 'assets/img/camera/cam.webp" alt="" decoding="async">' +
          '<div class="intro__screen" style="transform:' + CAM.matrix + '"><img alt=""><img alt="" class="is-next"><i></i></div>' +
        '</div>' +
      '</div>' +
      '<div class="intro__hud intro__hud--tl"><span class="intro__rec">Rec</span> <span class="intro__tc">00:00:00:00</span></div>' +
      '<div class="intro__hud intro__hud--tr">Frame <span class="intro__count">01</span>/' + pad(Math.max(1, covers.length)) + '</div>' +
      '<div class="intro__hud intro__hud--bl">25 fps · 1/50 · 4K</div>' +
      '<div class="intro__hud intro__hud--br"><span class="intro__pct">000</span>%</div>' +
      '<div class="intro__panel"><span class="intro__hint"><i></i>' + T.hint + '</span><button type="button" class="intro__enter">' + T.enter + ' →</button></div>' +
      '<div class="intro__progress"><i></i></div>';
    doc.body.appendChild(el);

    var cam = $('.intro__cam', el), body = $('.intro__body', el), name = $('.intro__name', el), photo = $('.intro__photo', el);
    var shots = $$('.intro__screen img', el);
    var pct = $('.intro__pct', el), tc = $('.intro__tc', el), count = $('.intro__count', el);

    // i lavori sul monitor: dissolvenza fra un fotogramma e il successivo
    var frameIdx = 0, front = 0;
    big.slice(0, 4).forEach(function (src) { new Image().src = src; });
    function showFrame() {
      if (!big.length) return;
      var next = shots[1 - front];
      next.src = big[frameIdx % big.length];
      next.classList.add('is-on');
      shots[front].classList.remove('is-on');
      front = 1 - front;
      count.textContent = pad((frameIdx % big.length) + 1);
      frameIdx++;
    }
    showFrame();
    var frameTimer = setInterval(showFrame, 900);

    var W, H, g = {}, p = 0, target = 0, done = false, finishing = false;
    var start = performance.now(), lastInput = start - 600, lastTick = start, raf;
    var mx = 0, my = 0, pmx = 0, pmy = 0;

    function layout() {
      W = innerWidth; H = innerHeight;
      var mobile = W < 720;
      // inquadratura iniziale: la cinepresa intera sotto il nome
      g.k0 = Math.min((W * (mobile ? 0.96 : 0.6)) / CAM.w, (H * (mobile ? 0.4 : 0.54)) / CAM.h);
      g.cx = W / 2; g.cy = H * (mobile ? 0.6 : 0.63);
      // inquadratura finale: lo schermo della cinepresa copre tutta la finestra
      g.k1 = Math.max(W / CAM.sw, H / CAM.sh) * 1.12;
      // posizione dello schermo nell'inquadratura iniziale
      g.px0 = g.cx + (CAM.sx - CAM.w / 2) * g.k0;
      g.py0 = g.cy + (CAM.sy - CAM.h / 2) * g.k0;
    }

    function ease(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
    function seg(a, b) { return Math.max(0, Math.min(1, (p - a) / (b - a))); }

    function render(now) {
      pmx += (mx - pmx) * 0.08; pmy += (my - pmy) * 0.08;
      var z = ease(seg(0.2, 0.92));            // avvicinamento allo schermo
      var zz = Math.pow(z, 1.6);
      var k = g.k0 * Math.pow(g.k1 / g.k0, zz);   // scala geometrica: velocità percepita costante
      var bob = Math.sin(now / 900) * 4 * (1 - z);
      var px = g.px0 + (W / 2 - g.px0) * zz;
      var py = g.py0 + (H / 2 - g.py0) * zz + bob;
      cam.style.transform = 'translate(' + (px - CAM.sx * k).toFixed(2) + 'px,' + (py - CAM.sy * k).toFixed(2) + 'px) scale(' + k.toFixed(5) + ')';
      // quando lo schermo riempie la finestra il corpo della cinepresa non si vede più: non serve disegnarlo
      photo.style.visibility = CAM.sw * k * 0.92 > W && CAM.sh * k * 0.92 > H ? 'hidden' : '';
      // leggera rotazione verso il cursore all'inizio; si raddrizza mentre si entra nel monitor
      var tilt = 1 - ease(seg(0.15, 0.5));
      body.style.transform = 'rotateY(' + (pmx * 9 * tilt).toFixed(2) + 'deg) rotateX(' + (-pmy * 5 * tilt).toFixed(2) + 'deg)';
      name.style.opacity = (1 - ease(seg(0.18, 0.42))).toFixed(3);
      name.style.transform = 'translateY(' + (-seg(0.18, 0.5) * 30).toFixed(1) + 'px)';
      // alla fine resta solo il fotogramma sullo schermo, che sfuma nel sito
      el.style.opacity = (1 - ease(seg(0.93, 1))).toFixed(3);
      if (p > 0.93 && html.classList.contains('has-intro')) { html.classList.remove('has-intro'); fit(); }
      if (p <= 0.93 && !done && !html.classList.contains('has-intro')) html.classList.add('has-intro');
      pct.textContent = ('00' + Math.round(p * 100)).slice(-3);
      el.style.setProperty('--p', p.toFixed(3));
    }

    function tick() {
      var now = performance.now();
      var dt = Math.min(400, now - lastTick);
      lastTick = now;
      var t = (now - start) / 1000;
      tc.textContent = '00:00:' + pad(Math.floor(t) % 60) + ':' + pad(Math.floor((t % 1) * 25));
      if (!done && now - lastInput > 900) target = Math.min(1, target + dt * (finishing ? 0.0016 : 0.00033));
      p += (target - p) * Math.min(1, dt * 0.009);
      if (Math.abs(target - p) < 0.0005) p = target;
      render(now);
      if (p >= 0.999 && !done) return close();
      raf = requestAnimationFrame(tick);
    }

    function nudge(amount) {
      if (done) return;
      lastInput = performance.now();
      el.classList.add('is-active');
      target = Math.max(0, Math.min(1, target + amount));
    }
    function onWheel(e) {
      e.preventDefault();
      nudge(Math.max(-240, Math.min(240, e.deltaY || e.deltaX)) / 620);
    }
    var touchY = null;
    function onTouchStart(e) { touchY = e.touches[0].clientY; }
    function onTouchMove(e) {
      if (touchY === null) return;
      e.preventDefault();
      var y = e.touches[0].clientY;
      nudge((touchY - y) / (H * 0.7));
      touchY = y;
    }
    function onPointer(e) { mx = (e.clientX / W - 0.5) * 2; my = (e.clientY / H - 0.5) * 2; }
    function onKey(e) {
      if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); finish(); }
      else if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); nudge(0.16); }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); nudge(-0.16); }
    }
    function finish() { finishing = true; lastInput = 0; el.classList.add('is-active'); }

    function close() {
      done = true;
      clearInterval(frameTimer);
      try { sessionStorage.setItem('lm-intro', '1'); } catch (e) {}
      removeEventListener('keydown', onKey);
      removeEventListener('resize', layout);
      html.classList.remove('has-intro');
      fit();
      cancelAnimationFrame(raf);
      if (el.parentNode) el.parentNode.removeChild(el);
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('pointermove', onPointer);
    $('.intro__enter', el).addEventListener('click', finish);
    addEventListener('keydown', onKey);
    addEventListener('resize', layout);
    layout();
    render(start);
    raf = requestAnimationFrame(tick);
  }
})();
