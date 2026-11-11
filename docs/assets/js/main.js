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

  /* ---------- intro: muovi il cursore (o scorri) per "esporre" la pellicola ---------- */

  if (html.classList.contains('has-intro')) intro();

  function intro() {
    var covers = [];
    try { covers = JSON.parse($('#intro-data').textContent); } catch (e) {}
    var root = doc.body.getAttribute('data-root') || './';
    var touch = !canHover;

    var el = doc.createElement('div');
    el.className = 'intro';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Intro');
    el.innerHTML =
      '<div class="intro__bar intro__bar--top"></div><div class="intro__bar intro__bar--bottom"></div>' +
      '<div class="intro__trail"></div>' +
      '<i class="intro__corner intro__corner--tl"></i><i class="intro__corner intro__corner--tr"></i>' +
      '<i class="intro__corner intro__corner--bl"></i><i class="intro__corner intro__corner--br"></i>' +
      '<div class="intro__cross"><span></span></div>' +
      '<div class="intro__center"><em>//site</em>\n[Lorenzo Mangini]\n         [#]Director &amp; DoP</div>' +
      '<div class="intro__hud intro__hud--tl">TC <span class="intro__tc">00:00:00:00</span></div>' +
      '<div class="intro__hud intro__hud--tr"><span class="intro__rec">Rec</span><br>Frame <span class="intro__count">00</span>/' + pad(covers.length) + '</div>' +
      '<div class="intro__hud intro__hud--bl"><span class="intro__hint">' + (touch ? 'Drag your finger to expose the film' : 'Move your cursor or scroll to expose the film') + '</span><br><button type="button" class="intro__skip">[ Skip intro ]</button></div>' +
      '<div class="intro__hud intro__hud--br">Exposure <span class="intro__pct">000</span>%<span class="intro__meter"><i></i></span></div>';
    doc.body.appendChild(el);

    var trail = $('.intro__trail', el);
    var cross = $('.intro__cross', el);
    var crossLabel = $('span', cross);
    var pct = $('.intro__pct', el);
    var meter = $('.intro__meter', el);
    var count = $('.intro__count', el);
    var tc = $('.intro__tc', el);
    var center = $('.intro__center', el);

    covers.slice(0, 6).forEach(function (src) { new Image().src = root + src; });

    var progress = 0, shown = 0, done = false;
    var last = null, sinceFrame = 0, next = 0;
    var start = performance.now(), lastInput = start, raf;
    var W = innerWidth, H = innerHeight;
    var pos = { x: W / 2, y: H / 2 };
    var need = Math.hypot(W, H) * (touch ? 1.1 : 1.7);
    var step = Math.max(70, Math.min(W, H) * 0.11);

    function spawn(x, y) {
      if (!covers.length) return;
      var img = doc.createElement('img');
      img.className = 'intro__frame';
      img.alt = '';
      img.src = root + covers[next % covers.length];
      next++;
      var w = Math.max(150, Math.min(330, W * 0.21));
      img.style.translate = (x - w / 2).toFixed(0) + 'px ' + (y - w * 9 / 32).toFixed(0) + 'px';
      img.style.rotate = ((Math.random() - 0.5) * 10).toFixed(1) + 'deg';
      img.addEventListener('animationend', function () { img.remove(); });
      trail.appendChild(img);
      if (trail.children.length > 16) trail.firstChild.remove();
      shown = Math.min(covers.length, shown + 1);
      count.textContent = pad(shown);
    }

    function add(amount) {
      if (done) return;
      progress = Math.min(100, progress + amount);
      var p = Math.round(progress);
      pct.textContent = (p < 10 ? '00' : p < 100 ? '0' : '') + p;
      meter.style.setProperty('--p', progress.toFixed(1));
      if (progress >= 100) finish(650);
    }

    function move(x, y, weight) {
      pos.x = x; pos.y = y;
      cross.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px)';
      crossLabel.textContent = 'X' + pad4(x) + ' Y' + pad4(y);
      if (last) {
        var d = Math.hypot(x - last.x, y - last.y);
        sinceFrame += d;
        add(d / need * 100 * (weight || 1));
        if (sinceFrame >= step) { sinceFrame = 0; spawn(x, y); }
      }
      last = { x: x, y: y };
    }
    function pad4(n) { n = Math.max(0, Math.round(n)); return ('000' + n).slice(-4); }

    function onPointer(e) { lastInput = performance.now(); move(e.clientX, e.clientY); }
    function onWheel(e) {
      e.preventDefault();
      lastInput = performance.now();
      var d = Math.min(240, Math.abs(e.deltaY) + Math.abs(e.deltaX));
      add(d / 26);
      sinceFrame += d;
      if (sinceFrame >= 110) {
        sinceFrame = 0;
        var a = next * 2.4, r = Math.min(W, H) * 0.26;
        spawn(pos.x + Math.cos(a) * r * 0.5, pos.y + Math.sin(a) * r * 0.5);
      }
    }
    function onKey(e) {
      if (e.key === 'Enter' || e.key === 'Escape') finish(0);
      else if (e.key === ' ' || e.key.indexOf('Arrow') === 0) {
        e.preventDefault();
        lastInput = performance.now();
        add(12);
        spawn(W * (0.2 + Math.random() * 0.6), H * (0.25 + Math.random() * 0.5));
      }
    }
    function onClick(e) {
      if (e.target.closest('.intro__skip')) return finish(0);
      if (!touch) finish(0);
    }

    function tick(now) {
      var t = (now - start) / 1000;
      var f = Math.floor((t % 1) * 25);
      tc.textContent = '00:00:' + pad(Math.floor(t) % 60) + ':' + pad(f);
      // Se nessuno tocca nulla per qualche secondo, l'intro si "espone" da sola.
      if (!done && now - lastInput > 5000) {
        var a = now / 520;
        var x = W / 2 + Math.cos(a) * W * 0.3;
        var y = H / 2 + Math.sin(a * 1.7) * H * 0.24;
        var keep = lastInput;
        move(x, y, 0.75);
        lastInput = keep;
      }
      raf = requestAnimationFrame(tick);
    }

    function finish(delay) {
      if (done) return;
      done = true;
      progress = 100;
      pct.textContent = '100';
      meter.style.setProperty('--p', 100);
      center.textContent = '[ Rolling ]';
      try { sessionStorage.setItem('lm-intro', '1'); } catch (e) {}
      removeEventListener('keydown', onKey);
      setTimeout(function () {
        html.classList.remove('has-intro');
        fit();
        el.classList.add('is-leaving');
        setTimeout(function () {
          cancelAnimationFrame(raf);
          el.remove();
          removeEventListener('resize', onResize);
        }, 1000);
      }, delay);
    }
    function onResize() { W = innerWidth; H = innerHeight; need = Math.hypot(W, H) * (touch ? 1.1 : 1.7); }

    el.addEventListener('pointermove', onPointer);
    el.addEventListener('pointerdown', function (e) { if (touch) { last = null; onPointer(e); } });
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('click', onClick);
    addEventListener('keydown', onKey);
    addEventListener('resize', onResize);
    raf = requestAnimationFrame(tick);
  }
})();
