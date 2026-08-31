#!/usr/bin/env node
'use strict';

/*
 * Import deterministico #18.
 *
 * Input ufficiali, conservati separatamente dal dato runtime:
 *   processo/dati/fonti/istat-comuni-2026-02-21.xlsx
 *   processo/dati/fonti/mef-addizionale-regionale-2026.csv
 *   processo/dati/fonti/mef-addizionale-comunale-2025.csv
 *   processo/dati/fonti/mef-addizionale-comunale-2026.csv
 *
 * Output: prototipo/dati-addizionali-2026.js (script classico/file://).
 * Lo script usa soltanto Node e `unzip`, non librerie applicative.
 */
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');

const ROOT=path.resolve(__dirname,'../..');
const SRC=path.join(ROOT,'processo/dati/fonti');
const OUT=path.join(ROOT,'prototipo/dati-addizionali-2026.js');
const AS_OF='2026-08-26';
/* La revisione del 31 agosto 2026 (issue #34) non cambia le fonti: usa gli
 * stessi CSV di AS_OF e vi aggiunge le regole locali legate ai carichi di
 * famiglia, che l'import di #18 aveva escluso di proposito. */
const REVISIONE='2026-08-31';
const URL_ISTAT='https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx';
const URL_REG='https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/download/tabella.htm';
const URL_COM='https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/download/tabella.htm';

function xmlText(s){return s.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<')
  .replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");}
function unzip(file,member){return cp.execFileSync('unzip',['-p',file,member],{encoding:'utf8',maxBuffer:32e6});}
function istat(){
  const file=path.join(SRC,'istat-comuni-2026-02-21.xlsx');
  const shared=[...unzip(file,'xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map(m=>xmlText(m[1]));
  const sheet=unzip(file,'xl/worksheets/sheet1.xml');
  const rows=[...sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(m=>{
    const cells={};
    for(const c of m[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)){
      const ref=/\br="([A-Z]+)\d+"/.exec(c[1]); if(!ref)continue;
      const v=/<v>([\s\S]*?)<\/v>/.exec(c[2]);
      const inline=/<is>([\s\S]*?)<\/is>/.exec(c[2]);
      let value=v?xmlText(v[1]):inline?xmlText(inline[1]):'';
      if(/\bt="s"/.test(c[1])&&value!=='')value=shared[Number(value)];
      cells[ref[1]]=value;
    }
    return cells;
  });
  rows.shift();
  return rows.filter(r=>r.U).map(r=>({
    istat:r.E.padStart(6,'0'),nome:r.F,regione:r.K,provincia:r.L,sigla:r.O,catastale:r.U
  }));
}

function csv(file){
  const text=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"')quoted=false;else field+=ch;}
    else if(ch==='"')quoted=true;
    else if(ch===';'){row.push(field.trim());field='';}
    else if(ch==='\n'){row.push(field.trim().replace(/\r$/,''));rows.push(row);row=[];field='';}
    else field+=ch;
  }
  if(field||row.length){row.push(field.trim());rows.push(row);}
  const head=rows.shift().map(x=>x.trim());
  return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]||''])));
}
const numero=s=>{const x=String(s).trim();return Number(x.includes(',')?x.replace(/\./g,'').replace(',','.'):x);};
const frazione=s=>numero(s)/100;
function tetto(s){
  if(!s||/unica/i.test(s)||/oltre/i.test(s)&&!/fino/i.test(s))return null;
  const n=[...s.matchAll(/[\d.]+(?:,\d+)?/g)].map(x=>{
    const raw=x[0];
    return numero(!raw.includes(',')&&/^\d{1,3}(?:\.\d{3})+$/.test(raw)?raw.replace(/\./g,''):raw);
  }).filter(Number.isFinite);
  return n.length?n[n.length-1]:null;
}
function scaglioni(r){
  const out=[];
  for(let i=1;i<=12;i++){
    const a=r[i===1?'ALIQUOTA':`ALIQUOTA_${i}`];
    const f=r[i===1?'FASCIA':`FASCIA_${i}`];
    if(!a||a==='0*')continue;
    out.push([tetto(f),frazione(a)]);
  }
  /* Le righe a zero affiancate ad aliquote positive descrivono esenzioni
   * (il MEF le mette nelle stesse coppie aliquota/fascia): non sono scaglioni
   * a 0%. La soglia generale affidabile è IMPORTO_ESENTE per i flag 2/4;
   * per 0/5/6 non concediamo condizioni personali senza relativi input. */
  if(out.some(([,a])=>a>0))for(let i=out.length-1;i>=0;i--)if(out[i][1]===0)out.splice(i,1);
  if(out.length&&out[out.length-1][0]!==null)out[out.length-1][0]=null;
  /* Sei righe MEF 2026 hanno refusi nelle fasce testuali (28 al posto di
   * 28.000 o la terza fascia duplicata). Quando la forma è inequivocabilmente
   * quella a quattro scaglioni nazionali, i tetti revisionati sono canonici. */
  if(out.length===4&&out[0][0]===15000){out[1][0]=28000;out[2][0]=50000;out[3][0]=null;}
  return out;
}
function esenzioneGeneraleRevisionata(r){
  for(let i=1;i<=12;i++){
    const a=r[i===1?'ALIQUOTA':`ALIQUOTA_${i}`],f=r[i===1?'FASCIA':`FASCIA_${i}`];
    if(numero(a)!==0||!/^Esenzione per redditi impon/i.test(f))continue;
    const valori=[...f.matchAll(/[\d.]+(?:,\d+)?/g)].map(x=>{
      const raw=x[0];return numero(raw.includes(',')?raw:/^\d{1,3}(?:\.\d{3})+$/.test(raw)?raw.replace(/\./g,''):raw);
    }).filter(Number.isFinite);
    if(valori.length)return Math.max(...valori);
  }
  return 0;
}
/* I comuni la cui esenzione dipende dai figli a carico. La soglia sale di un
 * importo fisso per ogni figlio oltre il minimo: non e' una detrazione, e per
 * questo non sta nell'array `detrazioni`.
 * `residuo` dichiara quel che di quella delibera resta comunque fuori: dove
 * la condizione e' l'ISEE non c'e' niente da normalizzare, perche' l'ISEE non
 * si ricava dalla RAL. */
