# mi hanno dato un task per un colloquio. non mi hanno preso. l'ho pubblicato lo stesso.

**Dove va la tua RAL**: da una RAL stima il netto annuale e mensile e mostra, voce per voce,
contributi e imposte trattenuti. Regole 2026, lavoro dipendente privato.

**[Apri il calcolatore](https://jethr.riccsartori.com)** ·
**[La storia, con i numeri e i commenti](https://jethr.riccsartori.com/la-storia.html)**

Sette giorni dopo il post: **293.027 impression e 177 commenti**. Molti da consulenti del
lavoro, HR e payroll specialist che mi hanno spiegato, abbastanza precisamente, cosa avevo
sbagliato. Questa è la storia di quello che è successo, e il repository di quello che ne è
uscito.

---

### 01 — DA DOVE È PARTITO

## La candidatura a Jet HR

Mando la candidatura a Jet HR per il ruolo di AI builder. La prima mail che ricevo non è una
risposta, è un task: un calcolatore da RAL a netto che mostri anche dove finiscono tasse e
contributi. Lo costruisco in due giorni. Due giorni dopo mi rifiutano: proseguono con altri
candidati.

Il calcolatore però era lì. Una sera sto cullando mia figlia per l'ottava volta, apro il
telefono e scrivo due righe nel journal — non mi hanno preso, amen, però il task l'ho fatto,
tanto vale pubblicarlo invece di lasciarlo morire in una cartella. Salvo.

Pochi minuti dopo arriva la mail dell'automazione n8n che trasforma i journal in bozze di post.
Mia figlia ancora sveglia. Faccio due aggiustamenti e pubblico.

[Il post, 18 agosto 2026 →](https://www.linkedin.com/posts/riccsartori_dove-va-la-tua-ral-netto-2026-activity-7495589860154572801-31Jx)

---

### 02 — I NUMERI

## Pensavo non lo avrebbe visto nessuno

Presi dall'analytics di LinkedIn il 25 agosto 2026, sette giorni dopo il post.

| Numero | Metrica | Nota |
|---|---|---|
| **293.027** | Impressions | in sette giorni. I sette precedenti erano praticamente zero: +406.882% |
| **988** | Reazioni | più 177 commenti e 7 condivisioni |
| **~400** | Follower nuovi | da circa 1.135 a 1.535, +32% in una settimana |
| **3.736** | Visite al profilo | negli ultimi novanta giorni |

Le impression erano carine. I 177 commenti molto più utili, perché a un certo punto hanno
cominciato a indicarmi dove migliorare il calcolatore, dove era sbagliato e cosa potevo farne.

---

### 03 — I COMMENTI

## 177 commenti. mi hanno praticamente aperto una backlog

Consulenti del lavoro, HR manager, payroll specialist, developer. Mi hanno elencato tutto
quello che mancava. Li ho scaricati e dati a Claude Code cercando i filoni invece delle singole
richieste. Sono usciti sette filoni e sedici ticket, implementabili uno alla volta.

| Cosa mancava | Quante volte | Stato |
|---|---|---|
| Mensilità oltre la tredicesima | 9 | fatto |
| Regione e comune scelti da chi calcola | 7 | aperto |
| Scelta del CCNL | 5 | aperto |
| Nucleo familiare e figli a carico | 5 | aperto |
| Premi di risultato e MBO | 3 | aperto |
| Welfare e fringe benefit | 2 | aperto |
| Costo totale per l'azienda | 1 | aperto |

A quel punto ho smesso di trattarli come commenti. Sono diventati
[ticket](https://github.com/ricca91/jethr-riccardosartori/issues). Se nove persone diverse ti
scrivono che manca la quattordicesima, probabilmente manca la quattordicesima.

> «Un buco di analisi grosso come una casa.»
>
> — Un commento, sulla mancanza della quattordicesima

Il commento tecnico più votato però non chiedeva una feature. Qualcuno ha aperto il codice e ha
scritto che `calcola()` era un blocco unico da settanta righe, numeri magici sparsi, e un solo
test goldmaster — se si rompeva qualcosa non sapevi quale voce avesse sbagliato. Aveva ragione
su tutto.

> «Avrei preferito ricevere l'albero e non il tool: cerco di capire come ragiona la persona.»
>
> — Un altro commento, il motivo per cui questo repository è pubblico

---

### 04 — LA DIREZIONE

## Da task per un colloquio a strumento che si può usare

I commenti non mi hanno solo detto cosa mancava. Mi hanno fatto vedere quanto lontano poteva
andare una cosa nata in due giorni per superare una selezione.

Quando l'ho pubblicato era un artefatto. Serviva a rispondere a un task, copriva un caso solo,
e finito quello avrebbe smesso di servire a qualcosa. Sedici ticket dopo è diventato un'altra
cosa: non ancora finita, ma con una direzione.

La direzione è portarlo dal caso singolo che copre oggi — dipendente privato, Milano, anno
intero — verso i casi veri. Regione e comune scelti da chi calcola. Il CCNL. Il nucleo
familiare. Il costo per l'azienda accanto al netto del lavoratore. Sono problemi grossi, alcuni
più grossi del calcolatore stesso, e li sto affrontando uno alla volta.

So che di strumenti così ne esistono già, compreso quello di Jet HR. Non sto provando a
sostituirli. Questo serve prima di tutto a me: per imparare a costruire qualcosa che regge
davvero, e per mettere insieme un portfolio fatto di cose che funzionano.

---

### 05 — PERIMETRO E LIMITI

## Dove il calcolo vale e dove smette

La parte tecnica ridotta all'osso: quello che serve sapere prima di fidarsi di un numero con
due decimali.

**Il caso coperto.** Regole 2026, Milano, impiegato privato a tempo indeterminato, anno intero,
un datore e un reddito. Nessun familiare a carico, nessun benefit, premio o agevolazione
personale.

**Che numero è.** Il netto annuale maturato sulla RAL, e la sua media su 12, 13 o 14 mensilità.
Non è la previsione del singolo cedolino né del bonifico che arriva a gennaio.

**Il 9,19% non vale per ogni dipendente privato.** Settore, inquadramento INPS, dimensione del
datore e fondi speciali cambiano la contribuzione. Il calcolatore assume FPLD ordinario.

**Sopra 122.295 € la sola RAL non basta.** Lì scatta il massimale e i contributi si fermano a
11.899,62 €, ma vale solo per chi non aveva anzianità contributiva al 31 dicembre 1995. Il
calcolatore mantiene questa assunzione e la segnala nel risultato.

**Nessun consulente del lavoro ha validato questi numeri.** Le regole vengono da fonti primarie
e le ho controllate a mano, ma è un prototipo, non un parere fiscale. E Jet HR ha già un suo
calcolatore pubblico — me l'hanno ricordato nei commenti — che questo non sostituisce.

[Apri il caso a 35.000 €](https://jethr.riccsartori.com/index.html?ral=35.000&m=13&calc=1) ·
[Ricerca normativa e decisioni](https://github.com/ricca91/jethr-riccardosartori/tree/main/processo)

---

### 06 — IL REPOSITORY

## Perché il calcolo è sotto controllo

- Il motore è separato dall'interfaccia: [`motore.js`](prototipo/motore.js) contiene le regole,
  [`motore.test.js`](prototipo/motore.test.js) le mette alla prova e `index.html` le presenta.
- Le regole vengono da fonti primarie e sono tradotte in passaggi ordinati. Ogni voce mostrata
  rimanda alla propria fonte.
- Il calcolo usa aritmetica decimale a virgola fissa, esplicita le convenzioni di arrotondamento
  e definisce il netto come somma delle voci arrotondate.
- Le prove distinguono correttezza, comportamento alle soglie e non-regressione: una
  riconciliazione contabile, da sola, non viene spacciata per prova di correttezza.

```sh
node --test prototipo/*.test.js
```

Stato verificato: **61 test superati su 61**.

## Come orientarsi

Due cartelle: **il prodotto** e **il lavoro che c'è dietro**.

```
prototipo/          IL PRODOTTO
  index.html          la pagina — doppio clic e funziona, senza installare niente
  la-storia.html      questa storia, com'è pubblicata
  motore.js           il calcolo, separato per poterlo provare fuori dal browser
  motore.test.js      la matrice di prova
  righe.js            l'adapter che trasforma ogni Voce in una Riga
  fonti.js            il catalogo delle fonti normative
  README.md           le scelte di prodotto e di calcolo, spiegate

processo/           COME CI SONO ARRIVATO
  decisioni.md        il registro: gli otto ticket iniziali, una domanda per ticket
  verifica.md         cosa è provato, come, e cosa dichiaratamente non lo è
  regole-netto-2026.md  la ricerca normativa, solo fonti primarie

CONTEXT.md          il glossario: Voce, Riga, Capienza, Salto
curriculum.md       chi sono
```

**C'è anche un easter egg.** Tutto inizia da un pezzo di storia di Jet HR. Trovato?

---

### E POI SONO ARRIVATE LE CALL

## Il lavoro non l'ho preso

Il lavoro in Jet HR non l'ho preso. Sono arrivate decine di messaggi e qualche call. Una con
un'azienda lombarda da quindici milioni di fatturato: CTO molto tecnico, un problema che gli
gira in testa da sette mesi, software su misura, un budget. È finita con «preparo l'incontro?».
Un'altra per un ruolo da product builder. Non so se una di queste cose andrà da qualche parte.

La parte buffa è che durante una delle call mi hanno descritto il lavoro — parlare con gli
utenti, guardare cosa succede nel prodotto, fare prototipi, capire cosa regge e poi passarlo
agli sviluppatori. Era abbastanza vicino a quello che stavo già facendo qui.

Comunque. Il lavoro originale non l'ho preso.

> **Il calcolatore è ancora online. La backlog pure.**

## Chi sono

**Riccardo Sartori.** Oggi Production Supervisor a *La Nazione | Quotidiano Nazionale*: coordino
un reparto di 8 grafici e porto in chiusura ogni sera le edizioni di QN, La Nazione, Il Resto
del Carlino e Il Giorno. Prima Product Marketing Manager alla Caoduro Spa, e prima ancora
regista documentarista — *50 Liters Life* è finito su Netflix e Disney+, *Tied into me* sulla
televisione svizzera RSI.

Il curriculum completo è in [`curriculum.md`](curriculum.md).
📧 riccsartori@gmail.com · [LinkedIn](https://www.linkedin.com/in/riccsartori/)
