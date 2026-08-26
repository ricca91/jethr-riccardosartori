/* Fonti normative usate dalle Riga. Script classico per file://,
   esportato anche in Node per esercitare lo stesso catalogo nei test. */
const FONTI=Object.freeze({
  inps101:Object.freeze(['INPS, circolare 101/2024','aliquota IVS 9,19% a carico del lavoratore','https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2024.11.circolare-numero-101-del-29-11-2024_14714.html']),
  inps6:Object.freeze(['INPS, circolare 6/2026','prima fascia 56.224 € e massimale 122.295 €','https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html']),
  l199:Object.freeze(['L. 199/2025, art. 1 c. 3','scaglioni IRPEF 2026: 23 / 33 / 43%','https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED']),
  tuir13:Object.freeze(['TUIR, art. 13','detrazione da lavoro dipendente e maggiorazione di 65 €','https://def.giustiziatributaria.gov.it/DocTribFrontend/getAttoNormativoDetail.do?ACTION=getArticolo&articolo=Articolo+13&id=%7B31D694E8-4398-4030-873B-FEAF5A6647F9%7D']),
  l207c4:Object.freeze(['L. 207/2024, art. 1 c. 4-5','somma non imponibile fino a 20.000 € di reddito','https://www.normattiva.it/eli/stato/LEGGE/2024/12/30/207/CONSOLIDATED/20251219']),
  l207c6:Object.freeze(['L. 207/2024, art. 1 c. 6','ulteriore detrazione fra 20.000 e 40.000 €','https://www.normattiva.it/eli/stato/LEGGE/2024/12/30/207/CONSOLIDATED/20251219']),
  dl3:Object.freeze(['D.L. 3/2020, art. 1','trattamento integrativo','https://www.normattiva.it/atto/caricaDettaglioAtto?atto.codiceRedazionale=20A02005&atto.dataPubblicazioneGazzetta=2020-04-04&tipoDettaglio=multivigenza']),
  lomb:Object.freeze(['Regione Lombardia','addizionale regionale IRPEF progressiva','https://www.regione.lombardia.it/bollo-auto-e-tributi-regionali/red-addizionale-regionale-irpef']),
  mi:Object.freeze(['Comune di Milano','addizionale comunale 0,8%, esenzione fino a 23.000 €','https://www.comune.milano.it/argomenti/tributi/addizionale-comunale-irpef']),
});

if(typeof module!=='undefined'&&module.exports)module.exports={FONTI};
