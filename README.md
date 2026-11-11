# lorenzomangini.com

Nuovo sito portfolio di Lorenzo Mangini (Filmmaker & DP). Sito statico, senza dipendenze:
tutto quello che va online è nella cartella `docs/`.

## Come è fatto

| Cosa | Dove |
| --- | --- |
| Tutti i contenuti (progetti, testi, link, social) | `content/site.json` |
| Generatore delle pagine | `build.mjs` |
| Sito pronto da pubblicare | `docs/` |
| Stile (colore d'accento: variabile `--accent`) | `docs/assets/css/style.css` |
| Interazioni (intro, filtri, video, gallery, form) | `docs/assets/js/main.js` |
| Immagini (copertine, foto, anteprime video) | `docs/assets/img/` |

## Modificare o aggiungere un progetto

1. Apri `content/site.json` e modifica (o copia) una voce dentro `projects`.
   L'ordine nel file è l'ordine nella home.
   - `slug`: l'indirizzo della pagina (`/slug/`)
   - `title`, `kind`, `role`, `year`
   - `category`: `director`, `dop` oppure `photography` (serve ai filtri in home)
   - `cover`: nome del file in `docs/assets/img/covers/` senza estensione
     (servono `nome.webp` largo 1600px e `nome-800.webp` largo 800px)
   - `blocks`: il contenuto della pagina, nell'ordine in cui appare:
     - video Vimeo: `{ "type": "video", "provider": "vimeo", "id": "…", "hash": "…", "width": 1280, "height": 720, "thumb": "video/ID" }`
     - video YouTube: `{ "type": "video", "provider": "youtube", "id": "…", "width": 720, "height": 1280, "thumb": "video/ID" }`
     - testo: `{ "type": "text", "html": "<p>…</p>" }`
     - foto: `{ "type": "gallery", "images": [{ "src": "cartella/01", "width": 1920, "height": 1280 }] }`
     - più elementi affiancati: `{ "type": "row", "items": [ … ] }`
2. Lancia `node build.mjs` (serve solo Node.js, nessuna installazione).
   Se manca un'immagine il comando lo segnala.
3. Pubblica la cartella `docs/`.

`width`/`height` dei video servono solo per le proporzioni del riquadro.

## Anteprima in locale

```
node build.mjs
cd docs && python3 -m http.server 8000
```

poi apri <http://localhost:8000>. L'intro compare una volta per sessione del browser:
per rivederla chiudi e riapri la scheda.

## Pubblicazione

`docs/` funziona su qualsiasi hosting statico (GitHub Pages con sorgente `/docs`,
Netlify, Vercel, Cloudflare Pages…). Gli indirizzi dei progetti sono gli stessi del
vecchio sito; `/home`, `/me` e `/about-me-1` reindirizzano alle nuove pagine.

## Modulo contatti

Senza configurazione il modulo prepara il messaggio nel programma di posta del visitatore.
Per ricevere i messaggi direttamente, crea un modulo su un servizio come Formspree e
incolla il suo indirizzo in `site.formEndpoint` dentro `content/site.json`, poi rilancia il build.

## Video e cookie

I player Vimeo/YouTube vengono caricati solo quando il visitatore preme play
(prima si vede un'anteprima salvata nel sito). Se il visitatore rifiuta i cookie,
il video si apre sulla piattaforma in una nuova scheda.

## Font

Archivo e JetBrains Mono, entrambi con licenza SIL Open Font License, inclusi in `docs/assets/fonts/`.
