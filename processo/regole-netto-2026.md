# RAL → netto: cosa si trattiene davvero nel caso standard Jet HR

_Ricerca verificata l'11 agosto 2026. Perimetro: dipendente del settore privato, impiegato a tempo indeterminato, residente fiscalmente a Milano per tutto l'anno, un solo datore, rapporto attivo per 365 giorni, nessun familiare a carico, nessun altro reddito/onere/detrazione/agevolazione individuale, nessun benefit o premio. Non è un cedolino né un parere professionale._

## Risposta breve

Nel caso semplice, le voci obbligatorie che riducono il netto attribuibile alla RAL sono:

1. **Contributi previdenziali del lavoratore**: per l'iscrizione ordinaria al Fondo pensioni lavoratori dipendenti (FPLD), il riferimento generale è il **9,19%** dell'imponibile previdenziale; oltre la prima fascia pensionabile 2026 si aggiunge **1%** sulla sola eccedenza.
2. **IRPEF nazionale**, calcolata sul reddito imponibile dopo i contributi obbligatori, meno le detrazioni spettanti.
3. **Addizionale regionale IRPEF Lombardia**, progressiva.
4. **Addizionale comunale IRPEF Milano**, 0,8% sull'intera base imponibile se questa supera 23.000 euro.

Ma «tutte le voci» non può significare una lista universale di qualunque riga possibile di un cedolino: contributi a fondi di solidarietà, fondi sanitari, previdenza complementare, quota sindacale, cessione del quinto e pignoramenti dipendono da CCNL, settore, datore o situazione del dipendente. Senza questi dati non esiste un unico netto corretto. Il prototipo deve quindi dichiarare quale sotto-caso usa e mostrare ciò che esclude.

La parte spesso confusa è che i **contributi previdenziali non sono imposte**: riducono il netto e anche la base IRPEF, ma finanziano la posizione previdenziale. Le imposte sono IRPEF e addizionali.

## Cosa significa “RAL” in questo prototipo

La RAL è una convenzione retributiva, non una base legale autonoma di calcolo. Le basi effettive possono differire per superminimo, straordinari, premi, benefit, rimborsi, welfare, auto aziendale, premi di risultato e voci CCNL. Fiscalmente il reddito di lavoro dipendente comprende in generale tutte le somme e i valori percepiti in relazione al rapporto; la norma elenca anche le esclusioni, inclusi i contributi previdenziali obbligatori. [TUIR, art. 51](https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Apresidente.repubblica%3Adecreto%3A1986%3B917~art51=)

Per poter calcolare con il solo input RAL, il prototipo deve assumere:

- `RAL = imponibile previdenziale = retribuzione imponibile fiscale prima dei contributi del lavoratore`;
- nessuna componente variabile o in natura e nessun rimborso;
- nessun onere deducibile aggiuntivo;
- un solo rapporto e un solo reddito, quindi `reddito complessivo = imponibile IRPEF`;
- nessuna trattenuta volontaria, giudiziale o settoriale oltre alle voci esplicitamente incluse.

Queste assunzioni non sono note a piè pagina: devono apparire nella UI e nel README.

## Mappa delle voci

| Voce | Riduce il netto del dipendente? | Riduce la base IRPEF? | Nel prototipo base? | Perché |
|---|---:|---:|---:|---|
| Contributo IVS INPS dipendente | Sì | Sì | Sì | Obbligatorio nel sotto-caso FPLD ordinario |
| Contributo aggiuntivo INPS 1% | Sì, solo oltre soglia | Sì | Sì, se input alto | Obbligatorio solo sull'eccedenza della prima fascia |
| IRPEF nazionale | Sì | — | Sì | Ritenuta fiscale principale |
| Detrazione lavoro dipendente / detrazione aggiuntiva 2025 | Riduce l'imposta, quindi aumenta il netto | — | Sì | Non è una trattenuta, ma serve per il netto corretto |
| Somma esente “cuneo fiscale” e trattamento integrativo | Aumentano il netto | — | Sì, se si supportano RAL basse | Non sono trattenute ma misure generali, non personali |
| Addizionale regionale Lombardia | Sì | No | Sì | Imposta locale dovuta per residenza al 1° gennaio |
| Addizionale comunale Milano | Sì | No | Sì | Imposta locale dovuta per domicilio fiscale al 1° gennaio |
| Fondo di solidarietà / FIS | Talvolta | Sì | No, salvo input settore/dimensione | Contributo ordinario ripartito 2/3 datore, 1/3 lavoratore; applicabilità e misura non sono inferibili dalla RAL |
| Fondo sanitario, ente bilaterale, previdenza complementare | Talvolta | Spesso, entro limiti | No | Dipendono da CCNL, adesione e accordi |
| Quota sindacale, cessione del quinto, pignoramento | Talvolta | No | No | Dipendono da delega/contratto/provvedimento individuale |
| TFR | No, non è trattenuta del netto mensile | — | No | È retribuzione differita/accantonamento, non tassa sul lordo corrente |
| INAIL, NASpI, Fondo garanzia TFR e gran parte degli oneri minori | No | — | No | Sono costi/contributi del datore, non trattenute del dipendente |

