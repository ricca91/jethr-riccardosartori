# Verifica

Che cosa è provato di questo calcolatore, con quale prova, e — la parte che rende
difendibile il resto — che cosa **non** è provato.

## Come si esegue

```
node --test prototipo/*.test.js
```

Node 18 o successivo. Nessuna dipendenza, nessun `package.json`, niente da installare.
Il motore (`prototipo/motore.js`) è uno script classico: la stessa riga di codice
gira nella pagina aperta con un doppio clic e in Node, senza duplicati.

Stato al 25 agosto 2026: **61 prove, tutte verdi** (Node v22.22.2).

Gli attrezzi di verifica stanno in `processo/attrezzi/`, e girano anche loro senza
dipendenze:

```
node processo/attrezzi/confronto.js salva base.json      # fotografa 2.001 corse
node processo/attrezzi/confronto.js confronta base.json  # le riesegue e le confronta
node processo/attrezzi/mutazioni.js                      # rompe una voce alla volta
```

## Le quattro categorie, e perché stanno separate

Due prove che sembrano prove e non lo sono:

- La **riconciliazione** — `RAL − contributi − imposte + integrazioni = netto` — conferma
  un'identità algebrica, non la correttezza. Il contratto *definisce* il netto come somma
  delle voci, quindi il controllo non può fallire nemmeno con le aliquote sbagliate.
  Resta come guardia a ogni ricalcolo, non come prova.
- Il **golden** rigenerato dal motore prova che nessuno ha cambiato niente. Se il motore
  sbagliasse oggi, congelerebbe l'errore e ci metterebbe un test verde a guardia.

