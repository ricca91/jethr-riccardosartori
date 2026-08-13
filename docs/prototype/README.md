# Prototipo #5 — architettura dell'informazione

Codice **usa e getta**. Non è il prodotto e non va promosso in `main`: serve solo a rendere
reagibile la domanda del ticket
[#5](https://github.com/ricca91/jethr-riccardosartori/issues/5) — *quale architettura
dell'informazione traduce la tesi «ti mostro dove va la tua RAL»*.

## Come si apre

Un solo file, nessuna dipendenza: apri `ia-ral-netto.html` con un doppio clic.

## Le tre varianti

Si cambia dalla barra in basso o con i tasti ← →. Lo stato è serializzato nell'URL
(`?variant=&ral=&m=&spiega=&w=&tab=`), quindi ogni schermata è condivisibile e ricaricabile.

| | Variante | Eroe della pagina | Affordance principale |
|---|---|---|---|
| **A** | Il flusso | il money flow Sankey, subito sotto l'input | si scorre; si clicca una banda per scendere nel dettaglio |
| **B** | Il libro mastro | la tabella a operatori firmati, in due colonne | ogni riga si apre in linea con formula e fonte |
| **C** | La risposta secca | un numero solo, grande | le tre schede (flusso / dettaglio / metodo) |

Controlli trasversali nella barra: **Spiegami il calcolo** e la **finestra di visibilità delle
soglie** (`mai` · 100 · 500 · 1.500 · 4.000 €), cioè la costante che #4 ha lasciato
esplicitamente alla presentazione.

## Il motore è quello vero

Il calcolo implementa il contratto di #4 (`regole-2026-v1`) in aritmetica decimale a virgola
fissa su `BigInt`, scala 1e-8, mai float binario: tredici passi nell'ordine vincolante,
troncamento a 4 decimali solo sui rapporti dell'art. 13, netto definito come somma delle voci
arrotondate. I numeri a schermo sono quindi reali, non mockup.

Verifiche eseguite su questa implementazione:

- le sei voci a RAL 35.000 coincidono al centesimo con la tabella di riconciliazione di #2;
- riconciliazione verificata su 1.460 campioni fra 0 e 200.000 €, zero fallimenti;
- i **sette salti** di #4 si ripresentano tutti, con gli stessi importi;
- nessun overflow orizzontale a 390 px in nessuna variante e nessuna scheda.

Due comportamenti sono stati corretti rispetto a una lettura ingenua del contratto:

1. **Capienza.** Le detrazioni non sono rimborsabili: la voce mostra la quota *effettivamente
   usata* (con la spettante in chiaro nella spiegazione), altrimenti a RAL 0 il netto risultava
   di 1.955 € invece che 0.
2. **Input negativo** bloccato con messaggio dedicato, distinto dal non numerico.


---

# v2 — dopo il primo giro di feedback

`ia-ral-netto-v2.html`. Base scelta: la **C** del primo giro (risposta prima di tutto).
Quattro cambiamenti sostanziali.

## 1. Aspetto Jet HR, non più neutro

Non è uno screenshot copiato: la pagina è costruita sui **token estratti dal loro sito**
(`candidature/jethr/design/`), tre strati di variabili CSS più la libreria di 108 componenti
`jet-*`. Wix Madefor Display è incorporato nel file come data URI, quindi il prototipo gira
offline senza CDN. Nero verdastro `#11150a`, grigi caldi tirati verso l'oliva, bordi da 1px
al posto delle ombre, raggio 6px sui controlli e 16–24px sui contenitori.

Il **lime evidenzia, non riempie**: compare solo nel badge dell'anno, nel trattino
dell'occhiello, nella voce attiva della catena e nelle integrazioni di legge. Il flusso usa un
verde Jet per ciò che resta, un bruno per ciò che se ne va e un grigio caldo per i contributi —
che non sono una tassa e non devono sembrarlo.

## 2. Bottone «Calcola»

Prima si compila, poi si calcola. Il risultato è **committed**: cambiare la RAL dopo il calcolo
non aggiorna i numeri di nascosto, mostra un avviso che invita a ricalcolare. Invio nel campo
equivale a premere Calcola.

Unica eccezione deliberata: il selettore **12/13 si applica subito**, senza ricalcolare. È la
dimostrazione a schermo della tesi di #4 — le mensilità sono presentazione, non calcolo.
Se richiedessero un ricalcolo, la pagina direbbe il contrario di quello che afferma.

## 3. Sezioni impilate al posto delle schede

Le tre schede della v1 erano strette e nascondevano il contenuto. Ora sono **cinque sezioni
in colonna**, larghe, con occhiello, titolo e sommario, nell'ordine della progressive
disclosure di #3: *Livello 1 — la risposta*, *Livello 2 — il flusso*, *Livello 3 — il dettaglio*,
*Metodo e fonti*, *Domande frequenti*. La navigazione ad ancore le lega con scrollspy.

Il dettaglio sfrutta la larghezza: la catena a operatori firmati a sinistra, e a destra un
pannello che mostra formula, base e fonte della voce selezionata.

Prima di calcolare la pagina non è vuota: mostra *Cifre chiave 2026* e le FAQ, come fa Stipendee.

## 4. Le tre versioni ora variano sulla navigazione

| | Versione | Come si naviga il risultato |
|---|---|---|
| **A** | Indice laterale | colonna sticky a sinistra con indice e netto annuo sempre visibile |
| **B** | Barra di ancore | barra sticky in cima con mini-riepilogo, sezioni a fasce alternate bianco/avorio |
| **C** | Riepilogo persistente | barra nera sticky con netto annuo e media, ancore incluse |

## Verifiche

Motore **identico alla v1** e non toccato: 26.032,17 a RAL 35.000, riconciliazione su 1.460
campioni senza fallimenti. Nessun overflow orizzontale a 390 px in nessuna versione, né prima
né dopo il calcolo, incluso il caso RAL a sette cifre.
