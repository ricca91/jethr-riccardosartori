/* ============================================================
   MUTAZIONI — la proprietà verificata invece che asserita.

   «Ogni voce ha una prova che la esercita da sola» è facile da
   scrivere e difficile da credere: una prova può esistere, girare
   verde e non guardare niente. L'unico modo di saperlo è romperla.

   Qui si rompe una voce alla volta — un carattere nel motore, in
   una copia usa e getta — e si guarda quale prova si accende
   rossa. Se la prova della voce resta verde, la prova non c'era.

   node processo/attrezzi/mutazioni.js

   Stampa una tabella: per ogni mutazione, se la prova bersaglio è
   caduta, quali ALTRE prove della categoria D sono cadute con lei
   (l'accoppiamento fra le voci, che è un fatto, non un difetto) e
   quante prove di A, B e C.

   Una mutazione può essere dichiarata EQUIVALENTE: una riscrittura
   che, viste le costanti in `K`, non può cambiare nessun risultato.
   Lì l'attrezzo rovescia la domanda e pretende che tutto resti
   verde: se qualcosa si accende, l'equivalenza era falsa.
   ============================================================ */

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const PROTOTIPO=path.join(__dirname,'..','..','prototipo');

/* Ogni riga: che cosa si rompe, come, e quale prova DEVE cadere. */
const MUTAZIONI=[
  {voce:'contributiIvs', rompe:'aliquota 9,19% → 9,20%',
   cerca:"aliquotaIvs:dec('0.0919')", con:"aliquotaIvs:dec('0.092')",
   prova:'contributiIvs'},

  {voce:'contributoAggiuntivo', rompe:'aliquota 1% → 2%',
   cerca:"aliquotaAggiuntivo:dec('0.01')", con:"aliquotaAggiuntivo:dec('0.02')",
   prova:'contributoAggiuntivo'},

  {voce:'imponibile', rompe:'un euro in più',
   cerca:'function imponibile(ral){return ral-contributi(ral);}',
   con:"function imponibile(ral){return ral-contributi(ral)+dec('1');}",
   prova:'imponibile —'},

  {voce:'irpefLorda', rompe:"l'aliquota sull'intero, non sulla quota",
   cerca:'if(cima>precedente)totale+=mul(cima-precedente,aliquota);',
   con:'if(cima>precedente)totale+=mul(cima,aliquota);',
   prova:'irpefLorda'},

  {voce:'detrazioneLavoroDipendente', rompe:'il rapporto non si tronca più',
   cerca:'const troncaQuattro=a=>(a/D4)*D4;', con:'const troncaQuattro=a=>a;',
   prova:'il rapporto si tronca'},

  {voce:'detrazioneLavoroDipendente', rompe:'la maggiorazione parte un centesimo prima',
   cerca:'(imponibile>D.maggiorazioneDa&&imponibile<=D.maggiorazioneA)',
   con:'(imponibile>=D.maggiorazioneDa&&imponibile<=D.maggiorazioneA)',
   prova:'i 65 € stanno fra'},

  {voce:'ulterioreDetrazione', rompe:'1.000 → 900',
   cerca:"importoPieno:dec('1000')", con:"importoPieno:dec('900')",
   prova:'ulterioreDetrazione'},

  {voce:'applicaCapienza', rompe:'la detrazione entra intera, senza capienza',
   cerca:'const uso=min(spettante,residua);', con:'const uso=spettante;',
   prova:'incapiente'},

  {voce:'applicaCapienza', rompe:"si consuma la più grande per prima, non nell'ordine",
   cerca:'let residua=lorda;',
   con:'let residua=lorda;spettanti=[...spettanti].sort((a,b)=>Number(b-a));',
   prova:"l'ordine dell'array"},

  {voce:'addizionaleRegionale', rompe:'dovuta anche a IRPEF netta zero',
   cerca:':(dovute?perScaglioni(imponibile,K.regionale.scaglioni):0n);',
   con:':(perScaglioni(imponibile,K.regionale.scaglioni));',
   prova:'addizionaleRegionale'},

  {voce:'addizionaleComunale', rompe:'esenzione secca → franchigia',
   cerca:'mul(imponibile,K.comunale.aliquota)',
   con:'mul(imponibile-K.comunale.esenzioneFinoA,K.comunale.aliquota)',
   prova:'addizionaleComunale'},

  {voce:'sommaNonImponibile', rompe:'7,1% → 6,1%',
   cerca:"[dec('8500'),dec('0.071')]", con:"[dec('8500'),dec('0.061')]",
   prova:'sommaNonImponibile'},

  {voce:'trattamentoIntegrativo', rompe:'1.200 → 1.300',
   cerca:"importo:dec('1200')", con:"importo:dec('1300')",
   prova:'trattamentoIntegrativo'},

  {voce:'detrazioniCarichiFamiglia', rompe:'la disabilità non toglie più il tetto dei 30 anni',
   cerca:"if(eta>=F.figlio.etaMassima&&!disabilita)return fuori('oltreTrentaAnni');",
   con:"if(eta>=F.figlio.etaMassima)return fuori('oltreTrentaAnni');",
   prova:'la disabilità toglie il tetto dei 30 anni'},

  {voce:'detrazioniCarichiFamiglia', rompe:'la soglia sale per OGNI figlio, non solo per chi dà diritto',
   cerca:'const oltreIlPrimo=Math.max(0,conDiritto-1);',
   con:"const oltreIlPrimo=Math.max(0,nucleo.filter(f=>f.tipo==='figlio').length-1);",
   prova:'non alza la soglia'},

  {voce:'ripartisciCapienza', rompe:'chi non ha diritto riceve il resto dell\'arrotondamento',
   cerca:'const ultimo=usi.reduce((scelto,_,i)=>spettanti[i]>0n?i:scelto,-1);',
   con:'const ultimo=usi.length-1;',
   prova:"resto dell'arrotondamento non atterra"},

  {voce:'riconcilia', rompe:"l'identità per tipo non si controlla più",
   cerca:'&&netto===daIdentita', con:'&&true',
   prova:"un tipo fuori dall'identità"},

  {voce:'sommeDichiarate', rompe:'la somma dichiarata non si controlla più',
   cerca:'const sommeDichiarate=voci=>voci.every(v=>SOMME.includes(v.somma));',
   con:'const sommeDichiarate=voci=>true;',
   prova:'la voce orfana si vede'},

  /* Mutante EQUIVALENTE, dichiarato: il terzo argomento viene letto
     solo sotto i 15.000 € di imponibile, e lì la maggiorazione è
     sempre zero perché parte da 25.000. `articolo13` e `spettante`
     coincidono in tutta la fascia in cui contano, quindi nessuna
     prova può distinguerli — ed è appunto il motivo per cui il
     motore scrive `articolo13`: la coincidenza fra due soglie di
     `K` non è una regola, e non deve reggere il D.L. 3/2020.
     L'attrezzo verifica che la mutazione sia davvero muta. */
  {voce:'trattamentoIntegrativo', rompe:"guarda il totale invece dell'art. 13",
   cerca:'trattamentoIntegrativo(I,lorda,detrLav.articolo13)',
   con:'trattamentoIntegrativo(I,lorda,detrLav.spettante)',
   equivalente:'le due letture coincidono sotto i 15.000 €'},
];

