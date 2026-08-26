/* Geografia fiscale #18 — una piccola interface sopra lo snapshot generato. */
const D=typeof module!=='undefined'&&module.exports
  ?require('./dati-addizionali-2026.js').DATI_ADDIZIONALI_2026
  :DATI_ADDIZIONALI_2026;

const ORDINE_ITALIANO=new Intl.Collator('it',{sensitivity:'base'});
const perNome=(a,b)=>ORDINE_ITALIANO.compare(a.nome,b.nome);
const REGIONI=D.regioni.map((r,id)=>Object.freeze({id,nome:r.nome})).sort(perNome);
const PROVINCE=D.province.map((p,id)=>Object.freeze({id,...p})).sort(perNome);
const COMUNI=D.comuni.map((c,id)=>Object.freeze({id,...c})).sort(perNome);
const PER_CATASTALE=new Map(COMUNI.map(c=>[c.catastale,c]));

function regioni(){return REGIONI;}
function province(regione){return regione===undefined?PROVINCE:PROVINCE.filter(p=>p.regione===Number(regione));}
function comuni(provincia){return provincia===undefined?COMUNI:COMUNI.filter(c=>c.provincia===Number(provincia));}
function risolvi(catastale='F205'){
  const comune=PER_CATASTALE.get(String(catastale).toUpperCase());
  if(!comune)throw new RangeError(`Comune non attivo nello snapshot Istat: ${catastale}`);
  const provincia=D.province[comune.provincia],regione=D.regioni[provincia.regione];
  return{meta:D.meta,regione,provincia,comune,regionale:regione,
    comunale:D.regoleComunali[comune.regola]};
}
const GEOGRAFIA_ITALIA=Object.freeze({regioni,province,comuni,risolvi});

if(typeof module!=='undefined'&&module.exports)module.exports=GEOGRAFIA_ITALIA;