const SPECIALI_COMUNALI={
  A650:{esenzioneFinoA:28000,
    esenzioneFamiliare:{finoA:35000,minimoFigli:3,incrementoPerFiglio:10000},
    revisione:'Esenzione generale fino a 28.000 euro; esenzione fino a 35.000 euro per le famiglie con tre o più figli a carico, elevata di 10.000 euro per ogni figlio oltre il terzo.'},
  B073:{esenzioneFamiliare:{finoA:50000,minimoFigli:4,incrementoPerFiglio:10000},
    revisione:'Esenzione fino a 50.000 euro per le famiglie con quattro figli a carico, elevata di 10.000 euro per ogni figlio oltre il quarto.',
    residuo:'Resta fuori l’esenzione per invalidità non inferiore all’80% condizionata all’ISEE: l’ISEE non si ricava dalla RAL.'},
  B107:{esenzioneFamiliare:{finoA:50000,minimoFigli:4,incrementoPerFiglio:10000},
    revisione:'Esenzione fino a 50.000 euro per i nuclei con quattro figli a carico, elevata di 10.000 euro per ogni figlio oltre il quarto.'},
  F861:{esenzioneFamiliare:{finoA:40000,minimoFigli:3,incrementoPerFiglio:10000},
    revisione:'Esenzione fino a 40.000 euro per le famiglie con tre figli a carico, elevata di 10.000 euro per ogni figlio a partire dal quarto.'},
  H608:{esenzioneFamiliare:{finoA:50000,minimoFigli:4,incrementoPerFiglio:10000},
    revisione:'Esenzione fino a 50.000 euro per le famiglie con quattro figli a carico, elevata di 10.000 euro per ogni figlio oltre il quarto.'},
  M172:{esenzioneFamiliare:{finoA:50000,minimoFigli:4,incrementoPerFiglio:10000},
    revisione:'Esenzione fino a 50.000 euro per i soggetti con quattro figli a carico, elevata di 10.000 euro per ogni ulteriore figlio a carico.'},
  E207:{residuo:'Esenzione per almeno quattro figli minori condizionata a un ISEE fino a 10.632,94 euro: l’ISEE non si ricava dalla RAL e la condizione non è applicata.'},
  H769:{residuo:'Esenzione per i nuclei con almeno quattro figli minori condizionata a un ISEE familiare fino a 10.632,94 euro: l’ISEE non si ricava dalla RAL e la condizione non è applicata.'},
};

