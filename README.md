# Dove va la tua RAL

Una pagina che risponde a una domanda sola: di una retribuzione annua lorda, quanto resta
in tasca, dove finisce il resto e perché.

**Demo:** https://deploy-proto-mu.vercel.app

> Esercizio di candidatura per **Jet HR**. È un artefatto dimostrativo, non un motore payroll:
> serve a mostrare come lavoro su un dominio dove i numeri devono tornare al centesimo.
> Che cosa non è, sta scritto in fondo a questa pagina e — più in dettaglio — in
> [`docs/verifica.md`](docs/verifica.md).

## Guardalo in trenta secondi

Apri la demo e scrivi `35.000`. Il netto è **26.032,17 €** l'anno, **2.002,47 €** di media su
tredici mensilità. Poi scendi: il flusso del denaro in scala, la catena voce per voce, e ogni
riga che si apre con la sua formula e la sua fonte normativa.

Se vuoi vedere la parte interessante, prova **25.327,61** e poi **25.327,62**. Un centesimo
lordo in più toglie 184 € netti l'anno: finisce l'esenzione dell'addizionale comunale di
Milano, che è un'esenzione e non una franchigia. È legge, non un errore di arrotondamento —
e un calcolatore che liscia quel gradino sta mentendo.

## Il percorso di lettura

Tre porte, in ordine di tempo che costano.

| Tempo | Dove | Che cosa ci trovi |
|---|---|---|
| 30 secondi | [la demo](https://deploy-proto-mu.vercel.app) | il prodotto |
| 5 minuti | [`docs/verifica.md`](docs/verifica.md) | che cosa è provato, come, e che cosa **non** lo è |
| 20 minuti | [`docs/decisioni.md`](docs/decisioni.md) | come ci sono arrivato: una domanda per ticket, il registro delle decisioni |
| a piacere | [`docs/prototype/`](docs/prototype/) | il codice: la pagina, il motore, le prove |

## Come ho lavorato

Non ho aperto l'editor per primo. Ho aperto **una domanda per ticket**, e ogni ticket si chiude
con un commento di risoluzione che fissa una decisione e la motiva. I ticket sono
[le issue di questo repo](https://github.com/ricca91/jethr-riccardosartori/issues?q=is%3Aissue),
la mappa è la [#1](https://github.com/ricca91/jethr-riccardosartori/issues/1).

Il metodo serve a una cosa sola: **separare le decisioni dal codice**. Quando il motore e la
pagina sono arrivati, le domande difficili — quale aliquota, quale arrotondamento, quale prova
è sufficiente — erano già state discusse e chiuse per iscritto. Il codice è diventato la
trascrizione di decisioni prese, non il posto dove prenderle.

Si vede anche dove ho sbagliato. Il ticket [#4](https://github.com/ricca91/jethr-riccardosartori/issues/4)
fissa una convenzione di arrotondamento e poi, nella sua sezione *Verifica*, cita numeri
calcolati con la convenzione opposta. Se ne è accorto il [#6](https://github.com/ricca91/jethr-riccardosartori/issues/6),
che ha reso vincolante una regola: **i valori attesi si rigenerano dal motore, non si ricopiano
dai ticket a monte.** L'errore è rimasto scritto dov'era, con l'errata accanto, invece di essere
riscritto: è la parte del registro che vale di più.

[`docs/decisioni.md`](docs/decisioni.md) è l'indice: otto ticket, una riga a testa.

## Che cosa c'è nel repo

```
README.md                        questa pagina
docs/
  decisioni.md                   il registro: come sono state prese le decisioni
  verifica.md                    cosa è provato, come, e cosa dichiaratamente no
  prototype/
    index.html                   la pagina, autoportante — doppio clic e funziona
    motore.js                    il calcolo, separato per poterlo provare
    motore.test.js               la matrice di prova
    README.md                    le scelte di prodotto e di calcolo
  research/
    regole-netto-2026.md         la ricerca normativa, solo fonti primarie
```

## Come si prova

```
node --test docs/prototype/motore.test.js
```

Node 18 o successivo. Nessuna dipendenza, nessun `package.json`, niente da installare:
**32 prove**, divise in tre categorie tenute separate perché provano cose diverse —
correttezza, comportamento ai limiti, non-regressione.

La pagina si apre con un doppio clic su `docs/prototype/index.html`, senza server e senza
rete: i caratteri sono incorporati nel file. Per questo il motore è uno script classico e non
un modulo ES — i moduli non si caricano da `file://`.

## Che cosa non è

Un caso solo, dichiarato in cima alla pagina invece che nascosto in nota: **regole 2026,
Milano, settore privato, tempo indeterminato, anno intero**. Niente familiari a carico, altri
redditi, oneri, benefit, CCNL, TFR o costo azienda. Nessuno di questi si ricava dalla sola RAL,
e chiederli significherebbe un modulo lungo prima del primo risultato.

Il calcolo è di **competenza, non di cassa**: è il carico maturato sulla RAL dell'anno, non il
denaro trattenuto sui cedolini. Per questo la cifra mensile è etichettata *media*, mai
«importo del cedolino».

Nessun consulente del lavoro ha validato questi numeri. L'elenco completo dei limiti sta in
[`docs/verifica.md`](docs/verifica.md), con lo stesso rilievo della matrice di prova.
