# Verifica

Che cosa è provato di questo calcolatore, con quale prova, e — la parte che rende
difendibile il resto — che cosa **non** è provato.

## Come si esegue

```
node --test prototipo/motore.test.js
```

Node 18 o successivo. Nessuna dipendenza, nessun `package.json`, niente da installare.
Il motore (`prototipo/motore.js`) è uno script classico: la stessa riga di codice
gira nella pagina aperta con un doppio clic e in Node, senza duplicati.

Stato al 13 agosto 2026: **32 prove, tutte verdi** (Node v22.22.2).

## Le tre categorie, e perché stanno separate

Due prove che sembrano prove e non lo sono:

- La **riconciliazione** — `RAL − contributi − imposte + integrazioni = netto` — conferma
  un'identità algebrica, non la correttezza. Il contratto *definisce* il netto come somma
  delle voci, quindi il controllo non può fallire nemmeno con le aliquote sbagliate.
  Resta come guardia a ogni ricalcolo, non come prova.
- Il **golden** rigenerato dal motore prova che nessuno ha cambiato niente. Se il motore
  sbagliasse oggi, congelerebbe l'errore e ci metterebbe un test verde a guardia.

La correttezza può venire da un posto solo: il confronto a mano con la norma. Costa,
quindi si fa in pochi punti scelti. Da qui le tre categorie, etichettate nel file di test.

| | Categoria | Che cosa prova | Come |
|---|---|---|---|
| **A** | Correttezza | che il numero è giusto | poche ancore, derivate a mano dalla norma e scritte per esteso nei commenti |
| **B** | Comportamento ai limiti | che le discontinuità di legge ci sono tutte, con la causa giusta | i sette salti e i quattro cambi di pendenza, presi a un centesimo di distanza, più gli input estremi |
| **C** | Non-regressione | che nessuno ha cambiato niente | 2.001 campioni a passo di 100 € da 0 a 200.000 €, più il golden |

### A — le ancore verificate a mano

- **RAL 35.000, voce per voce.** La derivazione completa è nel commento sopra il test:
  contributi 3.216,50 · IRPEF lorda 7.688,56 · detrazione art. 13 1.581,48 più 65 ·
  ulteriore detrazione 1.000 · addizionale regionale 454,98 · addizionale comunale 254,27 ·
  **netto 26.032,17**.
- **RAL 25.327,61 → 25.327,62.** L'esenzione dell'addizionale comunale di Milano è
  un'esenzione, non una franchigia: un centesimo lordo in più costa 183,99 € netti l'anno.
  È legge, non un errore di arrotondamento.
- **RAL 122.295 e oltre.** I contributi si fermano a 11.899,62 € e non si muovono più:
  l'aliquota effettiva scende dal 9,73% al 5,95% a 200.000 € e all'1,19% a un milione.
- **RAL 0 → netto 0.** Capienza: le detrazioni abbattono l'imposta ma non sono
  rimborsabili. Senza questo vincolo il netto a RAL 0 risulterebbe di 1.955 €.

### B — le sette soglie, con la causa e non solo l'effetto

Per ogni soglia il test controlla due cose: che il salto abbia il segno e la magnitudine
attesi entro un centesimo, e che sia **la voce giusta a comparire o a sparire** — il
trattamento integrativo, l'addizionale comunale, la maggiorazione di 65 €. La verifica
strutturale è la parte che un motore sbagliato ma internamente coerente non supera.

L'invariante di monotonicità è formulato in modo da non bocciare il motore giusto:

> Il netto è continuo e crescente in RAL **ovunque tranne** nelle sette soglie note, e in
> ciascuna di esse il salto ha esattamente il segno e la magnitudine documentati.

«Il netto cresce sempre» sarebbe falso: quattro dei sette salti vanno all'ingiù e sono
legge. Un test così boccerebbe l'implementazione corretta, e la reazione naturale sarebbe
"aggiustare" un motore che funziona.

## La convenzione di arrotondamento

