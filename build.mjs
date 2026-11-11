#!/usr/bin/env node
// Generatore del sito: legge content/site.json e scrive le pagine HTML in docs/.
// Nessuna dipendenza: basta `node build.mjs`.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'docs');
const data = JSON.parse(readFileSync(join(ROOT, 'content/site.json'), 'utf8'));
const { site, projects } = data;

/* ---------- scorciatoie per chi compila site.json a mano ----------
   Un progetto può essere scritto in forma breve:
     { "title": "...", "role": "Director", "year": "2027", "cover": "file.jpg", "video": "https://vimeo.com/..." }
   Qui vengono ricavati da soli indirizzo della pagina, categoria e dati del video. */

function fail(msg) {
  console.error('\nERRORE in content/site.json — ' + msg + '\n');
  process.exit(1);
}

function parseVideo(url, where) {
  const u = String(url).trim();
  let m;
  if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-z]+)|\?h=([0-9a-z]+))?/i)))
    return { provider: 'vimeo', id: m[1], ...(m[2] || m[3] ? { hash: m[2] || m[3] } : {}) };
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i)))
    return { provider: 'youtube', id: m[1], shorts: /\/shorts\//i.test(u) };
  fail(`${where}: non riconosco questo link video: "${u}". Usa un link Vimeo o YouTube.`);
}

function expandVideo(b, where) {
  const link = b.reel || b.video || b.url;
  const v = parseVideo(link, where);
  const vertical = Boolean(b.reel) || b.vertical === true || (v.shorts && b.vertical !== false);
  const out = { type: 'video', provider: v.provider, id: v.id };
  if (v.hash) out.hash = v.hash;
  out.width = b.width || (vertical ? 1080 : 1920);
  out.height = b.height || (vertical ? 1920 : 1080);
  if (b.thumb) out.thumb = b.thumb;
  if (b.caption) out.caption = b.caption;
  return out;
}

function expandBlocks(blocks, where) {
  return blocks.map((b) => {
    if (typeof b === 'string') return expandVideo({ video: b }, where);
    if (b.type === 'row') return { ...b, items: expandBlocks(b.items, where) };
    if (!b.type && (b.reel || b.video || b.url)) return expandVideo(b, where);
    if (b.type === 'video' && !b.id && b.url) return expandVideo(b, where);
    return b;
  });
}

const slugify = (t) =>
  String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const seen = new Set();
projects.forEach((p, i) => {
  const where = `progetto n. ${i + 1}${p.title ? ` ("${p.title}")` : ''}`;
  if (!p.title) fail(`${where}: manca "title".`);
  if (!p.cover) fail(`${where}: manca "cover" (il nome del file della copertina).`);
  p.kind = p.kind || '';
  p.fullTitle = p.fullTitle || (p.kind ? `${p.title} | ${p.kind}` : p.title);
  p.slug = p.slug || slugify(p.fullTitle);
  if (seen.has(p.slug)) fail(`${where}: esiste già un altro progetto con lo stesso indirizzo "${p.slug}". Cambia titolo o aggiungi "slug".`);
  seen.add(p.slug);
  p.role = p.role || '';
  p.year = String(p.year || '');
  p.category = p.category || (/photograph(y|er)$|^photo/i.test(p.role) && !/director/i.test(p.role) ? 'photography' : /photography|dop/i.test(p.role) ? 'dop' : 'director');
  const quick = p.video ? (Array.isArray(p.video) ? p.video : [p.video]).map((v) => (typeof v === 'string' ? { video: v, vertical: p.vertical } : v)) : [];
  p.blocks = expandBlocks([...quick, ...(p.blocks || [])], where);
});
const VERSION = createHash('sha1')
  .update(readFileSync(join(OUT, 'assets/css/style.css')))
  .update(readFileSync(join(OUT, 'assets/js/main.js')))
  .digest('hex')
  .slice(0, 8);

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');
const duration = (s) => (s ? `${pad(Math.floor(s / 60))}:${pad(s % 60)}` : '');
const categoryLabel = { director: 'Director', dop: 'Director of Photography', photography: 'Photography' };
// Un'immagine può essere indicata senza estensione (allora servono nome.webp e nome-800.webp)
// oppure come file singolo con estensione (es. "nuovo-video.jpg").
const hasExt = (f) => /\.(jpe?g|png|webp|avif)$/i.test(f);
const imgSrc = (f, small) => (hasExt(f) ? f : `${f}${small ? '-800' : ''}.webp`);
const imgAttrs = (base, f, w) =>
  hasExt(f) ? `src="${base}${f}"` : `src="${base}${f}-800.webp" srcset="${base}${f}-800.webp 800w, ${base}${f}.webp ${w}w"`;
