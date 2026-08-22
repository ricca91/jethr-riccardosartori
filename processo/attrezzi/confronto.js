/* ============================================================
   CONFRONTO A TAPPETO — 2.001 corse, campo per campo.

   Serve a provare che un refactor del motore non ha spostato
   un centesimo. Si usa in due tempi:

     node processo/attrezzi/confronto.js salva base.json
     ...si rifà il motore...
     node processo/attrezzi/confronto.js confronta base.json

   Il confronto è ricorsivo sull'oggetto intero — kpi, imponibile,
   irpefNetta, integrazioni, aliquotaContributivaEffettiva,
   riconciliazione e l'ordine delle voci — non solo sul netto.

   Il confronto guarda i campi che stanno nella BASE. Un campo
   nuovo non ha un prima con cui divergere: viene elencato a parte,
   sotto «campi aggiunti», così si vede senza far fallire la corsa.
   Un campo SPARITO invece è una divergenza, a meno che non lo si
   dichiari con `--esclude a,b`: quando un campo esce dal motore
   per disegno, la scelta va detta all'invocazione, non nascosta
   dentro l'attrezzo.

   Niente dipendenze: `node --test` e questo attrezzo girano su
   Node 18+ appena clonata la repo.
   ============================================================ */

const fs=require('node:fs');
const path=require('node:path');
const {calcola}=require(path.join(__dirname,'..','..','prototipo','motore.js'));

/* Le 2.001 corse: passo di 100 € da 0 a 200.000 €. È la stessa
   griglia della categoria C dei test, così l'attrezzo e la rete di
   non-regressione guardano lo stesso spazio. */
const PASSO=100,MAX=200000,MENSILITA=13;
const griglia=()=>{const r=[];for(let ral=0;ral<=MAX;ral+=PASSO)r.push(String(ral));return r;};

function corse(){
  return griglia().map(ral=>({ral,risultato:calcola(ral,MENSILITA)}));
}

/* Confronto ricorsivo. Restituisce le divergenze come percorsi
   leggibili: `voci[3].importo: 1646.48 → 1646.47`. I campi nati
   dopo la base finiscono in `aggiunti`, non fra le divergenze. */
function divergenze(atteso,ottenuto,esclusi,aggiunti,percorso=''){
  const out=[];
  const tipo=x=>Array.isArray(x)?'array':(x===null?'null':typeof x);
  if(tipo(atteso)!==tipo(ottenuto))
    return [`${percorso||'(radice)'}: tipo ${tipo(atteso)} → ${tipo(ottenuto)}`];
  if(Array.isArray(atteso)){
    if(atteso.length!==ottenuto.length)
      out.push(`${percorso}: ${atteso.length} elementi → ${ottenuto.length}`);
    for(let i=0;i<Math.min(atteso.length,ottenuto.length);i++)
      out.push(...divergenze(atteso[i],ottenuto[i],esclusi,aggiunti,`${percorso}[${i}]`));
    return out;
  }
  if(atteso!==null&&typeof atteso==='object'){
    for(const k of Object.keys(ottenuto))
      if(!(k in atteso)&&!esclusi.has(k))aggiunti.add(percorso?`${percorso}.${k}`:k);
    for(const k of Object.keys(atteso)){
      if(esclusi.has(k))continue;
      const p=percorso?`${percorso}.${k}`:k;
      if(!(k in ottenuto)){out.push(`${p}: ${JSON.stringify(atteso[k])} → sparito`);continue;}
      out.push(...divergenze(atteso[k],ottenuto[k],esclusi,aggiunti,p));
    }
    return out;
  }
  if(atteso!==ottenuto)out.push(`${percorso}: ${JSON.stringify(atteso)} → ${JSON.stringify(ottenuto)}`);
  return out;
}

/* `voci[3].capiente` e `voci[7].capiente` sono lo stesso campo:
   l'indice della voce non aggiunge niente all'elenco dei nuovi. */
const senzaIndici=p=>p.replace(/\[\d+]/g,'[]');

/* ---------- riga di comando ---------- */
const [,,comando,file,...resto]=process.argv;
const esclusi=new Set(
  resto.filter(a=>a.startsWith('--esclude'))
       .flatMap(a=>(a.split('=')[1]||resto[resto.indexOf(a)+1]||'').split(','))
       .map(s=>s.trim()).filter(Boolean));

if(comando==='salva'){
  if(!file){console.error('uso: confronto.js salva <file.json>');process.exit(2);}
  const dati={versione:calcola('35000',13).versioneRegole,passo:PASSO,max:MAX,
    mensilita:MENSILITA,corse:corse()};
  fs.writeFileSync(file,JSON.stringify(dati));
  console.log(`salvate ${dati.corse.length} corse in ${file} (${dati.versione})`);
  process.exit(0);
}

if(comando==='confronta'){
  if(!file){console.error('uso: confronto.js confronta <file.json> [--esclude a,b]');process.exit(2);}
  const base=JSON.parse(fs.readFileSync(file,'utf8'));
  const ora=corse();
  if(base.corse.length!==ora.length){
    console.error(`la griglia è cambiata: ${base.corse.length} corse → ${ora.length}`);
    process.exit(1);
  }
  let rotte=0,totali=0;
  const aggiunti=new Set();
  for(let i=0;i<ora.length;i++){
    if(base.corse[i].ral!==ora[i].ral){
      console.error(`corsa ${i}: RAL ${base.corse[i].ral} → ${ora[i].ral}`);rotte++;continue;
    }
    const nuovi=new Set();
    const d=divergenze(base.corse[i].risultato,ora[i].risultato,esclusi,nuovi);
    for(const n of nuovi)aggiunti.add(senzaIndici(n));
    if(d.length){
      rotte++;totali+=d.length;
      if(rotte<=20)console.error(`RAL ${ora[i].ral}\n  ${d.join('\n  ')}`);
    }
  }
  const esclusiTxt=esclusi.size?`\nusciti per disegno (--esclude): ${[...esclusi].join(', ')}`:'';
  const aggiuntiTxt=aggiunti.size?`\ncampi aggiunti (non erano nella base): ${[...aggiunti].sort().join(', ')}`:'';
  if(rotte===0){
    console.log(`${ora.length} corse, zero divergenze campo per campo${esclusiTxt}${aggiuntiTxt}`);
    process.exit(0);
  }
  console.error(`\n${rotte} corse divergenti su ${ora.length}, ${totali} campi${esclusiTxt}${aggiuntiTxt}`);
  process.exit(1);
}

console.error(`uso:
  node processo/attrezzi/confronto.js salva <file.json>
  node processo/attrezzi/confronto.js confronta <file.json> [--esclude campo,campo]`);
process.exit(2);
