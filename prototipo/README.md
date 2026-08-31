# Dove va la tua RAL — calcolatore netto 2026

Una pagina che risponde a una domanda sola: di una retribuzione annua lorda, quanto resta
in tasca, dove finisce il resto e perché.

Si inserisce la RAL, si sceglie il domicilio fiscale con tre controlli dipendenti
(**regione → provincia → comune**) e si dichiarano, se ci sono, i **familiari a carico**.
Il profilo resta dichiarato — regole 2026, settore privato, tempo indeterminato, anno
intero — mentre le addizionali coprono tutti i 7.894 comuni Istat attivi nello snapshot
del 21 febbraio 2026.

## I file

| File | Che cos'è |
|---|---|
| `index.html` | la pagina |
| `draftsman.css` | il design system delle tre pagine: token, componenti e caratteri incorporati |
| `come-ho-lavorato.html` | la nota di lavoro: perimetro, modello, verifica, limiti |
| `la-storia.html` | la storia: cosa è successo dopo la pubblicazione |
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

Doppio clic su `index.html`, tenendo `draftsman.css`, `motore.js`, `righe.js` e `fonti.js`
nella stessa cartella. Nessuna dipendenza, nessun passo di build, nessuna richiesta di rete:
Archivo, Instrument Sans e JetBrains Mono sono incorporati in `draftsman.css`, quindi le
pagine funzionano anche offline.

Le tre pagine — `index.html`, `come-ho-lavorato.html` e `la-storia.html` — condividono
`draftsman.css` invece di portare ciascuna la propria copia dei caratteri: 232 KB una volta
sola contro i 480 KB che prima erano triplicati. Il prezzo è che `come-ho-lavorato.html` e
`la-storia.html` non sono più apribili da sole: vogliono `draftsman.css` accanto. Un `<link>`
si carica anche da `file://`, a differenza dei moduli ES.

L'aspetto è **Draftsman**, il design system in
`resources/design-systems/greptile-inspired-design-system`: raggio zero e angoli smussati,
hairline tratteggiate, etichette mono fra parentesi, ombre a offset duro e **una sola sezione
inchiostro per pagina** — il flusso del denaro nel calcolatore, il modello nella nota di
lavoro, la coda nella storia.

Il prototipo usa-e-getta del feedback visivo del pulsante **Calcola** si apre con
`prototype-ral-feedback.html?variant=A`. Le varianti A, B e C si cambiano dalla barra
in basso o con le frecce della tastiera.

Il motore è uno script classico e non un modulo ES proprio per questo: i moduli non si
caricano da `file://`, gli script classici sì.

Lo stato sta nell'URL (`?ral=&m=&c=&n=&calc=1`), incluso il codice catastale del comune e
il nucleo familiare, quindi ogni schermata è condivisibile. Il parametro `n` porta un
familiare per token — `c` coniuge, `f22` figlio di 22 anni, `a` ascendente convivente,
`f35d` con disabilità accertata, `f22r1500` con il suo reddito — e **non compare** se non
c'è nessun familiare dichiarato:
senza nucleo la query string è quella di prima.

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
*scendere* il netto. `soglie({ comune })` separa gli eventi nazionali, regionali e
comunali e la FAQ usa sempre il comune selezionato. Per Milano, a 25.327,62 € di RAL
finisce l'esenzione comunale e il netto perde 184 € l'anno; un comune senza esenzione
non eredita quel gradino. È un'esenzione, non una franchigia.

**3. Ogni euro torna, per costruzione.** Il netto non è un totale calcolato a parte e poi
confrontato con le voci: **è** la somma delle voci arrotondate. La verifica gira a ogni
ricalcolo, non solo nelle prove, quindi la pagina non può mostrare una tabella che non
chiude.

## Il calcolo