/* ---------- lettura dell'esito: JUnit, che dà il percorso intero ---------- */
function esegui(cartella){
  let xml;
  try{
    xml=execFileSync(process.execPath,
      ['--test-reporter=junit',path.join(cartella,'motore.test.js')],
      {encoding:'utf8',stdio:['ignore','pipe','ignore']});
  }catch(e){xml=e.stdout||'';}
  const pila=[],caduti=[],tutti=[];
  const righe=xml.split('\n');
  for(let i=0;i<righe.length;i++){
    const r=righe[i];
    const suite=r.match(/<testsuite name="([^"]*)"/);
    if(suite){pila.push(decodifica(suite[1]));continue;}
    if(/<\/testsuite>/.test(r)){pila.pop();continue;}
    const caso=r.match(/<testcase name="([^"]*)"/);
    if(!caso)continue;
    const percorso=[...pila,decodifica(caso[1])].join(' › ');
    tutti.push(percorso);
    if(!/\/>\s*$/.test(r))caduti.push(percorso);   // ha un <failure> dentro
  }
  return{tutti,caduti};
}
const decodifica=s=>s.replace(/&quot;/g,'"').replace(/&apos;/g,"'")
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');

const categoria=p=>(p.match(/^([A-E]) —/)||[])[1]||'?';
const ultimo=p=>p.split(' › ').pop();

