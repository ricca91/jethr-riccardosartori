const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('./motore.js');
const G=require('./geografia.js');

const euro=x=>M.toNumber(M.calcolaAddizionale(M.dec(String(x)),true,arguments[1]));
const imposta=(base,regola)=>M.toNumber(M.calcolaAddizionale(M.dec(String(base)),true,regola));
/* La famiglia entra in coda: le regole che non la guardano restano
   chiamabili come prima, ed è la ragione per cui il parametro è ultimo. */
const impostaFam=(base,regola,famiglia)=>
  M.toNumber(M.calcolaAddizionale(M.dec(String(base)),true,regola,famiglia));
const figlio=(eta,extra={})=>({tipo:'figlio',eta,...extra});

test.describe('regole locali normalizzate',()=>{
  test('aliquota unica, esenzione secca e assenza di addizionale',()=>{
    assert.equal(imposta(10000,{tipo:'aliquotaUnica',aliquota:0.01}),100);
    assert.equal(imposta(10000,{tipo:'aliquotaUnica',aliquota:0.01,esenzioneFinoA:10000}),0);
    assert.equal(imposta(10000,{tipo:'nessuna'}),0);
  });

  test('scaglioni progressivi con e senza esenzione',()=>{
    const r={tipo:'scaglioni',scaglioni:[[15000,0.01],[null,0.02]]};
    assert.equal(imposta(20000,r),250);
    assert.equal(imposta(20000,{...r,esenzioneFinoA:20000}),0);
  });

  test('aliquote sull’intero reddito e detrazioni generali revisionate',()=>{
    assert.equal(imposta(16000,{tipo:'aliquotePerReddito',fasce:[[15000,0.007],[null,0.0123]]}),196.8);
    const r={tipo:'aliquotaUnica',aliquota:0.02,detrazioni:[{oltre:10000,finoA:20000,fissa:100}]};
    assert.equal(imposta(15000,r),200);
  });

  test('non applica l’addizionale quando l’IRPEF netta è zero',()=>{
    assert.equal(imposta(20000,{tipo:'aliquotaUnica',aliquota:0.01}),200);
    assert.equal(M.toNumber(M.calcolaAddizionale(M.dec('20000'),false,{tipo:'aliquotaUnica',aliquota:0.01})),0);
  });
});

test.describe('geografia nel calcolo',()=>{
  test('Milano resta il default e conserva il golden esatto',()=>{
    assert.deepEqual(M.calcola('35000'),M.calcola('35000',{comune:'F205'}));
    assert.equal(M.calcola('35000',{comune:'F205'}).kpi.nettoAnnuo,26032.17);
  });

  test('la scelta del comune determina entrambe le addizionali e le fonti',()=>{
    const roma=G.comuni().find(c=>c.nome==='Roma');
    const r=M.calcola('35000',{comune:roma.catastale});
    assert.equal(r.input.comune,roma.catastale);
    assert.equal(r.geografia.comune,'Roma');
    assert.equal(r.voci.find(v=>v.id==='addreg').fonte.tipo,'regionale');
    assert.equal(r.voci.find(v=>v.id==='addcom').fonte.tipo,'comunale');
    assert.notEqual(r.kpi.nettoAnnuo,26032.17);
  });

  test('le soglie comunali seguono il comune selezionato e non una cache globale',()=>{
    const comunali=catastale=>M.soglie({comune:catastale}).filter(s=>s.ambito==='comunale');

    const milano=comunali('F205');
    assert.deepEqual(milano.map(s=>s.imponibile),[23000]);
    assert.match(milano[0].causa,/Milano/);

    const candiolo=comunali('B592');
    assert.deepEqual(candiolo.map(s=>s.imponibile),[15000]);
    assert.match(candiolo[0].causa,/Candiolo/);

    assert.deepEqual(comunali('A074'),[]); // Agliè: aliquota unica senza esenzione
    assert.deepEqual(comunali('F205'),milano); // ritorno a Milano: cache per comune
  });

  test('espone soltanto le discontinuità regionali, non i normali scaglioni progressivi',()=>{
    assert.deepEqual(M.soglie({comune:'F205'}).filter(s=>s.ambito==='regionale'),[]);
    const lazio=M.soglie({comune:'H501'}).filter(s=>s.ambito==='regionale');
    assert.deepEqual(lazio.map(s=>s.imponibile),[28000,30000]);
    assert.match(lazio[0].causa,/fascia intera.*detrazione generale/);
  });
});


