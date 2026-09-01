/* ============================================================
   MOTORE — calcolatore RAL → netto, contratto di calcolo #4
   Regole 2026, comune selezionabile / impiegato privato / anno intero.

   Script classico, non modulo: la pagina deve aprirsi con un
   doppio clic (file://), dove i moduli non si caricano.
   In Node lo stesso file si carica con require() grazie
   all'export in fondo — così `node --test` gira senza
   installare niente e senza duplicare la logica.

   Qui dentro escono NUMERI. Titoli e formule li compone la
   pagina: una voce non sa come verrà raccontata (CONTEXT.md,
   «voce» contro «riga»). Resta nel motore la `fonte`, perché è
   un'affermazione sulla regola, non su come la disegni.
   ============================================================ */

/* ============================================================
   IMPALCATURA — virgola fissa su BigInt (scala 1e8). Mai float
   binario. I nomi qui sono in inglese: servono a far funzionare
   la macchina, non a descrivere una norma.
   ============================================================ */
const SC=8n,S=10n**8n,CENT=10n**6n,D4=10n**4n;
function dec(x){const s=String(x).trim();const neg=s.startsWith('-');
  const[i,f='']=(neg?s.slice(1):s).split('.');
  const frac=(f+'0'.repeat(Number(SC))).slice(0,Number(SC));
  const v=BigInt(i||'0')*S+BigInt(frac||'0');return neg?-v:v;}
const mul=(a,b)=>(a*b)/S;
const div=(a,b)=>(a*S)/b;
const min=(a,b)=>a<b?a:b;
const toNumber=a=>Number(a)/1e8;
const GEOGRAFIA=typeof module!=='undefined'&&module.exports?require('./geografia.js')
  :GEOGRAFIA_ITALIA;

/* Arrotondamento e troncamento non sono impalcatura: sono due
   regole del contratto, e stanno in italiano come le altre.
   Il netto è la somma delle voci arrotondate al centesimo
   (HALF_UP); i rapporti dell'art. 13 si troncano alla quarta
   cifra decimale, perché la norma dice troncare, non arrotondare. */
const arrotondaCentesimi=a=>{const neg=a<0n,x=neg?-a:a;const q=x/CENT,r=x%CENT;
  const y=(r*2n>=CENT?q+1n:q)*CENT;return neg?-y:y;};
const troncaQuattro=a=>(a/D4)*D4;

/* ============================================================
   COSTANTI — nessuna soglia e nessuna aliquota compare come
   letterale dentro la logica: se un numero viene da una circolare
   o da una legge, sta qui e ha un nome.
   ============================================================ */
const K={
  contributi:{
    aliquotaIvs:dec('0.0919'),            // INPS circ. 101/2024
    massimale:dec('122295'),              // INPS circ. 6/2026
    primaFascia:dec('56224'),             // INPS circ. 6/2026
    aliquotaAggiuntivo:dec('0.01'),       // 1% oltre la prima fascia
  },
  irpef:{                                 // L. 199/2025, art. 1 c. 3
    scaglioni:[[dec('28000'),dec('0.23')],[dec('50000'),dec('0.33')],[null,dec('0.43')]],
  },
  detrazioneLavoro:{                      // TUIR, art. 13
    sogliaFissa:dec('15000'),   importoFisso:dec('1955'),
    sogliaIntermedia:dec('28000'), quotaBase:dec('1910'),
    quotaAggiuntiva:dec('1190'), ampiezzaIntermedia:dec('13000'),
    sogliaFinale:dec('50000'),  ampiezzaFinale:dec('22000'),
    maggiorazione:dec('65'), maggiorazioneDa:dec('25000'), maggiorazioneA:dec('35000'),
  },
  ulterioreDetrazione:{                   // L. 207/2024, art. 1 c. 6
    importoPieno:dec('1000'), da:dec('20000'),
    pienoFinoA:dec('32000'), a:dec('40000'), ampiezzaDecrescente:dec('8000'),
  },
  regionale:{                             // Regione Lombardia
    scaglioni:[[dec('15000'),dec('0.0123')],[dec('28000'),dec('0.0158')],
               [dec('50000'),dec('0.0172')],[null,dec('0.0173')]],
  },
  comunale:{                              // Comune di Milano
    aliquota:dec('0.008'), esenzioneFinoA:dec('23000'),
  },
  sommaNonImponibile:{                    // L. 207/2024, art. 1 c. 4-5
    /* L'ultimo tetto È il limite: sopra i 20.000 € la somma non
       spetta più. Scriverlo due volte vuol dire poterlo cambiare
       in un posto solo e non accorgersene. */
    aliquote:[[dec('8500'),dec('0.071')],[dec('15000'),dec('0.053')],[dec('20000'),dec('0.048')]],
  },
  trattamentoIntegrativo:{                // D.L. 3/2020, art. 1
    limiteImponibile:dec('15000'), importo:dec('1200'), scartoDetrazione:dec('75'),
  },
  carichiFamiglia:{                       // TUIR, art. 12
    redditoMassimoFamiliare:dec('2840.51'),        // c. 2
    redditoMassimoFiglioGiovane:dec('4000'),       // c. 2, figli fino a 24 anni
    etaFiglioGiovane:24,
    coniuge:{                             // c. 1 lett. a) e b)
      importoPieno:dec('800'), scarto:dec('110'), riferimento:dec('15000'),
      importoFisso:dec('690'),
      daTerzoRapporto:dec('40000'), aTerzoRapporto:dec('80000'), ampiezzaTerzoRapporto:dec('40000'),
      /* lett. b): cinque scalini, l'unico punto in cui la detrazione risale */
      scalini:[[dec('29000'),dec('29200'),dec('10')],[dec('29200'),dec('34700'),dec('20')],
               [dec('34700'),dec('35000'),dec('30')],[dec('35000'),dec('35100'),dec('20')],
               [dec('35100'),dec('35200'),dec('10')]],
    },
    figlio:{                              // c. 1 lett. c)
      importo:dec('950'), soglia:dec('95000'), incremento:dec('15000'),
      etaMinima:21, etaMassima:30,
    },
    ascendente:{                          // c. 1 lett. d)
      importo:dec('750'), soglia:dec('80000'),
    },
  },
  benefit:{                               // Regole 2026, TUIR art. 51
    fringe:{
      sogliaOrdinaria:dec('1000'),        // L. 207/2024, art. 1 c. 390
      sogliaConFigli:dec('2000'),         // L. 207/2024, art. 1 c. 391
    },
    buoniPasto:{                          // TUIR, art. 51 c. 2 lett. c
      cartacei:dec('4'),
      elettronici:dec('8'),
    },
  },
};

/* Il denaro in busta e i benefit spendibili sono somme diverse:
   la guardia di riconciliazione ne considera una alla volta. */
const NETTO_LAVORATORE='nettoLavoratore';
const BENEFIT_SPENDIBILI='benefitSpendibili';
const SOMME=[NETTO_LAVORATORE,BENEFIT_SPENDIBILI];