const roleOf = (p) => p.role || categoryLabel[p.category] || '';

function write(path, html) {
  const file = join(OUT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

/* ---------- pezzi condivisi ---------- */

const NAV = [
  { key: 'work', label: 'Work', href: '' },
  { key: 'vertical-adv', label: 'Vertical ADV', href: 'vertical-adv/' },
  { key: 'about', label: 'About', href: 'about/' },
  { key: 'contact', label: 'Contact', href: 'contact/' },
];

const abs = (f) => `${site.url}/${f}`;
const clip = (t, n = 158) => {
  t = String(t).replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
};
const ld = (o) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...o }).replace(/</g, '\\u003c')}</script>\n`;
const person = () => ({
  '@type': 'Person',
  '@id': `${site.url}/#person`,
  name: site.name,
  url: `${site.url}/`,
  image: abs('assets/img/icon-512.png'),
  email: `mailto:${site.email}`,
  jobTitle: site.roles,
  description: site.descriptionLong,
  address: { '@type': 'PostalAddress', addressCountry: 'IT' },
  knowsAbout: ['Film directing', 'Cinematography', 'Camera operating', 'Commercials', 'Documentary film', 'Sports videography'],
  sameAs: site.socials.map((x) => x.url),
});

/* ---------- creste di montagna (intro e footer) ----------
   Profili generati con un rumore "a creste": sempre uguali a ogni build (seme fisso). */
function ridgePath(seed, base, amp, W = 1600, H = 600) {
  const rnd = (i) => {
    const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const noise = (x) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return rnd(i) * (1 - u) + rnd(i + 1) * u;
  };
  let d = `M0 ${H}`;
  for (let x = 0; x <= W; x += 8) {
    let n = 0, a = 1, fq = 1 / 300, tot = 0;
    for (let o = 0; o < 5; o++) {
      n += (1 - Math.abs(noise(x * fq + o * 19.3) * 2 - 1)) * a;
      tot += a;
      a *= 0.5;
      fq *= 2.15;
    }
    d += `L${x} ${(base - amp * Math.pow(n / tot, 1.5)).toFixed(1)}`;
  }
  return `${d}L${W} ${H}Z`;
}
function ridgesSvg(id = 'r') {
  const layers = [
    [3, 330, 300, '#2b3c62'],
    [11, 395, 270, '#213053'],
    [24, 460, 250, '#182542'],
    [37, 525, 210, '#101b31'],
    [52, 600, 170, '#0b1322'],
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3d0e8" stop-opacity="0"/><stop offset="1" stop-color="#c3d0e8" stop-opacity=".16"/></linearGradient></defs>${layers
    .map(([seed, base, amp, color], i) => {
      const d = ridgePath(seed, base, amp);
      const line = i < 4 ? `<path d="${d}" fill="none" stroke="#8fb3ff" stroke-opacity="${(0.34 - i * 0.07).toFixed(2)}" stroke-width="1" vector-effect="non-scaling-stroke"/>` : '';
      const haze = i < 4 ? `<rect y="${base - amp}" width="1600" height="${600 - base + amp}" fill="url(#${id}h)"/>` : '';
      return `<g class="ridge"><path d="${d}" fill="${color}"/>${line}</g>${haze}`;
    })
    .join('')}</svg>`;
}

function layout({ path, root, title, description, image, current, body, bodyClass = '', head = '', keywords = '', ogType = 'website', ogSize = [1200, 630] }) {
  const url = `${site.url}/${path}`;
  const og = `${site.url}/assets/img/og/${image && existsSync(join(OUT, 'assets/img/og', image + '.jpg')) ? image : 'site'}.jpg`;
  const link = (n) =>
    `<a class="nav__link${current === n.key ? ' is-current' : ''}" href="${root}${n.href}"${current === n.key ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`;
  const socials = site.socials
    .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`)
    .join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(clip(description))}">