/* ============================================================
   LE REGOLE LOCALI CHE GUARDANO LA FAMIGLIA
   Tre meccanismi, non uno: sei enti aggiungono una detrazione per
   figlio, due cambiano l'ALIQUOTA e sei comuni cambiano l'ESENZIONE.
   Qui si provano le forme su regole sintetiche; che l'ente giusto
   porti la forma giusta lo prova la sezione sugli enti reali.
   ============================================================ */
test.describe('detrazione locale per figlio a carico',()=>{
  test('un importo per ogni figlio a carico, e mai un\'imposta negativa',()=>{
    const r={tipo:'aliquotaUnica',aliquota:0.0123,detrazioni:[{finoA:50000,perFiglio:{importo:246}}]};
    assert.equal(impostaFam(30000,r,[]),369);
    assert.equal(impostaFam(30000,r,[figlio(10)]),123);
    assert.equal(impostaFam(30000,r,[figlio(10),figlio(35)]),0);
  });

  test('sopra il tetto di reddito del contribuente la detrazione non spetta',()=>{
    const r={tipo:'aliquotaUnica',aliquota:0.01,detrazioni:[{finoA:50000,perFiglio:{importo:246}}]};
    assert.equal(impostaFam(50000,r,[figlio(10)]),254);
    assert.equal(impostaFam(50001,r,[figlio(10)]),500.01);
  });

  /* «Più di due figli»: il minimo è una condizione di accesso. Sotto
     quel numero non spetta una detrazione ridotta: non spetta niente. */
  test('il numero minimo di figli è una condizione, non uno sconto parziale',()=>{
    const r={tipo:'aliquotaUnica',aliquota:0.01,detrazioni:[{perFiglio:{importo:100,minimoFigli:3}}]};
    assert.equal(impostaFam(30000,r,[figlio(10),figlio(12)]),300);
    assert.equal(impostaFam(30000,r,[figlio(10),figlio(12),figlio(14)]),0);
  });

  test('il supplemento per disabilità si somma ai soli figli disabili',()=>{
    const r={tipo:'aliquotaUnica',aliquota:0.01,detrazioni:[{perFiglio:{importo:20,supplementoDisabile:375}}]};
    assert.equal(impostaFam(50000,r,[figlio(10),figlio(12,{disabilita:true})]),85);
  });

  test('una detrazione riservata ai figli disabili ignora gli altri',()=>{
    const r={tipo:'aliquotaUnica',aliquota:0.01,detrazioni:[{perFiglio:{importo:40,soloDisabili:true}}]};
    assert.equal(impostaFam(50000,r,[figlio(10)]),500);
    assert.equal(impostaFam(50000,r,[figlio(10,{disabilita:true})]),460);
  });

  test('età massima e limite di reddito del figlio scelgono chi conta',()=>{
    const r={tipo:'aliquotaUnica',aliquota:0.01,
      detrazioni:[{perFiglio:{importo:200,etaMassima:18,redditoMassimoFiglio:4000}}]};
    assert.equal(impostaFam(50000,r,[figlio(17)]),300);
    assert.equal(impostaFam(50000,r,[figlio(18)]),500);
    assert.equal(impostaFam(50000,r,[figlio(17,{reddito:4000})]),300);
    assert.equal(impostaFam(50000,r,[figlio(17,{reddito:4000.01})]),500);
  });

  /* Piemonte e Puglia rinviano all'art. 12 per la spettanza: il tetto
     dei trent'anni le segue, e la disabilità lo toglie qui come là. */
  test('il tetto dei trent\'anni dell\'art. 12 vale anche in locale, salvo disabilità',()=>{
    const r={tipo:'aliquotaUnica',aliquota:0.01,detrazioni:[{perFiglio:{importo:100,tettoTrentaAnni:true}}]};
    assert.equal(impostaFam(50000,r,[figlio(29)]),400);
    assert.equal(impostaFam(50000,r,[figlio(30)]),500);
    assert.equal(impostaFam(50000,r,[figlio(30,{disabilita:true})]),400);
  });

  test('senza famiglia dichiarata la detrazione per figlio non si applica',()=>{
    const r={tipo:'aliquotaUnica',aliquota:0.01,detrazioni:[{perFiglio:{importo:246}}]};
    assert.equal(imposta(30000,r),300);
  });

  test('solo i figli contano: un ascendente non è un figlio a carico',()=>{
    const r={tipo:'aliquotaUnica',aliquota:0.01,detrazioni:[{perFiglio:{importo:246}}]};
    assert.equal(impostaFam(30000,r,[{tipo:'ascendente'}]),300);
  });
});