/* ---------- la corsa ---------- */
const lavoro=fs.mkdtempSync(path.join(os.tmpdir(),'mutazioni-'));
/* Dalla #18 il motore carica la geografia, e dalla #34 la matrice di prova la
 * carica a sua volta: la copia usa e getta deve portarsi dietro lo snapshot,
 * altrimenti il file di prova non si carica nemmeno e OGNI mutazione sembra
 * sfuggita — un attrezzo rotto che accusa le prove. */
for(const f of ['motore.js','motore.test.js','geografia.js','dati-addizionali-2026.js'])
  fs.copyFileSync(path.join(PROTOTIPO,f),path.join(lavoro,f));
const sorgente=fs.readFileSync(path.join(PROTOTIPO,'motore.js'),'utf8');

const pulita=esegui(lavoro);
if(pulita.caduti.length){
  console.error('la matrice è già rossa senza mutazioni: non c\'è niente da misurare');
  for(const c of pulita.caduti)console.error(`  ${c}`);
  process.exit(1);
}
console.log(`base: ${pulita.tutti.length} prove verdi\n`);

let sfuggite=0,equivalenti=0;
for(const m of MUTAZIONI){
  const occorrenze=sorgente.split(m.cerca).length-1;
  if(occorrenze!==1){
    console.error(`la mutazione «${m.voce}: ${m.rompe}» non aggancia il motore `+
      `(${occorrenze} occorrenze di ${JSON.stringify(m.cerca)})`);
    process.exit(1);
  }
  fs.writeFileSync(path.join(lavoro,'motore.js'),sorgente.replace(m.cerca,m.con));
  const {caduti}=esegui(lavoro);
  const abc=['A','B','C'].map(c=>caduti.filter(p=>categoria(p)===c).length);

  if(m.equivalente){
    const muta=caduti.length===0;
    if(!muta)sfuggite++;
    console.log(`${muta?'EQUIVALENTE':'NON EQUIVALENTE'}  ${m.voce} — ${m.rompe}`);
    console.log(`         · ${m.equivalente}`);
    if(!muta)for(const c of caduti)console.log(`         ! si accende: ${ultimo(c)}`);
    console.log(`         A ${abc[0]} · B ${abc[1]} · C ${abc[2]}\n`);
    equivalenti++;
    continue;
  }

  /* D esercita le voci una alla volta, E fa lo stesso per i carichi di
     famiglia: sono la stessa domanda su due sezioni. */
  const perVoce=caduti.filter(p=>['D','E'].includes(categoria(p)));
  const bersaglio=perVoce.filter(p=>p.includes(m.prova));
  const altre=perVoce.filter(p=>!p.includes(m.prova));
  const colpita=bersaglio.length>0;
  if(!colpita)sfuggite++;
  console.log(`${colpita?'ROSSA':'SFUGGITA'}  ${m.voce} — ${m.rompe}`);
  for(const b of bersaglio)console.log(`         ↳ ${ultimo(b)}`);
  for(const a of altre)console.log(`         · anche: ${ultimo(a)}`);
  console.log(`         A ${abc[0]} · B ${abc[1]} · C ${abc[2]}\n`);
}
fs.rmSync(lavoro,{recursive:true,force:true});

const rotture=MUTAZIONI.length-equivalenti;
console.log(`${rotture} rotture, ${rotture-sfuggite} colte dalla prova della loro voce`+
  (equivalenti?`, più ${equivalenti} `+
    (equivalenti===1?'mutazione dichiarata equivalente e verificata muta'
                    :'mutazioni dichiarate equivalenti e verificate mute'):''));
if(sfuggite){console.error(`${sfuggite} sfuggite: la prova esiste ma non guarda`);process.exit(1);}
