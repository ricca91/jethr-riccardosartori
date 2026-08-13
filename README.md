# Dove va la tua RAL

Una pagina che risponde a una domanda sola: di una retribuzione annua lorda, quanto resta in
tasca, dove finisce il resto e perché.

**Demo:** https://deploy-proto-mu.vercel.app

> Esercizio di candidatura per **Jet HR**, agosto 2026. È un artefatto dimostrativo, non un
> motore payroll: serve a mostrare come lavoro su un dominio dove i numeri devono tornare al
> centesimo e ogni regola deve avere una fonte.

## Chi sono

**Riccardo Sartori.** Oggi Production Supervisor a *La Nazione | Quotidiano Nazionale*: coordino
un reparto di 8 grafici e porto in chiusura ogni sera le edizioni di QN, La Nazione, Il Resto
del Carlino e Il Giorno. Prima Product Marketing Manager alla Caoduro Spa, e prima ancora
regista documentarista — *50 Liters Life* è finito su Netflix e Disney+, *Tied into me* sulla
televisione svizzera RSI.

Non vengo dallo sviluppo software. Vengo da mestieri in cui una cosa complicata va resa
comprensibile a chi non la conosce, entro una scadenza che non si sposta: un documentario, una
prima pagina, il lancio di un prodotto. Un calcolatore che spiega dove finisce il tuo stipendio
è lo stesso problema con altri strumenti.

È anche il motivo per cui questa repo è organizzata così. La parte difficile non è stata
scrivere il codice: è stata decidere quale aliquota, quale arrotondamento, quale prova basta —
e quelle decisioni sono scritte, non nascoste nei commit.

Il curriculum completo è in [`curriculum.md`](curriculum.md).
📧 riccardosartori@outlook.com · [LinkedIn](https://www.linkedin.com/in/riccsartori/)

## Guardalo in trenta secondi

Apri la demo e scrivi `35.000`. Il netto è **26.032,17 €** l'anno, **2.002,47 €** di media su
tredici mensilità. Poi scendi: il flusso del denaro in scala, la catena voce per voce, e ogni
riga che si apre con la sua formula e la sua fonte normativa.

Se vuoi vedere la parte interessante, prova **25.327,61** e poi **25.327,62**. Un centesimo
lordo in più toglie 184 € netti l'anno: finisce l'esenzione dell'addizionale comunale di
Milano, che è un'esenzione e non una franchigia. È legge, non un errore di arrotondamento — e
un calcolatore che liscia quel gradino sta mentendo.

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

Se hai poco tempo, in ordine di quanto costano:

| Tempo | Dove | Che cosa ci trovi |
|---|---|---|
| 30 secondi | [la demo](https://deploy-proto-mu.vercel.app) | il prodotto |
| 5 minuti | [`processo/verifica.md`](processo/verifica.md) | perché fidarsi dei numeri, e dove smettono di valere |
| 20 minuti | [`processo/decisioni.md`](processo/decisioni.md) | come ho lavorato, ticket per ticket |
| a piacere | [`prototipo/`](prototipo/) | il codice |

## Come ho lavorato

Non ho aperto l'editor per primo. Ho aperto **una domanda per ticket**, e ogni ticket si chiude
con un commento di risoluzione che fissa una decisione e la motiva. I ticket sono
[le issue di questo repo](https://github.com/ricca91/jethr-riccardosartori/issues?q=is%3Aissue),
la mappa è la [#1](https://github.com/ricca91/jethr-riccardosartori/issues/1).

Il metodo serve a una cosa sola: **separare le decisioni dal codice**. Quando il motore e la
pagina sono arrivati, le domande difficili erano già state discusse e chiuse per iscritto. Il
codice è diventato la trascrizione di decisioni prese, non il posto dove prenderle.

Si vede anche dove ho sbagliato. Il ticket [#4](https://github.com/ricca91/jethr-riccardosartori/issues/4)
fissa una convenzione di arrotondamento e poi, nella sua sezione *Verifica*, cita numeri
calcolati con la convenzione opposta. Se ne è accorto il [#6](https://github.com/ricca91/jethr-riccardosartori/issues/6),
che ha reso vincolante una regola: **i valori attesi si rigenerano dal motore, non si ricopiano
dai ticket a monte.** L'errore è rimasto scritto dov'era, con l'errata accanto, invece di
essere riscritto: è la parte del registro che vale di più.

## Come si prova

```
node --test prototipo/motore.test.js
```

Node 18 o successivo. Nessuna dipendenza, nessun `package.json`, niente da installare:
**32 prove**, divise in tre categorie tenute separate perché provano cose diverse —
correttezza, comportamento ai limiti, non-regressione.

La pagina si apre con un doppio clic su `prototipo/index.html`, senza server e senza rete: i
caratteri sono incorporati nel file. Per questo il motore è uno script classico e non un modulo
ES — i moduli non si caricano da `file://`.

## Che cosa non è

Un caso solo, dichiarato in cima alla pagina invece che nascosto in nota: **regole 2026,
Milano, settore privato, tempo indeterminato, anno intero**. Niente familiari a carico, altri
redditi, oneri, benefit, CCNL, TFR o costo azienda. Nessuno di questi si ricava dalla sola RAL,
e chiederli significherebbe un modulo lungo prima del primo risultato.

Il calcolo è di **competenza, non di cassa**: è il carico maturato sulla RAL dell'anno, non il
denaro trattenuto sui cedolini. Per questo la cifra mensile è etichettata *media*, mai
«importo del cedolino».

Nessun consulente del lavoro ha validato questi numeri. L'elenco completo dei limiti sta in
[`processo/verifica.md`](processo/verifica.md), con lo stesso rilievo della matrice di prova.