/* ============================================================
   LE VOCI, UNA FUNZIONE PER CIASCUNA
   Ogni funzione qui sotto prende numeri e restituisce numeri.
   Si può esercitare da sola, a un imponibile scelto, senza
   passare da calcola() e senza cercare la RAL che lo produce.
   ============================================================ */

/* Il totale per scaglioni progressivi: aliquota su aliquota, ogni
   fascia sulla sola quota che le compete. Lo usano l'IRPEF lorda
   e l'addizionale regionale — stessa forma, tabelle diverse. */
function perScaglioni(base,scaglioni){
  let totale=0n,precedente=0n;
  for(const[tetto,aliquota]of scaglioni){
    const cima=tetto===null?base:min(base,tetto);
    if(cima>precedente)totale+=mul(cima-precedente,aliquota);
    if(tetto===null)break;
    precedente=tetto;
    if(base<=tetto)break;
  }
  return totale;
}

/* La base contributiva si ferma al massimale: sopra, si fermano
   sia il 9,19% sia l'1%, perché guardano la stessa base. Da qui
   la contribuzione regressiva oltre 122.295 €. */
function baseContributiva(ral){return min(ral,K.contributi.massimale);}

function contributiIvs(ral){
  const base=baseContributiva(ral);
  return{base,aliquota:K.contributi.aliquotaIvs,importo:mul(base,K.contributi.aliquotaIvs)};
}

function contributoAggiuntivo(ral){
  const base=baseContributiva(ral);
  const eccedenza=base>K.contributi.primaFascia?base-K.contributi.primaFascia:0n;
  return{base,eccedenza,soglia:K.contributi.primaFascia,
    aliquota:K.contributi.aliquotaAggiuntivo,
    importo:mul(eccedenza,K.contributi.aliquotaAggiuntivo)};
}

/* Il netto contributivo, arrotondato voce per voce prima di
   sommare: è la stessa convenzione che regge il netto annuo. */
function contributi(ral){
  return arrotondaCentesimi(contributiIvs(ral).importo)
        +arrotondaCentesimi(contributoAggiuntivo(ral).importo);
}

function imponibile(ral){return ral-contributi(ral);}

function irpefLorda(imponibile){return perScaglioni(imponibile,K.irpef.scaglioni);}

/* Art. 13 TUIR: tre fasce e una maggiorazione. Dice quanto
   SPETTA, non quanto se ne usa — quello lo decide applicaCapienza.
   Il rapporto si tronca a quattro decimali: a precisione piena, a
   RAL 35.000, la detrazione sarebbe 1.581,52 invece di 1.581,48. */
function detrazioneLavoroDipendente(imponibile){
  const D=K.detrazioneLavoro;
  let quotaFissa=0n,quotaVariabile=0n,rapporto=null,base=0n;
  if(imponibile<=D.sogliaFissa){
    quotaFissa=D.importoFisso;
    base=quotaFissa;
  }else if(imponibile<=D.sogliaIntermedia){
    quotaFissa=D.quotaBase;quotaVariabile=D.quotaAggiuntiva;
    rapporto=troncaQuattro(div(D.sogliaIntermedia-imponibile,D.ampiezzaIntermedia));
    base=quotaFissa+mul(quotaVariabile,rapporto);
  }else if(imponibile<=D.sogliaFinale){
    quotaVariabile=D.quotaBase;
    rapporto=troncaQuattro(div(D.sogliaFinale-imponibile,D.ampiezzaFinale));
    base=mul(quotaVariabile,rapporto);
  }
  const maggiorazione=(imponibile>D.maggiorazioneDa&&imponibile<=D.maggiorazioneA)?D.maggiorazione:0n;
  /* `articolo13` è la detrazione prima della maggiorazione. Serve
     al trattamento integrativo, che guarda quella e non il totale:
     tenerla separata evita di far dipendere il D.L. 3/2020 dal
     fatto che oggi le due finestre non si sovrappongono. */
  return{quotaFissa,quotaVariabile,rapporto,articolo13:base,maggiorazione,
    spettante:base+maggiorazione};
}

/* L. 207/2024 c. 6: piena fra 20.000 e 32.000, poi si consuma
   linearmente fino a 40.000. Anche questa dice quanto spetta. */
function ulterioreDetrazione(imponibile){
  const U=K.ulterioreDetrazione;
  if(imponibile>U.da&&imponibile<=U.pienoFinoA)
    return{quotaFissa:U.importoPieno,rapporto:null,spettante:U.importoPieno};
  if(imponibile>U.pienoFinoA&&imponibile<=U.a){
    const rapporto=div(U.a-imponibile,U.ampiezzaDecrescente);
    return{quotaFissa:U.importoPieno,rapporto,spettante:mul(U.importoPieno,rapporto)};
  }
  return{quotaFissa:0n,rapporto:null,spettante:0n};
}

/* Art. 12 TUIR: le detrazioni per carichi di famiglia. Prende il
   reddito complessivo (qui approssimato con l'imponibile) e il
   nucleo dichiarato, e restituisce una valutazione per ciascun
   familiare, nello stesso ordine: quanto spetta e, quando non
   spetta, il CODICE del motivo. Il motivo in italiano lo scrive la
   Riga: qui escono fatti, non frasi.

   Il comma 4 governa i rapporti: si guarda il rapporto vero per
   decidere se la detrazione compete, e lo si assume nelle prime
   quattro cifre decimali per calcolarla. Le due cose sono
   distinte, e invertirle azzererebbe detrazioni che spettano. */
const NON_A_CARICO='familiareNonACarico';
const FUORI_INTERVALLO='rapportoFuoriIntervallo';
const SPETTA='spetta';

function limiteRedditoFamiliare(tipo,eta){
  const F=K.carichiFamiglia;
  if(tipo!=='figlio')return F.redditoMassimoFamiliare;
  if(eta===null||eta===undefined)return null;
  return eta<=F.etaFiglioGiovane?F.redditoMassimoFiglioGiovane:F.redditoMassimoFamiliare;
}