test.describe('aliquota condizionata alla famiglia',()=>{
  const SCAGLIONI=[[15000,0.0123],[null,0.0173]];
  const ORDINARIA=444;                                   // 15.000×1,23% + 15.000×1,73%
  const marche={tipo:'scaglioni',scaglioni:SCAGLIONI,
    aliquotaFamiliare:{aliquota:0.0123,finoA:50000,richiede:'figlioDisabile'}};

  /* Non è una detrazione: sostituisce il calcolo dell'imposta. */
  test('l\'aliquota agevolata sostituisce gli scaglioni, non li corregge',()=>{
    assert.equal(impostaFam(30000,marche,[]),ORDINARIA);
    assert.equal(impostaFam(30000,marche,[figlio(10,{disabilita:true})]),369);
  });

  test('sopra il tetto di reddito l\'aliquota agevolata non si applica',()=>{
    assert.equal(impostaFam(50000,marche,[figlio(10,{disabilita:true})]),615);
    assert.equal(impostaFam(50001,marche,[figlio(10,{disabilita:true})]),790.0173);
  });

  test('un figlio disabile non a carico non apre l\'agevolazione',()=>{
    assert.equal(impostaFam(30000,marche,[figlio(10,{disabilita:true,reddito:4000.01})]),ORDINARIA);
  });

  test('le Marche chiedono un FIGLIO disabile: un coniuge disabile non basta',()=>{
    assert.equal(impostaFam(30000,marche,[{tipo:'coniuge',disabilita:true}]),ORDINARIA);
  });

  test('il Veneto accetta qualunque familiare a carico con disabilità',()=>{
    const veneto={tipo:'scaglioni',scaglioni:SCAGLIONI,
      aliquotaFamiliare:{aliquota:0.009,finoA:50000,richiede:'familiareDisabile'}};
    assert.equal(impostaFam(30000,veneto,[{tipo:'ascendente',disabilita:true}]),270);
    assert.equal(impostaFam(30000,veneto,[{tipo:'ascendente',disabilita:true,reddito:2840.52}]),ORDINARIA);
    assert.equal(impostaFam(30000,veneto,[{tipo:'ascendente'}]),ORDINARIA);
  });
});

test.describe('esenzione condizionata al numero di figli',()=>{
  const r={tipo:'aliquotaUnica',aliquota:0.004,esenzioneFinoA:28000,
    esenzioneFamiliare:{finoA:35000,minimoFigli:3,incrementoPerFiglio:10000}};
  const tre=[figlio(10),figlio(12),figlio(14)];

  test('senza abbastanza figli resta soltanto l\'esenzione generale',()=>{
    assert.equal(impostaFam(27000,r,[]),0);
    assert.equal(impostaFam(30000,r,[figlio(10),figlio(12)]),120);
  });

  test('raggiunto il numero di figli la soglia sale',()=>{
    assert.equal(impostaFam(30000,r,tre),0);
    assert.equal(impostaFam(35000,r,tre),0);
    assert.equal(impostaFam(35001,r,tre),140.004);
  });

  test('ogni figlio oltre il minimo alza la soglia di 10.000',()=>{
    const quattro=[...tre,figlio(16)];
    assert.equal(impostaFam(45000,r,quattro),0);
    assert.equal(impostaFam(45001,r,quattro),180.004);
  });

  test('l\'esenzione per figli non si applica senza famiglia dichiarata',()=>{
    assert.equal(imposta(30000,r),120);
  });
});


/* ============================================================
   GLI ENTI REALI CHE GUARDANO LA FAMIGLIA
   Otto giurisdizioni regionali e sei comuni. Ciascuno ha la sua
   prova, perché la forma giusta sull'ente sbagliato è comunque un
   numero sbagliato in busta paga. Le cifre attese sono quelle
   della delibera, non quelle rigenerate dal motore.
   ============================================================ */
const c2=n=>Math.round(n*100)/100;
const cat=nome=>{
  const c=G.comuni().find(x=>x.nome===nome);
  if(!c)throw new Error(`Comune assente dallo snapshot: ${nome}`);
  return c.catastale;
};
/* Le imposte escono negative dal motore: qui si guardano in positivo.
   Lo `|| 0` toglie lo zero negativo, che non è un importo ma un artefatto. */
