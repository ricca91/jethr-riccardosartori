/* ============================================================
   FRASI — la pagina dice ancora le stesse cose?

   `et` e `formula` sono usciti dal motore: adesso titolo e
   formula li compone la pagina, dai numeri della voce. È la
   parte del #15 che il confronto a tappeto NON può controllare,
   perché quei due campi dalla base sono esclusi per disegno.

   Qui si chiude il buco: si estrae il blocco RIGHE da index.html,
   lo si esegue con `K`, `fmt` e `toNumber` del motore, e si
   confrontano le frasi ricomposte con quelle che il motore
   scriveva prima, corsa per corsa e voce per voce.

   node processo/attrezzi/frasi.js <base.json>
   ============================================================ */

const fs=require('node:fs');
const path=require('node:path');
const M=require(path.join(__dirname,'..','..','prototipo','motore.js'));

const html=fs.readFileSync(path.join(__dirname,'..','..','prototipo','index.html'),'utf8');
const dentro=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b);
  if(i<0||j<0)throw new Error(`marcatori ${a} / ${b} non trovati in index.html`);
  return html.slice(i+a.length,j);};
const blocco=dentro('/* RIGHE-INIZIO */','/* RIGHE-FINE */');

/* Il blocco non è un modulo: nella pagina vive fra i globali che
   motore.js dichiara. Qui glieli passiamo a mano. */
const {titolo,formula}=new Function('K','fmt','toNumber',
  `${blocco}\nreturn {titolo,formula};`)(M.K,M.fmt,M.toNumber);

const file=process.argv[2];
if(!file){console.error('uso: node processo/attrezzi/frasi.js <base.json>');process.exit(2);}
const base=JSON.parse(fs.readFileSync(file,'utf8'));

let confrontate=0,diverse=0;
for(const corsa of base.corse){
  const ora=M.calcola(corsa.ral);
  for(const prima of corsa.risultato.voci){
    const adesso=ora.voci.find(v=>v.id===prima.id);
    if(!adesso){console.error(`RAL ${corsa.ral}: la voce ${prima.id} è sparita`);diverse++;continue;}
    for(const[campo,atteso,ottenuto]of[
      ['et',prima.et,titolo(adesso)],
      ['formula',prima.formula,formula(adesso,ora.voci)]]){
      confrontate++;
      if(atteso===ottenuto)continue;
      diverse++;
      if(diverse<=20)console.error(
        `RAL ${corsa.ral} · ${prima.id} · ${campo}\n  prima:   ${JSON.stringify(atteso)}\n`+
        `  adesso:  ${JSON.stringify(ottenuto)}`);
    }
  }
}
if(diverse===0){
  console.log(`${confrontate} frasi ricomposte dalla pagina, tutte identiche a quelle che il motore scriveva`);
  process.exit(0);
}
console.error(`\n${diverse} frasi diverse su ${confrontate}`);
process.exit(1);
