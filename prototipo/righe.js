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
const descriviRegola=(v,comunale)=>{
  if(!v.dovuta)return'0 — non dovuta: IRPEF netta è zero';
  const r=v.regola;
  if(r.tipo==='nessuna')return'0 — il comune non applica l’addizionale';
  if(r.esenzioneFinoA&&v.base<=r.esenzioneFinoA)
    return`0 — esente fino a ${senzaCentesimi(r.esenzioneFinoA)} € di imponibile`;
  if(r.tipo==='aliquotaUnica')
    return`${formatta(v.base)} × ${percentuale(r.aliquota,comunale?1:2)} (sull'intero imponibile)`;
  if(r.tipo==='aliquotePerReddito')return r.fasce.map(([t,a])=>
    `${percentuale(a,2)} ${t===null?'oltre':`fino a ${migliaia(t)}k`}`).join(' · ')+' sull’intero imponibile';
  if(r.tipo==='scaglioni')return r.scaglioni.map(([t,a],i)=>{
    const al=percentuale(a,2);if(t===null)return`${al} oltre`;
    return i===0?`${al} fino a ${migliaia(t)}k`:`${al} ${migliaia(r.scaglioni[i-1][0])}–${migliaia(t)}k`;
  }).join(' · ');
  return r.revisione||r.tipo;
};

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

/* CARICHI DI FAMIGLIA — una voce per persona, quindi una ricetta
   sola e tanti id numerati. Il motore emette un CODICE di esito;
   la frase in italiano nasce qui, che è dove vivono le parole. */
const FAMILIARE={coniuge:'coniuge a carico',figlio:'figlio a carico',
  ascendente:'ascendente convivente a carico'};
const SENZA_DIRITTO={
  etaNonDichiarata:()=>'manca l’età: è l’età che decide se la detrazione spetta',
  assorbitaAssegnoUnico:()=>'sotto i 21 anni la detrazione è assorbita dall’Assegno Unico',
  oltreTrentaAnni:()=>'dai 30 anni compiuti la detrazione non spetta più',
  familiareNonACarico:v=>`non a carico: reddito proprio ${formatta(v.redditoFamiliare)} €,`+
    ` oltre il limite di ${senzaCentesimi(v.limiteRedditoFamiliare)} €`,
  rapportoFuoriIntervallo:()=>'il rapporto dell’art. 12 non è utile:'+
    ' il c. 4 esclude zero, i negativi e uno',
};
/* La nota: la stessa cosa della formula, in poche parole. Serve
   alla colonna «perché» della tabella del nucleo, dove non c'è
   spazio per una formula ma la ragione deve restare in vista. */