function detrazioneConiuge(imponibile){
  const C=K.carichiFamiglia.coniuge;
  const scalino=C.scalini.find(([da,a])=>imponibile>da&&imponibile<=a);
  const fissa=maggiorazione=>({importo:C.importoFisso,da:C.riferimento,a:C.daTerzoRapporto,
    maggiorazione,scalinoDa:scalino?scalino[0]:null,scalinoA:scalino?scalino[1]:null});

  if(imponibile<=C.riferimento){
    const grezzo=div(imponibile,C.riferimento);
    const termini={importo:C.importoPieno,scarto:C.scarto,riferimento:C.riferimento};
    /* c. 4: rapporto zero, la detrazione non compete; rapporto uno,
       la detrazione è 690 e la formula del primo rapporto non si usa. */
    if(grezzo===0n)return{esito:FUORI_INTERVALLO,spettante:0n,rapporto:grezzo,
      fascia:'primoRapporto',termini};
    if(grezzo===S)return{esito:SPETTA,spettante:C.importoFisso,rapporto:S,
      fascia:'rapportoUno',termini:{importo:C.importoFisso}};
    const rapporto=troncaQuattro(grezzo);
    return{esito:SPETTA,spettante:C.importoPieno-mul(C.scarto,rapporto),rapporto,
      fascia:'primoRapporto',termini};
  }
  if(imponibile<=C.daTerzoRapporto){
    const maggiorazione=scalino?scalino[2]:0n;
    return{esito:SPETTA,spettante:C.importoFisso+maggiorazione,rapporto:null,
      fascia:'fissa',termini:fissa(maggiorazione)};
  }
  const termini={importo:C.importoFisso,da:C.daTerzoRapporto,a:C.aTerzoRapporto,
    ampiezza:C.ampiezzaTerzoRapporto};
  if(imponibile<=C.aTerzoRapporto){
    const grezzo=div(C.aTerzoRapporto-imponibile,C.ampiezzaTerzoRapporto);
    if(grezzo===0n)return{esito:FUORI_INTERVALLO,spettante:0n,rapporto:grezzo,
      fascia:'terzoRapporto',termini};
    const rapporto=troncaQuattro(grezzo);
    return{esito:SPETTA,spettante:mul(C.importoFisso,rapporto),rapporto,
      fascia:'terzoRapporto',termini};
  }
  return{esito:FUORI_INTERVALLO,spettante:0n,rapporto:null,fascia:'terzoRapporto',termini};
}

/* Lett. c) e d) hanno la stessa forma: un importo per il rapporto
   fra quanto resta della soglia e la soglia. Cambiano importo e
   soglia — e la soglia dei figli cresce, quella degli ascendenti no. */
function detrazioneSuSoglia(imponibile,importo,soglia,termini){
  const grezzo=div(soglia-imponibile,soglia);
  const fatti={...termini,importo,soglia};
  if(grezzo<=0n||grezzo===S)
    return{esito:FUORI_INTERVALLO,spettante:0n,rapporto:grezzo,fascia:null,termini:fatti};
  const rapporto=troncaQuattro(grezzo);
  return{esito:SPETTA,spettante:mul(importo,rapporto),rapporto,fascia:null,termini:fatti};
}

/* La lett. c) dà la detrazione «per ciascun figlio di età compresa fra
   21 e 30 anni, ovvero per ciascun figlio di età pari o superiore a 30
   anni con disabilità accertata ai sensi dell'art. 3 L. 104/1992». La
   disabilità toglie il tetto dei 30 anni: non cambia l'importo, e per
   questo non porta con sé nessuna costante in K. Sotto i 21 anni non
   toglie niente, perché lì la detrazione non esiste per nessuno. */
function etaAmmessaArt12(familiare){
  const F=K.carichiFamiglia.figlio;
  const eta=familiare.eta;
  if(eta===null||eta===undefined||eta==='')return false;
  if(eta<F.etaMinima)return false;
  return eta<F.etaMassima||!!familiare.disabilita;
}

/* «In presenza di più figli CHE DANNO DIRITTO alla detrazione»:
   il figlio di quindici anni non porta detrazione e non fa salire
   la soglia per i fratelli. Contarlo sarebbe generoso e sbagliato. */
function daDirittoAllaDetrazione(familiare){
  if(familiare.tipo!=='figlio')return false;
  if(!etaAmmessaArt12(familiare))return false;
  return dec(String(familiare.reddito??0))<=limiteRedditoFamiliare('figlio',familiare.eta);
}

const TIPI_FAMILIARE=['coniuge','figlio','ascendente'];
function verificaNucleo(nucleo){
  if(!Array.isArray(nucleo))throw new TypeError('Il nucleo familiare deve essere un array');
  let coniugi=0;
  for(const familiare of nucleo){
    if(!familiare||!TIPI_FAMILIARE.includes(familiare.tipo))
      throw new TypeError(`Tipo di familiare sconosciuto: ${familiare&&familiare.tipo}`);
    if(familiare.tipo==='coniuge'&&++coniugi>1)
      throw new RangeError('Si dichiara un solo coniuge a carico');
    if(familiare.disabilita!==undefined&&typeof familiare.disabilita!=='boolean')
      throw new TypeError(`Disabilità non valida: ${familiare.disabilita}`);
    const eta=familiare.eta;
    if(eta===null||eta===undefined||eta==='')continue;
    if(!Number.isInteger(eta)||eta<0)throw new RangeError(`Età non valida: ${eta}`);
  }
}

function detrazioniCarichiFamiglia(imponibile,nucleo=[]){
  verificaNucleo(nucleo);
  const F=K.carichiFamiglia;
  const conDiritto=nucleo.filter(daDirittoAllaDetrazione).length;
  const oltreIlPrimo=Math.max(0,conDiritto-1);
  const sogliaFigli=F.figlio.soglia+F.figlio.incremento*BigInt(oltreIlPrimo);
  return nucleo.map(familiare=>{
    const tipo=familiare.tipo;
    const eta=familiare.eta===undefined||familiare.eta===''?null:familiare.eta;
    const redditoFamiliare=dec(String(familiare.reddito??0));
    const limite=limiteRedditoFamiliare(tipo,eta);
    const disabilita=!!familiare.disabilita;
    const comune={tipoFamiliare:tipo,eta,disabilita,redditoFamiliare,limiteRedditoFamiliare:limite};
    const fuori=esito=>({...comune,esito,spettante:0n,rapporto:null,fascia:null,termini:{}});

    /* Per i figli l'età viene prima del reddito: è la condizione
       strutturale, e finché manca non si sa nemmeno quale limite
       di reddito applicare. */
    if(tipo==='figlio'){
      if(eta===null)return fuori('etaNonDichiarata');
      if(eta<F.figlio.etaMinima)return fuori('assorbitaAssegnoUnico');
      if(eta>=F.figlio.etaMassima&&!disabilita)return fuori('oltreTrentaAnni');
    }
    if(redditoFamiliare>limite)return fuori(NON_A_CARICO);
    if(tipo==='coniuge')return{...comune,...detrazioneConiuge(imponibile)};
    if(tipo==='figlio')return{...comune,...detrazioneSuSoglia(imponibile,
      F.figlio.importo,sogliaFigli,
      {sogliaBase:F.figlio.soglia,incremento:F.figlio.incremento,oltreIlPrimo})};
    return{...comune,...detrazioneSuSoglia(imponibile,
      F.ascendente.importo,F.ascendente.soglia,{})};
  });
}

/* CAPIENZA — una detrazione abbatte l'imposta, non viene
   rimborsata. Qui si decide quanto se ne USA, e in che ordine:
   prima quella da lavoro dipendente, poi l'ulteriore. L'ordine
   dell'array è l'ordine di consumo, ed è la ragione per cui
   questo passo ha un nome invece di stare sciolto in tre righe.
   Quel che resta dell'imposta dopo il consumo è l'IRPEF netta. */