const locale=(id)=>(ral,comune,nucleo=[])=>
  c2(-M.calcola(ral,{comune,nucleo}).voci.find(v=>v.id===id).importo)||0;
const regionale=locale('addreg'),comunale=locale('addcom');
/* Quanto la famiglia toglie all'addizionale: è la detrazione della
   delibera, a meno che l'imposta finisca prima. */
const sconto=(quale,ral,comune,nucleo)=>c2(quale(ral,comune)-quale(ral,comune,nucleo));

test.describe('le regioni che detraggono per figlio a carico',()=>{
  test('Trento: 246 € per figlio fino a 50.000 € di imponibile',()=>{
    const t=cat('Trento');
    assert.equal(sconto(regionale,'55000',t,[figlio(10)]),246);
    assert.equal(sconto(regionale,'55000',t,[figlio(10),figlio(12)]),492);
    assert.equal(sconto(regionale,'60000',t,[figlio(10)]),0);   // imponibile oltre 50.000
  });

  /* La nota MEF di Bolzano è esplicita: la detrazione vale «anche a
     figli a carico di età inferiore ai 21 e superiore a 30 anni». */
  test('Bolzano: 340 € per figlio, a qualunque età, fino a 90.000 €',()=>{
    const b=cat('Bolzano/Bozen');
    assert.equal(sconto(regionale,'80000',b,[figlio(10)]),340);
    assert.equal(sconto(regionale,'80000',b,[figlio(45)]),340);
  });

  test('Sardegna: 200 € per figlio MINORENNE, 100 € in più se disabile',()=>{
    const c=cat('Cagliari');
    assert.equal(sconto(regionale,'55000',c,[figlio(10),figlio(12)]),400);
    assert.equal(sconto(regionale,'55000',c,[figlio(10),figlio(12,{disabilita:true})]),500);
    assert.equal(sconto(regionale,'55000',c,[figlio(19)]),0);
    assert.equal(sconto(regionale,'55000',c,[figlio(10,{reddito:4000.01})]),0);
    assert.equal(sconto(regionale,'60000',c,[figlio(10)]),0);   // imponibile oltre 50.000
  });

  test('Campania: 30 € per figlio da due figli in su, 40 € per figlio disabile',()=>{
    const n=cat('Napoli');
    assert.equal(sconto(regionale,'30000',n,[figlio(10)]),0);
    assert.equal(sconto(regionale,'30000',n,[figlio(10),figlio(12)]),60);
    assert.equal(sconto(regionale,'30000',n,[figlio(10),figlio(12,{disabilita:true})]),100);
    assert.equal(sconto(regionale,'30000',n,[figlio(10,{disabilita:true})]),40);
    assert.equal(sconto(regionale,'40000',n,[figlio(10),figlio(12)]),0);  // oltre 28.000
  });

  test('Piemonte: 100 € per figlio da tre figli in su, 500 € per figlio disabile',()=>{
    const t=cat('Torino');
    assert.equal(sconto(regionale,'40000',t,[figlio(10),figlio(12)]),0);
    assert.equal(sconto(regionale,'40000',t,[figlio(10),figlio(12),figlio(14)]),300);
    assert.equal(sconto(regionale,'40000',t,[figlio(10,{disabilita:true})]),500);
    assert.equal(sconto(regionale,'40000',t,[figlio(31)]),0);   // il tetto dei 30 anni
  });

  test('Puglia: 20 € per figlio da quattro figli in su, 375 € in più se disabile',()=>{
    const b=cat('Bari');
    assert.equal(sconto(regionale,'40000',b,[figlio(10),figlio(12),figlio(14)]),0);
    assert.equal(sconto(regionale,'40000',b,
      [figlio(10),figlio(12),figlio(14),figlio(16)]),80);
    assert.equal(sconto(regionale,'40000',b,
      [figlio(10),figlio(12),figlio(14),figlio(16,{disabilita:true})]),455);
  });
});

