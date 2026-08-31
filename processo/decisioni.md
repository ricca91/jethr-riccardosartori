# Il registro delle decisioni

Come sono arrivato alla pagina. Serve a orientarsi: il dettaglio vive nei ticket, questo è
l'indice.

## Il metodo, in tre righe

Una **domanda per ticket**. Ogni ticket si chiude con un **commento di risoluzione** che fissa
una decisione e la motiva. La [mappa #1](https://github.com/ricca91/jethr-riccardosartori/issues/1)
tiene insieme destinazione, vincoli e l'elenco delle decisioni prese.

Il punto non è la burocrazia: è che le domande difficili di questo dominio — quale aliquota,
quale arrotondamento, quale prova basta — si decidono meglio prima di scrivere il codice che
dentro il codice. Quando ho iniziato a costruire, erano già chiuse per iscritto.

## Gli otto ticket

| # | La domanda | La decisione, in una riga |
|---|---|---|
| [1](https://github.com/ricca91/jethr-riccardosartori/issues/1) | La mappa | Destinazione, vincoli e indice delle decisioni. Ridisegnata a metà strada: da «una specifica pronta per i ticket di build» a «la pagina finita» |
| [2](https://github.com/ricca91/jethr-riccardosartori/issues/2) | Quali regole compongono il netto nel 2026? | Quattro trattenute, due detrazioni, due integrazioni di legge. Otto affermazioni verificate su fonti primarie: sette confermate, una corretta |
| [3](https://github.com/ricca91/jethr-riccardosartori/issues/3) | Quali pattern dei calcolatori esistenti adottare o superare? | Progressive disclosure con la RAL come unico input, flusso del denaro in scala, dettaglio riconciliabile. Il distintivo realistico è la comprensibilità, non l'estensione del calcolo |
| [4](https://github.com/ricca91/jethr-riccardosartori/issues/4) | Qual è il contratto di calcolo? | Tredici passi in ordine vincolante, aritmetica decimale, netto = somma delle voci arrotondate, troncamento a 4 decimali solo dove la norma lo impone. Sette salti e quattro cambi di pendenza esposti come fatti |
| [5](https://github.com/ricca91/jethr-riccardosartori/issues/5) | Quale esperienza rende comprensibile il passaggio? | Cinque sezioni impilate con barra di ancore, non schede. Il 12/13 si applica senza ricalcolare. Nessun avviso di soglia a schermo: le soglie restano nel motore e nelle FAQ |
| [6](https://github.com/ricca91/jethr-riccardosartori/issues/6) | Quale prova di correttezza basta? | Tre categorie **etichettate per ciò che provano**, perché riconciliazione e golden file *non* provano la correttezza. Il valore canonico a RAL 35.000 è **26.032,17** |
| [7](https://github.com/ricca91/jethr-riccardosartori/issues/7) | Come confezionare la specifica in ticket di build? | **Chiuso senza risolverlo**: nessun passaggio di consegne, quindi la specifica non ha lettori. È questa esclusione a ridisegnare la destinazione della mappa |
| [9](https://github.com/ricca91/jethr-riccardosartori/issues/9) | Quale stack regge la pagina? | Si rifinisce l'HTML esistente: nessun framework, nessun bundler, nessuna dipendenza. Il motore esce in un file a parte per poterlo provare fuori dal browser |

*(#8 non è un ticket: è la pull request che corregge un riferimento INPS.)*

## L'errore che è rimasto scritto

Il ticket #4 impone due convenzioni di arrotondamento — troncamento a quattro decimali sui
rapporti dell'art. 13, netto come somma delle voci arrotondate — e poi, nella sua sezione
*Verifica*, cita numeri calcolati **senza** la regola che lui stesso impone. A RAL 35.000
scrive 26.032,22; il valore che nasce dal contratto è **26.032,17**.

Se ne è accorto #6, implementando. Le opzioni erano due: riscrivere #4 e far sparire l'errore,
oppure lasciarlo dov'era e dichiarare l'errata. Ho scelto la seconda, e ne è uscita una regola
vincolante:

> I valori attesi si **rigenerano dal motore**, non si ricopiano dai ticket a monte.

Vale anche per le sette soglie: ci sono tutte, con gli stessi importi, ma sei su sette cadono
uno o due centesimi più in alto delle posizioni annotate durante la ricerca. È il tipo di
scarto che, copiato dentro un test, boccerebbe un motore che funziona — e la reazione naturale
sarebbe "aggiustare" il motore, rompendolo.

Per questo, leggendo i ticket, **#6 vince su #4 e su #3 sui numeri**.

## Due cose che ho tolto invece di aggiungere

**La specifica di build (#7).** Sarebbe stato mezzo giorno su cinque per scrivere un documento
a un destinatario che non esiste: costruisce la stessa persona che ha fatto la mappa.

**Le impalcature esplorative.** Il prototipo aveva tre varianti di architettura
dell'informazione, un selettore per confrontarle e una finestra regolabile per gli avvisi di
soglia. Servivano a scegliere. Fatta la scelta, sono uscite dalla pagina: quello che resta è
una versione sola, senza interruttori che non interessano a chi legge.

## Tre decisioni prese dopo la chiusura dei ticket

Il registro si ferma dove finiscono i ticket, ma la pagina è andata avanti ancora un giro. Dove
il prodotto e il registro non coincidono più, comanda il prodotto — ed è scritto qui invece che
correggendo i ticket a posteriori.

**C'è un tetto all'input.** Il ticket [#4](https://github.com/ricca91/jethr-riccardosartori/issues/4)
lo escludeva: nessun limite, e una battuta sopra il milione. Ora il calcolatore si ferma a
**1.000.000 €**. Il motivo è lo stesso che regge tutto il resto: su cifre così il modello a
input unico non descrive più niente di reale, e un numero preciso su un caso fuori perimetro
è peggio di un rifiuto onesto. Lo spazio liberato dalla battuta è occupato da un avviso che
serve davvero — sopra **122.295 €** il risultato assume nessuna anzianità contributiva al
31 dicembre 1995, ed è l'unico punto in cui la sola RAL non basta.

**La riconciliazione non è più stampata a schermo.** Il ticket
[#3](https://github.com/ricca91/jethr-riccardosartori/issues/3) la elencava fra i pattern da
adottare, e per un po' la pagina mostrava la riga `RAL − contributi − imposte = netto`. È
uscita perché ripeteva ad alta voce quello che la tabella sopra già faceva vedere. **La guardia
resta dov'era utile**: `motore.js` calcola `riconciliazione.verificata` a ogni chiamata e le
prove la controllano. Quello che è sparito è la dimostrazione, non il controllo.

**C'è una nota di lavoro, e un easter egg.** `prototipo/come-ho-lavorato.html` racconta
perimetro, modello, verifica e limiti a chi apre la demo senza passare da questo repo — le
stesse cose che stanno qui, per un lettore che è arrivato dall'altra parte. L'easter egg si
apre su una RAL precisa, e chi conosce Jet HR sa già quale.

## Il nucleo familiare: quattro decisioni prese col prototipo (#35)

Il [#35](https://github.com/ricca91/jethr-riccardosartori/issues/35) lasciava aperta una domanda
che non si poteva decidere a tavolino: le detrazioni di famiglia diventano **una voce sola, una
per tipo di familiare, o una per persona?** Sono nate tre varianti dell'interfaccia sulla pagina
vera, commutabili con un parametro, e la scelta è arrivata guardandole.

**Una voce per persona.** Vince perché è l'unica forma in cui la pagina può dire *perché* una
detrazione è zero. Il figlio di diciassette anni ha la sua riga, con `0,00 €` e il motivo scritto
accanto: sotto i 21 anni la detrazione non esiste, è assorbita dall'Assegno Unico. Una voce sola
seppellirebbe quel fatto dentro una formula lunga; una voce per tipo lo direbbe di «i figli»,
non di quel figlio.

**Le righe stanno dentro il gruppo IRPEF, non in un gruppo loro.** Il prototipo le aveva messe
sotto un'intestazione «Carichi di famiglia», e il risultato era che la riga di totale «IRPEF
netta» finiva orfana, come se fosse il totale della famiglia. Sono detrazioni dell'imposta:
stanno dove stanno le altre.

**Il motore emette codici, non frasi.** `assorbitaAssegnoUnico` è un fatto; «sotto i 21 anni la
detrazione è assorbita dall'Assegno Unico» è un racconto. La separazione fra Voce e Riga di
`CONTEXT.md` regge anche qui: il primo esce da `motore.js`, il secondo nasce in `righe.js`.

**Il nucleo si dichiara e poi si preme Calcola**, come per la RAL e per il comune. Il prototipo
ricalcolava a ogni cifra digitata e si leggeva bene, ma metteva in pagina numeri live accanto a
una catena ferma. La pagina ha una tesi sola — quello che si vede viene tutto dallo stesso
calcolo, e quel calcolo chiude — e vale più di un clic risparmiato. Finché il risultato a schermo
non è stato calcolato per *quel* nucleo, le colonne «detrazione» e «perché» dicono `—`.

Il prototipo ha anche corretto due errori di merito prima che diventassero codice: la soglia dei
figli cresce solo per i figli **che danno diritto** alla detrazione, e i rapporti dell'art. 12
vanno **troncati a quattro decimali** come quelli dell'art. 13 (c. 4). Entrambi erano sbagliati
nelle formule scritte a memoria, ed entrambi ora hanno una prova.

## Le regole locali per la famiglia: tre meccanismi, non uno (#34)

Contare gli enti che nell'addizionale guardano i figli a carico è stato il lavoro, non
implementarli. Il conto è venuto leggendo i CSV MEF riga per riga, e due volte è risultato
diverso da quello scritto nel ticket.

**Le regioni sono otto, non sette.** All'elenco del ticket manca il **Veneto**, che applica
un'aliquota agevolata dello 0,9% a chi ha un familiare disabile fiscalmente a carico: stesso
meccanismo delle Marche, stessa soglia di 50.000 €.

**I comuni sono sei, non due.** Il ticket contava le righe del CSV 2026, ma il dataset usa anche
le righe 2025 prorogate per i 4.830 comuni senza delibera 2026 — e lì compaiono **Bovolone,
Negrar di Valpolicella, Roverè Veronese e Zevio**, con la stessa esenzione per numero di figli di
Bardolino e Bosco Chiesanuova. Contare la fonte invece del dato generato è il modo in cui si
perdono quattro comuni.

**Tre meccanismi restano tre.** Sei enti aggiungono una **detrazione** per figlio: sta nell'array
`detrazioni`, che sapeva già sommare importi, con una forma nuova (`perFiglio`) che porta i suoi
criteri come dati — importo, minimo di figli, età massima, limite di reddito del figlio,
supplemento per disabilità. Marche e Veneto cambiano l'**aliquota**: non è una detrazione e non
poteva starci dentro, perché sostituisce il calcolo dell'imposta invece di correggerlo. I sei
comuni cambiano l'**esenzione**: non è un importo ma una soglia che sale di 10.000 € per ogni
figlio oltre il minimo. Modellarli tutti e tre come «una detrazione» avrebbe dato numeri
plausibili e sbagliati.

**Il filtro sta dentro le funzioni, mai sull'input.** Il nucleo arriva intero, minorenni compresi.
L'art. 12 non dà niente ai figli sotto i 21 anni, ma la Sardegna vuole proprio i minorenni e i
comuni veronesi contano i figli senza limite d'età: filtrare all'ingresso renderebbe il dato
locale non più ricostruibile.

**Due comuni restano scoperti, e lo dicono.** Grottammare e San Benedetto del Tronto condizionano
l'esenzione all'**ISEE**, che dalla RAL non si ricava. Non c'è niente da normalizzare: la
condizione è scritta nel dataset, in `condizioniPersonali`, invece di sparire.

## La disabilità toglie un'età, non aggiunge un importo (#34)

Il ticket lasciava aperto «l'importo per i figli con disabilità», citando 1.350 € da fonti
secondarie. Sul testo vigente dell'art. 12 quell'importo **non esiste**, e non esiste più nemmeno
la maggiorazione di 400 € per handicap: la lett. c) dà 950 € «per ciascun figlio di età compresa
fra 21 e 30 anni, **ovvero** per ciascun figlio di età pari o superiore a 30 anni con disabilità
accertata». La disabilità entra solo nel predicato di ammissibilità — stessa formula, stesso
importo, stessa soglia — e infatti non ha portato con sé nessuna costante in `K`.

La conseguenza pratica è che il flag serviva comunque: cinque delle otto regioni e una delle due
aliquote agevolate lo guardano. Senza, metà del lavoro sulle regole locali sarebbe stato
irraggiungibile dalla pagina.

## Se un link di un ticket non porta da nessuna parte

I ticket sono stati scritti mentre il lavoro procedeva, quindi citano la repo **com'era in quel
momento**. Due cose sono cambiate alla consegna, e vale la pena saperlo prima di cliccare:

- **I percorsi.** I file stavano sotto `docs/`. Ora il prodotto è in `prototipo/` e il lavoro
  che c'è dietro in `processo/`. Le citazioni dentro i ticket non sono state riscritte: sono la
  fotografia di quando sono state prese le decisioni.
- **I rami di lavoro.** `prototype/ia-ral-netto` e `research/competitor-*` sono stati rimossi
  una volta uniti. I commit restano nella storia del repo.

Niente di quello che serve per valutare il lavoro sta in quei link: sta in questa cartella e in
`prototipo/`.

## Dove finisce il registro

Nel codice, in tre pull request:

- [#10](https://github.com/ricca91/jethr-riccardosartori/pull/10) — la rifinitura: motore
  estratto, matrice di prova, tre correzioni di accessibilità trovate aprendo davvero la pagina
  invece che leggendo il codice.
- [#11](https://github.com/ricca91/jethr-riccardosartori/pull/11) — la porta d'ingresso, e la
  correzione della fonte INPS: i valori del massimale erano giusti, la circolare citata no.
- [#12](https://github.com/ricca91/jethr-riccardosartori/pull/12) — la struttura attuale della
  repo e il curriculum.
