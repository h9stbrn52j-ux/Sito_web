# Guida — mettere online il sito e aggiungere nuovi video

Due parti: **A.** passare da Adobe Portfolio al nuovo sito, **B.** aggiungere un video.
Se qualcosa non torna, puoi sempre chiedere a Claude di farlo al posto tuo:
basta mandare il link del video e un'immagine di copertina.

---

## A. Passare da Adobe Portfolio al nuovo sito

Il dominio `lorenzomangini.com` è su Namecheap e oggi "punta" ad Adobe Portfolio.
Il nuovo sito va messo su un hosting e poi il dominio va fatto puntare lì.
La strada consigliata è **GitHub Pages**: è gratuita, il sito è già in questo repository
e si aggiorna da solo a ogni modifica.

> Finché non cambi i DNS (passo A3) il vecchio sito Adobe resta online: puoi fare
> i passi A1 e A2 con calma e controllare il risultato prima di fare il cambio.

### A1. Attiva GitHub Pages

1. Vai su `github.com/h9stbrn52j-ux/Sito_web` → **Settings** → **Pages**.
2. In **Build and deployment → Source** scegli **GitHub Actions**.
3. Vai nella scheda **Actions** del repository: deve comparire "Pubblica il sito".
   Se non è partito da solo, aprilo e premi **Run workflow**.
4. Quando compare la spunta verde il sito è pubblicato.

Nota: con un account GitHub gratuito, Pages funziona solo se il repository è **pubblico**
(Settings → General → in fondo, "Change repository visibility").

### A2. Collega il dominio su GitHub

1. Sempre in **Settings → Pages**, campo **Custom domain**: scrivi `lorenzomangini.com` e salva.
2. GitHub mostrerà un avviso sui DNS finché non fai il passo A3: è normale.

### A3. Cambia i DNS su Namecheap

1. Entra su Namecheap → **Domain List** → **Manage** accanto a `lorenzomangini.com` → scheda **Advanced DNS**.
2. **Prima di toccare qualcosa fai uno screenshot** dei record esistenti, così puoi tornare indietro.
3. **Non toccare i record MX e TXT**: servono alla casella `work@lorenzomangini.com`.
4. Elimina solo i record che portano ad Adobe: di solito un `CNAME` con host `www`
   (valore che contiene `myportfolio.com`) e l'eventuale record `A` / `URL Redirect` con host `@`.
5. Aggiungi questi record:

   | Type | Host | Value |
   | --- | --- | --- |
   | A Record | `@` | `185.199.108.153` |
   | A Record | `@` | `185.199.109.153` |
   | A Record | `@` | `185.199.110.153` |
   | A Record | `@` | `185.199.111.153` |
   | CNAME Record | `www` | `h9stbrn52j-ux.github.io` |

6. Salva. La propagazione richiede da pochi minuti a qualche ora.

### A4. Attiva HTTPS e chiudi Adobe

