/* ============================================================
   MOTORE — calcolatore RAL → netto, contratto di calcolo #4
   Regole 2026, caso Milano / impiegato privato / anno intero.

   Script classico, non modulo: la pagina deve aprirsi con un
   doppio clic (file://), dove i moduli non si caricano.
   In Node lo stesso file si carica con require() grazie
   all'export in fondo — così `node --test` gira senza
   installare niente e senza duplicare la logica.
   ============================================================ */

/* ============================================================
   MOTORE — contratto di calcolo #4, regole-2026-v1
   Virgola fissa su BigInt (scala 1e8). Mai float binario.
   ============================================================ */
const SC=8n,S=10n**8n,CENT=10n**6n,D4=10n**4n;
function d(x){const s=String(x).trim();const neg=s.startsWith('-');
  const[i,f='']=(neg?s.slice(1):s).split('.');
  const frac=(f+'0'.repeat(Number(SC))).slice(0,Number(SC));
  const v=BigInt(i||'0')*S+BigInt(frac||'0');return neg?-v:v;}
const mul=(a,b)=>(a*b)/S;
const rc=a=>{const neg=a<0n,x=neg?-a:a;const q=x/CENT,r=x%CENT;
  const y=(r*2n>=CENT?q+1n:q)*CENT;return neg?-y:y;};
const tr4=a=>(a/D4)*D4;
const nu=a=>Number(a)/1e8;
const K={massimale:d('122295'),sogliaEcc:d('56224'),ivs:d('0.0919'),ecc:d('0.01'),
  irpef:[[d('28000'),d('0.23')],[d('50000'),d('0.33')],[null,d('0.43')]],
  reg:[[d('15000'),d('0.0123')],[d('28000'),d('0.0158')],[d('50000'),d('0.0172')],[null,d('0.0173')]],
  comAliq:d('0.008'),comEsente:d('23000')};

