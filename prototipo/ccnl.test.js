const test=require('node:test');
const assert=require('node:assert/strict');
const {VERSIONE_CATALOGO,CCNL,trovaCcnl,suggerisciMensilita,statoMensilita,
  preferenzaDaUrl}=require('./ccnl.js');
const MENSILITA_AMMESSE=[12,13,14,15,16];

test.describe('catalogo CCNL',()=>{
  test('identifica precisamente i tre contratti e le loro fonti',()=>{
    assert.equal(VERSIONE_CATALOGO,'2026-09-01');
    assert.deepEqual(CCNL.map(({id,codiceCnel,mensilita})=>({id,codiceCnel,mensilita})),[
      {id:'terziario-confcommercio-h011',codiceCnel:'H011',mensilita:14},
      {id:'metalmeccanica-industria-c011',codiceCnel:'C011',mensilita:13},
      {id:'funzioni-centrali',codiceCnel:null,mensilita:13},
    ]);
    for(const contratto of CCNL){
      assert.ok(contratto.nome);
      assert.ok(contratto.parti);
      assert.match(contratto.dataRiferimento,/^\d{4}-\d{2}-\d{2}$/);
      assert.match(contratto.fonte.url,/^https:\/\//);
      assert.ok(contratto.fonte.titolo);
    }
  });

  test('selezionare un CCNL propone le sue mensilita; nessuna selezione conserva il valore',()=>{
    assert.equal(suggerisciMensilita('terziario-confcommercio-h011',13),14);
    assert.equal(suggerisciMensilita('metalmeccanica-industria-c011',14),13);
    assert.equal(suggerisciMensilita('',14),14);
    assert.throws(()=>suggerisciMensilita('inesistente',13),RangeError);
  });

  test('distingue il suggerimento contrattuale da un valore personalizzato',()=>{
    assert.deepEqual(statoMensilita('terziario-confcommercio-h011',14),
      {personalizzato:false,consigliate:14});
    assert.deepEqual(statoMensilita('terziario-confcommercio-h011',13),
      {personalizzato:true,consigliate:14});
    assert.deepEqual(statoMensilita('',13),
      {personalizzato:false,consigliate:null});
  });

  test('lookup e catalogo non sono modificabili dai consumatori',()=>{
    const commercio=trovaCcnl('terziario-confcommercio-h011');
    assert.ok(Object.isFrozen(CCNL));
    assert.ok(Object.isFrozen(commercio));
    assert.ok(Object.isFrozen(commercio.fonte));
  });

  test('nell URL le mensilita esplicite prevalgono sul suggerimento del CCNL',()=>{
    assert.deepEqual(preferenzaDaUrl('terziario-confcommercio-h011','13',13,MENSILITA_AMMESSE),
      {ccnl:'terziario-confcommercio-h011',mensilita:13});
    assert.deepEqual(preferenzaDaUrl('terziario-confcommercio-h011',null,13,MENSILITA_AMMESSE),
      {ccnl:'terziario-confcommercio-h011',mensilita:14});
    assert.deepEqual(preferenzaDaUrl('inesistente','14',13,MENSILITA_AMMESSE),
      {ccnl:'',mensilita:14});
    assert.deepEqual(preferenzaDaUrl('',null,13,MENSILITA_AMMESSE),{ccnl:'',mensilita:13});
  });
});
