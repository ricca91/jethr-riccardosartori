const test=require('node:test');
const assert=require('node:assert/strict');
const {calcola}=require('./motore.js');
const {componiRighe}=require('./righe.js');
const {FONTI}=require('./fonti.js');

const riga=(ral,id)=>componiRighe(calcola(ral).voci).find(r=>r.id===id);

test.describe('adapter Voce → Riga',()=>{
  test('restituisce una Riga per ogni Voce, nello stesso ordine',()=>{
    for(const ral of ['0','9001.12','20000','35000','60000','200000']){
      const voci=calcola(ral).voci,righe=componiRighe(voci);
      assert.equal(righe.length,voci.length);
      assert.deepEqual(righe.map(r=>r.id),voci.map(v=>v.id));
      for(const r of righe){
        assert.ok(r.titolo.length>0,`${ral} · ${r.id}: titolo`);
        assert.ok(r.formula.length>0,`${ral} · ${r.id}: formula`);
        assert.ok(r.fonte.titolo.length>0,`${ral} · ${r.id}: fonte`);
        assert.match(r.fonte.url,/^https:\/\//,`${ral} · ${r.id}: URL`);
      }
    }
  });

  test('copre ogni Voce e ogni fonte emesse dal Motore',()=>{
    const id=new Set(),fonti=new Set();
    for(let ral=0;ral<=200000;ral+=100){
      const voci=calcola(String(ral)).voci;
      assert.doesNotThrow(()=>componiRighe(voci),`RAL ${ral}`);
      for(const voce of voci){id.add(voce.id);fonti.add(voce.fonte);}
    }
    assert.deepEqual([...id].sort(),['addcom','addreg','detrlav','detrult','ecc','ivs','lorda','somma','ti']);
    assert.deepEqual([...fonti].sort(),Object.keys(FONTI).sort());
  });

  test('compone le formule rappresentative dai soli fatti della Voce',()=>{
    assert.equal(riga('35000','ivs').formula,'35.000,00 × 9,19%');
    assert.equal(riga('35000','lorda').formula,
      '23% × min(31.783,50; 28.000) + 33% sulla quota 28–50k + 43% oltre');
    assert.equal(riga('35000','detrlav').titolo,'Detrazione lavoro dipendente (+65 €)');
    assert.equal(riga('35000','detrlav').formula,
      '1.910 × 0.8280  (rapporto troncato a 4 decimali)  +65 (imponibile 25–35k)');
    assert.equal(riga('25327.62','addcom').formula,
      "23.000,01 × 0,8% (sull'intero imponibile)");
  });

  test('spiega la Capienza come fatto trasversale alle Voce',()=>{
    const r=riga('0','detrlav');
    assert.match(r.formula,/spettante 1\.955,00 €/);
    assert.match(r.formula,/capienza: usata 0,00 €/);
  });

  test('non muta le Voce',()=>{
    const voci=calcola('35000').voci,prima=structuredClone(voci);
    componiRighe(voci);
    assert.deepEqual(voci,prima);
  });

  test('fallisce atomicamente sugli input che violano la seam',()=>{
    const ivs=calcola('35000').voci.find(v=>v.id==='ivs');
    assert.throws(()=>componiRighe(null),/devono essere un array/);
    assert.throws(()=>componiRighe([ivs,ivs]),/Voce duplicata: ivs/);
    assert.throws(()=>componiRighe([{...ivs,id:'nuova'}]),/Voce sconosciuta: nuova/);
    assert.throws(()=>componiRighe([{...ivs,fonte:'ignota'}]),/Fonte sconosciuta: ignota/);
    const {aliquota,...incompleta}=ivs;
    assert.throws(()=>componiRighe([incompleta]),/Voce ivs: fatto mancante aliquota/);
  });
});
