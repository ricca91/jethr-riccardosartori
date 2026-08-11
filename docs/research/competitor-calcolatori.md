# Ricerca interna: calcolatori italiani RAL → netto (2026)

> **Uso interno.** Questo documento serve a orientare prodotto, UX e verifiche del prototipo Jet HR. I competitor non sono fonti normative e non vanno citati nella consegna. Osservazioni e benchmark sono stati raccolti l'11 agosto 2026 sulle interfacce pubbliche.

## Domanda e sintesi

La domanda era: come impostano oggi i migliori calcolatori italiani input, output, money flow, spiegazioni, fonti e limiti; cosa possiamo replicare rapidamente e cosa possiamo superare?

La risposta breve:

- Il pattern migliore è **progressive disclosure**: pochi dati per il primo risultato, assunzioni visibili, dettaglio solo su richiesta.
- Quasi tutti mostrano netto mensile e annuo; pochi rendono davvero riconciliabile `RAL = contributi + imposte + netto`.
- [Stipendee](https://www.stipendee.it/) ha il racconto più completo: fonti in apertura, spiegazioni per voce, riepilogo annuale, dettaglio, FAQ e Sankey. Il prezzo è una pagina molto lunga e un form che espone molte eccezioni prima del risultato.
- [CalcoloNetto](https://www.calcolonetto.it/) offre il miglior compromesso osservato tra ingresso semplice e profondità successiva: regole automatiche, comune, metodologia/versione e opzioni avanzate collassate.
- Le differenze numeriche sono materialmente ampie. Alcuni strumenti che dichiarano il 2026 espongono regole non aggiornate o assunzioni opache. Il benchmark è utile come **allarme**, non come oracolo.
- Per il prototipo: un solo input fiscale (RAL), 12/13 come preferenza di presentazione, badge 2026, assunzioni Milano/caso standard visibili, Sankey ridotto alle sole trattenute del dipendente, dettaglio per voce attivabile e pagina Metodo/FAQ. Non includere costo azienda, TFR o casi personali.

## Metodo e limiti

Sono stati ispezionati cinque prodotti pubblici, usando il contenuto first-party delle rispettive pagine e interazioni browser reali:

1. [Stipendee](https://www.stipendee.it/)
2. [CalcoloNetto](https://www.calcolonetto.it/)
3. [NettoRAL](https://nettoral.it/)
4. [Calcolato.it](https://calcolato.it/calcolo/stipendio-netto)
5. [NettoCalc](https://nettocalc.it/)

Un sesto candidato, `calcolatorestipendionetto.it`, è stato escluso perché l'URL pubblico reindirizzava a un login al momento della verifica.

Il caso comune desiderato era: dipendente privato a tempo indeterminato, nessun familiare o agevolazione personale, Milano/Lombardia, regole 2026. Non tutti gli strumenti permettono di fissare le stesse condizioni; la tabella indica quindi solo risultati effettivamente riproducibili e non forza comparazioni spurie.

## Confronto a colpo d'occhio

| Prodotto | Utente implicito | Input iniziali | Output/visualizzazioni | Trasparenza | Pattern utile | Debolezza/opportunità |
|---|---|---|---|---|---|---|
| [Stipendee](https://www.stipendee.it/) | Dipendente curioso anche del costo azienda | RAL, anno, 12–16 mensilità, regione, comune; molte checkbox per casi particolari | Netto annuo, media e mese ordinario/13ª, composizione, dettaglio, Sankey, confronto distribuzione redditi | Fonti INPS/MEF in alto; help contestuale su quasi ogni voce; FAQ e metodologia | Racconto a livelli e money flow | Prima schermata lunga e cognitivamente pesante; il Sankey amplia il perimetro a costo azienda/TFR/INAIL |
| [CalcoloNetto](https://www.calcolonetto.it/) | Dipendente che vuole una prima stima e poi approfondire/confrontare | RAL/netto obiettivo, mensilità, regione, comune; avanzate collassate | Netto e dettaglio dopo submit; confronto offerte/PDF come percorsi successivi | Anno, data verifica e versione motore; pagina metodologia/fonti; provenienza MEF del comune | Modalità base + avanzata, regole tecniche automatiche | Prodotto molto esteso e con funnel/account: da non replicare nel prototipo |
| [NettoRAL](https://nettoral.it/) | Dipendente che vuole risposta immediata | RAL, 12–14 mensilità, regione, fringe benefit | Aggiornamento immediato; netto mensile/annuo, TFR, trattenute, agevolazioni | Spiega regole in pagina ma non collega fonti puntuali | Immediatezza e tabella compatta | Contraddizioni osservabili: dichiara 2026 ma mostra il 35% nel secondo scaglione; applica automaticamente 1.200€ di trattamento integrativo a 30k; etichetta "totale trattenute" poco riconciliabile |
| [Calcolato.it](https://calcolato.it/calcolo/stipendio-netto) | Dipendente che esplora anche CCNL e offerte | RAL, full/part-time, mensilità, contratto, familiari | Risultato su submit, tabelle RAL predefinite, confronto offerte, molti percorsi correlati | Link diretti a TUIR/Normattiva e Agenzia Entrate; disclaimer esplicito | Microcopy precisa su cosa cambia con le mensilità; confronto neutro | Pagina molto densa e dispersiva; addizionali medie, nessun comune nel form principale |
| [NettoCalc](https://nettocalc.it/) | Dipendente che vuole giocare con RAL e poi configurare | Modalità semplice: RAL; avanzata: settore, contratto, mensilità, comune, fondo, familiari | Risultato live, composizione tabellare, shortcut RAL | Assunzioni mostrate soprattutto in avanzata; nessun percorso fonti evidente | Toggle semplice/avanzato e riconciliazione riga per riga | La modalità semplice nasconde luogo e altre assunzioni; alcuni controlli custom non emergono come select semantiche; il risultato cambia entrando in avanzata |

## Stipendee in dettaglio

### Cosa funziona

La testata dichiara esplicitamente anno e provenienza dei dati con link a [INPS](https://www.inps.it/) e [MEF](https://www.mef.gov.it/). Dopo il calcolo, l'informazione è organizzata in livelli:

1. **Composizione annua**: netto, contributi INPS, ritenute IRPEF.
2. **Netto per mensilità**: media, mese ordinario e tredicesima, evitando di fingere che tutte le buste paga siano identiche.
3. **Dettaglio**: imponibile, IRPEF lorda, detrazioni, addizionali e riconciliazione.
4. **Money Journey**: Sankey.
5. **FAQ**: spiegazioni trasversali e link a fonti.

Le etichette informative risultano raggiungibili anche da tastiera (`tabindex`) e non solo tramite hover. A viewport 390 px la pagina non presentava overflow orizzontale (`scrollWidth <= viewport`) e le sezioni venivano impilate; la resa era funzionale, sebbene estremamente lunga.

### Money flow / Sankey

Nel caso osservato (RAL 30.000€, Milano, 13 mensilità, configurazione standard predefinita), il Sankey mostrava:

```text
Costo azienda 40.265€
├─ RAL dipendente 30.000€
│  ├─ Retribuzione netta 23.367€
│  ├─ INPS dipendente 2.847€
│  └─ Ritenute IRPEF 3.786€
├─ INPS azienda 7.143€
├─ TFR 2.222€
└─ Oneri assicurativi 900€
```

Il diagramma funziona perché la larghezza dei flussi rende immediatamente visibile la scala delle componenti e riconcilia una storia altrimenti astratta. Per la task Jet HR, però, l'inizio da "costo azienda" introduce tre voci esplicitamente fuori scope e basate su ulteriori assunzioni.

**Adattamento raccomandato:** mantenere il linguaggio Sankey ma partire dalla RAL:

```text
RAL
├─ Contributi dipendente
└─ Imponibile fiscale
   ├─ Imposte nette (IRPEF + addizionali − detrazioni)
   └─ Netto annuo
```

In UI, la vista sintetica può aggregare "imposte"; il dettaglio cliccabile conserva IRPEF lorda, detrazioni e addizionali. In questo modo il grafico risponde esattamente a "dove vanno i soldi trattenuti al lordo" senza promettere un simulatore del costo aziendale.

### Cosa non copiare

- L'intero set di checkbox (bonus, apprendistato, pubblico, dimensione azienda, familiari, impatriati...) prima del primo risultato.
- Grafici di distribuzione del reddito: interessanti ma non aiutano a validare la trasformazione RAL → netto.
- Duplicazione estesa tra tooltip, dettaglio e FAQ. Il prototipo deve avere una singola fonte contenutistica riusabile.
- Claim di "stima precisa" accanto a un dominio esplicitamente semplificato.

## Pattern da adottare rapidamente

### 1. Form → calcola → risultato

Usare RAL come unico input fiscale. Il controllo 12/13 mensilità è una preferenza di presentazione: non cambia netto annuo o trattenute. Badge visibile: **Calcolo stipendio netto 2026**. Mostrare sotto il form le assunzioni compatte: Milano, privato, tempo indeterminato, anno intero, nessuna agevolazione.

### 2. Gerarchia in tre livelli

- **Livello 1:** netto annuo, media netta per mensilità, totale imposte, totale contributi.
- **Livello 2:** Sankey RAL → contributi / imposte / netto e tabella riconciliabile.
- **Livello 3:** modal/drawer per voce con spiegazione breve, formula e link al punto pertinente di Metodo e fonti.

FAQ e Metodo restano sempre raggiungibili. Il toggle "Spiegami il calcolo" mostra/nasconde callout e affordance didattiche, ma non deve nascondere assunzioni o disclaimer.

### 3. Spiegare la differenza 12/13

Replicare la microcopy osservata su Calcolato.it: la RAL e il netto annuo non cambiano; cambia la distribuzione tra mensilità. Etichettare il risultato **media netta per mensilità**, non "cedolino".

### 4. Rendere verificabile ogni euro

La tabella deve chiudere aritmeticamente:

```text
RAL − contributi dipendente − imposte nette = netto annuo
imposte nette = IRPEF lorda − detrazioni + addizionale regionale + addizionale comunale
```

Questo supera gli strumenti in cui "totale trattenute" non è chiaramente inclusivo o le agevolazioni sono presentate fuori sequenza.

### 5. Accessibilità minima non negoziabile

- Ogni help deve funzionare con click/tap e tastiera, non solo hover.
- Pulsanti con nomi espliciti; modale con focus management e chiusura Escape.
- Sankey accompagnato da tabella/testo equivalente: il grafico non può essere l'unico vettore dell'informazione.
- Nessun overflow a 390 px; ordine di lettura: risultati → flusso → dettaglio.

## Benchmark numerico interno

### Risultati osservati

Tutti gli importi sono euro. `n/d` significa che non è stato possibile fissare/riprodurre in modo affidabile lo stesso caso tramite l'interfaccia durante la sessione; non è una valutazione del motore.

| Strumento / configurazione osservata | RAL | Mensilità | Netto annuo | Netto medio |
|---|---:|---:|---:|---:|
| Stipendee — Milano, azienda >15 dipendenti (default), cuneo e bonus automatici | 30.000 | 13 | 23.367 | 1.797 |
| NettoRAL — Lombardia, fringe 0 | 30.000 | 13 | 23.821 | 1.832 |
| NettoRAL — Lombardia, fringe 0 | 30.000 | 12 | 23.821 | 1.985 |
| NettoRAL — Lombardia, fringe 0 | 40.000 | 13 | 27.711 | 2.132 |
| NettoRAL — Lombardia, fringe 0 | 60.000 | 13 | 37.747 | 2.904 |
| NettoCalc — modalità semplice (assunzioni locali non esposte) | 30.000 | 13 | 23.381,19 | 1.798,55 |
| NettoCalc — modalità semplice | 40.000 | 13 | 27.930,29 | 2.148,48 |
| NettoCalc — modalità semplice | 60.000 | 13 | 37.576,60 | 2.890,51 |
| NettoCalc — avanzata, Milano | 60.000 | 13 | 37.517,59 | 2.885,97 |
| Calcolato.it — tabella predefinita, addizionali medie | 30.000 | 13 | ~23.335* | ~1.795 |
| Calcolato.it — tabella predefinita, addizionali medie | 40.000 | 13 | ~27.859* | ~2.143 |
| Calcolato.it — tabella predefinita, addizionali medie | 60.000 | 13 | ~37.453* | ~2.881 |
| CalcoloNetto — Milano | 30k/40k/60k | 13 | n/d | n/d |

\* Annuale ricavato dalla media pubblicata moltiplicata per 13, quindi soggetto all'arrotondamento della cifra mensile; non è un output annuo dichiarato.

### Come interpretare le divergenze

La forbice a RAL 30.000 è già circa 454€ annui tra Stipendee e NettoRAL. Non prova automaticamente che uno dei due sia errato, perché cambiano almeno:

- aliquota contributiva (Stipendee preimposta 9,49% per azienda >15; altri 9,19%);
- comune e soglia di esenzione vs addizionale regionale/comunale media;
- trattamento integrativo e cuneo, applicati automaticamente o condizionati;
- arrotondamenti annuali/mensili;
- distinzione tra media per mensilità e simulazione delle mensilità aggiuntive;
- regole dichiarate ma non necessariamente coerenti con il motore.

Ci sono però segnali che richiedono indagine: NettoRAL dichiara 2026 ma nella propria spiegazione usa ancora `35%` tra 28.001 e 50.000€; inoltre accredita automaticamente 1.200€ di trattamento integrativo nel caso 30.000€. Questi risultati non vanno usati come expected value dei nostri test.

### Uso corretto del benchmark durante la build

1. Derivare gli expected value esclusivamente dal modello documentato e dalle fonti ufficiali.
2. Verificare invarianti (riconciliazione, monotonicità ragionevole, continuità agli scaglioni, 12/13 invarianti sull'annuo).
3. Confrontare 20k, 30k, 40k, 56.224k, 60k e 120k con almeno due competitor.
4. Se la divergenza è significativa, spiegare prima le assunzioni; correggere il motore solo quando una fonte ufficiale o un errore aritmetico lo giustifica.
5. Non citare competitor nel README o nella UI Jet HR.

## Decisione proposta per la spec

**Adottare:** form breve, badge anno, assunzioni upfront, Sankey RAL-only, quattro KPI, dettaglio riconciliabile, spiegazioni click/tap, Metodo/fonti e FAQ brevi, progressive disclosure.

**Non adottare:** costo azienda/TFR/INAIL, grafici di confronto redditi, modalità Pro, account/PDF/condivisione, input personali o checkbox tecniche, comparatore offerte.

**Elemento distintivo realistico in cinque giorni:** non un calcolo più esteso, ma un calcolo più comprensibile. Il prototipo deve permettere a un valutatore di seguire visivamente e aritmeticamente ogni euro dalla RAL al netto, con le semplificazioni sempre visibili.

## Evidenze consultate

- [Stipendee — calcolatore stipendio netto](https://www.stipendee.it/): form, fonti upfront, output, spiegazioni, Sankey e FAQ.
- [Stipendee — metodologia](https://www.stipendee.it/metodologia): percorso first-party dichiarato dal footer del prodotto.
- [CalcoloNetto — calcolatore 2026](https://www.calcolonetto.it/): modalità base/avanzata, versione motore, input locali, privacy e percorsi successivi.
- [CalcoloNetto — metodologia](https://www.calcolonetto.it/methodology/): metodologia first-party collegata dalla pagina.
- [NettoRAL](https://nettoral.it/): input, output live, regole e FAQ pubblicate nella stessa pagina.
- [Calcolato.it — calcolo stipendio netto](https://calcolato.it/calcolo/stipendio-netto): form, tabelle predefinite, confronto offerte, fonti e contenuti educativi.
- [NettoCalc](https://nettocalc.it/): modalità semplice/avanzata, composizione e risultati live.