function calcola(ralInput,mensilita){
  const RAL=rc(d(ralInput)),v=[];
  const push=(id,et,tipo,base,imp,fonte,formula)=>v.push({id,et,tipo,base:nu(base),
    importo:nu(rc(imp)),_i:rc(imp),fonte,formula});
  const baseC=RAL<K.massimale?RAL:K.massimale;
  const ivs=mul(baseC,K.ivs);
  const ecc=baseC>K.sogliaEcc?mul(baseC-K.sogliaEcc,K.ecc):0n;
  push('ivs','Contributi previdenziali IVS','contributo',baseC,-ivs,'inps101',
    `${fmt(nu(baseC))} × 9,19%`);
  if(ecc>0n)push('ecc','Contributo aggiuntivo 1%','contributo',baseC-K.sogliaEcc,-ecc,'inps27',
    `(${fmt(nu(baseC))} − 56.224,00) × 1%`);
  const contributi=rc(ivs)+rc(ecc);
  const I=RAL-contributi;
  let lorda=0n,prev=0n;
  for(const[cap,al]of K.irpef){const top=cap===null?I:(I<cap?I:cap);
    if(top>prev)lorda+=mul(top-prev,al);prev=cap===null?prev:cap;if(cap!==null&&I<=cap)break;}
  let detrLav=0n,fdet='';
  if(I<=d('15000')){detrLav=d('1955');fdet='1.955,00 (fisso fino a 15.000 €)';}
  else if(I<=d('28000')){const rap=tr4(((d('28000')-I)*S)/d('13000'));
    detrLav=d('1910')+mul(d('1190'),rap);fdet=`1.910 + 1.190 × ${nu(rap).toFixed(4)}`;}
  else if(I<=d('50000')){const rap=tr4(((d('50000')-I)*S)/d('22000'));
    detrLav=mul(d('1910'),rap);fdet=`1.910 × ${nu(rap).toFixed(4)}  (rapporto troncato a 4 decimali)`;}
  else fdet='0 (imponibile oltre 50.000 €)';
  const b65=(I>d('25000')&&I<=d('35000'))?d('65'):0n;
  const detrLavTot=detrLav+b65;
  let detrUlt=0n,fult='';
  if(I>d('20000')&&I<=d('32000')){detrUlt=d('1000');fult='1.000,00 (imponibile 20–32k)';}
  else if(I>d('32000')&&I<=d('40000')){detrUlt=mul(d('1000'),((d('40000')-I)*S)/d('8000'));
    fult=`1.000 × (40.000 − ${fmt(nu(I))}) ÷ 8.000`;}
  const nettaRaw=(lorda-detrLavTot-detrUlt);
  const netta=nettaRaw>0n?nettaRaw:0n;
  // Capienza: le detrazioni abbattono l'imposta, non sono rimborsabili.
  // Nelle voci entra la quota effettivamente usata, altrimenti la somma non tornerebbe.
  const usoLav=detrLavTot<lorda?detrLavTot:lorda;
  const resto=lorda-usoLav;
  const usoUlt=detrUlt<resto?detrUlt:resto;
  const capiente=(detrLavTot+detrUlt)<=lorda;
  const capNota=q=>capiente?'':`  ⚠ capienza: usata ${fmt(nu(q))} € — le detrazioni non sono rimborsabili`;
  push('lorda','IRPEF lorda','imposta',I,-lorda,'l199',
    `23% × min(${fmt(nu(I))}; 28.000) + 33% sulla quota 28–50k + 43% oltre`);
  push('detrlav',b65>0n?'Detrazione lavoro dipendente (+65 €)':'Detrazione lavoro dipendente','detrazione',
    I,usoLav,'tuir13',fdet+(b65>0n?'  +65 (imponibile 25–35k)':'')+
    (capiente?'':`  →  spettante ${fmt(nu(detrLavTot))} €,${capNota(usoLav)}`));
  if(detrUlt>0n)push('detrult','Ulteriore detrazione','detrazione',I,usoUlt,'l207c6',
    fult+(capiente?'':`  →  spettante ${fmt(nu(detrUlt))} €,${capNota(usoUlt)}`));
  const dovute=netta>0n;
  let reg=0n;prev=0n;
  if(dovute)for(const[cap,al]of K.reg){const top=cap===null?I:(I<cap?I:cap);
    if(top>prev)reg+=mul(top-prev,al);prev=cap===null?prev:cap;if(cap!==null&&I<=cap)break;}
  const com=(dovute&&I>K.comEsente)?mul(I,K.comAliq):0n;
  push('addreg','Addizionale regionale Lombardia','imposta',I,-reg,'lomb',
    dovute?'1,23% fino a 15k · 1,58% 15–28k · 1,72% 28–50k · 1,73% oltre':'0 — non dovuta: IRPEF netta è zero');
  push('addcom','Addizionale comunale Milano','imposta',I,-com,'mi',
    !dovute?'0 — non dovuta: IRPEF netta è zero':(I>K.comEsente?`${fmt(nu(I))} × 0,8% (sull'intero imponibile)`:'0 — esente fino a 23.000 € di imponibile'));
  let somma=0n,fsom='';
  if(I<=d('20000')){const al=I<=d('8500')?d('0.071'):(I<=d('15000')?d('0.053'):d('0.048'));
    somma=mul(I,al);fsom=`${fmt(nu(I))} × ${(nu(al)*100).toFixed(1).replace('.',',')}%`;}
  const ti=(I<=d('15000')&&lorda>(detrLav-d('75')))?d('1200'):0n;
  if(somma>0n)push('somma','Somma non imponibile (cuneo)','integrazione',I,somma,'l207c4',fsom);
  if(ti>0n)push('ti','Trattamento integrativo','integrazione',I,ti,'dl3',
    '1.200,00 — imponibile ≤ 15.000 e IRPEF lorda > detrazione − 75');
  const netto=v.reduce((a,x)=>a+x._i,RAL);
  const imposte=rc(netta)+rc(reg)+rc(com);
  const media=rc((netto*S)/d(String(mensilita)));
  const somme=v.reduce((a,x)=>a+x._i,0n);
  return{input:{ral:nu(RAL),mensilita},versioneRegole:'regole-2026-v1',
    voci:v.map(({_i,...r})=>r),
    kpi:{nettoAnnuo:nu(netto),mediaMensile:nu(media),totaleImposte:nu(imposte),totaleContributi:nu(contributi)},
    imponibile:nu(I),irpefNetta:nu(rc(netta)),integrazioni:nu(rc(somma)+rc(ti)),
    aliquotaContributivaEffettiva:RAL>0n?nu(mul(((contributi*S)/RAL),d('100'))):0,
    riconciliazione:{verificata:netto===RAL+somme,identita:'RAL − contributi − imposte + integrazioni = netto annuo'}};
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
const SALTI=[
  ['9001.12','si attiva il trattamento integrativo'],
  ['9360.21','scattano le addizionali e la somma non imponibile passa dal 7,1% al 5,3%'],
  ['16518.02','decade il trattamento integrativo (imponibile 15.000 €)'],
  ['22024.02','la somma non imponibile lascia il posto all\'ulteriore detrazione (imponibile 20.000 €)'],
  ['25327.62','finisce l\'esenzione dell\'addizionale comunale di Milano (imponibile 23.000 €)'],
  ['27530.02','si attiva la maggiorazione di 65 € (imponibile 25.000 €)'],
  ['38542.02','decade la maggiorazione di 65 € (imponibile 35.000 €)'],
];
let SOGLIE=null;
function soglie(){
  if(SOGLIE)return SOGLIE;
  SOGLIE=SALTI.map(([r,causa])=>{
    const hi=calcola(r,13).kpi.nettoAnnuo,lo=calcola((Number(r)-0.01).toFixed(2),13).kpi.nettoAnnuo;
    return{ral:Number(r),causa,delta:Math.round((hi-lo)*100)/100};
  });
  return SOGLIE;
}

/* ---------- mensilità: presentazione, non calcolo ----------
   Il selettore 12/13 non rientra nel motore fiscale: divide un
   netto annuo già calcolato. Applicarlo così — invece di
   richiamare calcola() — è ciò che rende vera a schermo la tesi
   del contratto: cambiare mensilità non può muovere il netto. */
function applicaMensilita(res,mensilita){
  const netto=d(res.kpi.nettoAnnuo.toFixed(2));
  const media=rc((netto*S)/d(String(mensilita)));
  return{...res,input:{...res.input,mensilita},
    kpi:{...res.kpi,mediaMensile:nu(media)}};
}

/* Node: require('./motore.js'). Browser: `module` non esiste e
   le dichiarazioni qui sopra sono già globali per la pagina. */
if(typeof module!=='undefined'&&module.exports){
  module.exports={calcola,applicaMensilita,parseRal,soglie,SALTI,fmt,eur,K};
}