## 1. Contributi previdenziali a carico del dipendente

### Regola utilizzabile nel caso base

Per la generalità degli iscritti FPLD, l'INPS indica contribuzione IVS complessiva 33%, di cui **23,81% a carico del datore** e **9,19% a carico del lavoratore**. L'1% aggiuntivo è a carico del lavoratore sulla quota di retribuzione oltre la prima fascia pensionabile. [INPS, circolare n. 101/2024](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2024.11.circolare-numero-101-del-29-11-2024_14714.html)

Nel 2026 la prima fascia oltre cui scatta l'1% è **56.224 euro**; il massimale annuo della base contributiva e pensionabile per chi è privo di anzianità contributiva al 31 dicembre 1995 (o optante per il contributivo) è **122.295 euro** (122.295,40 arrotondati a 122.295,00). [INPS, circolare n. 6/2026](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html)

Formula annuale, nel sotto-caso più semplice e fino al massimale applicabile:

```text
contributi_IVS_lavoratore = imponibile_previdenziale × 9,19%
contributo_aggiuntivo = max(0, imponibile_previdenziale − 56.224) × 1%
contributi_lavoratore = contributi_IVS_lavoratore + contributo_aggiuntivo
```

### Limite importante

Il 9,19% è una **scelta di modello**, non l'aliquota di ogni possibile “impiegato privato”. L'inquadramento INPS, il settore, la dimensione del datore, il CCNL e fondi speciali possono aggiungere/ripartire contribuzioni minori. Ad esempio, i fondi di solidarietà sono finanziati da una contribuzione ordinaria calcolata sull'imponibile mensile, normalmente per due terzi dal datore e un terzo dal lavoratore. [INPS, fondi di solidarietà](https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.50226.Assegno-d-integrazione-salariale-per-dipendenti-di-aziende-iscritte-ai-fondi-di-solidarieta.html)

Per un prototipo onesto ci sono due alternative:

- **più semplice:** dichiarare esplicitamente “FPLD ordinario, 9,19%, nessun contributo settoriale aggiuntivo” e limitare la RAL a 56.224 euro; oppure
- **più fedele:** chiedere settore/CSC, dimensione del datore, CCNL e posizione assicurativa; questa scelta amplia però molto il dominio.

Il primo caso è adatto alla task. Per input oltre 56.224 euro va almeno applicato l'1% e visualizzata l'assunzione sul massimale contributivo; per andare oltre 122.295 euro serve il dato sulla prima iscrizione previdenziale.

## 2. Base imponibile e IRPEF nazionale 2026

I contributi previdenziali e assistenziali versati in ottemperanza a disposizioni di legge non concorrono al reddito di lavoro dipendente. [TUIR, art. 51, comma 2, lett. a](https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Apresidente.repubblica%3Adecreto%3A1986%3B917~art51-com2-let7=)

Con le assunzioni del prototipo:

```text
imponibile_IRPEF = RAL − contributi_lavoratore
```