<meta name="keywords" content="${esc(keywords ? `${keywords}, ${site.keywords}` : site.keywords)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-video-preview:-1, max-snippet:-1">${site.googleVerification ? `\n<meta name="google-site-verification" content="${esc(site.googleVerification)}">` : ''}
<meta name="author" content="${esc(site.name)}">
<meta name="copyright" content="© ${esc(site.name)}. All rights reserved.">
<!-- © ${esc(site.name)}. All rights reserved. Design, code, photographs and films on this site may not be copied or reused without written permission. -->
<link rel="license" href="${site.url}/LICENSE.txt">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="${ogType}">
<meta property="og:locale" content="en_US">
<meta property="og:locale:alternate" content="it_IT">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(clip(description, 200))}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(og)}">${image && og.endsWith(`/${image}.jpg`) ? '' : `\n<meta property="og:image:width" content="${ogSize[0]}">\n<meta property="og:image:height" content="${ogSize[1]}">`}
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(clip(description, 200))}">
<meta name="twitter:image" content="${esc(og)}">
<meta name="theme-color" content="#0b1322">
<link rel="icon" href="${root}favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="96x96" href="${root}assets/img/icon-96.png">
<link rel="icon" type="image/png" sizes="192x192" href="${root}assets/img/icon-192.png">
<link rel="apple-touch-icon" href="${root}assets/img/apple-touch-icon.png">
<link rel="manifest" href="${root}site.webmanifest">
<link rel="preload" href="${root}assets/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}assets/fonts/jetbrains-mono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}assets/css/style.css?v=${VERSION}">
<script>document.documentElement.classList.add('js')</script>
${head}</head>
<body class="${bodyClass}" data-root="${root}">
<a class="skip" href="#main">Skip to content</a>
<header class="header">
  <nav class="nav" aria-label="Main">
    <div class="nav__group nav__group--left">${NAV.slice(0, 2).map(link).join('')}</div>
    <a class="nav__logo" href="${root}" aria-label="${esc(site.name)} — home"><span class="logo" aria-hidden="true"></span></a>
    <div class="nav__group nav__group--right">${NAV.slice(2).map(link).join('')}</div>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
  </nav>
</header>
<div class="menu" id="menu" hidden>
  <nav class="menu__links" aria-label="Mobile">${NAV.map(
    (n, i) =>
      `<a href="${root}${n.href}"${current === n.key ? ' aria-current="page"' : ''}><span>${pad(i + 1)}</span>${esc(n.label)}</a>`
  ).join('')}</nav>
  <div class="menu__foot"><a href="mailto:${site.email}">${site.email}</a><div class="menu__socials">${socials}</div></div>
</div>
<main id="main">
${body}
</main>
<footer class="footer">
  <div class="footer__ridge" aria-hidden="true"><img src="${root}assets/img/ridges.svg" alt="" loading="lazy" decoding="async"><span>Orobie · Alpi Bergamasche</span></div>
  <a class="footer__cta" href="${root}contact/">
    <span class="footer__label">${esc(data.contact.headline)}</span>
    <span class="footer__big" data-fit>CONTACT</span>
  </a>
  <div class="footer__row">
    <span>© <span data-year>${new Date().getFullYear()}</span> ${esc(site.name)} — All rights reserved</span>
    <a href="mailto:${site.email}">${site.email}</a>
    <div class="footer__socials">${socials}</div>
    <a class="footer__top" href="#top" data-top>Back to top ↑</a>
  </div>
</footer>
<div class="cookie" id="cookie" hidden role="dialog" aria-label="Cookie">
  <p>${esc(site.cookieText)}</p>
  <div class="cookie__actions"><button type="button" data-cookie="yes">Accetta</button><button type="button" data-cookie="no">Rifiuta</button></div>
