const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('./motore.js');
const G=require('./geografia.js');

const euro=x=>M.toNumber(M.calcolaAddizionale(M.dec(String(x)),true,arguments[1]));
const imposta=(base,regola)=>M.toNumber(M.calcolaAddizionale(M.dec(String(base)),true,regola));

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