function fonteComune(r,anno,provisional){return{
  annoOrigine:anno,asOf:AS_OF,stato:provisional?'provvisorio':'definitivo',
  numeroDelibera:r.NUMERO_DELIBERA||null,dataDelibera:r.DATA_DELIBERA||null,
  dataPubblicazione:r.DATA_PUBBLICAZIONE||null,url:URL_COM,
  nota:provisional?'Disciplina precedente prorogata: pubblicazione 2026 non presente nello snapshot.':null
};}
function regolaComune(r,anno,provisional){
  if(!r||r.ALIQUOTA==='0*')return{tipo:'nessuna',fonte:fonteComune(r||{},anno,provisional)};
  const s=scaglioni(r),flag=r.FLAG_NUOVA||'assenza';
  const revisionato=SPECIALI_COMUNALI[r.CODICE_CATASTALE]||{};
  const esenzione=revisionato.esenzioneFinoA!==undefined?revisionato.esenzioneFinoA
    :((numero(r.IMPORTO_ESENTE)||0)||(flag==='0'?esenzioneGeneraleRevisionata(r):0));
  const personali=['0','5','6'].includes(flag);
  const base=!s.length||s.every(([,a])=>a===0)?{tipo:'nessuna'}:s.length===1
    ?{tipo:'aliquotaUnica',aliquota:s[0][1],esenzioneFinoA:esenzione}
    :{tipo:'scaglioni',scaglioni:s,esenzioneFinoA:esenzione};
  const familiare=base.tipo!=='nessuna'&&revisionato.esenzioneFamiliare
    ?{esenzioneFamiliare:revisionato.esenzioneFamiliare}:{};
  return{...base,...familiare,casoMef:flag,
    normalizzazione:revisionato.revisione
      ||(flag==='0'&&esenzione?'Esenzione generale revisionata dalla fascia strutturata MEF.':null),
    condizioniPersonali:revisionato.residuo
      ||(revisionato.revisione?null
        :(personali?'Non applicate: il profilo dichiarato non include agevolazioni personali o categoriali.':null)),
    fonte:fonteComune(r,anno,provisional)};
}

/* Revisione esplicita delle disposizioni regionali applicabili al profilo,
 * comprese quelle legate ai carichi di famiglia (issue #34). Tre forme, non una:
 * una DETRAZIONE per figlio (Trento, Bolzano, Sardegna, Campania, Piemonte,
 * Puglia), un'ALIQUOTA diversa (Marche, Veneto) e — nei comuni — un'ESENZIONE
 * che sale col numero dei figli.
 * Restano fuori, e sono dichiarate: la condizione sulla somma dei redditi dei
 * due genitori (Marche, Veneto), la ripartizione a percentuale e mesi di carico
 * del c. 3 e del c. 4 dell'art. 12, e l'agevolazione veneta al contribuente
 * disabile in prima persona, che non e' un dato del nucleo. */
