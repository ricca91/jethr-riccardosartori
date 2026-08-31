# Dove va la tua RAL

Calcolatore da retribuzione lorda annua a netto. Regole 2026, lavoro dipendente
privato. Questo file è solo il glossario: fissa le parole, non le scelte tecniche —
quelle stanno in `processo/decisioni.md` e nei commenti di risoluzione dei ticket.

## Language

### Il calcolo

**Voce**:
Un fatto di calcolo che esce dal motore: importo, base su cui è stato calcolato,
tipo, fonte normativa e gli altri fatti effettivamente usati per ottenerlo e
spiegarlo. Non contiene testo né sa come verrà mostrata.
_Avoid_: riga, item, entry, componente

**Riga**:
Una voce come appare a schermo: titolo, frase della formula, link alla fonte. La
compone la pagina a partire dai numeri della voce.
_Avoid_: voce, card, dettaglio

**Regime**:
L'insieme di regole che governa un rapporto di lavoro. Oggi ne esiste uno solo,
il lavoro dipendente privato. La partita IVA sarà un secondo regime, non
un'estensione di questo.
_Avoid_: modalità, profilo, caso

**Imponibile**:
La RAL più le eventuali quote imponibili dei benefit, meno i contributi
previdenziali. È la base di quasi tutto ciò che segue: IRPEF, detrazioni,
addizionali, cuneo.
_Avoid_: reddito, base imponibile, netto contributivo

**Capienza**:
Il vincolo per cui una detrazione abbatte l'imposta ma non viene rimborsata. Da
qui la distinzione fra quanto **spetta** e quanto se ne **usa**: a IRPEF lorda 400 €
una detrazione da 1.955 € entra per 400.
_Avoid_: cap, clamp, limite

**Somma**:
L'identità contabile in cui una voce entra. Oggi ne esistono due: il netto del
lavoratore e i benefit spendibili. Il costo azienda ne sarà un'altra. La guardia
di riconciliazione verifica una somma alla volta.
_Avoid_: totale, gruppo, categoria

**Riconciliazione**:
Il controllo che le voci di una somma, applicate alla sua base, ricostruiscano
esattamente il risultato dichiarato. È una guardia, non una prova di correttezza:
dice che i conti tornano, non che le aliquote sono giuste.
_Avoid_: quadratura, check, validazione

**Salto**:
Una RAL in cui il netto scende mentre il lordo sale, perché una regola si attiva o
decade di colpo. Ce ne sono sette, ed è legge, non un errore.
_Avoid_: soglia, discontinuità, edge case

### Come si nominano le cose nel codice

I nomi del dominio stanno in italiano — `trattamentoIntegrativo`,
`addizionaleComunale`, `troncaQuattro` — perché corrispondono a regole scritte in
Gazzetta e non hanno una traduzione onesta. L'impalcatura sta in inglese — `dec`,
`mul`, `toNumber` — perché esiste per far funzionare la macchina, non per
descrivere una norma.

Il criterio, in una riga: **se il nome corrisponde a qualcosa che qualcuno ha
scritto in una circolare, sta in italiano.**