</div>
<script src="${root}assets/js/main.js?v=${VERSION}" defer></script>
</body>
</html>
`;
}

function card(p, root, { eager = false, index = 0 } = {}) {
  const base = `${root}assets/img/covers/`;
  const hover = p.coverHover
    ? `<img class="card__img card__img--hover" ${imgAttrs(base, p.coverHover, 1600)} sizes="(max-width: 720px) 100vw, 50vw" alt="${esc(p.fullTitle)} — ${esc(site.name)}" loading="lazy" decoding="async">`
    : '';
  return `<a class="card" href="${root}${p.slug}/" data-category="${p.category}" data-cursor="${p.category === 'photography' ? 'View' : 'Play'}">
  <span class="card__media">
    <img class="card__img" ${imgAttrs(base, p.cover, 1600)} sizes="(max-width: 720px) 100vw, 50vw" width="1600" height="900" alt="${esc(p.fullTitle)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">${hover}
    <span class="card__index">${pad(index + 1)}</span>
  </span>
  <span class="card__caption">
    <span class="card__title">${esc(p.title)}${p.kind ? ` <span class="card__kind">${esc(p.kind)}</span>` : ''}</span>
    <span class="card__meta">${esc(roleOf(p))}${p.year ? ` — ${esc(p.year)}` : ''}</span>
  </span>
</a>`;
}

/* ---------- blocchi di una pagina progetto ---------- */

function videoBlock(v, root, p) {
  const ratio = `${v.width} / ${v.height}`;
  const vertical = v.height > v.width;
  let href, embed;
  if (v.provider === 'youtube') {
    href = `https://www.youtube.com/watch?v=${v.id}`;
    embed = `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&playsinline=1`;
  } else if (v.provider === 'vimeo') {
    href = `https://vimeo.com/${v.id}${v.hash ? '/' + v.hash : ''}`;
    embed = `https://player.vimeo.com/video/${v.id}?${v.hash ? `h=${v.hash}&` : ''}autoplay=1&dnt=1&title=0&byline=0&portrait=0`;
  } else {
    href = v.src;
    embed = v.src;
  }
  const label = v.caption || v.title || p.fullTitle;
  const poster = v.thumb ? `${root}assets/img/${imgSrc(v.thumb)}` : `${root}assets/img/covers/${imgSrc(p.cover)}`;
  return `<figure class="video${vertical ? ' video--vertical' : ''}" style="--ratio:${ratio}">
  <a class="video__frame" href="${esc(href)}" target="_blank" rel="noopener" data-embed="${esc(embed)}" data-cursor="Play" aria-label="Play: ${esc(label)}">
    <img src="${poster}" alt="${esc(label)} — ${esc(roleOf(p) || 'video')} ${esc(site.name)}" loading="lazy" decoding="async">
    <span class="video__play" aria-hidden="true">[ Play ]</span>
    ${v.duration ? `<span class="video__time" aria-hidden="true">${duration(v.duration)}</span>` : ''}
  </a>
  ${v.caption ? `<figcaption>${esc(v.caption)}</figcaption>` : ''}
</figure>`;
}