function applicaCapienza(lorda,spettanti){
  let residua=lorda;
  const usi=spettanti.map(spettante=>{
    const uso=min(spettante,residua);
    residua-=uso;
    return uso;
  });
  return{usi,residua};
}

/* Le detrazioni per carichi di famiglia sono un blocco solo:
   l'art. 12 le somma, non le mette in fila. Quando la capienza non
   basta, la quota effettivamente usata si ripartisce in proporzione
   a quanto spetta a ciascuno. La ripartizione è una convenzione di
   PRESENTAZIONE — serve a poter mostrare una riga per familiare —
   non una regola della norma: la norma non alloca niente a nessuno.
   Consumarle in fila, invece, direbbe che il primo dichiarato ha
   avuto tutto e l'ultimo niente, che non è vero di nessuno. */
function ripartisciCapienza(spettanti,residua){
  if(!spettanti.length)return{usi:[],residua};
  const totale=spettanti.reduce((a,s)=>a+s,0n);
  const disponibile=residua>0n?arrotondaCentesimi(residua):0n;
  const uso=min(totale,disponibile);
  if(uso===totale)return{usi:spettanti.slice(),residua:residua-uso};
  /* Incapienti: quel che spetta supera l'imposta, quindi l'imposta
     finisce. Resta a zero e non a un milionesimo di euro, altrimenti
     farebbe scattare un'addizionale su un'imposta che non c'è più. */
  const quota=totale===0n?0n:div(uso,totale);
  const usi=spettanti.map(s=>arrotondaCentesimi(mul(s,quota)));
  /* Il resto dell'arrotondamento va a chi la detrazione ce l'ha:
     darlo a chi ha zero significherebbe inventargli un diritto. */
  const ultimo=usi.reduce((scelto,_,i)=>spettanti[i]>0n?i:scelto,-1);
  if(ultimo>=0)usi[ultimo]+=uso-usi.reduce((a,u)=>a+u,0n);
  return{usi,residua:0n};
}

/* Le addizionali si pagano solo se l'IRPEF netta è dovuta: a
   imposta azzerata dalle detrazioni non c'è addizionale. */
function regolaDecimale(n){return dec(String(n??0));}
function scaglioniDecimali(scaglioni){return scaglioni.map(([t,a])=>[t===null?null:dec(String(t)),regolaDecimale(a)]);}

/* ------------------------------------------------------------
   LA FAMIGLIA DENTRO LE REGOLE LOCALI
   Nove regioni e sei comuni guardano i figli a carico, e non lo
   fanno tutti allo stesso modo: sei aggiungono una DETRAZIONE per
   figlio, due cambiano l'ALIQUOTA, sei comuni cambiano l'ESENZIONE.
   Sono tre meccanismi distinti, e restano distinti anche qui.

   Il nucleo arriva intero, minorenni compresi: il filtro sta in
   queste funzioni e mai sull'input, altrimenti il dato locale non
   sarebbe più ricostruibile. Sardegna vuole proprio i minorenni,
   e i comuni veronesi contano i figli senza limite d'età.
   ------------------------------------------------------------ */

/* «A carico» dell'art. 12 c. 2 è una condizione di reddito, non di
   età: il figlio di dieci anni è a carico anche se la detrazione
   nazionale non gli spetta. Quando l'età non è dichiarata non si sa
   quale dei due limiti valga, e si usa il più stretto. */
function aCaricoPerReddito(familiare,limiteEsplicito){
  const limite=limiteEsplicito!==undefined?dec(String(limiteEsplicito))
    :(familiare.tipo==='figlio'
      ?(limiteRedditoFamiliare('figlio',familiare.eta)??K.carichiFamiglia.redditoMassimoFamiliare)
      :K.carichiFamiglia.redditoMassimoFamiliare);
  return dec(String(familiare.reddito??0))<=limite;
}

/* I figli che una singola regola locale conta. Ogni criterio è un
   campo del dato, non un ramo indovinato dal nome dell'ente. */
function figliContati(famiglia,criterio={}){
  return (famiglia||[]).filter(f=>{
    if(!f||f.tipo!=='figlio')return false;
    if(criterio.soloDisabili&&!f.disabilita)return false;
    if(criterio.tettoTrentaAnni&&!etaAmmessaSalvoDisabilita(f))return false;
    if(criterio.etaMassima!==undefined){
      if(f.eta===null||f.eta===undefined||f.eta==='')return false;
      if(f.eta>=criterio.etaMassima)return false;
    }
    return aCaricoPerReddito(f,criterio.redditoMassimoFiglio);
  });
}
function etaAmmessaSalvoDisabilita(familiare){
  const eta=familiare.eta;
  if(eta===null||eta===undefined||eta==='')return true;
  return eta<K.carichiFamiglia.figlio.etaMassima||!!familiare.disabilita;
}

/* Marche e Veneto: l'agevolazione non toglie euro all'imposta, la
   ricalcola da capo con un'altra aliquota. Le Marche chiedono un
   figlio, il Veneto un familiare qualunque. */
function aliquotaFamiliareApplicabile(imponibile,regola,famiglia){
  const a=regola&&regola.aliquotaFamiliare;
  if(!a)return null;
  if(a.finoA!==undefined&&imponibile>dec(String(a.finoA)))return null;
  const candidati=(famiglia||[]).filter(f=>f&&f.disabilita&&
    (a.richiede==='figlioDisabile'?f.tipo==='figlio':TIPI_FAMILIARE.includes(f.tipo)));
  return candidati.some(f=>aCaricoPerReddito(f))?regolaDecimale(a.aliquota):null;
}

/* I sei comuni veronesi: l'esenzione non è un importo ma una soglia
   che SALE con i figli. Il numero minimo è una condizione d'accesso,
   quindi sotto quel numero la soglia familiare non esiste affatto. */
function sogliaEsenzioneFamiliare(regola,famiglia){
  const e=regola&&regola.esenzioneFamiliare;
  if(!e)return null;
  const quanti=figliContati(famiglia,e).length;
  const minimo=e.minimoFigli??1;
  if(quanti<minimo)return null;
  return dec(String(e.finoA))+dec(String(e.incrementoPerFiglio??0))*BigInt(quanti-minimo);
}