const SPECIALI_REGIONALI={
  "Valle d'Aosta":{esenzioneFinoA:15000,revisione:'Esenzione generale fino a 15.000 euro.'},
  'Friuli-Venezia Giulia':{tipo:'aliquotePerReddito',fasce:[[15000,0.007],[null,0.0123]],revisione:'Aliquota sull’intero imponibile in base al reddito.'},
  'Umbria':{fasciaInteraFinoA:[28000,0.0123],detrazioni:[{oltre:28000,finoA:50000,fissa:150}],revisione:'Maggiorazioni escluse fino a 28.000 euro; detrazione generale di 150 euro tra 28.001 e 50.000.'},
  'Lazio':{fasciaInteraFinoA:[28000,0.0173],detrazioni:[{oltre:28000,finoA:30000,fissa:60}],revisione:'Aliquota 1,73% sull’intero imponibile fino a 28.000 euro; detrazione generale di 60 euro tra 28.001 e 30.000.'},
  'Trentino-Alto Adige/Südtirol':null,
  'Provincia autonoma di Trento':{esenzioneFinoA:30000,
    detrazioni:[{finoA:50000,perFiglio:{importo:246}}],
    revisione:'Deduzione generale pari all’imponibile fino a 30.000 euro, normalizzata come esenzione; detrazione di 246 euro per ogni figlio a carico fino a 50.000 euro di imponibile.'},
  'Provincia autonoma di Bolzano/Bozen':{detrazioni:[{finoA:90000,fissa:430.5},{oltre:50000,finoA:75000,massimo:125,progressivaDa:50000,ampiezza:25000},{oltre:75000,fissa:125},{finoA:90000,perFiglio:{importo:340}}],revisione:'Detrazioni generali MEF e detrazione di 340 euro per ogni figlio a carico, a qualunque età, fino a 90.000 euro di imponibile.'},
  'Sardegna':{detrazioni:[{finoA:50000,perFiglio:{importo:200,supplementoDisabile:100,etaMassima:18,redditoMassimoFiglio:4000}}],revisione:'Detrazione di 200 euro per ogni figlio minorenne a carico con reddito fino a 4.000 euro, entro 50.000 euro di imponibile, aumentata di 100 euro per ogni figlio con disabilità.'},
  'Campania':{detrazioni:[{finoA:28000,perFiglio:{importo:30,minimoFigli:2}},{finoA:28000,perFiglio:{importo:40,soloDisabili:true}}],revisione:'Entro 28.000 euro di imponibile: 30 euro per ogni figlio a carico da due figli in su, e 40 euro per ogni figlio a carico con disabilità.'},
  'Piemonte':{detrazioni:[{perFiglio:{importo:100,minimoFigli:3,tettoTrentaAnni:true}},{perFiglio:{importo:500,soloDisabili:true,tettoTrentaAnni:true}}],revisione:'Senza tetto di reddito: 100 euro per ogni figlio a carico con più di due figli, e 500 euro per ogni figlio a carico con disabilità.'},
  'Puglia':{detrazioni:[{perFiglio:{importo:20,minimoFigli:4,supplementoDisabile:375,tettoTrentaAnni:true}}],revisione:'Senza tetto di reddito: 20 euro per ogni figlio a carico con più di tre figli, aumentati di 375 euro per ogni figlio con disabilità.'},
  'Marche':{aliquotaFamiliare:{aliquota:0.0123,finoA:50000,richiede:'figlioDisabile'},revisione:'Aliquota unica dell’1,23% sull’intero imponibile fino a 50.000 euro con almeno un figlio a carico con handicap ex art. 3 L. 104/1992.'},
  'Veneto':{aliquotaFamiliare:{aliquota:0.009,finoA:50000,richiede:'familiareDisabile'},revisione:'Aliquota agevolata dello 0,9% fino a 50.000 euro di imponibile con un familiare con disabilità fiscalmente a carico.'}
};
const NOMI_REGIONALI={
  "REGIONE VALLE D'AOSTA":"Valle d'Aosta",'REGIONE UMBRIA':'Umbria',
  'REGIONE FRIULI VENEZIA GIULIA':'Friuli-Venezia Giulia','REGIONE EMILIA-ROMAGNA':'Emilia-Romagna',
  'REGIONE MARCHE':'Marche','PROVINCIA AUTONOMA DI TRENTO':'Provincia autonoma di Trento',
  'REGIONE VENETO':'Veneto','REGIONE LAZIO':'Lazio','REGIONE ABRUZZO':'Abruzzo',
  'REGIONE LIGURIA':'Liguria','REGIONE PUGLIA':'Puglia','REGIONE LOMBARDIA':'Lombardia',
  'REGIONE CALABRIA':'Calabria','PROVINCIA AUTONOMA DI BOLZANO':'Provincia autonoma di Bolzano/Bozen',
  'REGIONE SICILIA':'Sicilia','REGIONE SARDEGNA':'Sardegna','REGIONE MOLISE':'Molise',
  'REGIONE PIEMONTE':'Piemonte','REGIONE CAMPANIA':'Campania','REGIONE BASILICATA':'Basilicata','REGIONE TOSCANA':'Toscana'
};
function regioni(){
  const rows=csv(path.join(SRC,'mef-addizionale-regionale-2026.csv'));
  const gruppi=new Map();
  for(const r of rows){if(!gruppi.has(r.REGIONE))gruppi.set(r.REGIONE,new Map());
    const pub=r['DATA PUBBLICAZIONE'];if(!gruppi.get(r.REGIONE).has(pub))gruppi.get(r.REGIONE).set(pub,[]);
    gruppi.get(r.REGIONE).get(pub).push(r);}
  return [...gruppi].map(([raw,pubs])=>{
    const latest=[...pubs.values()].at(-1),r=latest[0],nome=NOMI_REGIONALI[raw];
    if(!nome)throw new Error(`Regione MEF non riconosciuta: ${raw}`);
    const rates=latest.map(x=>[tetto(x.FASCIA),frazione(x.ALIQUOTA)]);
    if(rates.at(-1)[0]!==null)rates.at(-1)[0]=null;
    const base=rates.length===1?{tipo:'aliquotaUnica',aliquota:rates[0][1]}:{tipo:'scaglioni',scaglioni:rates};
    const speciale=SPECIALI_REGIONALI[nome]||{};
    return{nome,...base,...speciale,
      condizioniPersonali:r.DISPOSIZIONE&&!speciale.revisione?'Non applicate al profilo dichiarato (nessun familiare e nessuna agevolazione personale).':null,
      fonte:{annoOrigine:2026,asOf:AS_OF,stato:'definitivo',numero:r.NUMERO,
        dataPubblicazione:r['DATA PUBBLICAZIONE'],norme:r.NORME||null,url:URL_REG}};
  });
}