function imageTag(im, root, sizes, cls = '', alt = '') {
  return `<img${cls ? ` class="${cls}"` : ''} ${imgAttrs(`${root}assets/img/`, im.src, im.width)} sizes="${sizes}" width="${im.width}" height="${im.height}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
}

function renderBlocks(blocks, root, p) {
  // I video verticali consecutivi (singoli o in riga) finiscono in un'unica griglia.
  const isVertical = (b) => b.type === 'video' && b.height > b.width;
  const flat = [];
  for (const b of blocks) {
    if (b.type === 'row' && b.items.every(isVertical)) flat.push(...b.items);
    else flat.push(b);
  }
  const out = [];
  for (let i = 0; i < flat.length; i++) {
    const b = flat[i];
    if (isVertical(b)) {
      const group = [];
      while (i < flat.length && isVertical(flat[i])) group.push(flat[i++]);
      i--;
      out.push(`<div class="reels reels--${Math.min(group.length, 4)}">${group.map((v) => videoBlock(v, root, p)).join('')}</div>`);
    } else if (b.type === 'video') {
      out.push(`<div class="block block--video">${videoBlock(b, root, p)}</div>`);
    } else if (b.type === 'row') {
      const text = b.items.every((x) => x.type === 'text');
      // Testi nella stessa riga che iniziano con il nome della lingua (ENGLISH / ITALIANO)
      // diventano un selettore di lingua: se ne vede uno alla volta.
      const langs = text ? b.items.map((x) => x.html.match(/^\s*<p>\s*([^<]{2,24}?)\s*<\/p>/)) : [];
      if (text && b.items.length > 1 && langs.every(Boolean)) {
        const code = (l) => (/^ita/i.test(l) ? 'it' : /^eng/i.test(l) ? 'en' : l.slice(0, 2).toLowerCase());
        const cap = (l) => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase();
        out.push(`<div class="lang" data-lang>
  <div class="lang__tabs" role="group" aria-label="Language / Lingua">${langs
    .map((m, n) => `<button type="button" class="lang__tab${n === 0 ? ' is-active' : ''}" data-lang-tab="${code(m[1])}" aria-pressed="${n === 0}">${esc(cap(m[1]))}</button>`)
    .join('<span aria-hidden="true">/</span>')}</div>
  ${b.items
    .map((x, n) => `<div class="lang__panel prose" lang="${code(langs[n][1])}" data-lang-panel="${code(langs[n][1])}">${x.html.replace(langs[n][0], '')}</div>`)
    .join('\n  ')}
</div>`);
        continue;
      }
      out.push(`<div class="row${text ? ' row--text' : ''}">${b.items.map((x) => renderBlocks([x], root, p)).join('')}</div>`);
    } else if (b.type === 'text') {
      out.push(`<div class="block block--text prose">${b.html}</div>`);
    } else if (b.type === 'button') {
      out.push(`<div class="block block--button"><a class="btn" href="${root}${b.href}/">${esc(b.label)}</a></div>`);
    } else if (b.type === 'image') {
      out.push(`<figure class="block block--image">${imageTag(b, root, '(max-width: 1100px) 100vw, 1100px', '', `${p.fullTitle} — still, ${site.name}`)}</figure>`);
    } else if (b.type === 'gallery') {
      out.push(
        `<div class="gallery" data-gallery>${b.images
          .map(
            (im, n) =>
              `<a class="gallery__item" href="${root}assets/img/${imgSrc(im.src)}" data-w="${im.width}" data-h="${im.height}" data-cursor="View" aria-label="Open photo ${n + 1}">${imageTag(im, root, '(max-width: 720px) 50vw, 33vw', '', `${p.title} — photo ${n + 1} by ${site.name}`)}</a>`
          )
          .join('')}</div>`
      );
    }
  }
  return out.join('\n');
}

/* ---------- pagine ---------- */

function home() {
  const root = './';
  const filters = [
    ['all', 'All'],
    ['director', 'Director'],
    ['dop', 'Director of Photography'],
    ['photography', 'Photography'],
  ];
  const count = (k) => (k === 'all' ? projects.length : projects.filter((p) => p.category === k).length);
  const covers = projects.map((p) => `assets/img/covers/${imgSrc(p.cover, true)}`);
  const body = `<section class="hero" id="top">
  <div class="hero__meta">
    <span>Lorenzo</span>
    <span>${site.roles.map(esc).join(' / ')}</span>
    <span>${esc(site.location)}</span>
  </div>
  <h1 class="hero__word" data-fit><span class="sr">${esc(site.name)} — ${site.roles.map(esc).join(', ')} </span><span class="fit" aria-hidden="true">MANGINI</span></h1>
  <p class="hero__intro">${esc(site.descriptionLong)}</p>
</section>
<section class="work" aria-label="Selected work">
  <div class="filters" role="group" aria-label="Filter projects">
    ${filters
      .map(
        ([k, l], i) =>
          `<button type="button" class="filter${i === 0 ? ' is-active' : ''}" data-filter="${k}" aria-pressed="${i === 0}">${esc(l)}<sup>${pad(count(k))}</sup></button>`
      )
      .join('\n    ')}
  </div>
  <div class="grid" id="grid">
${projects.map((p, i) => card(p, root, { eager: i < 2, index: i })).join('\n')}
  </div>
</section>`;
  const head = `<script>try{if(!sessionStorage.getItem('lm-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('has-intro')}catch(e){}</script>
<script type="application/json" id="intro-data">${JSON.stringify(covers)}</script>
<template id="ridges">${ridgesSvg('i')}</template>
${ld({ '@type': 'WebSite', '@id': `${site.url}/#website`, url: `${site.url}/`, name: site.name, alternateName: [site.title, 'lorenzomangini.com'], description: site.description, inLanguage: ['en', 'it'], publisher: { '@id': `${site.url}/#person` } })}${ld(person())}${ld({
    '@type': 'ItemList',
    name: 'Selected work',
    itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.fullTitle, url: `${site.url}/${p.slug}/` })),
  })}`;
  write('index.html', layout({ path: '', root, title: site.title, description: site.description, current: 'work', body, bodyClass: 'page-home', head }));
}

function projectPage(p, i) {
  const root = '../';
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  const more = [1, 2, 3, 4].map((n) => projects[(i + n) % projects.length]);
  const firstVideo = (function find(bs) {
    for (const b of bs) {
      if (b.type === 'video') return b;
      if (b.type === 'row') {
        const f = find(b.items);
        if (f) return f;
      }
    }
  })(p.blocks);
  const format = p.category === 'photography' ? 'Photography' : firstVideo && firstVideo.height > firstVideo.width ? 'Vertical 9:16' : 'Film';
  const body = `<article class="project" id="top">
  <header class="project__head">
    <a class="back" href="${root}">← All work</a>
    <h1 class="project__title">${esc(p.title)}</h1>
    ${p.kind ? `<p class="project__kind">${esc(p.kind)}</p>` : ''}
    <dl class="project__meta">
      <div><dt>Role</dt><dd>${esc(roleOf(p))}</dd></div>
      ${p.year ? `<div><dt>Year</dt><dd>${esc(p.year)}</dd></div>` : ''}
      <div><dt>Format</dt><dd>${format}</dd></div>
      ${p.subtitle ? `<div><dt>Project</dt><dd>${esc(p.subtitle.replace(/\s*\|.*$/, ''))}</dd></div>` : ''}
    </dl>
  </header>
  <div class="project__body">
${renderBlocks(p.blocks, root, p)}
  </div>
  ${p.credits && p.credits.length ? `<section class="credits" aria-labelledby="credits-title">
    <h2 class="label" id="credits-title">Credits</h2>
    <p>${p.credits.map(esc).join('<br>')}</p>
  </section>` : ''}
  <nav class="pager" aria-label="Projects">
    <a href="${root}${prev.slug}/"><span>← Previous</span>${esc(prev.title)}</a>
    <a href="${root}${next.slug}/"><span>Next →</span>${esc(next.title)}</a>
  </nav>
</article>
<section class="more" aria-labelledby="more-title">
  <h2 class="label" id="more-title">You may also like</h2>
  <div class="grid grid--small">
${more.map((m) => card(m, root, { index: projects.indexOf(m) })).join('\n')}
  </div>
</section>`;
  const credits = (p.credits || []).join('. ').replace(/\.\./g, '.');
  const description = `${p.fullTitle} (${[roleOf(p), p.year].filter(Boolean).join(', ')}). ${credits ? credits + '. ' : ''}From the portfolio of ${site.name}, ${site.tagline}.`;
  const url = `${site.url}/${p.slug}/`;
  const coverUrl = abs(`assets/img/covers/${imgSrc(p.cover)}`);
  const videos = [];
  const photos = [];
  (function collect(bs) {
    for (const b of bs) {
      if (b.type === 'row') collect(b.items);
      if (b.type === 'video') videos.push(b);
      if (b.type === 'image') photos.push(b);
      if (b.type === 'gallery') photos.push(...b.images);
    }
  })(p.blocks);
  const iso = (sec) => `PT${Math.floor(sec / 60)}M${sec % 60}S`;
  const work = {
    '@type': p.category === 'photography' ? 'ImageGallery' : 'CreativeWork',
    '@id': `${url}#work`,
    name: p.fullTitle,
    url,
    description: clip(description, 300),
    image: coverUrl,
    [p.category === 'dop' ? 'contributor' : 'creator']: { '@id': `${site.url}/#person` },
    ...(p.year ? { dateCreated: p.year, copyrightYear: Number(p.year) } : {}),
    copyrightHolder: { '@id': `${site.url}/#person` },
    ...(p.category === 'photography'
      ? { image: photos.slice(0, 30).map((im) => ({ '@type': 'ImageObject', contentUrl: abs(`assets/img/${imgSrc(im.src)}`), creator: { '@id': `${site.url}/#person` }, creditText: site.name, copyrightNotice: `© ${site.name}` })) }
      : {}),
  };
  // Google accetta i video solo con la data di caricamento: la abbiamo per quelli Vimeo.
  const videoLd = videos
    .filter((v) => v.uploadDate)
    .map((v) =>
      ld({
        '@type': 'VideoObject',
        name: v.caption || v.title || p.fullTitle,
        description: clip(description, 300),
        thumbnailUrl: v.thumb ? abs(`assets/img/${imgSrc(v.thumb)}`) : coverUrl,
        uploadDate: v.uploadDate,
        ...(v.duration ? { duration: iso(v.duration) } : {}),
        embedUrl: `https://player.vimeo.com/video/${v.id}${v.hash ? `?h=${v.hash}` : ''}`,
        [p.category === 'dop' ? 'contributor' : 'creator']: { '@id': `${site.url}/#person` },
      })
    )
    .join('');
  const head =
    ld(person()) +
    ld(work) +
    ld({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Work', item: `${site.url}/` },
        { '@type': 'ListItem', position: 2, name: p.fullTitle, item: url },
      ],
    }) +
    videoLd;
  write(
    `${p.slug}/index.html`,
    layout({
      path: `${p.slug}/`,
      root,
      title: `${p.fullTitle} — ${site.name}`,
      description,
      image: p.slug,
      current: p.slug === 'vertical-adv' ? 'vertical-adv' : '',
      head,
      keywords: [p.title, p.kind, roleOf(p), `${site.name} ${p.kind || roleOf(p)}`].filter(Boolean).join(', '),
      ogType: videos.length ? 'video.other' : 'website',
      body,
      bodyClass: `page-project page-${p.category}`,
    })
  );
}