function detrazioneLocale(imponibile,detrazioni=[],famiglia=[]){
  let totale=0n;
  for(const d of detrazioni){
    const oltre=d.oltre===undefined?null:dec(String(d.oltre));
    const fino=d.finoA===undefined?null:dec(String(d.finoA));
    if((oltre!==null&&imponibile<=oltre)||(fino!==null&&imponibile>fino))continue;
    if(d.fissa!==undefined)totale+=dec(String(d.fissa));
    else if(d.massimo!==undefined){
      const da=dec(String(d.progressivaDa)),ampiezza=dec(String(d.ampiezza));
      totale+=min(dec(String(d.massimo)),mul(dec(String(d.massimo)),div(imponibile-da,ampiezza)));
    }
    else if(d.perFiglio!==undefined){
      const p=d.perFiglio,figli=figliContati(famiglia,p);
      if(figli.length<(p.minimoFigli??1))continue;
      totale+=dec(String(p.importo))*BigInt(figli.length);
      if(p.supplementoDisabile!==undefined)
        totale+=dec(String(p.supplementoDisabile))*BigInt(figli.filter(f=>f.disabilita).length);
    }
  }
  return totale;
}
function calcolaAddizionale(imponibile,dovute,regola,famiglia=[]){
  if(!dovute||!regola||regola.tipo==='nessuna')return 0n;
  const sogliaFamiliare=sogliaEsenzioneFamiliare(regola,famiglia);
  if(sogliaFamiliare!==null&&imponibile<=sogliaFamiliare)return 0n;
  if(regola.esenzioneFinoA&&imponibile<=dec(String(regola.esenzioneFinoA)))return 0n;
  let imposta=0n;
  const agevolata=aliquotaFamiliareApplicabile(imponibile,regola,famiglia);
  if(agevolata!==null)imposta=mul(imponibile,agevolata);
  else if(regola.fasciaInteraFinoA&&imponibile<=dec(String(regola.fasciaInteraFinoA[0])))
    imposta=mul(imponibile,regolaDecimale(regola.fasciaInteraFinoA[1]));
  else if(regola.tipo==='aliquotaUnica')imposta=mul(imponibile,regolaDecimale(regola.aliquota));
  else if(regola.tipo==='scaglioni')imposta=perScaglioni(imponibile,scaglioniDecimali(regola.scaglioni));
  else if(regola.tipo==='aliquotePerReddito'){
    const fascia=regola.fasce.find(([t])=>t===null||imponibile<=dec(String(t)));
    imposta=fascia?mul(imponibile,regolaDecimale(fascia[1])):0n;
  }else throw new TypeError(`Tipo di addizionale sconosciuto: ${regola.tipo}`);
  const detrazione=detrazioneLocale(imponibile,regola.detrazioni,famiglia);
  return imposta>detrazione?imposta-detrazione:0n;
}
function addizionaleRegionale(imponibile,dovute,regola,famiglia=[]){
  return regola?calcolaAddizionale(imponibile,dovute,regola,famiglia)
    :(dovute?perScaglioni(imponibile,K.regionale.scaglioni):0n);
}

/* Esenzione secca, non franchigia: superati i 23.000 € si paga
   sull'intero imponibile, non sull'eccedenza. */
function addizionaleComunale(imponibile,dovute,regola,famiglia=[]){
  return regola?calcolaAddizionale(imponibile,dovute,regola,famiglia)
    :((dovute&&imponibile>K.comunale.esenzioneFinoA)?mul(imponibile,K.comunale.aliquota):0n);
}

function sommaNonImponibile(imponibile){
  const riga=K.sommaNonImponibile.aliquote.find(([tetto])=>imponibile<=tetto);
  if(!riga)return{aliquota:null,importo:0n};
  return{aliquota:riga[1],importo:mul(imponibile,riga[1])};
}

/* D.L. 3/2020: spetta sotto i 15.000 € di imponibile solo se
   l'IRPEF lorda supera la detrazione dell'art. 13 diminuita di
   75 €. `detrazione` è quella dell'art. 13, senza la
   maggiorazione: oggi le due letture coinciderebbero, perché la
   maggiorazione parte da 25.000, ma è una coincidenza fra due
   soglie e non una regola. */
function trattamentoIntegrativo(imponibile,lorda,detrazione){
  const T=K.trattamentoIntegrativo;
  return(imponibile<=T.limiteImponibile&&lorda>(detrazione-T.scartoDetrazione))?T.importo:0n;
}

/* RICONCILIAZIONE — la guardia, non una prova di correttezza:
   dice che i conti tornano, non che le aliquote sono giuste.
   Verifica UNA somma alla volta, non «tutto»: filtra le voci che
   entrano nell'identità chiesta e ricostruisce il netto da lì. */
const TIPI_PER_SOMMA={
  [NETTO_LAVORATORE]:['contributo','imposta','detrazione','integrazione'],
  [BENEFIT_SPENDIBILI]:['benefit'],
};
function riconcilia(ral,voci,somma=NETTO_LAVORATORE){
  const della=voci.filter(v=>v.somma===somma);
  const netto=della.reduce((a,v)=>a+v._i,ral);
  /* L'identità ricostruita per tipo. Che la partizione torni è
     algebra — è il limite dichiarato di questa guardia. Quello che
     il controllo prende davvero è una voce con un tipo che
     nell'identità non compare.
     Le voci di un'ALTRA somma non entrano qui, nemmeno se sono
     malformate: la riconciliazione ne verifica una alla volta. */
  const perTipo=t=>della.filter(v=>v.tipo===t).reduce((a,v)=>a+v._i,0n);
  const daIdentita=TIPI_PER_SOMMA[somma].reduce((a,t)=>a+perTipo(t),ral);
  return{netto,quante:della.length,
    verificata:della.length>0&&netto===daIdentita};
}

/* Una voce deve dichiarare una somma NOTA, altrimenti sparirebbe da
   ogni riconciliazione senza che nessuno se ne accorga. È una
   domanda sull'insieme delle voci, non su una somma sola: per
   questo sta fuori da riconcilia(), che di somme ne guarda una. */
const sommeDichiarate=voci=>voci.every(v=>SOMME.includes(v.somma));

/* BENEFIT — il valore nominale è spendibile ma non è denaro in
   busta. Le sole quote imponibili si sommano alla base previdenziale
   e fiscale; il superamento della soglia fringe rende imponibile
   l'intero valore, mentre i buoni tassano soltanto l'eccedenza per
   singolo titolo. `welfare` è dichiarato dall'utente già qualificato
   come esente: il motore non può ricostruire il piano aziendale. */