function main(){
  const comuniIstat=istat();
  const r25=csv(path.join(SRC,'mef-addizionale-comunale-2025.csv'));
  const r26=csv(path.join(SRC,'mef-addizionale-comunale-2026.csv'));
  const m25=new Map(r25.map(r=>[r.CODICE_CATASTALE,r]));
  const m26=new Map(r26.map(r=>[r.CODICE_CATASTALE,r]));
  const reg=regioni(),regByName=new Map(reg.map((r,i)=>[r.nome,i]));
  const province=[],provByKey=new Map(),regole=[],comuni=[];
  for(const c of comuniIstat){
    let regione=c.regione;
    if(regione==="Valle d'Aosta/Vallée d'Aoste")regione="Valle d'Aosta";
    if(c.sigla==='TN')regione='Provincia autonoma di Trento';
    if(c.sigla==='BZ')regione='Provincia autonoma di Bolzano/Bozen';
    const regioneId=regByName.get(regione);
    if(regioneId===undefined)throw new Error(`Regola regionale mancante: ${regione} (${c.nome})`);
    const pk=`${regioneId}|${c.provincia}|${c.sigla}`;
    if(!provByKey.has(pk)){provByKey.set(pk,province.length);province.push({nome:c.provincia,sigla:c.sigla,regione:regioneId});}
    const current=m26.get(c.catastale),published=current&&current.ALIQUOTA!=='0*';
    /* Un comune appena istituito può non avere una riga dell'anno precedente
     * (Castegnero Nanto nel 2026). In quel solo caso la riga corrente 0* viene
     * conservata esplicitamente come regola provvisoria senza addizionale. */
    const source=published?current:(m25.get(c.catastale)||current);
    if(!source)throw new Error(`Regola comunale mancante: ${c.catastale} ${c.nome}`);
    const rule=regolaComune(source,published?2026:(m25.has(c.catastale)?2025:2026),!published);
    const regola=regole.push(rule)-1;
    comuni.push({nome:c.nome,istat:c.istat,catastale:c.catastale,provincia:provByKey.get(pk),regola});
  }
  if(comuni.length!==7894)throw new Error(`Attesi 7.894 comuni Istat, trovati ${comuni.length}`);
  if(reg.length!==21)throw new Error(`Attese 21 giurisdizioni regionali, trovate ${reg.length}`);
  const data={meta:{versione:`addizionali-2026-${AS_OF}-r2`,asOf:AS_OF,revisione:REVISIONE,
    istat:{comuni:comuni.length,vigenteDal:'2026-02-21',url:URL_ISTAT},
    mef:{urlRegionale:URL_REG,urlComunale:URL_COM}},regioni:reg,province,comuni,regoleComunali:regole};
  const js='/* Generato da processo/attrezzi/importa-addizionali.js. Non modificare a mano. */\n'+
    `const DATI_ADDIZIONALI_2026=Object.freeze(${JSON.stringify(data)});\n`+
    "if(typeof module!=='undefined'&&module.exports)module.exports={DATI_ADDIZIONALI_2026};\n";
  fs.writeFileSync(OUT,js);
  console.log(JSON.stringify({output:path.relative(ROOT,OUT),comuni:comuni.length,province:province.length,
    regioni:reg.length,regoleComunali:regole.length,bytes:Buffer.byteLength(js)},null,2));
}
main();