function about() {
  const root = '../';
  const body = `<section class="page" id="top">
  <header class="page__head">
    <p class="label">About me</p>
    <h1 class="page__title" data-fit>ABOUT</h1>
  </header>
  <div class="about">
    <aside class="about__side">
      <dl>
        <div><dt>Name</dt><dd>${esc(site.name)}</dd></div>
        <div><dt>Roles</dt><dd>${site.roles.map(esc).join('<br>')}</dd></div>
        <div><dt>Location</dt><dd>${esc(site.location)}</dd></div>
        <div><dt>Contact</dt><dd><a href="mailto:${site.email}">${site.email}</a></dd></div>
        <div><dt>Follow</dt><dd>${site.socials.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('<br>')}</dd></div>
      </dl>
    </aside>
    <div class="about__text prose prose--large">
      ${data.about.html}
      <p><a class="btn" href="${root}contact/">${esc(data.about.button)}</a></p>
    </div>
  </div>
</section>`;
  write('about/index.html', layout({ path: 'about/', root, title: `About — ${site.title}`, description: site.descriptionLong, current: 'about', body, bodyClass: 'page-about', ogType: 'profile', keywords: `about ${site.name}, biography, showreel`, head: ld({ '@type': 'ProfilePage', url: `${site.url}/about/`, name: `About ${site.name}`, mainEntity: person() }) }));
}

