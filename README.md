# Dove va la tua RAL

Prototipo per il task di selezione **AI Builder @ Jet HR**: da una RAL stima il netto annuale
e mensile e mostra, voce per voce, contributi e imposte trattenuti.

**[Apri la demo](https://deploy-proto-mu.vercel.app)** ·
**[Leggi come l'ho costruita](https://deploy-proto-mu.vercel.app/come-ho-lavorato.html)**

## In trenta secondi

Apri la demo e scrivi `35.000`. Il netto è **26.032,17 €** l'anno, **2.002,47 €** di media su
tredici mensilità. Poi scendi: il flusso del denaro in scala, la catena voce per voce, e ogni
riga che si apre con la sua formula e la sua fonte normativa.

Il prototipo copre deliberatamente **un caso solo**: regole 2026, Milano, impiegato del settore
privato a tempo indeterminato, anno intero, nessun familiare a carico né agevolazione personale.
Non simula un cedolino: stima il carico annuale maturato sulla RAL.

**C'è anche un easter egg.** La soglia che lo attiva non è casuale: racconta un pezzo della
storia di Jet HR, a partire dal suo round pre-seed da 4,7 milioni di euro.

## Perché il calcolo è sotto controllo

- Il motore è separato dall'interfaccia: [`motore.js`](prototipo/motore.js) contiene le regole,
  [`motore.test.js`](prototipo/motore.test.js) le mette alla prova e `index.html` le presenta.
- Le regole vengono da fonti primarie e sono tradotte in tredici passaggi ordinati. Ogni voce
  mostrata rimanda alla propria fonte.
- Il calcolo usa aritmetica decimale a virgola fissa, esplicita le convenzioni di arrotondamento
  e definisce il netto come somma delle voci arrotondate.
- Le prove distinguono correttezza, comportamento alle soglie e non-regressione: una
  riconciliazione contabile, da sola, non viene spacciata per prova di correttezza.

Esecuzione:

```sh
node --test prototipo/motore.test.js
```

Stato verificato alla consegna: **32 test superati su 32**.

## Come orientarsi

Due cartelle: **il prodotto** e **il lavoro che c'è dietro**.

```
prototipo/          IL PRODOTTO
  index.html          la pagina — doppio clic e funziona, senza installare niente
  motore.js           il calcolo, separato per poterlo provare fuori dal browser
  motore.test.js      la matrice di prova
  README.md           le scelte di prodotto e di calcolo, spiegate

processo/           COME CI SONO ARRIVATO
  decisioni.md        il registro: otto ticket, una domanda per ticket
  verifica.md         cosa è provato, come, e cosa dichiaratamente non lo è
  regole-netto-2026.md  la ricerca normativa, solo fonti primarie

curriculum.md       chi sono
```

## Chi sono

**Riccardo Sartori.** Oggi Production Supervisor a *La Nazione | Quotidiano Nazionale*: coordino
un reparto di 8 grafici e porto in chiusura ogni sera le edizioni di QN, La Nazione, Il Resto
del Carlino e Il Giorno. Prima Product Marketing Manager alla Caoduro Spa, e prima ancora
regista documentarista — *50 Liters Life* è finito su Netflix e Disney+, *Tied into me* sulla
televisione svizzera RSI.

Il curriculum completo è in [`curriculum.md`](curriculum.md).
📧 riccsartori@gmail.com · [LinkedIn](https://www.linkedin.com/in/riccsartori/)