Il contratto impone due cose: troncamento alle prime **quattro cifre decimali** sui
rapporti dell'art. 13, e netto definito come **somma delle voci arrotondate** al centesimo
(HALF_UP). Aritmetica decimale a virgola fissa su `BigInt`, scala 1e-8: mai virgola mobile
binaria.

A RAL 35.000 il valore canonico è quindi **26.032,17**. I numeri citati nei documenti di
ricerca a monte — 26.032,18 e 26.032,22 — nascono da precisione piena sul rapporto
dell'art. 13 con arrotondamento solo alla fine. Sono errata dichiarati, non un modello
alternativo: la differenza è di quattro centesimi sulla detrazione, ed è *quando* si
arrotonda, non *quanto* si applica.

Per la stessa ragione i valori attesi dei test si **rigenerano dal motore** e non si
ricopiano dai documenti a monte. Sei delle sette soglie cadono uno o due centesimi più
in alto delle posizioni annotate durante la ricerca.

## L'estrazione del motore

Il motore è stato tolto dalla pagina e messo in un file a parte per poterlo provare fuori
dal browser. Per escludere che l'operazione avesse spostato un centesimo, la versione
estratta è stata confrontata con quella originale su **20.019 punti** — passo di 10 € da
0 a 200.000 €, più le sette soglie a un centesimo di distanza e gli input estremi —
confrontando l'oggetto risultato **intero**, non solo il netto: zero divergenze.

## Accessibilità: checklist manuale

Verificata a mano, non con uno strumento automatico. Automatizzarla comprerebbe copertura
su ciò che già sappiamo e nessuna su ciò che conta.

| Criterio | Esito |
|---|---|
| Nessun overflow orizzontale a 390 px | ✅ `scrollWidth` = `clientWidth` = 390 in quattro stati: vuoto, 35.000, 12.000 con integrazioni, sette cifre. La barra delle ancore scorre dentro il proprio contenitore, non trascina la pagina |
| Testo equivalente del money flow | ✅ frase completa in `.sr` sotto l'SVG, con tutti gli importi |
| Navigazione da tastiera | ✅ dopo una correzione: le fasce del flusso sono elementi SVG e non hanno il metodo `click()`, quindi Invio sulla fascia lanciava un errore e non apriva niente |
| Fuoco sul pannello della voce | ✅ dopo una correzione: la pagina si ridisegna sostituendo l'HTML, quindi il fuoco tornava a inizio pagina a ogni voce aperta. Ora viene restituito al comando che l'aveva. Le righe della catena usano `aria-expanded` e `aria-controls`, non `aria-pressed`: aprono un pannello, non attivano uno stato |
| Contrasto | ✅ dopo una correzione: 42 coppie testo/sfondo misurate su due stati, zero sotto il minimo AA. L'etichetta bianca dentro la barra verde stava a 2,03 contro un minimo di 4,5 ed è passata a inchiostro scuro |

## Cosa NON è provato

- **Nessuna validazione da un consulente del lavoro.** I numeri sono derivati da fonti
  primarie e ricontrollati a mano, non asseverati da chi fa buste paga di mestiere.
- **Competenza, non cassa.** Non è la simulazione di un cedolino: è il carico maturato
  sulla RAL dell'anno. Le addizionali si pagano a rate dopo il conguaglio. Per questo
  la cifra mensile è etichettata *media*, mai «importo del cedolino».
- **Sopra 122.295 € si assume la prima iscrizione previdenziale dal 1996.** Il massimale
  vale solo per chi è privo di anzianità al 31/12/1995. È l'unico punto del modello in cui
  la sola RAL non basta più, e l'input non può dirlo.
- **Il 9,19% è una scelta di modello**, non un'aliquota universale: inquadramento INPS,
  settore, dimensione del datore e fondi speciali possono cambiarla.
- **Un solo caso.** Milano, impiegato del settore privato, anno intero, tempo pieno,
  nessun familiare a carico, nessun altro reddito, nessun onere deducibile o detraibile.
  Fuori da qui il calcolo non è dichiarato valido.
