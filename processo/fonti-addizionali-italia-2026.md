# Fonti nazionali per le addizionali IRPEF 2026

_Verifica del 26 agosto 2026. Questa nota valuta disponibilità, struttura e limiti dei dati prima dell'implementazione._

## Conclusione

I dati ufficiali necessari sono scaricabili dal Dipartimento delle Finanze in CSV. Le aliquote regionali 2026 coprono tutte le 21 giurisdizioni fiscali (19 regioni più le Province autonome di Trento e Bolzano). Il CSV comunale contiene una riga per codice catastale, aliquote/scaglioni, esenzioni, estremi della delibera e una classificazione della forma impositiva.

Il dataset comunale 2026 non è però ancora definitivo al 26 agosto: su 7.897 righe, 4.834 riportano `0*`, cioè nessuna delibera 2026 presente al momento dell'estrazione. Per una copertura nazionale immediata si può partire dall'ultima annualità consolidata e sovrapporre le pubblicazioni 2026, mantenendo `asOf`, provenienza e stato provvisorio. L'art. 1, comma 169, della legge 296/2006 dispone la proroga delle aliquote dell'anno precedente in mancanza di nuova approvazione.

Una parte delle regole non è traducibile automaticamente nel modello attuale basato sulla sola RAL: esenzioni e detrazioni possono dipendere da tipo di reddito, età, disabilità o carichi familiari. Questi casi vanno normalizzati esplicitamente oppure dichiarati non applicabili al profilo coperto dal prodotto.

## Fonti e dati verificati

### Addizionale regionale

- [Pagina MEF degli elenchi generali](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/download/tabella.htm): elenchi annuali in CSV; per il 2026 indica ultimo aggiornamento 19 giugno 2026.
- [CSV MEF regionale 2026](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/download/download.php?anno=2026&tipo=reg): 71 righe per 21 giurisdizioni. Campi verificati: anno, regione/provincia autonoma, pubblicazione, disposizioni particolari, norme, note, aliquota e fascia.
- Le disposizioni particolari sono testo libero e includono anche deduzioni, detrazioni o agevolazioni condizionate: gli scaglioni numerici da soli non bastano sempre a calcolare l'imposta.

### Addizionale comunale

- [Pagina MEF degli elenchi generali e schema](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/download/tabella.htm): il MEF dichiara aggiornamento quotidiano e documenta colonne e flag.
- [CSV MEF comunale 2026](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/download/download.php?anno=2026): 7.897 righe e 34 colonne al 26 agosto 2026.
- Campi verificati: codice catastale, comune, sigla provinciale, estremi e data di pubblicazione della delibera, fino a 12 coppie aliquota/fascia, `FLAG_NUOVA`, importo dell'esenzione.
- Il flag distingue: `0` caso specifico; `1` aliquota unica; `2` unica con esenzione; `3` scaglioni; `4` scaglioni con esenzione; `5` unica con esenzione per categorie specifiche; `6` scaglioni con esenzione per categorie specifiche.
- Tra le 3.063 righe 2026 già pubblicate: 1.494 sono flag 1, 963 flag 2, 93 flag 3, 302 flag 4, 176 flag 0, 32 flag 5 e 3 flag 6. I 211 casi `0`, `5` e `6` richiedono interpretazione o dati personali ulteriori.
- Prima del 20 dicembre `0*` significa che non è presente una delibera per l'anno corrente. Dopo tale data il MEF mantiene `0*` per i comuni senza addizionale e riporta, negli altri casi senza nuova delibera, la disciplina precedente. Sono possibili pubblicazioni eccezionali anche nell'anno successivo.

### Anagrafica territoriale

- [Istat — codici di comuni, province e regioni](https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/): è la fonte canonica per la gerarchia territoriale e offre un permalink all'elenco corrente.
- Istat indica 7.894 comuni dal 21 febbraio 2026. Il CSV fiscale MEF contiene ancora anche Castegnero e Nanto oltre al nuovo Castegnero Nanto; per il selettore bisogna quindi filtrare/joinare con l'anagrafica Istat vigente usando il codice catastale, non affidarsi soltanto alla sigla provinciale.
- La provincia è utile come raggruppamento dell'interfaccia, ma non determina una propria addizionale IRPEF. Il calcolo usa regione/provincia autonoma e comune.

### Regola di continuità

- [Legge 296/2006, art. 1, comma 169, su Normattiva](https://www.normattiva.it/eli/stato/LEGGE/2006/12/27/296/CONSOLIDATED/20240613): se l'ente locale non approva nuove aliquote entro il termine, quelle vigenti sono prorogate di anno in anno.

## Implicazioni per l'implementazione

1. Importare snapshot versionati, senza interrogare MEF durante il calcolo dell'utente.
2. Usare Istat come anagrafica vigente e il codice catastale come chiave di join con MEF.
3. Sovrapporre le pubblicazioni 2026 alla base consolidata precedente; conservare `asOf`, anno originario e stato provvisorio.
4. Normalizzare i flag 1–4 in formule; gestire 0, 5 e 6 con regole revisionate e testate, non con parsing del testo a runtime.
5. Conservare il link MEF del comune/regione e gli estremi della delibera come fonte mostrabile nel dettaglio.
6. Decidere esplicitamente se il prodotto calcola soltanto il profilo già dichiarato (dipendente, nessun familiare) o raccoglie gli input aggiuntivi richiesti dalle agevolazioni locali.

## Implementazione del 26 agosto 2026

La issue #18 usa il primo perimetro: dipendente privato, un solo reddito, nessun
familiare e nessuna agevolazione personale. Le condizioni personali dei flag MEF 0, 5
e 6 restano esplicite nel dato e non sono concesse senza input. Le esenzioni generali
presenti nelle fasce strutturate dei casi 0 sono state revisionate in importazione.

Lo snapshot generato contiene 7.894 comuni, 110 raggruppamenti provinciali e 21
giurisdizioni regionali. Sono definitive 3.063 regole comunali pubblicate nel 2026;
4.830 usano la disciplina 2025 prorogata e il nuovo comune Castegnero Nanto conserva
una regola provvisoria 2026 senza pubblicazione precedente. Sei refusi nelle fasce MEF
2026 a quattro scaglioni sono normalizzati ai tetti canonici 15.000 / 28.000 / 50.000.
