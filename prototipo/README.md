# Dove va la tua RAL — calcolatore netto 2026

Una pagina che risponde a una domanda sola: di una retribuzione annua lorda, quanto resta
in tasca, dove finisce il resto e perché.

Si inserisce la RAL e si sceglie il domicilio fiscale con tre controlli dipendenti:
**regione → provincia → comune**. Il profilo resta dichiarato — regole 2026, settore
privato, tempo indeterminato, anno intero — mentre le addizionali coprono tutti i 7.894
comuni Istat attivi nello snapshot del 21 febbraio 2026.

## I file

| File | Che cos'è |
|---|---|
| `index.html` | la pagina, autoportante |
| `come-ho-lavorato.html` | la nota di lavoro: perimetro, modello, verifica, limiti |
| `motore.js` | il calcolo, separato per poterlo provare fuori dal browser |
| `motore.test.js` | la matrice di prova |
| `righe.js` | l'adapter che trasforma ogni Voce in una Riga |
| `righe.test.js` | le prove della seam Voce → Riga |
| `fonti.js` | il catalogo delle fonti normative usato da pagina e adapter |
| `geografia.js` | la piccola interface per elenchi dipendenti e risoluzione per codice catastale |
| `dati-addizionali-2026.js` | lo snapshot runtime generato da Istat e MEF |
| `../processo/attrezzi/importa-addizionali.js` | l'import deterministico degli snapshot ufficiali |
| `../processo/verifica.md` | che cosa è provato, come, e che cosa non lo è |

## Come si apre

Doppio clic su `index.html`, tenendo `motore.js`, `righe.js` e `fonti.js` nella stessa cartella.
Nessuna dipendenza, nessun passo di build, nessuna richiesta di rete: i caratteri
Wix Madefor Display sono incorporati nel file, quindi la pagina funziona anche offline.
Vale anche per `come-ho-lavorato.html`, che porta la propria copia dei caratteri per
restare apribile da sola.

Il motore è uno script classico e non un modulo ES proprio per questo: i moduli non si
caricano da `file://`, gli script classici sì.

Lo stato sta nell'URL (`?ral=&m=&c=&calc=1`), incluso il codice catastale del comune,
quindi ogni schermata è condivisibile.

## Come si provano i numeri

```
node --test prototipo/*.test.js
```

Node 18 o successivo, zero dipendenze. Lo stesso file `motore.js` che gira nella pagina
gira in Node: nessuna logica duplicata fra pagina e prove.

Dettagli in [`processo/verifica.md`](../processo/verifica.md).

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

Versione delle regole: `regole-2026-v2`. Fonti primarie, tutte citate nella pagina:
leggi di bilancio 2025 e 2026, TUIR, circolari INPS, Istat e MEF. Le pubblicazioni
comunali 2026 si sovrappongono alla disciplina 2025 prorogata; ogni regola conserva
annualità, `asOf`, stato definitivo/provvisorio ed estremi disponibili della delibera.

Per rigenerare lo snapshot, dopo aver sostituito i quattro file ufficiali in
`processo/dati/fonti/`, eseguire:

```
node processo/attrezzi/importa-addizionali.js
```

L'input accetta RAL da 0 a **1.000.000 €**. Oltre, il calcolatore si ferma e lo dice:
il modello non è pensato per quelle cifre e restituire un numero preciso su un caso
fuori perimetro sarebbe peggio che non rispondere. Sopra **122.295 €** il risultato
compare con l'avviso che assume nessuna anzianità contributiva al 31 dicembre 1995 —
l'unico punto in cui la sola RAL non basta più.

`calcola()` restituisce soltanto il risultato annuale. Il selettore **12/13/14 mensilità**
passa quel risultato ad `applicaMensilita()`, che divide il netto annuo già calcolato.
È la dimostrazione a schermo di una tesi del modello — le mensilità sono presentazione,
non calcolo. Se richiedessero un ricalcolo, la pagina direbbe il contrario di quello che
afferma.

## Come si pubblica

La demo è un deploy statico della sola cartella, senza passo di build:

```
vercel deploy --prod prototipo
```

Il progetto Vercel si chiama `jethr` e risponde su **https://jethr.riccsartori.com**.

Il deploy parte dalla riga di comando, non da un push: il repo **non** è collegato a
Vercel. `git push` aggiorna GitHub e lascia la demo com'era. Se una copia nuova del repo
non è ancora agganciata al progetto, la si aggancia una volta sola:

```
vercel link --yes --project jethr
```