test.describe('le regioni che cambiano aliquota per la famiglia',()=>{
  /* Marche e Veneto non detraggono: rifanno il conto con un'altra
     aliquota, e per questo non stanno nell'array `detrazioni`. */
  test('Marche: 1,23% sull\'intero imponibile con un figlio con disabilità',()=>{
    const a=cat('Ancona');
    assert.equal(regionale('40000',a),524.91);
    assert.equal(regionale('40000',a,[figlio(10,{disabilita:true})]),446.79);
    assert.equal(regionale('40000',a,[figlio(10)]),524.91);
    assert.equal(regionale('40000',a,[{tipo:'coniuge',disabilita:true}]),524.91);
    assert.equal(regionale('70000',a,[figlio(10,{disabilita:true})]),  // oltre 50.000
      regionale('70000',a));
  });

  test('Veneto: 0,9% con un familiare qualunque con disabilità a carico',()=>{
    const v=cat('Venezia');
    assert.equal(regionale('40000',v),446.79);
    assert.equal(regionale('40000',v,[{tipo:'ascendente',disabilita:true}]),326.92);
    assert.equal(regionale('40000',v,[figlio(10,{disabilita:true})]),326.92);
    assert.equal(regionale('40000',v,[{tipo:'coniuge'}]),446.79);
  });
});

test.describe('i comuni che esentano in base al numero di figli',()=>{
  /* Sei comuni veronesi. L'esenzione non è un importo da sottrarre:
     è una soglia che sale di 10.000 € per ogni figlio oltre il minimo. */
  const CASI=[
    {nome:'Bardolino',        minimo:3,ral:'35000',oltre:'60000'},
    {nome:'Bosco Chiesanuova',minimo:4,ral:'40000',oltre:'70000'},
    {nome:'Bovolone',         minimo:4,ral:'40000',oltre:'70000'},
    {nome:'Negrar di Valpolicella',minimo:3,ral:'35000',oltre:'60000'},
    {nome:'Roverè Veronese',  minimo:4,ral:'40000',oltre:'70000'},
    {nome:'Zevio',            minimo:4,ral:'40000',oltre:'70000'},
  ];
  const figli=n=>Array.from({length:n},(_,i)=>figlio(10+i));

  for(const caso of CASI)test(`${caso.nome}: esente con ${caso.minimo} figli a carico`,()=>{
    const c=cat(caso.nome);
    assert.ok(comunale(caso.ral,c)>0,'senza figli l\'addizionale è dovuta');
    assert.equal(comunale(caso.ral,c,figli(caso.minimo)),0);
    assert.equal(comunale(caso.ral,c,figli(caso.minimo-1)),comunale(caso.ral,c));
    assert.ok(comunale(caso.oltre,c,figli(caso.minimo))>0,'sopra la soglia si paga');
  });

  test('ogni figlio oltre il minimo alza la soglia di 10.000 €',()=>{
    const b=cat('Bardolino');
    /* Tre figli: soglia 35.000. Quattro: 45.000. RAL 49.000 sta in
       mezzo, e la differenza fra le due famiglie è tutta lì. */
    assert.ok(comunale('49000',b,figli(3))>0);
    assert.equal(comunale('49000',b,figli(4)),0);
  });

  test('Bardolino esenta comunque sotto i 28.000 € di imponibile',()=>{
    const b=cat('Bardolino');
    assert.equal(comunale('30000',b),0);
    assert.ok(comunale('35000',b)>0);
  });
});


test.describe('le soglie locali che dipendono dai figli dichiarati',()=>{
  const figli=n=>Array.from({length:n},(_,i)=>figlio(10+i));
  const local=(comune,nucleo)=>M.soglie({comune,nucleo}).filter(s=>s.ambito!=='nazionale');

  /* La soglia di Bardolino non è un numero della delibera: è quel numero
     più i figli dichiarati. Con tre figli il salto si sposta da 28.000 a
     35.000 — e quello a 28.000 sparisce, perché sotto i 35.000 non si
     paga comunque e un salto che non c'è non va raccontato. */
  test('l\'esenzione per figli sposta il salto comunale',()=>{
    const b=cat('Bardolino');
    assert.deepEqual(local(b,[]).map(s=>s.imponibile),[28000]);
    assert.deepEqual(local(b,figli(3)).map(s=>s.imponibile),[35000]);
    assert.deepEqual(local(b,figli(4)).map(s=>s.imponibile),[45000]);
    assert.match(local(b,figli(3))[0].causa,/esenzione per figli a carico.*Bardolino/);
  });

  test('l\'aliquota agevolata delle Marche è un salto solo se spetta',()=>{
    const a=cat('Ancona');
    assert.deepEqual(local(a,[]),[]);
    assert.deepEqual(local(a,[figlio(10)]),[]);
    const con=local(a,[figlio(10,{disabilita:true})]);
    assert.deepEqual(con.map(s=>s.imponibile),[50000]);
    assert.match(con[0].causa,/aliquota agevolata per la famiglia.*Marche/);
  });
});