Aritmetica decimale a virgola fissa su `BigInt`, scala 1e-8, mai virgola mobile binaria.
Tredici passi in ordine vincolante: contributi, imponibile, IRPEF lorda per scaglioni,
detrazioni con la capienza, IRPEF netta, addizionali — dovute solo se l'IRPEF netta è
positiva — e integrazioni di legge. Troncamento a quattro decimali sui rapporti dell'art. 13
e su quelli dell'art. 12, dove la norma lo impone (art. 12 c. 4, art. 13 c. 6).

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

## Il nucleo familiare

`calcola(ral, { comune, nucleo })` accetta un nucleo come lista di familiari —
`{ tipo: 'coniuge' | 'figlio' | 'ascendente', eta, disabilita, reddito }` — e ne emette **una Voce per
persona** (`detrfam1`, `detrfam2`, …), non una voce sola né una per tipo. È la scelta uscita
dal prototipo del [#35](https://github.com/ricca91/jethr-riccardosartori/issues/35): la
pagina deve poter dire *perché* una detrazione è zero, e per dirlo serve una riga per la
persona a cui non spetta.

Il motore emette un **codice** di esito — `spetta`, `assorbitaAssegnoUnico`,
`oltreTrentaAnni`, `etaNonDichiarata`, `familiareNonACarico`, `rapportoFuoriIntervallo` — e
la frase in italiano nasce in `righe.js`, che è dove vivono le parole. Ogni Riga porta anche
una `nota`: la stessa cosa della formula, in poche parole, per la colonna «perché» della
tabella del nucleo.

La **disabilità accertata** (art. 3 L. 104/1992) non è un importo: toglie il tetto dei
trent'anni della lett. c) e lascia formula, importo e soglia identici. Le fonti secondarie
citano 1.350 € per i figli disabili e una maggiorazione di 400 €: sul testo vigente non
esiste né l'uno né l'altra, e infatti il flag non porta nessuna costante in `K`. Serve però
anche alle regole locali — cinque regioni su otto lo guardano.

Otto giurisdizioni regionali e sei comuni cambiano l'**addizionale** in base ai figli a
carico, in tre forme distinte: una detrazione per figlio (Trento, Bolzano, Sardegna,
Campania, Piemonte, Puglia), un'aliquota diversa (Marche, Veneto) e — nei sei comuni
veronesi — una soglia di esenzione che sale di 10.000 € per ogni figlio oltre il minimo.
Per questo `calcolaAddizionale`, `addizionaleRegionale`, `addizionaleComunale` e
`detrazioneLocale` ricevono la famiglia come parametro opzionale in coda.

Due punti dell'art. 12 sono facili da sbagliare e sono provati apposta: la soglia dei figli
cresce di 15.000 € solo per i figli **che danno diritto** alla detrazione (un quindicenne non
la alza), e il comma 4 vuole che il rapporto si guardi *vero* per decidere se la detrazione
compete e *troncato a quattro decimali* per calcolarla.

Quando la capienza non basta, la quota usata si ripartisce **in proporzione** a quanto spetta
a ciascuno. È una convenzione di presentazione: l'art. 12 somma e sottrae, non alloca niente
a nessuno. Consumarle in fila direbbe che il primo dichiarato ha avuto tutto e l'ultimo
niente, che non è vero di nessuno.

`soglie({ comune: codiceCatastale, nucleo })` restituisce soltanto le discontinuità effettive:
ogni elemento dichiara `ambito` (`nazionale`, `regionale` o `comunale`), imponibile,
RAL, causa e variazione del netto. Le soglie normative sull'imponibile vengono convertite
nella prima RAL che le supera usando contributi e arrotondamenti del motore; i normali
cambi di scaglione progressivo, che modificano la pendenza ma non creano un salto, non
sono inclusi. Senza opzioni il default resta Milano per compatibilità. La cache è separata
per codice catastale e per nucleo dichiarato: le detrazioni di famiglia possono azzerare
l'IRPEF netta, e un salto che esiste per un contribuente solo può non esistere per una
famiglia — a Milano il gradino da 184 € dell'esenzione comunale sparisce con tre familiari
a carico, perché da entrambi i lati della soglia l'imposta è già zero.

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