const BENEFIT_DEFAULT=Object.freeze({tipo:'elettronici',valoreUnitario:0,numero:0});
function importoBenefit(nome,valore){
  const n=Number(valore??0);
  if(!Number.isFinite(n)||n<0)throw new RangeError(`${nome} non valido: ${valore}`);
  return arrotondaCentesimi(dec(String(n)));
}
function valutaBenefit(opzioni,nucleo){
  verificaNucleo(nucleo);
  const welfare=importoBenefit('Welfare',opzioni.welfare);
  const fringe=importoBenefit('Fringe benefit',opzioni.fringe);
  const figlioACarico=nucleo.some(f=>f.tipo==='figlio'&&
    dec(String(f.reddito??0))<=limiteRedditoFamiliare('figlio',f.eta));
  const sogliaFringe=figlioACarico
    ?K.benefit.fringe.sogliaConFigli:K.benefit.fringe.sogliaOrdinaria;
  const fringeImponibile=fringe>sogliaFringe?fringe:0n;

  const buoni={...BENEFIT_DEFAULT,...(opzioni.buoniPasto||{})};
  if(!Object.hasOwn(K.benefit.buoniPasto,buoni.tipo))
    throw new RangeError(`Tipo di buoni pasto non valido: ${buoni.tipo}`);
  const valoreUnitario=importoBenefit('Valore unitario buoni pasto',buoni.valoreUnitario);
  if(!Number.isInteger(Number(buoni.numero))||Number(buoni.numero)<0)
    throw new RangeError(`Numero di buoni pasto non valido: ${buoni.numero}`);
  const numero=BigInt(Number(buoni.numero));
  const sogliaUnitaria=K.benefit.buoniPasto[buoni.tipo];
  const valoreBuoni=valoreUnitario*numero;
  const esenteUnitario=min(valoreUnitario,sogliaUnitaria);
  const quotaEsenteBuoni=esenteUnitario*numero;
  const quotaImponibileBuoni=valoreBuoni-quotaEsenteBuoni;
  return{welfare,fringe,sogliaFringe,fringeImponibile,figlioACarico,
    buoni:{tipo:buoni.tipo,valoreUnitario,numero:Number(numero),sogliaUnitaria,
      valore:valoreBuoni,quotaEsente:quotaEsenteBuoni,quotaImponibile:quotaImponibileBuoni},
    imponibile:fringeImponibile+quotaImponibileBuoni,
    spendibile:welfare+fringe+valoreBuoni};
}

/* ============================================================
   LA SEQUENZA — l'ordine dei passi è vincolante, quindi l'ordine
   È il codice: si legge dall'alto in basso e nessuno può
   riordinarlo per sbaglio spostando una riga di una tabella.
   ============================================================ */
function calcola(ralInput,opzioni={}){
  const geo=GEOGRAFIA.risolvi(opzioni.comune||'F205');
  const RAL=arrotondaCentesimi(dec(ralInput));
  const nucleo=opzioni.nucleo||[];
  const benefit=valutaBenefit(opzioni,nucleo);
  const BASE_PREVIDENZIALE=RAL+benefit.imponibile;
  const voci=[];
  const serializza=v=>typeof v==='bigint'?toNumber(v)
    :Array.isArray(v)?v.map(serializza)
    :v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,serializza(x)]))
    :v;
  const emetti=(id,tipo,fonte,base,importo,dettagli={},somma=NETTO_LAVORATORE)=>{
    const i=arrotondaCentesimi(importo);
    voci.push({id,tipo,somma,base:toNumber(base),
      importo:toNumber(i),fonte,...serializza(dettagli),
      _i:i});
  };

  if(benefit.welfare>0n)emetti('welfare','benefit','tuir51welfare',benefit.welfare,benefit.welfare,
    {quotaEsente:benefit.welfare,quotaImponibile:0n},BENEFIT_SPENDIBILI);
  if(benefit.fringe>0n)emetti('fringe','benefit','l207fringe',benefit.fringe,benefit.fringe,
    {soglia:benefit.sogliaFringe,figlioACarico:benefit.figlioACarico,
      quotaEsente:benefit.fringeImponibile===0n?benefit.fringe:0n,
      quotaImponibile:benefit.fringeImponibile},BENEFIT_SPENDIBILI);
  if(benefit.buoni.valore>0n)emetti('buoni','benefit','tuir51buoni',benefit.buoni.valore,
    benefit.buoni.valore,{tipoBuoni:benefit.buoni.tipo,
      valoreUnitario:benefit.buoni.valoreUnitario,numero:benefit.buoni.numero,
      sogliaUnitaria:benefit.buoni.sogliaUnitaria,quotaEsente:benefit.buoni.quotaEsente,
      quotaImponibile:benefit.buoni.quotaImponibile},BENEFIT_SPENDIBILI);

  /* 1-2. dalla RAL all'imponibile */
  const ivs=contributiIvs(BASE_PREVIDENZIALE);
  emetti('ivs','contributo','inps101',ivs.base,-ivs.importo,{aliquota:ivs.aliquota});
  const agg=contributoAggiuntivo(BASE_PREVIDENZIALE);
  if(agg.importo>0n)
    emetti('ecc','contributo','inps6',agg.eccedenza,-agg.importo,
      {baseContributiva:agg.base,soglia:agg.soglia,aliquota:agg.aliquota});
  const contributiTotali=contributi(BASE_PREVIDENZIALE);
  const I=imponibile(BASE_PREVIDENZIALE);

  /* 3. IRPEF lorda */
  const lorda=irpefLorda(I);

  /* 4-5. quanto spetta */
  const detrLav=detrazioneLavoroDipendente(I);
  const detrUlt=ulterioreDetrazione(I);

  /* 6. quanto se ne usa, e in che ordine */
  const capienza=applicaCapienza(lorda,[detrLav.spettante,detrUlt.spettante]);
  const[usoLav,usoUlt]=capienza.usi;

  /* 6-bis. i carichi di famiglia consumano quel che resta
     dell'imposta dopo l'art. 13: stessa capienza, un blocco solo. */
  const famiglia=detrazioniCarichiFamiglia(I,nucleo);
  const spettantiFamiglia=famiglia.map(f=>arrotondaCentesimi(f.spettante));
  const ripartizione=ripartisciCapienza(spettantiFamiglia,capienza.residua);
  const netta=ripartizione.residua;

  emetti('lorda','imposta','l199',I,-lorda,{scaglioni:K.irpef.scaglioni});
  emetti('detrlav','detrazione','tuir13',I,usoLav,{
    spettante:detrLav.spettante,quotaFissa:detrLav.quotaFissa,
    quotaVariabile:detrLav.quotaVariabile,rapporto:detrLav.rapporto,
    maggiorazione:detrLav.maggiorazione,capiente:usoLav===detrLav.spettante,
    sogliaFissa:K.detrazioneLavoro.sogliaFissa,
    sogliaIntermedia:K.detrazioneLavoro.sogliaIntermedia,
    sogliaFinale:K.detrazioneLavoro.sogliaFinale,
    maggiorazioneDa:K.detrazioneLavoro.maggiorazioneDa,
    maggiorazioneA:K.detrazioneLavoro.maggiorazioneA});
  if(detrUlt.spettante>0n)
    emetti('detrult','detrazione','l207c6',I,usoUlt,{
      spettante:detrUlt.spettante,quotaFissa:detrUlt.quotaFissa,
      rapporto:detrUlt.rapporto,capiente:usoUlt===detrUlt.spettante,
      da:K.ulterioreDetrazione.da,pienoFinoA:K.ulterioreDetrazione.pienoFinoA,
      a:K.ulterioreDetrazione.a,
      ampiezzaDecrescente:K.ulterioreDetrazione.ampiezzaDecrescente});
  const LETTERA={coniuge:'tuir12a',figlio:'tuir12c',ascendente:'tuir12d'};
  famiglia.forEach((f,i)=>emetti(`detrfam${i+1}`,'detrazione',LETTERA[f.tipoFamiliare],I,
    ripartizione.usi[i],{
      tipoFamiliare:f.tipoFamiliare,eta:f.eta,disabilita:f.disabilita,
      esito:f.esito,fascia:f.fascia,
      redditoFamiliare:f.redditoFamiliare,limiteRedditoFamiliare:f.limiteRedditoFamiliare,
      spettante:spettantiFamiglia[i],capiente:ripartizione.usi[i]>=spettantiFamiglia[i],
      rapporto:f.rapporto,termini:f.termini}));

  /* 7-8. addizionali locali. Il nucleo arriva anche qui: otto
     giurisdizioni e sei comuni lo guardano, e senza passarglielo
     l'addizionale di quegli enti sarebbe incompleta in silenzio. */
  const dovute=netta>0n;
  const reg=addizionaleRegionale(I,dovute,geo.regionale,nucleo);
  const com=addizionaleComunale(I,dovute,geo.comunale,nucleo);
  emetti('addreg','imposta',{tipo:'regionale',...geo.regionale.fonte},I,-reg,
    {dovuta:dovute,regola:geo.regionale,nome:geo.regione.nome});
  emetti('addcom','imposta',{tipo:'comunale',...geo.comunale.fonte},I,-com,
    {dovuta:dovute,regola:geo.comunale,nome:geo.comune.nome});

  /* 9-10. integrazioni di legge */
  const cuneo=sommaNonImponibile(I);
  const ti=trattamentoIntegrativo(I,lorda,detrLav.articolo13);
  if(cuneo.importo>0n)
    emetti('somma','integrazione','l207c4',I,cuneo.importo,{aliquota:cuneo.aliquota});
  if(ti>0n)
    emetti('ti','integrazione','dl3',I,ti,{quotaFissa:ti,
      limiteImponibile:K.trattamentoIntegrativo.limiteImponibile,
      scartoDetrazione:K.trattamentoIntegrativo.scartoDetrazione});

  /* 11. la guardia */
  const conti=riconcilia(RAL,voci);
  const contiBenefit=riconcilia(0n,voci,BENEFIT_SPENDIBILI);
  const netto=conti.netto;
  const imposte=arrotondaCentesimi(netta)+arrotondaCentesimi(reg)+arrotondaCentesimi(com);
  const spendibili=arrotondaCentesimi(benefit.spendibile);
  const valorePacchetto=netto+spendibili;
  const mediaMensileBuoni=arrotondaCentesimi(div(benefit.buoni.valore,dec('12')));
  return{input:{ral:toNumber(RAL),comune:geo.comune.catastale},versioneRegole:'regole-2026-v4',
    geografia:{regione:geo.regione.nome,provincia:geo.provincia.nome,comune:geo.comune.nome,
      catastale:geo.comune.catastale,asOf:geo.meta.asOf},
    voci:voci.map(({_i,...r})=>r),
    kpi:{nettoAnnuo:toNumber(netto),nettoInBusta:toNumber(netto),
      benefitSpendibili:toNumber(spendibili),valorePacchetto:toNumber(valorePacchetto),
      mediaMensileBuoni:toNumber(mediaMensileBuoni),totaleImposte:toNumber(imposte),
      totaleContributi:toNumber(contributiTotali)},
    imponibile:toNumber(I),irpefNetta:toNumber(arrotondaCentesimi(netta)),
    integrazioni:toNumber(arrotondaCentesimi(cuneo.importo)+arrotondaCentesimi(ti)),
    aliquotaContributivaEffettiva:RAL>0n?toNumber(mul(div(contributiTotali,RAL),dec('100'))):0,
    riconciliazione:{verificata:conti.verificata&&
      (spendibili===0n||contiBenefit.verificata&&contiBenefit.netto===spendibili)&&
      sommeDichiarate(voci),
      identita:'RAL − contributi − imposte + integrazioni = netto annuo'}};
}

