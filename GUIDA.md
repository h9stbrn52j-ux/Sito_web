# Guida rapida

La guida completa, illustrata passo per passo, è nel file **[Guida-sito.pdf](Guida-sito.pdf)**.
Qui sotto c'è la versione breve.

## A. Da Adobe Portfolio al nuovo sito (una volta sola)

1. GitHub → repository `Sito_web` → **Settings → General → Default branch** → scegli `main`.
2. **Settings → General → Danger Zone → Change visibility → Public** (necessario con l'account gratuito).
3. **Settings → Pages → Source → GitHub Actions**. Poi scheda **Actions → Pubblica il sito → Run workflow**
   e attendi la spunta verde. Torna in **Settings → Pages**, scrivi `lorenzomangini.com` in **Custom domain** e salva.
4. Namecheap → **Domain List → Manage → Advanced DNS**. Fai uno screenshot dei record esistenti.
   **Non toccare i record MX e TXT** (servono all'email).
5. Elimina i record che portano ad Adobe (`www` → `…myportfolio.com` e i record `@` di tipo A / URL Redirect) e aggiungi:

   | Type | Host | Value |
   | --- | --- | --- |
   | A Record | `@` | `185.199.108.153` |
   | A Record | `@` | `185.199.109.153` |
   | A Record | `@` | `185.199.110.153` |
   | A Record | `@` | `185.199.111.153` |
   | CNAME Record | `www` | `h9stbrn52j-ux.github.io` |

6. Dopo qualche minuto/ora: in **Settings → Pages** spunta **Enforce HTTPS**, controlla
   `https://lorenzomangini.com` e solo allora scollega il dominio da Adobe Portfolio.

## B. Aggiungere un nuovo video (3 minuti)

1. Prepara una copertina JPG orizzontale 16:9, larga circa 1600 px, con un nome semplice: `nuovo-spot.jpg`.
2. GitHub → cartella `docs/assets/img/covers` → **Add file → Upload files** → **Commit changes**.
3. Apri `content/site.json` → matita ✎ → subito dopo la riga `"projects": [` incolla:

   ```json
       {
         "title": "Nuovo Spot",
         "kind":  "Commercial",
         "role":  "Director",
         "year":  "2027",
         "cover": "nuovo-spot.jpg",
         "video": "https://vimeo.com/1179671398/4ad090542b"
       },
   ```

   Cambia solo i testi tra virgolette a destra dei due punti.
   `role` può essere `Director` oppure `Director of Photography`.
4. **Commit changes**. Dopo circa 2 minuti il sito è aggiornato.

L'indirizzo della pagina, i filtri della home e l'**animazione iniziale** si aggiornano da soli:
i fotogrammi dell'intro sono le copertine dei progetti.

### Varianti

- Video verticale: aggiungi la riga `"vertical": true` (con una virgola alla fine della riga precedente).
- Più video nella stessa pagina: `"video": ["link-uno", "link-due"]`.
- Nuovo reel nella pagina Vertical ADV: nel progetto `vertical-adv`, dentro `"blocks": [`, aggiungi `{ "reel": "link" },`.
- Cambiare l'ordine in home: sposta il blocco del progetto più in alto o più in basso.
- Togliere un progetto: cancella il suo blocco, dalla `{` alla `},`.

### Se compare una croce rossa in Actions

Il sito online resta quello di prima: non si rompe nulla. Clicca sulla croce: una riga `ERRORE`
spiega cosa manca. Di solito è una virgola o una virgoletta cancellata, oppure il nome in `"cover"`
diverso dal file caricato. Correggi e salva di nuovo.