function contact() {
  const root = '../';
  const body = `<section class="page" id="top">
  <header class="page__head">
    <p class="label">${esc(data.contact.headline)}</p>
    <h1 class="page__title" data-fit>CONTACT</h1>
  </header>
  <div class="contact">
    <div class="contact__side">
      <p class="label">Follow</p>
      <div class="contact__socials">${site.socials.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('')}</div>
    </div>
    <div class="contact__main">
      <p class="label">Email</p>
      <a class="contact__mail" href="mailto:${site.email}">${site.email}</a>
      <div class="contact__actions">
        <a class="btn btn--solid" href="mailto:${site.email}" data-mail="${site.email}">Write me an email</a>
        <a class="btn" href="https://mail.google.com/mail/?view=cm&amp;fs=1&amp;to=${encodeURIComponent(site.email)}" target="_blank" rel="noopener">Write with Gmail ↗</a>
        <button class="btn" type="button" data-copy="${site.email}">Copy email</button>
      </div>
      <p class="contact__status" role="status" aria-live="polite"></p>
    </div>
  </div>
</section>`;
  write('contact/index.html', layout({ path: 'contact/', root, title: `Contact — ${site.title}`, description: `Contact ${site.name}, ${site.roles.join(', ')} ${site.location.toLowerCase()}. ${data.contact.headline} Email: ${site.email}`, current: 'contact', body, bodyClass: 'page-contact', keywords: `contact ${site.name}, hire director, hire director of photography, email`, head: ld({ '@type': 'ContactPage', url: `${site.url}/contact/`, name: `Contact ${site.name}`, mainEntity: person() }) }));
}

