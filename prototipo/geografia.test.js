const test=require('node:test');
const assert=require('node:assert/strict');
const G=require('./geografia.js');

const alfabetico=xs=>xs.map(x=>x.nome);
const ordinato=nomi=>[...nomi].sort(new Intl.Collator('it',{sensitivity:'base'}).compare);

test.describe('geografia nazionale normalizzata',()=>{
  test('espone 21 giurisdizioni, 110 raggruppamenti e 7.894 comuni attivi',()=>{
    assert.equal(G.regioni().length,21);
    assert.equal(G.province().length,110);
    assert.equal(G.comuni().length,7894);
    assert.equal(new Set(G.comuni().map(c=>c.catastale)).size,7894);
  });

  test('risolve il default Lombardia → Milano senza conoscenze nei chiamanti',()=>{
    const milano=G.risolvi('F205');
    assert.deepEqual({regione:milano.regione.nome,provincia:milano.provincia.nome,
      comune:milano.comune.nome},
    {regione:'Lombardia',provincia:'Milano',comune:'Milano'});
    assert.equal(milano.comunale.aliquota,0.008);
    assert.equal(milano.comunale.esenzioneFinoA,23000);
  });

  test('ogni comune ha gerarchia, regole e fonti complete',()=>{
    for(const comune of G.comuni()){
      const x=G.risolvi(comune.catastale);
      assert.ok(x.regione&&x.provincia&&x.comunale,comune.catastale);
      for(const regola of [x.regionale,x.comunale]){
        assert.ok(regola.tipo,`${comune.catastale}: tipo`);
        assert.ok(regola.fonte.url,`${comune.catastale}: fonte`);
        assert.ok(regola.fonte.annoOrigine,`${comune.catastale}: anno`);
        assert.ok(regola.fonte.asOf,`${comune.catastale}: asOf`);
        assert.match(regola.fonte.stato,/^(definitivo|provvisorio)$/);
        if(regola.tipo==='aliquotaUnica')assert.ok(Number.isFinite(regola.aliquota));
        if(regola.tipo==='scaglioni'){
          assert.equal(regola.scaglioni.at(-1)[0],null,`${comune.catastale}: ultimo scaglione`);
          const tetti=regola.scaglioni.slice(0,-1).map(([t])=>t);
          assert.ok(tetti.every((t,i)=>Number.isFinite(t)&&(!i||t>tetti[i-1])),
            `${comune.catastale}: soglie ordinate`);
          assert.ok(regola.scaglioni.every(([,a])=>Number.isFinite(a)&&a>=0),
            `${comune.catastale}: aliquote valide`);
        }
      }
    }
  });

  test('filtra in modo dipendente regione → provincia → comune',()=>{
    const lombardia=G.regioni().find(r=>r.nome==='Lombardia');
    const milano=G.province(lombardia.id).find(p=>p.nome==='Milano');
    assert.ok(G.comuni(milano.id).some(c=>c.nome==='Milano'));
    assert.ok(G.comuni(milano.id).every(c=>c.provincia===milano.id));
  });

  test('restituisce regioni, province e comuni in ordine alfabetico italiano',()=>{
    assert.deepEqual(alfabetico(G.regioni()),ordinato(alfabetico(G.regioni())));
    assert.deepEqual(alfabetico(G.province()),ordinato(alfabetico(G.province())));
    assert.deepEqual(alfabetico(G.comuni()),ordinato(alfabetico(G.comuni())));
  });

  test('fallisce su un codice non appartenente allo snapshot',()=>{
    assert.throws(()=>G.risolvi('XXXX'),/Comune non attivo/);
  });
});
