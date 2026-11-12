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

    // loghi: velocità costante (pixel al secondo), così tutte le collaborazioni passano in pochi secondi
    var mq = $('.marquee__track', page);
    function mqSpeed() {
      if (!mq) return;
      mq.style.setProperty('--mq-dur', Math.max(8, mq.scrollWidth / 2 / (innerWidth < 720 ? 70 : 110)).toFixed(1) + 's');
    }
    mqSpeed();
    addEventListener('resize', mqSpeed);
    if (mq) $$('img', mq).forEach(function (im) { if (!im.complete) im.addEventListener('load', mqSpeed); });

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

  /* ---------- intro: la cinepresa 3D ----------
     Scorrendo (o da sola dopo un attimo) la cinepresa si gira di fronte, la ripresa entra nell'obiettivo,
     l'iride si apre su un lavoro e attraverso l'apertura compare il sito.
     Il modello 3D si carica solo qui (assets/js/intro3d.js). Scorrere verso l'alto torna indietro. */

  if (html.classList.contains('has-intro')) intro();

  function intro() {
    var covers = [];
    try { covers = JSON.parse($('#intro-data').textContent); } catch (e) {}
    var root = doc.body.getAttribute('data-root') || './';
    var it = (navigator.language || '').slice(0, 2).toLowerCase() === 'it';
    var T = it ? { enter: 'Entra', hint: 'Scorri' } : { enter: 'Enter', hint: 'Scroll' };
    // per il monitor della cinepresa bastano le copertine piccole
    var big = covers.map(function (c) { return root + c; });

    var el = doc.createElement('div');
    el.className = 'intro is-loading';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Intro');
    el.innerHTML =
      '<canvas class="intro__gl" aria-hidden="true"></canvas>' +
      '<div class="intro__name"><span class="intro__first">Lorenzo</span><span class="intro__last">Mangini</span><span class="intro__role">Director · Director of Photography</span></div>' +
      '<div class="intro__hud intro__hud--tl"><span class="intro__rec">Rec</span> <span class="intro__tc">00:00:00:00</span></div>' +
      '<div class="intro__hud intro__hud--tr">Frame <span class="intro__count">01</span>/' + pad(Math.max(1, covers.length)) + '</div>' +
      '<div class="intro__hud intro__hud--bl">25 fps · 1/50 · <span class="intro__t">T16</span></div>' +
      '<div class="intro__hud intro__hud--br"><span class="intro__pct">000</span>%</div>' +
      '<div class="intro__panel"><span class="intro__hint"><i></i>' + T.hint + '</span><button type="button" class="intro__enter">' + T.enter + ' →</button></div>' +
      '<div class="intro__progress"><i></i></div>';
    doc.body.appendChild(el);

    var gl = $('.intro__gl', el), name = $('.intro__name', el);
    var pct = $('.intro__pct', el), tc = $('.intro__tc', el), count = $('.intro__count', el), tstop = $('.intro__t', el);
    var api = null, done = false, finishing = false, revealed = false;
    var p = 0, target = 0, start = performance.now(), lastInput = start, lastTick = start, raf;
    var W = innerWidth, H = innerHeight, mx = 0, my = 0, pmx = 0, pmy = 0;
    var frameIdx = 0, frameTimer = null;
    // per controllare un singolo momento della sequenza: ?introp=0.6 la ferma a quel punto
    var freeze = /[?&]introp=([\d.]+)/.exec(location.search);
    if (freeze) { p = target = Math.min(0.999, parseFloat(freeze[1])); }

    function nextFrame() {
      if (!api || !big.length) return;
      frameIdx = (frameIdx + 1) % Math.min(6, big.length);
      api.setFrame(frameIdx);
      count.textContent = pad(frameIdx + 1);
    }

    function ease(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
    function seg(a, b) { return Math.max(0, Math.min(1, (p - a) / (b - a))); }

    function tick() {
      var now = performance.now();
      var dt = Math.min(400, now - lastTick);
      lastTick = now;
      var t = (now - start) / 1000;
      tc.textContent = '00:00:' + pad(Math.floor(t) % 60) + ':' + pad(Math.floor((t % 1) * 25));
      if (api) {
        // senza input per un attimo la sequenza prosegue da sola (circa 3,5 secondi in tutto)
        if (!done && !freeze && now - lastInput > 900) target = Math.min(1, target + dt * (finishing ? 0.0016 : 0.00033));
        p += (target - p) * Math.min(1, dt * 0.009);
        if (Math.abs(target - p) < 0.0005) p = target;
        pmx += (mx - pmx) * 0.06; pmy += (my - pmy) * 0.06;
        var ap = api.render(p, pmx, pmy, now);
        // quando l'iride si ferma su un lavoro, smette di cambiare fotogramma
        if (p > 0.55 && frameTimer) { clearInterval(frameTimer); frameTimer = null; }
        name.style.opacity = (1 - ease(seg(0.18, 0.42))).toFixed(3);
        name.style.transform = 'translateY(' + (-seg(0.18, 0.5) * 30).toFixed(1) + 'px)';
        tstop.textContent = 'T' + (16 - api.open * 14.5).toFixed(1).replace('.0', '');
        // l'iride si apre direttamente sul sito vero (che sta sotto l'intro), poi l'apertura si allarga a tutto schermo
        var reveal = ease(seg(0.86, 1));
        if (p > 0.6) {
          if (!revealed) { revealed = true; html.classList.remove('has-intro'); fit(); }
          var hole = ap.r * (1 + reveal * 2) + reveal * Math.hypot(W, H);
          var m = 'radial-gradient(circle at ' + ap.x.toFixed(1) + 'px ' + ap.y.toFixed(1) + 'px, transparent ' + hole.toFixed(1) + 'px, #000 ' + (hole + 1.5).toFixed(1) + 'px)';
          el.style.webkitMaskImage = el.style.maskImage = m;
        } else if (revealed) {
          revealed = false; html.classList.add('has-intro');
          el.style.webkitMaskImage = el.style.maskImage = '';
        }
        if (p > 0.12) el.classList.add('is-active');
        pct.textContent = ('00' + Math.round(p * 100)).slice(-3);
        el.style.setProperty('--p', p.toFixed(3));
        if (p >= 0.999 && !done) return close();
      }
      raf = requestAnimationFrame(tick);
    }

    function nudge(amount) {
      if (done) return;
      lastInput = performance.now();
      el.classList.add('is-active');
      target = Math.max(0, Math.min(1, target + amount));
    }
    function onWheel(e) { e.preventDefault(); nudge(Math.max(-240, Math.min(240, e.deltaY || e.deltaX)) / 620); }
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
    function finish() { if (!api) return close(); finishing = true; lastInput = 0; el.classList.add('is-active'); }
    function onResize() { W = innerWidth; H = innerHeight; if (api) api.resize(); }

    function close() {
      done = true;
      if (frameTimer) clearInterval(frameTimer);
      try { sessionStorage.setItem('lm-intro', '1'); } catch (e) {}
      removeEventListener('keydown', onKey);
      removeEventListener('resize', onResize);
      html.classList.remove('has-intro');
      fit();
      cancelAnimationFrame(raf);
      if (api) api.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('pointermove', onPointer);
    $('.intro__enter', el).addEventListener('click', finish);
    addEventListener('keydown', onKey);
    addEventListener('resize', onResize);
    raf = requestAnimationFrame(tick);

    // se il 3D non si può caricare (browser vecchio, niente WebGL, errore di rete) si entra subito nel sito
    var giveUp = setTimeout(close, 8000);
    // l'indirizzo va reso assoluto: import() lo risolverebbe rispetto alla cartella di main.js
    import(new URL(root + 'assets/js/intro3d.js', location.href).href)
      .then(function (m) { return m.createCamera(gl, { covers: big }); })
      .then(function (a) {
        clearTimeout(giveUp);
        if (done) return a.dispose();
        api = a;
        el.classList.remove('is-loading');
        start = lastInput = lastTick = performance.now();
        frameTimer = setInterval(nextFrame, 900);
      })
      .catch(function (err) { if (window.console) console.warn('intro 3D non disponibile:', err); clearTimeout(giveUp); close(); });
  }
})();
