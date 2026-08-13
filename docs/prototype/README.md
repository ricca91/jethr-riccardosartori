# Dove va la tua RAL — calcolatore netto 2026

Una pagina che risponde a una domanda sola: di una retribuzione annua lorda, quanto resta
in tasca, dove finisce il resto e perché.

Un solo dato da inserire, la RAL. Anno, città e contratto non sono selezionabili: sono
dichiarati in cima alla pagina — **regole 2026, Milano, settore privato, tempo
indeterminato, anno intero**. Un caso solo, spiegato per intero, invece di un modulo lungo
prima del primo risultato.

## I file

| File | Che cos'è |
|---|---|
| `index.html` | la pagina, autoportante |
| `motore.js` | il calcolo, separato per poterlo provare fuori dal browser |
| `motore.test.js` | la matrice di prova |
| `../verifica.md` | che cosa è provato, come, e che cosa non lo è |

## Come si apre

Doppio clic su `index.html`, tenendo `motore.js` nella stessa cartella.
Nessuna dipendenza, nessun passo di build, nessuna richiesta di rete: i caratteri
Wix Madefor Display sono incorporati nel file, quindi la pagina funziona anche offline.

Il motore è uno script classico e non un modulo ES proprio per questo: i moduli non si
caricano da `file://`, gli script classici sì.

Lo stato sta nell'URL (`?ral=&m=&calc=1`), quindi ogni schermata è condivisibile.

## Come si provano i numeri

```
node --test docs/prototype/motore.test.js
```

Node 18 o successivo, zero dipendenze. Lo stesso file `motore.js` che gira nella pagina
gira in Node: nessuna logica duplicata fra pagina e prove.

Dettagli in [`docs/verifica.md`](../verifica.md).

## Le tre scelte che spiegano la pagina

**1. La risposta prima di tutto, poi il resto in tre livelli.** Netto mensile grande e
subito; sotto, il flusso del denaro in scala; sotto ancora, la catena voce per voce con
formula, base di calcolo e fonte normativa di ogni riga. Chi vuole solo il numero si ferma
alla prima schermata; chi non si fida scende fino alla norma.

**2. Le soglie si mostrano, non si nascondono.** In alcuni punti un euro lordo in più fa
*scendere* il netto: a 25.327,62 € di RAL finisce l'esenzione dell'addizionale comunale
di Milano e il netto perde 184 € l'anno. È un'esenzione, non una franchigia. Un
calcolatore che liscia quel gradino mente; questo lo calcola e lo spiega nelle FAQ.

**3. Ogni euro torna, per costruzione.** Il netto non è un totale calcolato a parte e poi
confrontato con le voci: **è** la somma delle voci arrotondate. La verifica gira a ogni
ricalcolo, non solo nelle prove, quindi la pagina non può mostrare una tabella che non
chiude.

## Il calcolo

Aritmetica decimale a virgola fissa su `BigInt`, scala 1e-8, mai virgola mobile binaria.
Tredici passi in ordine vincolante: contributi, imponibile, IRPEF lorda per scaglioni,
detrazioni con la capienza, IRPEF netta, addizionali — dovute solo se l'IRPEF netta è
positiva — e integrazioni di legge. Troncamento a quattro decimali solo sui rapporti
dell'art. 13, dove la norma lo impone.

Versione delle regole: `regole-2026-v1`. Fonti primarie, tutte citate nella pagina:
leggi di bilancio 2025 e 2026, TUIR, circolari INPS, Regione Lombardia, Comune di Milano.

Il selettore **12/13 mensilità** si applica senza ricalcolare nulla: divide un netto annuo
già calcolato. È la dimostrazione a schermo di una tesi del modello — le mensilità sono
presentazione, non calcolo. Se richiedessero un ricalcolo, la pagina direbbe il contrario
di quello che afferma.

## Come si pubblica

La demo è un deploy statico della sola cartella, senza passo di build:

```
vercel deploy --prod docs/prototype
```
