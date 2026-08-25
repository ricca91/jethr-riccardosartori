/* ============================================================
   RIGHE — adapter dalla Voce al suo racconto.

   Interface: componiRighe(voci) restituisce una Riga per ogni
   Voce, nello stesso ordine. Le Voce portano tutti i fatti del
   calcolo; questo module decide soltanto come mostrarli.
   ============================================================ */
const CATALOGO_FONTI=typeof module!=='undefined'&&module.exports
  ?require('./fonti.js').FONTI:FONTI;

const raggruppa=i=>i.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const formatta=n=>{const neg=n<0,x=Math.abs(n).toFixed(2),[i,f]=x.split('.');
  return(neg?'−':'')+raggruppa(i)+','+f;};
const senzaCentesimi=n=>formatta(n).replace(',00','');
const percentuale=(n,d)=>(n*100).toFixed(d).replace('.',',')+'%';
const migliaia=n=>n/1000;

const richiede=(voce,...campi)=>{
  for(const campo of campi)
    if(!Object.hasOwn(voce,campo)||voce[campo]===undefined)
      throw new TypeError(`Voce ${voce.id}: fatto mancante ${campo}`);
};
const notaCapienza=(voce,voci)=>{
  const detrazioni=voci.filter(v=>v.tipo==='detrazione');
  if(detrazioni.every(v=>v.capiente))return'';
  return`  →  spettante ${formatta(voce.spettante)} €,`+
    `  ⚠ capienza: usata ${formatta(voce.importo)} € — le detrazioni non sono rimborsabili`;
};

const RICETTE={
  ivs:{campi:['base','aliquota'],titolo:()=>`Contributi previdenziali IVS`,
    formula:v=>`${formatta(v.base)} × ${percentuale(v.aliquota,2)}`},
  ecc:{campi:['baseContributiva','soglia','aliquota'],
    titolo:v=>`Contributo aggiuntivo ${percentuale(v.aliquota,0)}`,
    formula:v=>`(${formatta(v.baseContributiva)} − ${formatta(v.soglia)}) × ${percentuale(v.aliquota,0)}`},
  lorda:{campi:['base','scaglioni'],titolo:()=>`IRPEF lorda`,formula:v=>{
    const sc=v.scaglioni,al=i=>percentuale(sc[i][1],0);
    return`${al(0)} × min(${formatta(v.base)}; ${senzaCentesimi(sc[0][0])}) `+
      `+ ${al(1)} sulla quota ${migliaia(sc[0][0])}–${migliaia(sc[1][0])}k + ${al(2)} oltre`;}},
  detrlav:{campi:['base','quotaFissa','quotaVariabile','rapporto','maggiorazione','spettante',
      'capiente','sogliaFissa','sogliaIntermedia','sogliaFinale','maggiorazioneDa','maggiorazioneA'],
    titolo:v=>'Detrazione lavoro dipendente'+(v.maggiorazione>0?` (+${senzaCentesimi(v.maggiorazione)} €)`:''),
    formula:(v,voci)=>{let f;
      if(v.base<=v.sogliaFissa)f=`${formatta(v.quotaFissa)} (fisso fino a ${senzaCentesimi(v.sogliaFissa)} €)`;
      else if(v.base<=v.sogliaIntermedia)f=`${senzaCentesimi(v.quotaFissa)} + ${senzaCentesimi(v.quotaVariabile)} × ${v.rapporto.toFixed(4)}`;
      else if(v.base<=v.sogliaFinale)f=`${senzaCentesimi(v.quotaVariabile)} × ${v.rapporto.toFixed(4)}  (rapporto troncato a 4 decimali)`;
      else f=`0 (imponibile oltre ${senzaCentesimi(v.sogliaFinale)} €)`;
      if(v.maggiorazione>0)f+=`  +${senzaCentesimi(v.maggiorazione)} (imponibile ${migliaia(v.maggiorazioneDa)}–${migliaia(v.maggiorazioneA)}k)`;
      return f+notaCapienza(v,voci);}},
  detrult:{campi:['quotaFissa','rapporto','spettante','capiente','da','pienoFinoA','a','ampiezzaDecrescente'],
    titolo:()=>`Ulteriore detrazione`,formula:(v,voci)=>{
      const f=v.rapporto===null
        ?`${formatta(v.quotaFissa)} (imponibile ${migliaia(v.da)}–${migliaia(v.pienoFinoA)}k)`
        :`${senzaCentesimi(v.quotaFissa)} × (${senzaCentesimi(v.a)} − ${formatta(v.base)}) ÷ ${senzaCentesimi(v.ampiezzaDecrescente)}`;
      return f+notaCapienza(v,voci);}},
  addreg:{campi:['dovuta','scaglioni'],titolo:()=>`Addizionale regionale Lombardia`,formula:v=>{
    if(!v.dovuta)return'0 — non dovuta: IRPEF netta è zero';
    return v.scaglioni.map(([tetto,aliquota],i)=>{
      const al=percentuale(aliquota,2);if(tetto===null)return`${al} oltre`;
      return i===0?`${al} fino a ${migliaia(tetto)}k`:`${al} ${migliaia(v.scaglioni[i-1][0])}–${migliaia(tetto)}k`;
    }).join(' · ');}},
  addcom:{campi:['dovuta','aliquota','esenzioneFinoA'],titolo:()=>`Addizionale comunale Milano`,formula:v=>{
    if(!v.dovuta)return'0 — non dovuta: IRPEF netta è zero';
    return v.base>v.esenzioneFinoA
      ?`${formatta(v.base)} × ${percentuale(v.aliquota,1)} (sull'intero imponibile)`
      :`0 — esente fino a ${senzaCentesimi(v.esenzioneFinoA)} € di imponibile`;}},
  somma:{campi:['base','aliquota'],titolo:()=>`Somma non imponibile (cuneo)`,
    formula:v=>`${formatta(v.base)} × ${percentuale(v.aliquota,1)}`},
  ti:{campi:['quotaFissa','limiteImponibile','scartoDetrazione'],titolo:()=>`Trattamento integrativo`,
    formula:v=>`${formatta(v.quotaFissa)} — imponibile ≤ ${senzaCentesimi(v.limiteImponibile)} `+
      `e IRPEF lorda > detrazione − ${senzaCentesimi(v.scartoDetrazione)}`},
};

function componiRighe(voci){
  if(!Array.isArray(voci))throw new TypeError('Le Voce devono essere un array');
  const viste=new Set();
  for(const voce of voci){
    if(!voce||typeof voce!=='object')throw new TypeError('Voce non valida');
    richiede(voce,'id','tipo','fonte','base','importo');
    if(viste.has(voce.id))throw new Error(`Voce duplicata: ${voce.id}`);
    viste.add(voce.id);
    const ricetta=RICETTE[voce.id];
    if(!ricetta)throw new Error(`Voce sconosciuta: ${voce.id}`);
    if(!CATALOGO_FONTI[voce.fonte])throw new Error(`Fonte sconosciuta: ${voce.fonte}`);
    richiede(voce,...ricetta.campi);
  }
  return voci.map(voce=>{
    const ricetta=RICETTE[voce.id];
    const[titoloFonte,descrizioneFonte,urlFonte]=CATALOGO_FONTI[voce.fonte];
    return{id:voce.id,titolo:ricetta.titolo(voce),formula:ricetta.formula(voce,voci),
      fonte:{titolo:titoloFonte,descrizione:descrizioneFonte,url:urlFonte}};
  });
}

if(typeof module!=='undefined'&&module.exports)module.exports={componiRighe};