function notFound() {
  const body = `<section class="page page--center" id="top">
  <p class="label">Error 404 — out of frame</p>
  <h1 class="page__title" data-fit>CUT!</h1>
  <p><a class="btn" href="/">← Back to all work</a></p>
</section>`;
  const html = layout({ path: '404.html', root: '/', title: `404 — ${site.name}`, description: site.description, current: '', body, bodyClass: 'page-404' });
  write('404.html', html.replace('<link rel="canonical"', '<meta name="robots" content="noindex">\n<link rel="canonical"'));
}

function redirect(from, to) {
  write(
    `${from}/index.html`,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(site.name)}</title><meta name="robots" content="noindex"><link rel="canonical" href="${site.url}/${to}"><meta http-equiv="refresh" content="0; url=../${to}"></head><body><a href="../${to}">Continue</a></body></html>\n`
  );
}

/* ---------- controlli e build ---------- */

const missing = [];
const need = (f) => existsSync(join(OUT, 'assets/img', f)) || missing.push(f);
for (const p of projects) {
  need(`covers/${imgSrc(p.cover)}`);
  const scan = (bs) =>
    bs.forEach((b) => {
      if (b.type === 'row') scan(b.items);
      if (b.type === 'image') need(imgSrc(b.src));
      if (b.type === 'gallery') b.images.forEach((im) => need(imgSrc(im.src)));
      if (b.type === 'video' && b.thumb) need(imgSrc(b.thumb));
    });
  scan(p.blocks);
}
if (missing.length) {
  console.error('Immagini mancanti in docs/assets/img:\n  ' + missing.join('\n  '));
  process.exit(1);
}

home();
projects.forEach(projectPage);
about();
contact();
notFound();
redirect('home', '');
redirect('me', 'contact/');
redirect('about-me', 'about/');
redirect('about-me-1', 'about/');

const urls = ['', 'about/', 'contact/', ...projects.map((p) => `${p.slug}/`)];
const today = new Date().toISOString().slice(0, 10);
const xml = (t) => esc(t).replace(/'/g, '&apos;');
const pageImages = (p) => {
  const list = [`assets/img/covers/${imgSrc(p.cover)}`];
  (function collect(bs) {
    for (const b of bs) {
      if (b.type === 'row') collect(b.items);
      if (b.type === 'image') list.push(`assets/img/${imgSrc(b.src)}`);
      if (b.type === 'gallery') b.images.forEach((im) => list.push(`assets/img/${imgSrc(im.src)}`));
    }
  })(p.blocks);
  return list;
};
const entry = (u, priority, images = []) =>
  `  <url><loc>${site.url}/${u}</loc><lastmod>${today}</lastmod><priority>${priority}</priority>${images.map((f) => `<image:image><image:loc>${xml(abs(f))}</image:loc></image:image>`).join('')}</url>`;
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${[
    entry('', '1.0', projects.map((p) => `assets/img/covers/${imgSrc(p.cover)}`)),
    entry('about/', '0.8'),
    entry('contact/', '0.7'),
    ...projects.map((p) => entry(`${p.slug}/`, '0.9', pageImages(p))),
  ].join('\n')}\n</urlset>\n`
);
write(
  'site.webmanifest',
  JSON.stringify(
    {
      name: site.title,
      short_name: site.name,
      description: site.description,
      start_url: '/',
      display: 'browser',
      background_color: '#0b1322',
      theme_color: '#0b1322',
      icons: [192, 512].map((n) => ({ src: `/assets/img/icon-${n}.png`, sizes: `${n}x${n}`, type: 'image/png' })),
    },
    null,
    2
  ) + '\n'
);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
write('.nojekyll', '');
write('assets/img/ridges.svg', ridgesSvg('f'));
write('CNAME', new URL(site.url).host + '\n');
console.log(`OK — ${urls.length} pagine generate in docs/`);
