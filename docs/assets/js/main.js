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
        var show = f === 'all' || card.getAttribute('data-category') === f;
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

  /* ---------- rilievo 3D disegnato a caratteri (intro e footer) ----------
     Una superficie 3D resa riga per riga con caratteri monospace: - _ / \ | ^
     Niente librerie: un canvas e un po' di trigonometria. */

  function makeTerrain(canvas, opt) {
    opt = opt || {};
    var ctx = canvas.getContext('2d');
    var css = getComputedStyle(html);
    var colA = css.getPropertyValue('--accent').trim() || '#f1e9d6';
    var colH = css.getPropertyValue('--hi').trim() || '#8fb3ff';
    var GLYPH = '01<>[]{}=+*#%$&@/\\';
    var W = 0, H = 0, fs, cw, ch, cols, yMin, ys, hs;

    function hash(i, j) { var x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return x - Math.floor(x); }
    function vnoise(x, y) {
      var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      var a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    }
    function height(x, z) {
      var m = Math.exp(-(x * x * 2.6 + z * z * 4.2)) +
        0.55 * Math.exp(-((x - 0.62) * (x - 0.62) * 6 + (z + 0.12) * (z + 0.12) * 8)) +
        0.45 * Math.exp(-((x + 0.66) * (x + 0.66) * 5 + (z - 0.1) * (z - 0.1) * 7));
      var n = 0, a = 0.5, f = 2.2;
      for (var o = 0; o < 3; o++) { n += (1 - Math.abs(vnoise(x * f + 17, z * f + 5) * 2 - 1)) * a; a *= 0.5; f *= 2.1; }
      return m * (0.7 + 0.55 * n) + n * 0.07;
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fs = opt.fontSize || (W < 720 ? 11 : 13);
      ctx.font = fs + 'px "JetBrains Mono", ui-monospace, Menlo, monospace';
      ctx.textBaseline = 'top';
      cw = ctx.measureText('M').width || fs * 0.6;
      ch = Math.round(fs * 1.3);
      cols = Math.ceil(W / cw) + 2;
      yMin = new Float32Array(cols); ys = new Float32Array(cols); hs = new Float32Array(cols);
    }

    // p: 0→1 quanto è "cresciuto" il rilievo; yaw: rotazione; glitch: 0→1 disturbo dei caratteri
    function draw(p, yaw, tilt, glitch, alpha) {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      var NZ = opt.rows || (W < 720 ? 34 : 46);
      var scale = opt.scale ? opt.scale(W, H) : Math.max(W * 0.62, Math.min(W * 1.25, H * 0.62));
      var camH = (opt.camH || 0.66) + (tilt || 0) * 0.1;
      var amp = (opt.amp || 0.74) * (0.14 + 0.86 * (1 - Math.pow(1 - p, 3)));
      var horizon = H * (opt.front || 0.9) - camH * scale * 0.9;
      var cs = Math.cos(yaw), sn = Math.sin(yaw);
      var cx = W / 2, c, k;
      for (c = 0; c < cols; c++) yMin[c] = 1e9;
      var noise = (1 - p) * 0.1 + (glitch || 0) * 0.5;
      var lastFill = '';
      for (k = 0; k < NZ; k++) {
        var v = k / (NZ - 1), d = 1 + v * 2.4, zc = (v - 0.42) * 1.5;
        for (c = 0; c < cols; c++) {
          var u = ((c + 0.5) * cw - cx) * d / scale;
          var h = height(u * cs - zc * sn, u * sn + zc * cs);
          hs[c] = h;
          ys[c] = horizon + (camH - h * amp) * scale / d * 0.9;
        }
        var rowAlpha = (alpha == null ? 1 : alpha) * (1 - v * 0.6) * (0.55 + 0.45 * p);
        for (c = 1; c < cols - 1; c++) {
          var y = ys[c];
          if (y >= yMin[c] - 1 || y < -ch || y > H) continue;
          // il piano attorno al rilievo resta una trama rada di punti; i bordi sfumano
          var lift = hs[c] * amp, edge = Math.abs((c * cw - cx) / (W * 0.5));
          var a = rowAlpha * (1 - Math.pow(Math.min(1, edge), 3) * 0.85);
          if (lift < 0.075) {
            if ((c + k) % 3) continue;
            ctx.globalAlpha = a * 0.6;
            if (lastFill !== colA) { ctx.fillStyle = colA; lastFill = colA; }
            ctx.fillText(noise > 0 && Math.random() < noise ? GLYPH.charAt((Math.random() * GLYPH.length) | 0) : '.', c * cw, Math.floor(y / ch) * ch);
            continue;
          }
          ctx.globalAlpha = a;
          var yl = ys[c - 1], yr = ys[c + 1];
          var slope = (yl - yr) / (2 * cw), s = Math.abs(slope);
          var row = Math.floor(y / ch), frac = y / ch - row;
          var chr = s < 0.2 ? (frac < 0.5 ? '-' : '_') : s > 2.4 ? '|' : slope > 0 ? '/' : '\\';
          if (y < yl - 0.4 && y < yr - 0.4 && hs[c] * amp > 0.3) chr = '^';
          if (noise > 0 && Math.random() < noise) chr = GLYPH.charAt((Math.random() * GLYPH.length) | 0);
          var fill = hs[c] * amp > 0.5 ? colH : colA;
          if (fill !== lastFill) { ctx.fillStyle = fill; lastFill = fill; }
          ctx.fillText(chr, c * cw, row * ch);
          // sulle pareti ripide riempie il salto verticale fino alla colonna successiva
          var row2 = Math.floor(yr / ch);
          if (Math.abs(row2 - row) > 1) {
            var from = Math.min(row, row2) + 1, to = Math.max(row, row2);
            for (var r = from; r < to; r++) if (r * ch < yMin[c] - 1) ctx.fillText('|', c * cw, r * ch);
          }
        }
        for (c = 0; c < cols; c++) if (ys[c] < yMin[c]) yMin[c] = ys[c];
      }
      ctx.globalAlpha = 1;
    }

    resize();
    return { draw: draw, resize: resize, ctx: ctx, cell: function () { return { cw: cw, ch: ch, W: W, H: H }; } };
  }

  // Striscia nel footer di ogni pagina: lo stesso rilievo, piccolo, che ruota lentamente.
  $$('[data-terrain]').forEach(function (canvas) {
    var t = makeTerrain(canvas, {
      rows: 18, fontSize: 11, camH: 0.42, amp: 0.5, front: 1.0,
      scale: function (W, H) { return H * 2.5; }
    });
    var visible = false, last = 0;
    function frame(now) {
      if (!visible) return;
      if (now - last > 66) { last = now; t.draw(1, Math.sin(now / 9000) * 0.7, 0, 0, 0.6); }
      requestAnimationFrame(frame);
    }
    function once() { t.resize(); t.draw(1, 0.3, 0, 0, 0.6); }
    addEventListener('resize', once);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(once);
    if (reduced || !('IntersectionObserver' in window)) { once(); return; }
    new IntersectionObserver(function (en) {
      var was = visible;
      visible = en[0].isIntersecting;
      if (visible && !was) requestAnimationFrame(frame);
    }).observe(canvas);
  });

  /* ---------- intro: muovendo il cursore (o scorrendo) il rilievo prende forma ----------
     I fotogrammi dei lavori compaiono lungo il percorso del cursore, resi a caratteri.
     [ Enter ] è sempre disponibile; senza input l'intro si completa da sola in pochi secondi. */

  if (html.classList.contains('has-intro')) intro();

  function intro() {
    var covers = [];
    try { covers = JSON.parse($('#intro-data').textContent); } catch (e) {}
    var root = doc.body.getAttribute('data-root') || './';
    var touch = !canHover;
    var it = (navigator.language || '').slice(0, 2).toLowerCase() === 'it';
    var T = it ? { enter: 'Entra', hint: touch ? 'trascina' : 'muovi · scorri' } : { enter: 'Enter', hint: touch ? 'drag' : 'move · scroll' };

    var el = doc.createElement('div');
    el.className = 'intro';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Intro');
    el.innerHTML =
      '<canvas class="intro__canvas"></canvas>' +
      '<div class="intro__hud intro__hud--tl">Lorenzo Mangini</div>' +
      '<div class="intro__hud intro__hud--tr">Director / Director of Photography</div>' +
      '<div class="intro__hud intro__hud--bl"><span class="intro__xy">x0000 y0000</span></div>' +
      '<div class="intro__hud intro__hud--br"><span class="intro__bar"></span> <span class="intro__pct">000</span>%</div>' +
      '<div class="intro__panel"><button type="button" class="intro__enter">[ ' + T.enter + ' ]</button><span class="intro__hint">' + T.hint + '<i>_</i></span></div>';
    doc.body.appendChild(el);

    var canvas = $('.intro__canvas', el);
    var terrain = makeTerrain(canvas, {});
    var ctx = terrain.ctx;
    var pct = $('.intro__pct', el), bar = $('.intro__bar', el), xy = $('.intro__xy', el);
    var BG = getComputedStyle(html).getPropertyValue('--bg').trim() || '#0b1322';
    var RAMP = ' .:-=+*x#%';

    var imgs = covers.map(function (src, i) {
      var im = new Image();
      if (i < 8) im.src = root + src; else setTimeout(function () { im.src = root + src; }, 600);
      return im;
    });
    var off = doc.createElement('canvas');
    var offCtx = off.getContext('2d', { willReadFrequently: true });
    var frames = [];

    var progress = 0, done = false, leaveAt = 0;
    var last = null, sinceFrame = 0, next = 0;
    var lastInput = performance.now(), lastTick = lastInput, lastDraw = 0, raf;
    var W = innerWidth, H = innerHeight;
    var yaw = 0.35, yawTo = 0.35, tilt = 0, tiltTo = 0;
    var need = Math.hypot(W, H) * (touch ? 0.55 : 0.9);
    var step = Math.max(150, Math.min(W, H) * 0.32);

    // Un fotogramma diventa una griglia di caratteri: più il punto è luminoso, più il carattere è "pieno".
    function spawn(x, y) {
      var im = imgs[next % imgs.length];
      next++;
      if (!im || !im.complete || !im.naturalWidth) return;
      var cell = terrain.cell();
      var fw = W < 720 ? 30 : 44, fh = Math.round(fw * (9 / 16) * (cell.cw / cell.ch));
      off.width = fw; off.height = fh;
      try {
        offCtx.drawImage(im, 0, 0, fw, fh);
        var data = offCtx.getImageData(0, 0, fw, fh).data;
      } catch (e) { return; }
      var cells = [], mean = 0, i;
      for (i = 0; i < fw * fh; i++) mean += (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
      mean /= fw * fh;
      for (i = 0; i < fw * fh; i++) {
        var r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
        var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (mean > 0.55) lum = 1 - lum; // immagini molto chiare: si disegnano le parti scure, non un blocco pieno
        var idx = Math.min(RAMP.length - 1, Math.floor(Math.pow(lum, 1.15) * RAMP.length));
        cells.push(RAMP.charAt(idx), 'rgb(' + Math.min(255, (r * 0.7 + 78) | 0) + ',' + Math.min(255, (g * 0.7 + 78) | 0) + ',' + Math.min(255, (b * 0.7 + 82) | 0) + ')');
      }
      var c0 = Math.round(x / cell.cw - fw / 2), r0 = Math.round(y / cell.ch - fh / 2);
      c0 = Math.max(1, Math.min(Math.floor(W / cell.cw) - fw - 1, c0));
      r0 = Math.max(3, Math.min(Math.floor(H / cell.ch) - fh - 5, r0));
      frames.push({ c0: c0, r0: r0, w: fw, h: fh, cells: cells, born: performance.now() });
      if (frames.length > 2) frames.shift();
    }

    function drawFrames(now) {
      var cell = terrain.cell();
      for (var n = 0; n < frames.length; n++) {
        var f = frames[n], age = now - f.born, LIFE = 1500;
        if (age > LIFE) { frames.splice(n--, 1); continue; }
        var a = age < 160 ? age / 160 : age > LIFE - 420 ? (LIFE - age) / 420 : 1;
        var scramble = age < 260 ? 1 - age / 260 : age > LIFE - 300 ? 1 - (LIFE - age) / 300 : 0;
        ctx.globalAlpha = Math.min(1, a * 1.2);
        ctx.fillStyle = BG;
        ctx.fillRect((f.c0 - 1) * cell.cw, (f.r0 - 0.5) * cell.ch, (f.w + 2) * cell.cw, (f.h + 1) * cell.ch);
        ctx.globalAlpha = a;
        for (var i = 0; i < f.w * f.h; i++) {
          var chr = f.cells[i * 2];
          if (scramble > 0 && Math.random() < scramble * 0.6) chr = RAMP.charAt((Math.random() * RAMP.length) | 0);
          if (chr === ' ') continue;
          ctx.fillStyle = f.cells[i * 2 + 1];
          ctx.fillText(chr, (f.c0 + (i % f.w)) * cell.cw, (f.r0 + ((i / f.w) | 0)) * cell.ch);
        }
      }
      ctx.globalAlpha = 1;
    }

    function pad4(n) { return ('000' + Math.max(0, Math.round(n))).slice(-4); }
    function hud() {
      var p = Math.round(progress), N = touch ? 14 : 24, on = Math.round(progress / 100 * N), s = '';
      for (var i = 0; i < N; i++) s += i < on ? '#' : '.';
      pct.textContent = ('00' + p).slice(-3);
      bar.textContent = '[' + s + ']';
    }

    function add(amount) {
      if (done) return;
      progress = Math.min(100, progress + amount);
      hud();
      if (progress >= 100) finish(450);
    }

    function move(x, y) {
      yawTo = (x / W - 0.5) * 1.5;
      tiltTo = (y / H - 0.5) * 2;
      xy.textContent = 'x' + pad4(x) + ' y' + pad4(y);
      if (last) {
        var dist = Math.hypot(x - last.x, y - last.y);
        sinceFrame += dist;
        add(dist / need * 100);
        if (sinceFrame >= step) { sinceFrame = 0; spawn(x, y); }
      }
      last = { x: x, y: y };
    }

    function onPointer(e) { lastInput = performance.now(); el.classList.add('is-active'); move(e.clientX, e.clientY); }
    function onWheel(e) {
      e.preventDefault();
      lastInput = performance.now();
      el.classList.add('is-active');
      var d = Math.min(240, Math.abs(e.deltaY) + Math.abs(e.deltaX));
      add(d / 5.5);
      yawTo += (e.deltaY > 0 ? 1 : -1) * d / 900;
      sinceFrame += d;
      if (sinceFrame >= 120) { sinceFrame = 0; spawn(W * (0.2 + Math.random() * 0.6), H * (0.3 + Math.random() * 0.35)); }
    }
    function onKey(e) {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') { e.preventDefault(); finish(0); }
      else if (e.key.indexOf('Arrow') === 0) { e.preventDefault(); lastInput = performance.now(); add(25); yawTo += e.key === 'ArrowLeft' ? -0.3 : 0.3; }
    }

    function tick() {
      var now = performance.now();
      var dt = Math.min(300, now - lastTick);
      lastTick = now;
      // Senza input per un attimo: il rilievo si completa da solo, ruotando.
      if (!done && now - lastInput > 1200) {
        add(dt * 0.045);
        yawTo += dt * 0.00035;
        sinceFrame += dt * 0.45;
        if (sinceFrame >= step) { sinceFrame = 0; spawn(W * (0.5 + Math.cos(now / 500) * 0.26), H * (0.45 + Math.sin(now / 330) * 0.14)); }
      }
      yaw += (yawTo - yaw) * Math.min(1, dt * 0.006);
      tilt += (tiltTo - tilt) * Math.min(1, dt * 0.006);
      if (now - lastDraw > 30) {
        lastDraw = now;
        var glitch = leaveAt ? Math.min(1, (now - leaveAt) / 500) : 0;
        terrain.draw(progress / 100, yaw, tilt, glitch, 1 - glitch * 0.6);
        drawFrames(now);
      }
      raf = requestAnimationFrame(tick);
    }

    function finish(delay) {
      if (done) return;
      done = true;
      progress = 100;
      hud();
      try { sessionStorage.setItem('lm-intro', '1'); } catch (e) {}
      removeEventListener('keydown', onKey);
      setTimeout(function () {
        leaveAt = performance.now();
        html.classList.remove('has-intro');
        fit();
        el.classList.add('is-leaving');
        setTimeout(function () {
          cancelAnimationFrame(raf);
          if (el.parentNode) el.parentNode.removeChild(el);
          removeEventListener('resize', onResize);
        }, 750);
      }, delay);
    }
    function onResize() { W = innerWidth; H = innerHeight; need = Math.hypot(W, H) * (touch ? 0.55 : 0.9); terrain.resize(); }

    el.addEventListener('pointermove', onPointer);
    el.addEventListener('pointerdown', function (e) { if (touch) { last = null; onPointer(e); } });
    el.addEventListener('wheel', onWheel, { passive: false });
    $('.intro__enter', el).addEventListener('click', function () { finish(0); });
    addEventListener('keydown', onKey);
    addEventListener('resize', onResize);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { terrain.resize(); });
    hud();
    raf = requestAnimationFrame(tick);
  }
})();