1. Torna in **Settings → Pages** su GitHub: quando il controllo DNS diventa verde,
   spunta **Enforce HTTPS** (può volerci fino a un'ora perché diventi cliccabile).
2. Apri `https://lorenzomangini.com` e controlla che si veda il sito nuovo.
3. Solo a questo punto, in Adobe Portfolio → Impostazioni → Nome dominio, scollega il dominio.
   Tutte le foto e le copertine sono già copiate nel nuovo sito; i video restano su Vimeo e YouTube.

### Alternativa: hosting Namecheap (cPanel)

Se su Namecheap hai anche un piano di **hosting** (non solo il dominio):

1. Su GitHub premi **Code → Download ZIP** e scompatta.
2. In cPanel → **File Manager** → cartella `public_html`: carica **il contenuto** della cartella `docs`
   (non la cartella stessa: `index.html` deve trovarsi direttamente dentro `public_html`).
3. In Advanced DNS il dominio deve puntare all'hosting Namecheap (di solito lo fa già il piano).

In questo caso a ogni modifica bisogna ricaricare i file a mano.

---

## B. Aggiungere un nuovo video

Servono tre cose: il **link** del video (Vimeo o YouTube), una **copertina** e due minuti.
Si fa tutto dal sito di GitHub, senza installare nulla.

### B1. Prepara la copertina

- Un fotogramma in orizzontale 16:9, JPG, largo circa 1600 px (sotto i 500 KB è l'ideale).
- Dagli un nome semplice, minuscolo, senza spazi né accenti: es. `nuovo-spot.jpg`.

### B2. Carica la copertina

1. Su GitHub apri la cartella `docs/assets/img/covers`.
2. **Add file → Upload files**, trascina `nuovo-spot.jpg`, poi **Commit changes**.

### B3. Ricava i dati dal link del video

| Link | Cosa copiare |
| --- | --- |
| `https://vimeo.com/1179671398/4ad090542b` | `id` = `1179671398`, `hash` = `4ad090542b` |
| `https://vimeo.com/1179671398` (video pubblico) | `id` = `1179671398`, togli la riga `hash` |
| `https://www.youtube.com/watch?v=Ukzs1TpT0p0` | `id` = `Ukzs1TpT0p0` |
| `https://youtube.com/shorts/9zfxDdVHeyc` | `id` = `9zfxDdVHeyc` |

Su Vimeo il video deve avere la privacy che consente l'incorporamento (embed).

### B4. Aggiungi il progetto

1. Su GitHub apri `content/site.json` e premi la **matita** (Edit).
2. Cerca la riga `"projects": [`. I progetti sono elencati nell'ordine in cui compaiono in home.
3. Incolla questo blocco subito dopo `"projects": [` per metterlo al primo posto
   (oppure tra due progetti: ogni progetto va da `{` a `},`):

```json
    {
      "slug": "nuovo-spot",
      "title": "Nuovo Spot",
      "kind": "Commercial",
      "fullTitle": "Nuovo Spot | Commercial",
      "role": "Director",
      "year": "2027",
      "category": "director",
      "cover": "nuovo-spot.jpg",
      "blocks": [
        {
          "type": "video",
          "provider": "vimeo",
          "id": "1179671398",
          "hash": "4ad090542b",
          "width": 1920,
          "height": 1080
        }
      ]
    },
```

4. Cambia i valori tra virgolette:
   - `slug`: l'indirizzo della pagina (`lorenzomangini.com/nuovo-spot`). Minuscolo, trattini al posto degli spazi, unico.
   - `title` / `kind`: titolo e tipo (Commercial, Docu, Reel…). `fullTitle` è il titolo completo.
   - `role`: `Director` oppure `Director of Photography`.
   - `category`: `director`, `dop` oppure `photography` — decide sotto quale filtro compare in home.
   - `cover`: il nome esatto del file caricato al passo B2.
   - `provider`: `vimeo` oppure `youtube`.
   - `width` / `height`: le proporzioni del video. Orizzontale `1920` × `1080`; verticale `1080` × `1920`.
5. **Commit changes**. Dopo un paio di minuti il sito si aggiorna da solo
   (scheda **Actions**: spunta verde = online).

### Varianti utili

**Più video nella stessa pagina** — metti più blocchi dentro `blocks`, separati da virgola.
Per una didascalia sotto un video aggiungi `"caption": "Versione 30 secondi"`.

**Aggiungere un reel alla pagina Vertical ADV** — cerca `"slug": "vertical-adv"`, e dentro i suoi `blocks` aggiungi:

```json
        {
          "type": "video",
          "provider": "youtube",
          "id": "9zfxDdVHeyc",
          "width": 1080,
          "height": 1920
        },
```

**Anteprima diversa dalla copertina** — carica un'immagine in `docs/assets/img/video/` e aggiungi
al video `"thumb": "video/nome-file.jpg"`. Senza `thumb` viene usata la copertina del progetto.

**Togliere un progetto** — cancella tutto il suo blocco, da `{` a `},`.

### Se qualcosa va storto

- **Croce rossa in Actions**: quasi sempre è una virgola o una virgoletta mancante in `site.json`,
  oppure il nome della copertina non coincide con il file caricato. Il sito online resta quello di prima,
  quindi non si rompe nulla: correggi e fai di nuovo Commit.
- Regola delle virgole: tra un blocco `{ … }` e il successivo serve una virgola; dopo l'ultimo di una lista no.
- Per tornare indietro: apri il file → **History** → scegli la versione precedente.
