/* ============================================================
   SEZIONI FACOLTATIVE — nucleo familiare e pacchetto retributivo.

   Interface: riepilogoNucleo(stato) e riepilogoPacchetto(stato)
   restituiscono le etichette da mostrare quando la sezione è
   chiusa; sezioniAperte(stato) dice quali sezioni devono partire
   aperte perché contengono già dei dati.

   Qui non c'è DOM: una sezione richiudibile mente non quando si
   apre male, ma quando il riepilogo dice una cosa diversa da
   quella che c'è dentro. È quella parte, e solo quella, che vale
   la pena provare fuori dal browser.
   ============================================================ */
const IN_NODE=typeof module!=='undefined'&&module.exports;
const PARSE_RAL=IN_NODE?require('./motore.js').parseRal:parseRal;
const EUR=IN_NODE?require('./motore.js').eur:eur;

/* Il termine con cui il conteggio si legge: «1 figlio» dice più di
   «1 familiare», ma vale solo finché il nucleo è omogeneo. */
const PLURALE={coniuge:['coniuge','coniugi'],figlio:['figlio','figli'],
  ascendente:['ascendente','ascendenti']};

/* Un importo dichiarato configura la sezione solo se è davvero
   positivo: un campo lasciato a «0» non è un pacchetto. */
function positivo(raw){
  const v=PARSE_RAL(raw===null||raw===undefined?'':raw);
  return v!==null&&!Number.isNaN(Number(v))&&Number(v)>0;
}

function contaFamiliari(nucleo){
  const n=nucleo.length;
  const tipi=new Set(nucleo.map(f=>f.tipo));
  if(tipi.size>1)return n+' familiari';
  const[uno,molti]=PLURALE[nucleo[0].tipo]||['familiare','familiari'];
  return n+' '+(n===1?uno:molti);
}

function riepilogoNucleo(stato){
  const nucleo=stato.nucleo||[];
  if(!nucleo.length)return['Nessun familiare'];
  const etichette=[contaFamiliari(nucleo)];
  /* La detrazione compare solo quando chi chiama l'ha già
     verificata contro l'ultimo calcolo: un riepilogo che resta
     indietro di una modifica è peggio di un riepilogo muto. */
  if(typeof stato.detrazione==='number')etichette.push('Detrazione '+EUR(stato.detrazione));
  return etichette;
}

/* Gli elementi del pacchetto restano elencati, mai sommati: welfare
   e buoni non sono denaro in busta e non si addizionano al netto. */
function vociPacchetto(stato){
  const voci=[];
  if(positivo(stato.welfareRaw))voci.push('welfare');
  if(positivo(stato.fringeRaw))voci.push('fringe');
  if(positivo(stato.buoniValoreRaw)||positivo(stato.buoniNumeroRaw)
    ||(stato.buoniTipo&&stato.buoniTipo!=='elettronici'))voci.push('buoni pasto');
  return voci;
}

function riepilogoPacchetto(stato){
  const voci=vociPacchetto(stato);
  if(!voci.length)return['Non configurato'];
  const testo=voci.join(' + ');
  return[testo.charAt(0).toUpperCase()+testo.slice(1)];
}

function sezioniAperte(stato){
  return{nucleo:(stato.nucleo||[]).length>0,pacchetto:vociPacchetto(stato).length>0};
}

if(IN_NODE)module.exports={riepilogoNucleo,riepilogoPacchetto,sezioniAperte};
