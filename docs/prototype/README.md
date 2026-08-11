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