Dal periodo d'imposta 2026 l'IRPEF lorda è progressiva per scaglioni: 23% fino a 28.000 euro, **33%** da 28.000 a 50.000 euro, 43% oltre 50.000 euro. La riduzione della fascia centrale dal 35% al 33% è introdotta dalla legge di bilancio 2026. [Legge 30 dicembre 2025, n. 199, art. 1, comma 3](https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED); la riforma a tre scaglioni e l'impostazione dell'art. 11 TUIR sono confermate dalla [legge 30 dicembre 2024, n. 207, art. 1, comma 2](https://www.normattiva.it/atto/caricaDettaglioAtto?atto.codiceRedazionale=24G00229&atto.dataPubblicazioneGazzetta=2024-12-31&bloccoAggiornamentoBreadCrumb=true&classica=true&dataVigenza=&tipoDettaglio=vigente&title=lbl.dettaglioAtto).

```text
IRPEF_lorda(I) =
  23% × min(I, 28.000)
  + 33% × min(max(I − 28.000, 0), 22.000)
  + 43% × max(I − 50.000, 0)
```

Usare aliquote marginali è fondamentale: l'aliquota più alta si applica solo alla quota nello scaglione, non a tutto il reddito.

### Detrazione ordinaria da lavoro dipendente

Con un solo reddito e anno intero, la detrazione dell'art. 13 TUIR è calcolabile così, dove `I` è il reddito complessivo del nostro caso semplificato:

```text
se I ≤ 15.000:          1.955
se 15.000 < I ≤ 28.000: 1.910 + 1.190 × (28.000 − I) / 13.000
se 28.000 < I ≤ 50.000: 1.910 × (50.000 − I) / 22.000
se I > 50.000:          0

aggiungere 65 se 25.000 < I ≤ 35.000
```

Il rapporto deve essere usato alle prime quattro cifre decimali e la detrazione è rapportata ai giorni di lavoro; qui sono 365/365. La fonte ufficiale MEF riporta le formule vigenti, il minimo di 690 euro per gli indeterminati e il bonus di 65 euro. [TUIR, art. 13, versione vigente dal 1° gennaio 2025](https://def.giustiziatributaria.gov.it/DocTribFrontend/getAttoNormativoDetail.do?ACTION=getArticolo&articolo=Articolo+13&codiceOrdinamento=0000000000000130000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000&id=%7B31D694E8-4398-4030-873B-FEAF5A6647F9%7D). Per questo caso pieno annuo il minimo non modifica 1.955 euro.

### Misure generali che aumentano il netto (da non chiamare “trattenute”)

Anche se l'utente chiede le trattenute, un output netto corretto lungo tutto l'intervallo delle RAL deve tenere conto delle misure automatiche seguenti. Non sono “agevolazioni particolari” del lavoratore: sono regole generali vigenti.

- Per reddito complessivo non oltre 20.000 euro, spetta una **somma non imponibile** pari al 7,1% del reddito di lavoro dipendente fino a 8.500 euro, 5,3% tra 8.500 e 15.000 euro, 4,8% oltre 15.000 euro fino a 20.000. Per individuare la percentuale il reddito è annualizzato. [Legge n. 207/2024, art. 1, commi 4-5](https://www.normattiva.it/atto/caricaDettaglioAtto?atto.codiceRedazionale=24G00229&atto.dataPubblicazioneGazzetta=2024-12-31&bloccoAggiornamentoBreadCrumb=true&classica=true&dataVigenza=&tipoDettaglio=vigente&title=lbl.dettaglioAtto)
- Oltre 20.000 e fino a 32.000 euro spetta una **ulteriore detrazione** di 1.000 euro; tra 32.000 e 40.000 decresce linearmente: `1.000 × (40.000 − I) / 8.000`; oltre 40.000 è zero. È rapportata ai giorni di lavoro. [Legge n. 207/2024, art. 1, comma 6](https://www.normattiva.it/eli/stato/LEGGE/2024/12/30/207/CONSOLIDATED/20251219)
- Il **trattamento integrativo** può valere fino a 1.200 euro per reddito complessivo fino a 15.000 euro, se l'imposta lorda sui redditi di lavoro è superiore alla detrazione lavoro dipendente diminuita di 75 euro; per 15.000–28.000 euro dipende da ulteriori detrazioni personali e quindi è fuori dal caso privo di oneri/detrazioni. Il sostituto lo riconosce automaticamente e lo verifica a conguaglio. [Agenzia delle Entrate, istruzioni 730/2026](https://infoprecompilata.agenziaentrate.gov.it/portale/quadro-c-lavoro-dipendente), [D.L. 3/2020, art. 1](https://www.normattiva.it/atto/caricaDettaglioAtto?atto.codiceRedazionale=20A02005&atto.dataPubblicazioneGazzetta=2020-04-04&tipoDettaglio=multivigenza)

Formula del prototipo:

```text
IRPEF_netta = max(0, IRPEF_lorda − detrazione_lavoro − detrazione_aggiuntiva)
netto_annuale_maturato =
  RAL − contributi_lavoratore − IRPEF_netta
      − addizionale_regionale_maturata − addizionale_comunale_maturata
      + somma_non_imponibile + trattamento_integrativo_eventuale
```

La UI deve rendere queste due ultime voci come **integrazioni al netto**, non nasconderle nelle tasse negative.

## 3. Addizionale regionale Lombardia

L'addizionale regionale si calcola sul reddito complessivo ai fini IRPEF al netto degli oneri deducibili; è dovuta se risulta dovuta anche l'IRPEF netta. [D.Lgs. 446/1997, art. 50](https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Astato%3Adecreto.legislativo%3A1997-12-15%3B446~art50=)

La Regione Lombardia conferma sul proprio sito le aliquote progressive applicabili, basate sugli scaglioni 15.000 / 28.000 / 50.000 euro:

| Quota di imponibile `I` | Aliquota Lombardia |
|---|---:|
| fino a 15.000 euro | 1,23% |
| oltre 15.000 e fino a 28.000 euro | 1,58% |
| oltre 28.000 e fino a 50.000 euro | 1,72% |
| oltre 50.000 euro | 1,73% |

Fonte: [Regione Lombardia — Addizionale regionale IRPEF](https://www.regione.lombardia.it/bollo-auto-e-tributi-regionali/red-addizionale-regionale-irpef), aggiornata il 5 maggio 2026. Queste fasce restano quattro anche se l'IRPEF statale 2026 ha tre aliquote.

## 4. Addizionale comunale Milano

Per Milano l'aliquota è **unica 0,8%**. Sono esenti i contribuenti con reddito imponibile IRPEF non superiore a **23.000 euro**; se la soglia è superata, l'aliquota si applica all'intero imponibile, non soltanto all'eccedenza. È rilevante il domicilio fiscale al 1° gennaio dell'anno di riferimento. [Comune di Milano — Addizionale comunale IRPEF](https://www.comune.milano.it/argomenti/tributi/addizionale-comunale-irpef), pagina aggiornata il 12 maggio 2026; [regolamento comunale, art. 6](https://fareimpresa.comune.milano.it/documents/20126/200621592/Regolamento%2Bper%2Bl%27applicazione%2Bdell%27Addizionale%2BComunale%2Ball%27Imposta%2Bsul%2BReddito%2Bdelle%2BPersone%2BFisiche.pdf/f5423372-46d4-c742-7cbe-4d0959865ec0?t=1613126257286).

```text
addizionale_comunale_maturata =
  0, se I ≤ 23.000
  I × 0,8%, se I > 23.000
```

Anche l'addizionale comunale è calcolata sul reddito complessivo IRPEF al netto degli oneri deducibili ed è dovuta se l'IRPEF netta è dovuta. [D.Lgs. 360/1998, art. 1](https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Astato%3Adecreto.legislativo%3A1998-09-28%3B360=)

## 5. Imposta maturata nell'anno ≠ trattenuta nel cedolino di quell'anno

È la principale scelta di prodotto da esplicitare. Il calcolo annuale può stimare **il carico fiscale generato dalla RAL 2026**. Il cash realmente trattenuto nelle singole buste del 2026 può essere diverso perché le addizionali sono posticipate:

- l'addizionale regionale è determinata dal datore al conguaglio e trattenuta in al massimo undici rate dal periodo di paga successivo, entro dicembre; [D.Lgs. 446/1997, art. 50](https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Astato%3Adecreto.legislativo%3A1997-12-15%3B446~art50=)
- per la comunale, il saldo è trattenuto fino a undici rate dopo il conguaglio; l'acconto è il 30% dell'addizionale calcolata sul reddito dell'anno precedente, in massimo nove rate da marzo. [D.Lgs. 360/1998, art. 1](https://www.normattiva.it/atto/caricaDettaglioAtto?atto.codiceRedazionale=098G0412&atto.dataPubblicazioneGazzetta=1998-10-16&bloccoAggiornamentoBreadCrumb=true&classica=true&dataVigenza=&generaTabId=true&qId=dc021bea-06fd-40cf-a05b-dd5fd2ed625d&tabID=0.08518584138903362&tipoDettaglio=vigente&title=lbl.dettaglioAtto); il Comune conferma acconto 30% e saldo. [Comune di Milano](https://www.comune.milano.it/argomenti/tributi/addizionale-comunale-irpef)

L'IRPEF e le misure che la riducono sono trattenute/riconosciute mese per mese con verifica finale: il datore svolge il conguaglio, che determina anche le addizionali. [Agenzia delle Entrate — scadenza conguaglio 2026](https://www1.agenziaentrate.gov.it/servizi/scadenzario/main.php?chi=1&come=34&cosa=1244&entroil=02-03-2026&op=4)

**Decisione raccomandata:** chiamare il risultato principale “netto annuale stimato di competenza 2026” e includere nel waterfall le addizionali **maturate** sulla RAL inserita. Non chiamarlo “somma effettivamente accreditata nel 2026” senza conoscere RAL/residenza dell'anno precedente e il calendario dei cedolini. Una piccola nota accanto al risultato evita una promessa errata.

## 6. Voci fuori perimetro: perché non vanno sottratte dalla RAL del dipendente

### Costi del datore, non trattenute del lavoratore

- La quota IVS del datore (23,81% nel FPLD ordinario) è un costo aziendale, non riduce il netto del dipendente. [INPS, circolare n. 101/2024](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2024.11.circolare-numero-101-del-29-11-2024_14714.html)
- Il premio INAIL per i dipendenti è a esclusivo carico del datore; varia con la lavorazione e non è calcolabile dalla RAL. [INAIL](https://www.inail.it/portale/assicurazione/it/lassicurazione-inail/La-tutela-assicurativa-nell-ue/Norme-obbligatorie-in-materia-di-assicurazione-in-Italia.html)
- Anche il Fondo di garanzia TFR è finanziato dal datore (0,20% della retribuzione imponibile, 0,40% per alcuni dirigenti industriali). [INPS](https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.50186.fondo-di-garanzia-del-tfr-e-dei-crediti-di-lavoro.html)
- NASpI, CIGO/CIGS/FIS, fondi interprofessionali e altri contributi minori appartengono al costo del lavoro; alcuni fondi hanno però una quota dipendente, perciò il settore non è un dettaglio trascurabile se si vuole superare il prototipo base.

### TFR

Il TFR non è una trattenuta sullo stipendio netto: matura come retribuzione differita e può restare presso il datore/Fondo Tesoreria o essere conferito alla previdenza complementare. Il versamento al Fondo Tesoreria è un adempimento del datore e la normativa menziona contributi datoriali collegati. [INPS, circolare n. 12/2026](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.02.circolare-numero-12-del-05-02-2026_15160.html) Non va quindi sottratto nella formula `RAL → netto annuale`; può essere al massimo una voce informativa separata (“TFR maturando non incluso nel cash netto”).

### Previdenza complementare e assistenza sanitaria

Un contributo del lavoratore a un fondo pensione può essere scelto dal lavoratore o fissato da fonte collettiva; la misura non è ricavabile da RAL, contratto a tempo indeterminato e città. [COVIP](https://www.covip.it/normativa/fondi-pensione/quesiti/contribuzione-aggiuntiva-fondi-pensione-negoziali) Anche i contributi sanitari previsti da CCNL/regolamento possono avere trattamento fiscale particolare fino a 3.615,20 euro, se ricorrono i requisiti dell'art. 51 TUIR. [TUIR, art. 51](https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Apresidente.repubblica%3Adecreto%3A1986%3B917~art51=)

Sono pertanto fuori dalla prima versione. In una versione successiva diventano input opzionali, mai valori inventati.

## Esempio di riconciliazione (solo test di modello)

Per RAL 35.000 euro, con le assunzioni sopra e valori 2026:

| Passaggio | Importo (€) |
|---|---:|
| RAL / imponibile previdenziale | 35.000,00 |
| Contributi INPS dipendente 9,19% | −3.216,50 |
| Imponibile IRPEF `I` | 31.783,50 |
| IRPEF lorda (23% fino a 28k, 33% sull'eccedenza) | 7.688,56 |
| Detrazione lavoro dipendente (1.581,48 + 65) | −1.646,48 |
| Ulteriore detrazione generale | −1.000,00 |
| IRPEF netta | −5.042,08 |
| Addizionale regionale Lombardia | −454,98 |
| Addizionale comunale Milano | −254,27 |
| **Netto annuale stimato di competenza** | **26.032,18** |
| Media su 13 mensilità | **2.002,48** |
| Media su 12 mensilità | **2.169,35** |

I valori sono arrotondati al centesimo per leggibilità; un payroll reale applica arrotondamenti e conguagli per periodo di paga. Inoltre le 13 mensilità reali non sono necessariamente uguali: la tredicesima può non beneficiare delle stesse detrazioni mensili e il conguaglio annuale riequilibra. Per questo il prodotto dovrebbe dire **“media su 13”**, non “importo garantito di ogni cedolino”.

## Contratto di calcolo consigliato per la task

### Inclusioni

- RAL da 0 a 56.224 euro (oppure applicazione esplicita dell'1% oltre soglia);
- 9,19% FPLD a carico lavoratore;
- IRPEF 2026 con scaglioni 23% / 33% / 43%;
- detrazione art. 13, incremento di 65 euro e misura generale 20–40k;
- addizionale Lombardia e Milano maturate;
- eventuali integrazioni generali per RAL basse, visibili separatamente.

### Esclusioni da dichiarare

- altro reddito, coniuge/figli a carico, spese e oneri deducibili/detraibili;
- premi di risultato, straordinari, bonus, stock option, welfare, benefit e rimborsi;
- CCNL, settore/CSC, fondi di solidarietà, fondi sanitari e previdenza complementare;
- cessioni/pignoramenti/deleghe/sindacato;
- cessazione/assunzione in corso d'anno, assenze, part-time, lavoro estero, apprendistato, dirigenti, domestici, agricoli, spettacolo, giornalisti e regimi agevolati;
- cash-flow effettivo delle addizionali maturate in anni precedenti e acconti.

### Input e output che rendono la semplificazione verificabile

Un solo input `RAL` basta per la demo, ma renderei visibili tre controlli o badge: “Milano”, “2026”, “13 mensilità / media”. L'output dovrebbe distinguere:

1. **Netto annuale stimato** e **media mensile**;
2. **Contributi previdenziali**;
3. **Imposte**: IRPEF, addizionale regionale, addizionale comunale;
4. **Detrazioni e integrazioni** che hanno ridotto l'imposta o aumentato il netto;
5. la riconciliazione `RAL − trattenute + integrazioni = netto`;
6. un link/modal “Assunzioni e limiti del modello”.

Questo è abbastanza rigoroso per dimostrare comprensione del dominio senza fingere di essere un motore payroll completo.

## Fonti primarie principali

- [Legge di bilancio 2026, L. 199/2025](https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED) — aliquota IRPEF centrale 33% dal 2026.
- [Legge di bilancio 2025, L. 207/2024](https://www.normattiva.it/eli/stato/LEGGE/2024/12/30/207/CONSOLIDATED/20251219) — scaglioni, detrazione lavoro, somma non imponibile e detrazione aggiuntiva.
- [TUIR, art. 13 — MEF/Documentazione economica e finanziaria](https://def.giustiziatributaria.gov.it/DocTribFrontend/getAttoNormativoDetail.do?ACTION=getArticolo&articolo=Articolo+13&codiceOrdinamento=0000000000000130000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000&id=%7B31D694E8-4398-4030-873B-FEAF5A6647F9%7D) — formule dettagliate della detrazione.
- [TUIR, art. 51 — Normattiva](https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Apresidente.repubblica%3Adecreto%3A1986%3B917~art51=) — reddito di lavoro dipendente ed esclusione contributi obbligatori.
- [INPS, circolare n. 6/2026](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html) — soglia 1% e massimale 2026.
- [Regione Lombardia — addizionale regionale IRPEF](https://www.regione.lombardia.it/bollo-auto-e-tributi-regionali/red-addizionale-regionale-irpef) — aliquote regionali e sostituto d'imposta.
- [Comune di Milano — addizionale comunale IRPEF](https://www.comune.milano.it/argomenti/tributi/addizionale-comunale-irpef) — aliquota, soglia e acconto.
