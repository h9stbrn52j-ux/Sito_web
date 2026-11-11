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
const VERSION = createHash('sha1')
  .update(readFileSync(join(OUT, 'assets/css/style.css')))
  .update(readFileSync(join(OUT, 'assets/js/main.js')))
  .digest('hex')
  .slice(0, 8);

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');
const duration = (s) => (s ? `${pad(Math.floor(s / 60))}:${pad(s % 60)}` : '');
const categoryLabel = { director: 'Director', dop: 'Director of Photography', photography: 'Photography' };
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

function layout({ path, root, title, description, image, current, body, bodyClass = '', head = '' }) {
  const url = `${site.url}/${path}`;
  const og = `${site.url}/assets/img/og/${image || 'site'}.jpg`;
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
<meta name="description" content="${esc(description)}">
<meta name="keywords" content="${esc(site.keywords)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(og)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b0b0c">
<link rel="icon" href="${root}assets/img/favicon.png">
<link rel="apple-touch-icon" href="${root}assets/img/apple-touch-icon.png">
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
  <a class="footer__cta" href="${root}contact/">
    <span class="footer__label">${esc(data.contact.headline)}</span>
    <span class="footer__big" data-fit>CONTACT</span>
  </a>
  <div class="footer__row">
    <span>© <span data-year>${new Date().getFullYear()}</span> ${esc(site.name)}</span>
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
  const img = (f) => `${root}assets/img/covers/${f}`;
  const hover = p.coverHover
    ? `<img class="card__img card__img--hover" src="${img(p.coverHover)}-800.webp" srcset="${img(p.coverHover)}-800.webp 800w, ${img(p.coverHover)}.webp 1600w" sizes="(max-width: 720px) 100vw, 50vw" alt="" loading="lazy" decoding="async">`
    : '';
  return `<a class="card" href="${root}${p.slug}/" data-category="${p.category}" data-cursor="${p.category === 'photography' ? 'View' : 'Play'}">
  <span class="card__media">
    <img class="card__img" src="${img(p.cover)}-800.webp" srcset="${img(p.cover)}-800.webp 800w, ${img(p.cover)}.webp 1600w" sizes="(max-width: 720px) 100vw, 50vw" width="1600" height="900" alt="${esc(p.fullTitle)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">${hover}
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
  const poster = v.thumb ? `${root}assets/img/${v.thumb}.webp` : `${root}assets/img/covers/${p.cover}.webp`;
  return `<figure class="video${vertical ? ' video--vertical' : ''}" style="--ratio:${ratio}">
  <a class="video__frame" href="${esc(href)}" target="_blank" rel="noopener" data-embed="${esc(embed)}" data-cursor="Play" aria-label="Play: ${esc(label)}">
    <img src="${poster}" alt="" loading="lazy" decoding="async">
    <span class="video__play" aria-hidden="true">[ Play ]</span>
    ${v.duration ? `<span class="video__time" aria-hidden="true">${duration(v.duration)}</span>` : ''}
  </a>
  ${v.caption ? `<figcaption>${esc(v.caption)}</figcaption>` : ''}
</figure>`;
}

function imageTag(im, root, sizes, cls = '') {
  const src = `${root}assets/img/${im.src}`;
  return `<img${cls ? ` class="${cls}"` : ''} src="${src}-800.webp" srcset="${src}-800.webp 800w, ${src}.webp ${im.width}w" sizes="${sizes}" width="${im.width}" height="${im.height}" alt="" loading="lazy" decoding="async">`;
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
      out.push(`<div class="row${text ? ' row--text' : ''}">${b.items.map((x) => renderBlocks([x], root, p)).join('')}</div>`);
    } else if (b.type === 'text') {
      out.push(`<div class="block block--text prose">${b.html}</div>`);
    } else if (b.type === 'button') {
      out.push(`<div class="block block--button"><a class="btn" href="${root}${b.href}/">${esc(b.label)}</a></div>`);
    } else if (b.type === 'image') {
      out.push(`<figure class="block block--image">${imageTag(b, root, '(max-width: 1100px) 100vw, 1100px')}</figure>`);
    } else if (b.type === 'gallery') {
      out.push(
        `<div class="gallery" data-gallery>${b.images
          .map(
            (im, n) =>
              `<a class="gallery__item" href="${root}assets/img/${im.src}.webp" data-w="${im.width}" data-h="${im.height}" data-cursor="View" aria-label="Open photo ${n + 1}">${imageTag(im, root, '(max-width: 720px) 50vw, 33vw')}</a>`
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
  const covers = projects.map((p) => `assets/img/covers/${p.cover}-800.webp`);
  const body = `<section class="hero" id="top">
  <div class="hero__meta">
    <span>Lorenzo</span>
    <span>${site.roles.map(esc).join(' / ')}</span>
    <span>${esc(site.location)}</span>
  </div>
  <h1 class="hero__word" data-fit aria-label="${esc(site.name)}">MANGINI</h1>
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
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url: site.url,
    email: site.email,
    jobTitle: site.roles.join(', '),
    description: site.descriptionLong,
    sameAs: site.socials.map((s) => s.url),
  })}</script>
`;
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
      <div><dt>Year</dt><dd>${esc(p.year)}</dd></div>
      <div><dt>Format</dt><dd>${format}</dd></div>
      ${p.subtitle ? `<div><dt>Project</dt><dd>${esc(p.subtitle.replace(/\s*\|.*$/, ''))}</dd></div>` : ''}
    </dl>
  </header>
  <div class="project__body">
${renderBlocks(p.blocks, root, p)}
  </div>
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
  const description = `${p.fullTitle} — ${roleOf(p)}${p.year ? `, ${p.year}` : ''}. ${site.description}`;
  write(
    `${p.slug}/index.html`,
    layout({
      path: `${p.slug}/`,
      root,
      title: `${p.fullTitle} — ${site.name}`,
      description,
      image: p.slug,
      current: p.slug === 'vertical-adv' ? 'vertical-adv' : '',
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
  write('about/index.html', layout({ path: 'about/', root, title: `About — ${site.title}`, description: site.descriptionLong, current: 'about', body, bodyClass: 'page-about' }));
}

function contact() {
  const root = '../';
  const field = (name, label, type = 'text', auto = '') =>
    `<label class="field"><span>${label} *</span><input type="${type}" name="${name}" required${auto ? ` autocomplete="${auto}"` : ''}></label>`;
  const body = `<section class="page" id="top">
  <header class="page__head">
    <p class="label">${esc(data.contact.headline)}</p>
    <h1 class="page__title" data-fit>CONTACT</h1>
  </header>
  <div class="contact">
    <div class="contact__side">
      <p class="label">Email</p>
      <a class="contact__mail" href="mailto:${site.email}">${site.email}</a>
      <p class="label">Follow</p>
      <div class="contact__socials">${site.socials.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('')}</div>
    </div>
    <form class="form" id="contact-form" action="${esc(site.formEndpoint || `mailto:${site.email}`)}" method="post" data-endpoint="${esc(site.formEndpoint)}" data-email="${site.email}">
      <div class="form__row">
        ${field('firstName', 'First Name', 'text', 'given-name')}
        ${field('lastName', 'Last Name', 'text', 'family-name')}
      </div>
      ${field('email', 'Email Address', 'email', 'email')}
      ${field('subject', 'Subject')}
      <label class="field"><span>Message *</span><textarea name="message" rows="6" required></textarea></label>
      <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="form__trap" aria-hidden="true">
      <button class="btn btn--solid" type="submit">Submit</button>
      <p class="form__status" role="status" aria-live="polite" hidden>Thank you!</p>
    </form>
  </div>
</section>`;
  write('contact/index.html', layout({ path: 'contact/', root, title: `Contact — ${site.title}`, description: `${data.contact.headline} ${site.email}`, current: 'contact', body, bodyClass: 'page-contact' }));
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
  need(`covers/${p.cover}.webp`);
  const scan = (bs) =>
    bs.forEach((b) => {
      if (b.type === 'row') scan(b.items);
      if (b.type === 'image') need(`${b.src}.webp`);
      if (b.type === 'gallery') b.images.forEach((im) => need(`${im.src}.webp`));
      if (b.type === 'video' && b.thumb) need(`${b.thumb}.webp`);
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
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site.url}/${u}</loc></url>`).join('\n')}\n</urlset>\n`
);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
write('.nojekyll', '');
console.log(`OK — ${urls.length} pagine generate in docs/`);