/* ---------- formattazione ---------- */
const grp=i=>i.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const fmt=n=>{const neg=n<0,x=Math.abs(n).toFixed(2),[i,f]=x.split('.');
  return (neg?'−':'')+grp(i)+','+f;};
const eur=n=>fmt(n)+' €';
const parseRal=s=>{const t=String(s).trim().replace(/\s|€/g,'');
  if(t==='')return null;
  let x=t;
  if(/^-/.test(t))return '-1';                                // negativo: blocca con messaggio dedicato
  if(/,/.test(t))x=t.replace(/\./g,'').replace(',','.');      // 35.000,50
  else if(/\.\d{3}(\D|$)/.test(t))x=t.replace(/\./g,'');       // 35.000
  if(/^-\d/.test(x))return '-1';                              // negativo: blocca con messaggio dedicato
  if(!/^\d+(\.\d+)?$/.test(x))return NaN;
  return x;};

/* ============================================================
   SOGLIE — il motore emette fatti, la UI decide quando mostrarli
   ============================================================ */
/* Le norme esprimono quasi tutte le soglie sull'imponibile, non sulla RAL.
   La prima RAL che le supera va quindi trovata passando dalla stessa funzione
   contributiva usata dal calcolo. In questo modo un cambio di aliquota o di
   arrotondamento non lascia in giro una RAL diventata falsa. */