const NOTA_SENZA_DIRITTO={
  etaNonDichiarata:()=>'manca l’età',
  assorbitaAssegnoUnico:()=>'sotto i 21 anni: Assegno Unico, non detrazione',
  oltreTrentaAnni:()=>'30 anni compiuti: non spetta più',
  familiareNonACarico:v=>`non a carico: oltre ${senzaCentesimi(v.limiteRedditoFamiliare)} €`,
  rapportoFuoriIntervallo:()=>'reddito fuori dall’intervallo dell’art. 12',
};
const TRONCATO='  (rapporto troncato a 4 decimali)';
const perScelta=(n,uno,molti)=>`${n} ${n===1?uno:molti}`;
const formulaConiuge=v=>{
  const t=v.termini;
  if(v.fascia==='rapportoUno')
    return`${senzaCentesimi(t.importo)} (il c. 4 fissa la detrazione quando il rapporto è uno)`;
  if(v.fascia==='fissa'){
    const base=`${senzaCentesimi(t.importo)} (imponibile fra ${senzaCentesimi(t.da)} e ${senzaCentesimi(t.a)} €)`;
    return t.maggiorazione>0
      ?`${base}  +${senzaCentesimi(t.maggiorazione)} (scalino ${senzaCentesimi(t.scalinoDa)}–${senzaCentesimi(t.scalinoA)} €)`
      :base;
  }
  if(v.fascia==='primoRapporto')
    return`${senzaCentesimi(t.importo)} − ${senzaCentesimi(t.scarto)} × ${v.rapporto.toFixed(4)}${TRONCATO}`;
  return`${senzaCentesimi(t.importo)} × ${v.rapporto.toFixed(4)}${TRONCATO}`;
};
const formulaSuSoglia=(v,coda)=>
  `${senzaCentesimi(v.termini.importo)} × ${v.rapporto.toFixed(4)}${TRONCATO}\n${coda}`;

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
  addreg:{campi:['dovuta','regola','nome'],titolo:v=>`Addizionale regionale ${v.nome}`,
    formula:v=>descriviRegola(v,false)},
  addcom:{campi:['dovuta','regola','nome'],titolo:v=>`Addizionale comunale ${v.nome}`,
    formula:v=>descriviRegola(v,true)},
  somma:{campi:['base','aliquota'],titolo:()=>`Somma non imponibile (cuneo)`,
    formula:v=>`${formatta(v.base)} × ${percentuale(v.aliquota,1)}`},
  detrfam:{campi:['tipoFamiliare','eta','esito','fascia','redditoFamiliare',
      'limiteRedditoFamiliare','spettante','capiente','rapporto','termini'],
    titolo:v=>`Detrazione per ${v.tipoFamiliare==='figlio'
      ?`figlio a carico (${v.eta===null?'età non indicata':perScelta(v.eta,'anno','anni')})`
      :FAMILIARE[v.tipoFamiliare]}`,
    formula:(v,voci)=>{
      if(v.esito!=='spetta')return`0 — ${SENZA_DIRITTO[v.esito](v)}`;
      const t=v.termini;
      const corpo=v.tipoFamiliare==='coniuge'?formulaConiuge(v)
        :v.tipoFamiliare==='figlio'
          ?formulaSuSoglia(v,t.oltreIlPrimo>0
            /* la soglia cresciuta si vede, non si subisce */
            ?`soglia ${senzaCentesimi(t.sogliaBase)} + ${senzaCentesimi(t.incremento)} × `+
             `${perScelta(t.oltreIlPrimo,'figlio','figli')} oltre il primo = ${senzaCentesimi(t.soglia)} €`
            :`soglia ${senzaCentesimi(t.soglia)} €, un solo figlio che dà diritto alla detrazione`)
          :formulaSuSoglia(v,`soglia ${senzaCentesimi(t.soglia)} €, solo ascendenti conviventi`);
      return`${corpo}\na carico: reddito proprio ${formatta(v.redditoFamiliare)} €`+
        ` entro il limite di ${senzaCentesimi(v.limiteRedditoFamiliare)} €`+notaCapienza(v,voci);
    },
    nota:v=>{
      if(v.esito!=='spetta')return NOTA_SENZA_DIRITTO[v.esito](v);
      const entro=`a carico entro ${senzaCentesimi(v.limiteRedditoFamiliare)} €`;
      if(v.tipoFamiliare==='figlio')return`21–29 anni, ${entro}`;
      if(v.tipoFamiliare==='ascendente')return`convivente, ${entro}`;
      return entro;
    }},
  ti:{campi:['quotaFissa','limiteImponibile','scartoDetrazione'],titolo:()=>`Trattamento integrativo`,
    formula:v=>`${formatta(v.quotaFissa)} — imponibile ≤ ${senzaCentesimi(v.limiteImponibile)} `+
      `e IRPEF lorda > detrazione − ${senzaCentesimi(v.scartoDetrazione)}`},
};

/* Le voci dei carichi di famiglia sono una per persona: l'id porta
   il numero del familiare, la ricetta invece è una sola. */
const ricettaDi=id=>RICETTE[id]||RICETTE[String(id).replace(/\d+$/,'')];

function componiRighe(voci){
  if(!Array.isArray(voci))throw new TypeError('Le Voce devono essere un array');
  const viste=new Set();
  for(const voce of voci){
    if(!voce||typeof voce!=='object')throw new TypeError('Voce non valida');
    richiede(voce,'id','tipo','fonte','base','importo');
    if(viste.has(voce.id))throw new Error(`Voce duplicata: ${voce.id}`);
    viste.add(voce.id);
    const ricetta=ricettaDi(voce.id);
    if(!ricetta)throw new Error(`Voce sconosciuta: ${voce.id}`);
    if(typeof voce.fonte==='string'&&!CATALOGO_FONTI[voce.fonte])throw new Error(`Fonte sconosciuta: ${voce.fonte}`);
    if(typeof voce.fonte==='object'&&(!voce.fonte.url||!voce.fonte.tipo))
      throw new Error(`Fonte locale incompleta: ${voce.id}`);
    richiede(voce,...ricetta.campi);
  }
  return voci.map(voce=>{
    const ricetta=ricettaDi(voce.id);
    const locale=typeof voce.fonte==='object';
    const[titoloFonte,descrizioneFonte,urlFonte]=locale
      ?[`MEF — addizionale ${voce.fonte.tipo}`,
        `Regola ${voce.fonte.annoOrigine}, ${voce.fonte.stato}; snapshot ${voce.fonte.asOf}`+
          (voce.fonte.numeroDelibera||voce.fonte.numero?`; atto n. ${voce.fonte.numeroDelibera||voce.fonte.numero}`:'')+
          (voce.fonte.dataPubblicazione?`, pubblicato ${voce.fonte.dataPubblicazione}`:''),
        voce.fonte.url]
      :CATALOGO_FONTI[voce.fonte];
    return{id:voce.id,titolo:ricetta.titolo(voce),formula:ricetta.formula(voce,voci),
      nota:ricetta.nota?ricetta.nota(voce,voci):'',
      fonte:{titolo:titoloFonte,descrizione:descrizioneFonte,url:urlFonte}};
  });
}

if(typeof module!=='undefined'&&module.exports)module.exports={componiRighe};