La correttezza può venire da un posto solo: il confronto a mano con la norma. Costa,
quindi si fa in pochi punti scelti. Da qui le categorie, etichettate nel file di test.
Le prime tre nascono con il [#6](https://github.com/ricca91/jethr-riccardosartori/issues/6);
la quarta con il [#15](https://github.com/ricca91/jethr-riccardosartori/issues/15), quando
il motore si spezza in voci che si possono esercitare una alla volta.

| | Categoria | Che cosa prova | Come |
|---|---|---|---|
| **A** | Correttezza | che il numero è giusto | poche ancore, derivate a mano dalla norma e scritte per esteso nei commenti |
| **B** | Comportamento ai limiti | che le discontinuità di legge ci sono tutte, con la causa giusta | le soglie nazionali e locali del comune scelto e i quattro cambi di pendenza, presi a un centesimo di distanza, più gli input estremi |
| **C** | Non-regressione | che nessuno ha cambiato niente | 2.001 campioni a passo di 100 € da 0 a 200.000 €, più il golden |
| **D** | Le voci da sole | che una voce sbagliata si vede *dove* è sbagliata | ogni funzione del contratto esercitata a un imponibile scelto, con soli numeri |

### A — le ancore verificate a mano

- **RAL 35.000, voce per voce.** La derivazione completa è nel commento sopra il test:
  contributi 3.216,50 · IRPEF lorda 7.688,56 · detrazione art. 13 1.581,48 più 65 ·
  ulteriore detrazione 1.000 · addizionale regionale 454,98 · addizionale comunale 254,27 ·
  **netto 26.032,17**.
- **RAL 25.327,61 → 25.327,62.** L'esenzione dell'addizionale comunale di Milano è
  un'esenzione, non una franchigia: un centesimo lordo in più costa 183,99 € netti l'anno.
  È legge, non un errore di arrotondamento.
- **Le detrazioni per carichi di famiglia (art. 12).** Derivate a mano dal testo dell'articolo,
  una prova per ciascuna delle sue regole: la quota del coniuge nelle tre fasce e i cinque
  scalini della lett. b — l'unico punto della norma in cui una detrazione **risale** —, i figli
  fra 21 e 30 anni con la soglia di 95.000 € **cresciuta di 15.000 € per ogni figlio successivo
  al primo che dà diritto** (il quindicenne non porta detrazione e non alza la soglia dei
  fratelli), gli ascendenti conviventi sulla soglia di 80.000 €, e i limiti di reddito del
  familiare del comma 2 — 2.840,51 €, elevati a 4.000 € per i figli fino a 24 anni.
  A RAL 35.000 con coniuge, un figlio di 22 anni, uno di 17 e un ascendente: **710,00 ·
  632,13 · 0,00 · 452,03**, netto **27.826,33**.
- **Il comma 4, che è la parte che si sbaglia.** I rapporti dell'art. 12 vanno assunti nelle
  prime quattro cifre decimali, e la detrazione **non compete** quando il rapporto è zero,
  negativo o uguale a uno. Le due cose sono distinte e vanno in quest'ordine: si guarda il
  rapporto vero per decidere se spetta, lo si tronca per calcolarla. Invertirle azzererebbe
  detrazioni che spettano. A reddito complessivo zero il rapporto dei figli vale uno, e la
  detrazione non c'è.
- **RAL 122.295 e oltre.** I contributi si fermano a 11.899,62 € e non si muovono più:
  l'aliquota effettiva scende dal 9,73% al 5,95% a 200.000 € e all'1,19% a un milione.
- **RAL 0 → netto 0.** Capienza: le detrazioni abbattono l'imposta ma non sono
  rimborsabili. Senza questo vincolo il netto a RAL 0 risulterebbe di 1.955 €.

### B — le soglie nazionali e locali, con la causa e non solo l'effetto

Per ogni soglia il test controlla due cose: che il salto abbia il segno e la magnitudine
attesi entro un centesimo, e che sia **la voce giusta a comparire o a sparire** — il
trattamento integrativo, l'addizionale comunale, la maggiorazione di 65 €. La verifica
strutturale è la parte che un motore sbagliato ma internamente coerente non supera.

L'invariante di monotonicità è formulato in modo da non bocciare il motore giusto:

> Il netto è continuo e crescente in RAL **ovunque tranne** nelle soglie note per il comune scelto, e in
> ciascuna di esse il salto ha esattamente il segno e la magnitudine documentati.

«Il netto cresce sempre» sarebbe falso: diversi salti vanno all'ingiù e sono
legge. Un test così boccerebbe l'implementazione corretta, e la reazione naturale sarebbe
"aggiustare" un motore che funziona.

**Le soglie dipendono anche dal nucleo, non solo dal comune.** Le detrazioni per carichi di
famiglia possono azzerare l'IRPEF netta, e senza IRPEF netta non c'è addizionale: il salto
dell'esenzione comunale di Milano, che a RAL 25.327,62 vale 184 € per un contribuente
solo, **non esiste** per chi dichiara coniuge, un figlio di 22 anni e un ascendente — da
entrambi i lati della soglia l'imposta è già zero. Per questo `soglie()` prende il nucleo
insieme al comune, la cache è chiavata su entrambi, e la FAQ distingue «questo comune non
ha esenzione» da «l'esenzione c'è ma non ti riguarda». Una prova copre esattamente questo.

### D — ogni voce esercitata da sola

Fino al [#15](https://github.com/ricca91/jethr-riccardosartori/issues/15) il motore era
un blocco unico: ogni prova passava da `calcola(RAL)`. Per esercitare la detrazione
dell'art. 13 a 31.783,50 € di imponibile bisognava trovare la RAL che quell'imponibile
lo produce — e quando una prova diventava rossa diceva *che* qualcosa si era rotto, non
*dove*.

Adesso ogni voce ha la sua funzione e la sua prova: `contributiIvs`,
`contributoAggiuntivo`, `imponibile`, `irpefLorda`, `detrazioneLavoroDipendente`,
`ulterioreDetrazione`, `detrazioniCarichiFamiglia`, `applicaCapienza`,
`addizionaleRegionale`, `addizionaleComunale`, `sommaNonImponibile`,
`trattamentoIntegrativo`, `riconcilia`. Entrano numeri, escono numeri.

### La proprietà è verificata, non asserita

«Ogni voce ha una prova che la esercita da sola» è facile da scrivere e difficile da
credere: una prova può esistere, girare verde e non guardare niente. L'unico modo di
saperlo è romperla.

`processo/attrezzi/mutazioni.js` rompe una voce alla volta — un carattere nel motore, su
una copia usa e getta — e guarda quale prova si accende rossa. **Quindici rotture, quindici
colte dalla prova della loro voce.**

| Si rompe | Che cosa | Chi si accende in D | A · B · C |
|---|---|---|---|
| `contributiIvs` | 9,19% → 9,20% | la sua, e `imponibile` | 4 · 9 · 2 |
| `contributoAggiuntivo` | 1% → 2% | la sua, e `imponibile` | 1 · 1 · 1 |
| `imponibile` | un euro in più | la sua | 4 · 8 · 2 |
| `irpefLorda` | aliquota sull'intero, non sulla quota | la sua, e `addizionaleRegionale` | 1 · 2 · 4 |
| `detrazioneLavoroDipendente` | il rapporto non si tronca più | la sua | 2 · 3 · 2 |
| `detrazioneLavoroDipendente` | i 65 € partono un centesimo prima | la sua | 0 · 2 · 0 |
| `ulterioreDetrazione` | 1.000 → 900 | la sua | 1 · 2 · 2 |
| `applicaCapienza` | la detrazione entra intera | la sua, e quella sull'ordine | 2 · 0 · 1 |
| `applicaCapienza` | si consuma la più grande per prima | la sua | **0 · 0 · 0** |
| `addizionaleRegionale` | dovuta anche a IRPEF netta zero | la sua | 0 · 2 · 1 |
| `addizionaleComunale` | esenzione secca → franchigia | la sua | 2 · 2 · 2 |
| `sommaNonImponibile` | 7,1% → 6,1% | la sua | 0 · 2 · 1 |
| `trattamentoIntegrativo` | 1.200 → 1.300 | la sua | 0 · 3 · 1 |
| `riconcilia` | l'identità per tipo non si controlla | la sua | **0 · 0 · 0** |
| `sommeDichiarate` | la somma dichiarata non si controlla | la sua | **0 · 0 · 0** |

Due cose che questa tabella dice, e che prima non si sapevano.

**L'accoppiamento è reale e va guardato in faccia.** Rompere il 9,19% accende anche la
prova di `imponibile`, perché l'imponibile è la RAL meno i contributi. Non è un difetto
delle prove: è la catena del calcolo che si vede. Quello che conta è che la prova della
voce rotta cade *sempre*, e che le altre che cadono con lei stanno a valle.

**Tre mutazioni le prende solo la categoria D** — le tre in grassetto. Cambiare l'ordine
di consumo delle detrazioni non muove un centesimo del netto in nessuna delle 2.001
corse, perché il totale consumato è lo stesso; e le due guardie interne di `riconcilia`
non hanno effetto su nessun risultato finché nessuna voce è malformata. Prima del #15
queste tre rotture sarebbero passate con tutta la matrice verde.

### Il mutante che non può parlare

Una sedicesima mutazione sta nell'elenco con un'etichetta diversa: **equivalente**. Il
trattamento integrativo riceve la detrazione dell'art. 13 *senza* la maggiorazione di
65 €. Scambiarla con il totale non cambia niente in nessuna corsa — e non per fortuna:
il terzo argomento viene letto solo sotto i 15.000 € di imponibile, e lì la maggiorazione
è sempre zero, perché parte da 25.000.

Nessuna prova può distinguere le due letture, e scriverne una sarebbe fingere. Ma è
proprio questo il motivo per cui il motore passa la detrazione senza maggiorazione: la
distanza fra due soglie di `K` è una coincidenza aritmetica, non una regola del D.L.
3/2020. Se un domani la maggiorazione scendesse sotto i 15.000 €, la versione «totale»
comincerebbe a sbagliare in silenzio.

Per queste mutazioni l'attrezzo rovescia la domanda: pretende che **tutto resti verde**.
Se qualcosa si accende, l'equivalenza dichiarata era falsa. È il modo di scrivere nero su
bianco «qui non c'è copertura, e so perché» invece di lasciare un buco che sembra una
svista.

*(Un fatto collegato, trovato scrivendo la tabella: nella fascia dove l'ulteriore
detrazione esiste — imponibile sopra 20.000 € — l'IRPEF lorda è sempre capiente, quindi
oggi l'ordine di consumo non è osservabile dal netto. `applicaCapienza` lo rispetta
comunque, ed è provato; ma è una garanzia sulla funzione, non un fatto misurabile a
schermo. Meglio scritto che scoperto dal prossimo che ci mette le mani.)*

## Il refactor del #15: come si prova che non ha spostato niente

Il #15 è un prefactor: nessun numero cambia. La garanzia sta in tre controlli, non in
una dichiarazione.

**Il confronto a tappeto.** 2.001 corse salvate prima del refactor con
`processo/attrezzi/confronto.js`, rieseguite dopo, confrontate **campo per campo**
sull'oggetto intero — `kpi`, `imponibile`, `irpefNetta`, `integrazioni`,
`aliquotaContributivaEffettiva`, `riconciliazione` e l'ordine delle voci: **zero
divergenze**. L'attrezzo è stato provato anche al contrario, seminando un errore di un
decimillesimo nell'addizionale comunale: 1.747 corse rosse su 2.001. Un attrezzo che non
sa fallire non prova niente.

Il confronto guarda i campi che stanno nella base. Due campi — `et` e `formula` — sono
usciti dal motore per disegno, e vanno dichiarati all'invocazione con
`--esclude et,formula`: la divergenza è una scelta, e sta scritta nel comando invece che
nascosta dentro l'attrezzo. I campi *nuovi* vengono elencati a parte, perché non hanno
un prima con cui divergere.

**Le Riga.** `prototipo/righe.test.js` attraversa la stessa seam usata dalla pagina:
verifica una Riga per ogni Voce nello stesso ordine, copertura completa di identificativi
e fonti, Capienza trasversale, errori fail-fast e alcuni testi rappresentativi. Nessun
test estrae o esegue più codice dall'HTML.

**La pagina vera.** Aperta a fianco della versione precedente e guidata dallo stesso
copione — la catena intera e i pannelli di dettaglio a RAL 35.000: stesso testo, stessi
importi, nessun errore in console.

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
ricopiano dai documenti a monte. Le soglie espresse dalla norma sull'imponibile vengono
convertite nella prima RAL che le supera attraverso il motore, inclusi contributi e
arrotondamenti. Le discontinuità regionali e comunali sono ricavate dalla regola
normalizzata del comune scelto; scaglioni progressivi continui e agevolazioni personali
non diventano soglie generali.

## L'estrazione del motore (#9)

Il motore è stato tolto dalla pagina e messo in un file a parte per poterlo provare fuori
dal browser. Per escludere che l'operazione avesse spostato un centesimo, la versione
estratta è stata confrontata con quella originale su **20.019 punti** — passo di 10 € da
0 a 200.000 €, più le soglie del caso Milano a un centesimo di distanza e gli input estremi —
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
| La modale dell'easter egg | ✅ `<dialog>` nativo. Il fuoco entra dentro all'apertura e **torna da solo al campo RAL** alla chiusura, senza codice che lo gestisca. Si chiude con Esc o cliccando fuori. Nessun sbordo a 390 px con la modale aperta. Non ha un bottone di chiusura: per una battuta di due righe Esc basta |
| La nota di lavoro | ✅ `come-ho-lavorato.html` verificata come la pagina principale: nessun sbordo a 390 px, nessuna richiesta di rete, caratteri incorporati. I suoi rimandi al repo funzionano perché il repo è pubblico |

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
- **Un solo profilo personale.** Impiegato del settore privato, anno intero, tempo pieno,
  nessun altro reddito, nessun onere deducibile o detraibile. Regione, comune e familiari a
  carico variano con la selezione; agevolazioni personali o categoriali restano escluse anche
  quando compaiono nella fonte locale.
- **La ripartizione pro quota della capienza è una convenzione, non una regola.** L'art. 12
  somma le detrazioni di famiglia e le sottrae dall'imposta: non ne alloca nessuna a nessuno.
  Quando la capienza non basta, mostrare una riga per familiare obbliga a decidere quanto ne
  usa ciascuno, e la scelta è ripartire in proporzione a quanto spetta. Consumarle in fila
  direbbe che il primo dichiarato ha avuto tutto e l'ultimo niente, che non è vero di nessuno.
  Quello che è provato è che la somma di quanto si usa è **esattamente** la capienza residua.
- **Le detrazioni di famiglia sono calcolate per l'anno intero.** L'art. 12 c. 3 le rapporta a
  mese, dal mese in cui le condizioni si verificano a quello in cui cessano: qui si assume che
  valgano per tutti i dodici. La quota degli ascendenti è assunta intera, non ripartita fra più
  aventi diritto, e il reddito complessivo del dichiarante è approssimato con l'imponibile IRPEF.
- **Fuori perimetro, dichiarato a schermo.** Le maggiorazioni per figli con disabilità
  (art. 12 c. 1 lett. c) e il caso dei familiari residenti all'estero di contribuente extra-UE
  (art. 12 c. 2-bis) non sono calcolati: servono fatti che la sola RAL non porta.
