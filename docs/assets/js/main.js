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
     Scorrendo (o trascinando, o da sola dopo un attimo) la cinepresa si gira di fronte,
     si entra nell'obiettivo, l'iride si apre sui lavori e attraverso l'obiettivo si arriva al sito.
     Scorrere verso l'alto la riporta indietro. [ Entra ] è sempre disponibile. */

  if (html.classList.contains('has-intro')) intro();

  function intro() {
    var covers = [];
    try { covers = JSON.parse($('#intro-data').textContent); } catch (e) {}
    var root = doc.body.getAttribute('data-root') || './';
    var touch = !canHover;
    var it = (navigator.language || '').slice(0, 2).toLowerCase() === 'it';
    var T = it ? { enter: 'Entra', hint: 'Scorri' } : { enter: 'Enter', hint: 'Scroll' };
    var NS = 'http://www.w3.org/2000/svg';
    // misure prese dalle immagini: monitor nella vista di tre quarti, obiettivo nella vista frontale (in %)
    var C34 = { ratio: 995 / 822, screen: [58.29, 43.67, 21.11, 19.22], clip: '0% 4.4%, 100% 0%, 99% 100%, 1% 98.7%' };
    var CF = { ratio: 905 / 960, lens: [44.69, 64.75, 18.57] };

    var el = doc.createElement('div');
    el.className = 'intro';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Intro');
    el.innerHTML =
      '<div class="intro__name"><span class="intro__first">Lorenzo</span><span class="intro__last">Mangini</span><span class="intro__role">Director · Director of Photography</span></div>' +
      '<div class="intro__stage">' +
        '<div class="intro__cam intro__cam--34"><img src="' + root + 'assets/img/camera/cam-34.webp" alt="" decoding="async">' +
          '<div class="intro__screen" style="left:' + C34.screen[0] + '%;top:' + C34.screen[1] + '%;width:' + C34.screen[2] + '%;height:' + C34.screen[3] + '%;clip-path:polygon(' + C34.clip + ')"><img alt=""></div></div>' +
        '<div class="intro__cam intro__cam--front"><img src="' + root + 'assets/img/camera/cam-front.webp" alt="" decoding="async"></div>' +
      '</div>' +
      '<svg class="intro__lens" viewBox="-100 -100 200 200" aria-hidden="true">' +
        '<defs>' +
          '<radialGradient id="ilBarrel" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#3a414b"/><stop offset=".55" stop-color="#14171c"/><stop offset="1" stop-color="#050607"/></radialGradient>' +
          '<radialGradient id="ilGlass" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#16202c"/><stop offset=".7" stop-color="#05080c"/><stop offset="1" stop-color="#000"/></radialGradient>' +
          '<linearGradient id="ilFlare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b26bff" stop-opacity=".55"/><stop offset=".5" stop-color="#3fd3a6" stop-opacity=".35"/><stop offset="1" stop-color="#ff6aa8" stop-opacity="0"/></linearGradient>' +
          '<clipPath id="ilClip"><circle r="74"/></clipPath>' +
        '</defs>' +
        '<circle r="100" fill="url(#ilBarrel)"/>' +
        '<circle r="99" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width=".8"/>' +
        '<circle r="91" fill="none" stroke="#262b33" stroke-width="7" stroke-dasharray="1.1 1.1"/>' +
        '<circle r="86.5" fill="none" stroke="#000" stroke-opacity=".7" stroke-width="2"/>' +
        '<circle r="82" fill="#0b0d10"/>' +
        '<circle r="81" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width=".6"/>' +
        '<g clip-path="url(#ilClip)">' +
          '<rect x="-74" y="-74" width="148" height="148" fill="url(#ilGlass)"/>' +
          '<image class="intro__shot" x="-74" y="-74" width="148" height="148" preserveAspectRatio="xMidYMid slice"/>' +
          '<g class="intro__iris"></g>' +
          '<path d="M-60,-30 A68,68 0 0 1 10,-66" fill="none" stroke="url(#ilFlare)" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M38,52 A66,66 0 0 1 -8,66" fill="none" stroke="#7cf2c8" stroke-opacity=".12" stroke-width="3" stroke-linecap="round"/>' +
          '<ellipse cx="-30" cy="-34" rx="16" ry="7" transform="rotate(-38 -30 -34)" fill="#fff" fill-opacity=".14"/>' +
        '</g>' +
        '<circle r="74" fill="none" stroke="#000" stroke-width="2.5"/>' +
      '</svg>' +
      '<div class="intro__hud intro__hud--tl"><span class="intro__rec">Rec</span> <span class="intro__tc">00:00:00:00</span></div>' +
      '<div class="intro__hud intro__hud--tr">Frame <span class="intro__count">01</span>/' + pad(Math.max(1, covers.length)) + '</div>' +
      '<div class="intro__hud intro__hud--bl">25 fps · 1/50 · <span class="intro__t">T16</span></div>' +
      '<div class="intro__hud intro__hud--br"><span class="intro__pct">000</span>%</div>' +
      '<div class="intro__panel"><span class="intro__hint"><i></i>' + T.hint + '</span><button type="button" class="intro__enter">' + T.enter + ' →</button></div>' +
      '<div class="intro__progress"><i></i></div>';
    doc.body.appendChild(el);

    var stage = $('.intro__stage', el), cam34 = $('.intro__cam--34', el), camF = $('.intro__cam--front', el);
    var name = $('.intro__name', el), lens = $('.intro__lens', el), iris = $('.intro__iris', el), shot = $('.intro__shot', el);
    var screenImg = $('.intro__screen img', el);
    var pct = $('.intro__pct', el), tc = $('.intro__tc', el), count = $('.intro__count', el), tstop = $('.intro__t', el);
    var BLADES = 9, blades = [];
    for (var b = 0; b < BLADES; b++) {
      var pth = doc.createElementNS(NS, 'path');
      pth.setAttribute('fill', '#111317');
      pth.setAttribute('stroke', '#5b6573');
      pth.setAttribute('stroke-opacity', '.35');
      pth.setAttribute('stroke-width', '.6');
      iris.appendChild(pth);
      blades.push(pth);
    }

    // i fotogrammi dei lavori: sul monitor della cinepresa e dentro l'obiettivo
    var frameIdx = 0;
    covers.slice(0, 6).forEach(function (src) { new Image().src = root + src; });
    function showFrame() {
      if (!covers.length) return;
      var src = root + covers[frameIdx % covers.length];
      screenImg.src = src;
      shot.setAttribute('href', src);
      count.textContent = pad((frameIdx % covers.length) + 1);
      frameIdx++;
    }
    showFrame();
    var frameTimer = setInterval(showFrame, 650);

    var W, H, box = {}, p = 0, target = 0, done = false, revealed = false;
    var start = performance.now(), lastInput = start - 600, lastTick = start, raf, mx = 0, my = 0, pmx = 0, pmy = 0;
    var finishing = false;

    function layout() {
      W = innerWidth; H = innerHeight;
      // la cinepresa di tre quarti occupa al massimo il 62% della larghezza e il 52% dell'altezza
      var h34 = Math.min(H * (W < 720 ? 0.36 : 0.52), (W * (W < 720 ? 0.94 : 0.62)) / C34.ratio);
      box.w34 = h34 * C34.ratio; box.h34 = h34;
      box.cx = W / 2; box.cy = H * (W < 720 ? 0.56 : 0.6);
      // vista frontale: alta come quella di tre quarti
      box.hF = h34 * 1.02; box.wF = box.hF * CF.ratio;
      cam34.style.width = box.w34 + 'px'; cam34.style.height = box.h34 + 'px';
      camF.style.width = box.wF + 'px'; camF.style.height = box.hF + 'px';
      // obiettivo della vista frontale, in pixel rispetto al centro del palco
      box.lx = (CF.lens[0] / 100 - 0.5) * box.wF;
      box.ly = (CF.lens[1] / 100 - 0.5) * box.hF;
      box.lr = (CF.lens[2] / 100) * box.wF;
      box.far = Math.hypot(W, H) * 0.62;
      stage.style.top = box.cy + 'px';
    }

    function ease(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
    function seg(a, b) { return Math.max(0, Math.min(1, (p - a) / (b - a))); }

    function drawIris(open) {
      var r = 74 * open, L = 220, n = BLADES, tan = Math.tan(Math.PI / n);
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 + open * 0.9;
        var ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
        var t0 = -r * tan - 2;
        var pts = [
          [r * ux + t0 * vx, r * uy + t0 * vy],
          [r * ux + L * vx, r * uy + L * vy],
          [(r + L) * ux + L * vx, (r + L) * uy + L * vy],
          [(r + L) * ux + t0 * vx, (r + L) * uy + t0 * vy]
        ];
        blades[i].setAttribute('d', 'M' + pts.map(function (q) { return q[0].toFixed(2) + ',' + q[1].toFixed(2); }).join('L') + 'Z');
      }
    }

    function render(now) {
      // 1) eroe: cinepresa di tre quarti che segue il cursore
      pmx += (mx - pmx) * 0.08; pmy += (my - pmy) * 0.08;
      var turn = ease(seg(0.22, 0.46));
      var zoom = ease(seg(0.44, 0.86));
      var open = ease(seg(0.56, 0.84));
      var reveal = ease(seg(0.82, 1));
      var bob = Math.sin(now / 900) * 4 * (1 - turn);

      cam34.style.opacity = (1 - turn).toFixed(3);
      cam34.style.transform = 'translate(-50%,-50%) translate(' + (turn * box.w34 * 0.18) + 'px,' + bob + 'px) rotateY(' + (pmx * 10 + turn * 38).toFixed(2) + 'deg) rotateX(' + (-pmy * 6).toFixed(2) + 'deg) scale(' + (1 + turn * 0.08) + ')';
      cam34.style.filter = turn > 0.01 ? 'blur(' + (turn * 6).toFixed(1) + 'px)' : '';

      // 2) di fronte, poi zoom centrato sull'obiettivo
      var s = 1 + Math.pow(zoom, 2.2) * (box.far / box.lr - 1);
      var ox = -box.lx * zoom, oy = (H / 2 - box.cy - box.ly) * zoom; // l'obiettivo va al centro dello schermo
      camF.style.opacity = (turn * (1 - ease((zoom - 0.35) / 0.3))).toFixed(3);
      camF.style.transformOrigin = (CF.lens[0]) + '% ' + (CF.lens[1]) + '%';
      camF.style.transform = 'translate(-50%,-50%) translate(' + ((1 - turn) * -box.w34 * 0.12 + ox) + 'px,' + (oy + bob) + 'px) rotateY(' + ((1 - turn) * -34 + pmx * 4 * (1 - zoom)).toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
      camF.style.filter = turn < 0.99 ? 'blur(' + ((1 - turn) * 5).toFixed(1) + 'px)' : '';

      // 3) l'obiettivo vettoriale prende il posto della foto, nitido a qualsiasi ingrandimento
      var lr = box.lr * s; // raggio esterno dell'obiettivo sullo schermo (il centro resta fermo: lo zoom parte da lì)
      var lcx = box.cx + (1 - turn) * -box.w34 * 0.12 + ox + box.lx;
      var lcy = box.cy + oy + bob + box.ly;
      var lensOn = ease((zoom - 0.12) / 0.3);
      lens.style.opacity = lensOn.toFixed(3);
      lens.style.width = lens.style.height = (lr * 2) + 'px'; // il bordo (r=100) coincide con l'obiettivo della foto
      lens.style.transform = 'translate(' + (lcx - lr) + 'px,' + (lcy - lr) + 'px)';
      drawIris(0.03 + open * 1.05);
      tstop.textContent = 'T' + (16 - open * 14.5).toFixed(1).replace('.0', '');

      name.style.opacity = (1 - ease(seg(0.3, 0.55))).toFixed(3);
      name.style.transform = 'translateY(' + (-seg(0.3, 0.6) * 30) + 'px)';

      // 4) attraverso l'apertura si vede il sito
      if (reveal > 0 && !revealed) { revealed = true; html.classList.remove('has-intro'); fit(); }
      if (reveal <= 0 && revealed && !done) { revealed = false; html.classList.add('has-intro'); }
      if (revealed) {
        var hole = Math.max(lr * 0.74 * open, 1) * (1 + reveal * 3) + reveal * Math.hypot(W, H);
        var m = 'radial-gradient(circle at ' + lcx.toFixed(1) + 'px ' + lcy.toFixed(1) + 'px, transparent ' + hole.toFixed(1) + 'px, #000 ' + (hole + 1.5).toFixed(1) + 'px)';
        el.style.webkitMaskImage = el.style.maskImage = m;
        shot.style.opacity = (1 - reveal * 1.4).toFixed(3);
      } else {
        el.style.webkitMaskImage = el.style.maskImage = '';
        shot.style.opacity = '';
      }

      var v = Math.round(p * 100);
      pct.textContent = ('00' + v).slice(-3);
      el.style.setProperty('--p', p.toFixed(3));
    }

    function tick() {
      var now = performance.now();
      var dt = Math.min(100, now - lastTick);
      lastTick = now;
      var t = (now - start) / 1000;
      tc.textContent = '00:00:' + pad(Math.floor(t) % 60) + ':' + pad(Math.floor((t % 1) * 25));
      // senza input per un attimo la ripresa prosegue da sola (circa 3,5 secondi in tutto)
      if (!done && now - lastInput > 900) target = Math.min(1, target + dt * (finishing ? 0.0016 : 0.00032));
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
      var d = Math.max(-240, Math.min(240, e.deltaY || e.deltaX));
      nudge(d / 620);
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
    function onPointer(e) {
      mx = (e.clientX / W - 0.5) * 2;
      my = (e.clientY / H - 0.5) * 2;
    }
    function onKey(e) {
      if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); finish(); }
      else if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); nudge(0.16); }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); nudge(-0.16); }
    }
    // [ Entra ]: la sequenza non viene tagliata, viene solo accelerata
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