function primaRal(predicato,massimo,opzioni={}){
  let basso=0n,alto=dec(String(massimo));
  if(!predicato(calcola(toNumber(alto),opzioni)))throw new RangeError('Evento non trovato nel perimetro');
  while(basso+CENT<alto){
    const mezzo=((basso+alto)/(2n*CENT))*CENT;
    if(predicato(calcola(toNumber(mezzo),opzioni)))alto=mezzo;else basso=mezzo;
  }
  return toNumber(alto).toFixed(2);
}
const EVENTI_NAZIONALI=[
  {ral:opzioni=>primaRal(r=>r.voci.some(v=>v.id==='ti'),15000,opzioni),
    causa:'si attiva il trattamento integrativo'},
  {imponibile:8500,causa:'la somma non imponibile passa dal 7,1% al 5,3%'},
  {imponibile:15000,causa:'decade il trattamento integrativo (imponibile 15.000 €)'},
  {imponibile:20000,causa:'la somma non imponibile lascia il posto all\'ulteriore detrazione (imponibile 20.000 €)'},
  {imponibile:25000,causa:'si attiva la maggiorazione di 65 € (imponibile 25.000 €)'},
  {imponibile:35000,causa:'decade la maggiorazione di 65 € (imponibile 35.000 €)'},
];
function confiniRegola(regola,famiglia=[]){
  const confini=new Map();
  const aggiungi=(imponibile,tipo)=>{
    const n=Number(imponibile),tipi=confini.get(n)||[];
    if(!tipi.includes(tipo))tipi.push(tipo);
    confini.set(n,tipi);
  };
  if(Number(regola.esenzioneFinoA)>0)
    aggiungi(regola.esenzioneFinoA,'esenzione');
  /* La soglia dei comuni veronesi non è un numero della delibera: è
     un numero della delibera PIÙ i figli dichiarati. Senza il nucleo
     la pagina racconterebbe il salto di un'altra famiglia. */
  const familiare=sogliaEsenzioneFamiliare(regola,famiglia);
  if(familiare!==null)aggiungi(toNumber(familiare),'esenzione per figli a carico');
  if(regola.aliquotaFamiliare&&regola.aliquotaFamiliare.finoA!==undefined)
    aggiungi(regola.aliquotaFamiliare.finoA,'aliquota agevolata per la famiglia');
  if(regola.fasciaInteraFinoA)
    aggiungi(regola.fasciaInteraFinoA[0],'fascia intera');
  if(regola.tipo==='aliquotePerReddito')for(const [tetto] of regola.fasce||[])
    if(tetto!==null)aggiungi(tetto,'fascia sull’intero reddito');
  for(const d of regola.detrazioni||[]){
    if(d.perFiglio!==undefined){
      if(d.oltre!==undefined)aggiungi(d.oltre,'inizio detrazione per figli a carico');
      if(d.finoA!==undefined)aggiungi(d.finoA,'fine detrazione per figli a carico');
      continue;
    }
    if(d.fissa===undefined)continue; // la detrazione progressiva è continua
    if(d.oltre!==undefined)aggiungi(d.oltre,'inizio detrazione generale');
    if(d.finoA!==undefined)aggiungi(d.finoA,'fine detrazione generale');
  }
  return [...confini].map(([imponibile,tipi])=>({imponibile,tipo:tipi.join(' e ')}));
}
const CACHE_SOGLIE=new Map();
const voceImporto=(r,id)=>r.voci.find(v=>v.id===id)?.importo||0;
const centesimi=n=>Math.round(n*100)/100;
function soglie(opzioni={}){
  const geo=GEOGRAFIA.risolvi(opzioni.comune||'F205');
  const nucleo=opzioni.nucleo||[];
  const benefit=valutaBenefit(opzioni,nucleo);
  /* La chiave porta anche il nucleo: le detrazioni di famiglia
     possono azzerare l'IRPEF netta, e allora un salto che esiste
     per un contribuente solo non esiste più per una famiglia.
     La disabilità sta nella chiave perché cambia da sola l'aliquota
     nelle Marche e in Veneto: due nuclei identici tranne quel flag
     hanno soglie diverse, e senza il flag si scambierebbero. */
  const chiave=geo.comune.catastale+'|'+
    nucleo.map(f=>`${f.tipo}${f.eta??''}${f.disabilita?'*':''}:${f.reddito??0}`).join(',')+'|'+
    `${toNumber(benefit.fringe)}:${benefit.buoni.tipo}:${toNumber(benefit.buoni.valoreUnitario)}:${benefit.buoni.numero}`;
  if(CACHE_SOGLIE.has(chiave))return CACHE_SOGLIE.get(chiave);
  const risultato=[];
  for(const evento of EVENTI_NAZIONALI){
    const ral=evento.ral?evento.ral(opzioni)
      :primaRal(r=>r.imponibile>evento.imponibile,Math.max(200000,evento.imponibile*3),opzioni);
    const sopra=calcola(ral,opzioni),
      sotto=calcola((Number(ral)-.01).toFixed(2),opzioni);
    risultato.push({ral:Number(ral),imponibile:evento.imponibile??null,ambito:'nazionale',
      causa:evento.causa,delta:centesimi(sopra.kpi.nettoAnnuo-sotto.kpi.nettoAnnuo)});
  }
  for(const [ambito,regola,nome,id] of [
    ['regionale',geo.regionale,geo.regione.nome,'addreg'],
    ['comunale',geo.comunale,geo.comune.nome,'addcom'],
  ])for(const confine of confiniRegola(regola,nucleo)){
    const ral=primaRal(r=>r.imponibile>confine.imponibile,
      Math.max(200000,confine.imponibile*3),opzioni);
    const sopra=calcola(ral,opzioni),
      sotto=calcola((Number(ral)-.01).toFixed(2),opzioni);
    const delta=centesimi(voceImporto(sopra,id)-voceImporto(sotto,id));
    if(Math.abs(delta)<=.01)continue; // cambio di pendenza, non salto
    risultato.push({ral:Number(ral),imponibile:confine.imponibile,ambito,
      causa:`${confine.tipo} dell’addizionale ${ambito} di ${nome} (imponibile ${fmt(confine.imponibile)} €)`,delta});
  }
  risultato.sort((a,b)=>a.ral-b.ral||a.ambito.localeCompare(b.ambito));
  const congelato=Object.freeze(risultato.map(Object.freeze));
  CACHE_SOGLIE.set(chiave,congelato);
  return congelato;
}
/* Compatibilità del contratto storico: la serie senza opzioni resta Milano,
   ma le RAL sono derivate dal motore e non costituiscono più la sorgente. */
const SALTI=Object.freeze(soglie().map(s=>Object.freeze([s.ral.toFixed(2),s.causa])));

/* ---------- mensilità: presentazione, non calcolo ----------
   Il selettore 12–16 non rientra nel motore fiscale: divide un
   netto annuo già calcolato. Applicarlo così — invece di
   richiamare calcola() — è ciò che rende vera a schermo la tesi
   del contratto: cambiare mensilità non può muovere il netto. */
const MENSILITA_AMMESSE=Object.freeze([12,13,14,15,16]);
function applicaMensilita(res,mensilita=13){
  if(!MENSILITA_AMMESSE.includes(mensilita))
    throw new RangeError(`Mensilità non ammessa: ${mensilita}`);
  const netto=dec(res.kpi.nettoAnnuo.toFixed(2));
  const media=arrotondaCentesimi(div(netto,dec(String(mensilita))));
  return{...res,input:{...res.input,mensilita},
    kpi:{...res.kpi,mediaMensile:toNumber(media)}};
}

/* Node: require('./motore.js'). Browser: `module` non esiste e
   le dichiarazioni qui sopra sono già globali per la pagina. */
if(typeof module!=='undefined'&&module.exports){
  module.exports={calcola,applicaMensilita,MENSILITA_AMMESSE,parseRal,soglie,SALTI,fmt,eur,K,
    NETTO_LAVORATORE,
    /* impalcatura, per provare le voci con soli numeri */
    dec,toNumber,
    /* le voci e i passi, uno per uno */
    contributiIvs,contributoAggiuntivo,imponibile,irpefLorda,
    detrazioneLavoroDipendente,ulterioreDetrazione,detrazioniCarichiFamiglia,applicaCapienza,
    calcolaAddizionale,addizionaleRegionale,addizionaleComunale,sommaNonImponibile,
    trattamentoIntegrativo,riconcilia,sommeDichiarate};
}
