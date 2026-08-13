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

## Dove finisce il registro

Nel codice. La rifinitura è la [PR #10](https://github.com/ricca91/jethr-riccardosartori/pull/10),
che porta la pagina da prototipo esplorativo ad artefatto consegnabile — motore estratto,
matrice di prova, tre correzioni di accessibilità trovate aprendo davvero la pagina invece
che leggendo il codice.
