const test=require('node:test');
const assert=require('node:assert/strict');
const {calcola}=require('./motore.js');
const {componiRighe}=require('./righe.js');
const {FONTI}=require('./fonti.js');

const riga=(ral,id)=>componiRighe(calcola(ral).voci).find(r=>r.id===id);
const righeDi=(ral,nucleo)=>componiRighe(calcola(ral,{nucleo}).voci).filter(r=>/^detrfam/.test(r.id));
const NUCLEO=[{tipo:'coniuge'},{tipo:'figlio',eta:22},{tipo:'ascendente'}];

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
    /* I carichi di famiglia non compaiono senza nucleo dichiarato:
       è la condizione perché la pagina di oggi resti quella di ieri.
       Le loro fonti si esercitano qui sotto, con un nucleo. */
    for(const voce of calcola('35000',{nucleo:NUCLEO}).voci)fonti.add(voce.fonte);
    const statiche=[...fonti].filter(f=>typeof f==='string');
    assert.deepEqual(statiche.sort(),Object.keys(FONTI).filter(k=>!['lomb','mi'].includes(k)).sort());
    assert.ok([...fonti].some(f=>f.tipo==='regionale'));
    assert.ok([...fonti].some(f=>f.tipo==='comunale'));
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

/* ============================================================
   Le Riga dei carichi di famiglia. Una voce per persona: la
   scelta è del prototipo di #35, e da qui in poi è un contratto.
   ============================================================ */
test.describe('carichi di famiglia — dalla Voce alla Riga',()=>{

  test('intitola ogni familiare per quello che è, e i figli con l\'età',()=>{
    assert.deepEqual(righeDi('35000',NUCLEO).map(r=>r.titolo),[
      'Detrazione per coniuge a carico',
      'Detrazione per figlio a carico (22 anni)',
      'Detrazione per ascendente convivente a carico']);
    assert.equal(righeDi('35000',[{tipo:'figlio'}])[0].titolo,
      'Detrazione per figlio a carico (età non indicata)');
  });

  /* La quota fissa dell'art. 12 con lo scalino della lett. b, che è
     l'unico punto in cui la detrazione risale invece di scendere. */
  test('coniuge: mostra la quota fissa e lo scalino della lettera b',()=>{
    assert.equal(righeDi('35000',[{tipo:'coniuge'}])[0].formula,
      '690 (imponibile fra 15.000 e 40.000 €)  +20 (scalino 29.200–34.700 €)\n'+
      'a carico: reddito proprio 0,00 € entro il limite di 2.840,51 €');
  });

  test('coniuge: mostra il primo rapporto con i suoi termini',()=>{
    assert.match(righeDi('12000',[{tipo:'coniuge'}])[0].formula,
      /^800 − 110 × 0\.7264  \(rapporto troncato a 4 decimali\)/);
  });

  /* «La soglia dei figli cresciuta di 15.000 € per ogni figlio dopo
     il primo va vista, non subita»: sta scritta nella formula. */
  test('figli: la soglia cresciuta oltre il primo si legge nella formula',()=>{
    assert.equal(righeDi('35000',[{tipo:'figlio',eta:22}])[0].formula,
      '950 × 0.6654  (rapporto troncato a 4 decimali)\n'+
      'soglia 95.000 €, un solo figlio che dà diritto alla detrazione\n'+
      'a carico: reddito proprio 0,00 € entro il limite di 4.000 €');
    assert.match(righeDi('35000',[{tipo:'figlio',eta:22},{tipo:'figlio',eta:25}])[0].formula,
      /soglia 95\.000 \+ 15\.000 × 1 figlio oltre il primo = 110\.000 €/);
  });

  test('ascendenti: dice che sono i soli conviventi',()=>{
    assert.match(righeDi('35000',[{tipo:'ascendente'}])[0].formula,
      /^750 × 0\.6027  \(rapporto troncato a 4 decimali\)\nsoglia 80\.000 €, solo ascendenti conviventi/);
  });

  /* Ogni esito del motore ha la sua frase: il codice esce dal
     motore, la frase la scrive qui la Riga. */
  test('dice perché una detrazione non spetta, un motivo alla volta',()=>{
    const formula=nucleo=>righeDi('35000',nucleo)[0].formula;
    assert.equal(formula([{tipo:'figlio',eta:17}]),
      '0 — sotto i 21 anni la detrazione è assorbita dall’Assegno Unico');
    assert.equal(formula([{tipo:'figlio',eta:30}]),
      '0 — dai 30 anni compiuti la detrazione non spetta più');
    assert.equal(formula([{tipo:'figlio',eta:22,reddito:'5000'}]),
      '0 — non a carico: reddito proprio 5.000,00 €, oltre il limite di 4.000 €');
    assert.equal(formula([{tipo:'coniuge',reddito:'3000'}]),
      '0 — non a carico: reddito proprio 3.000,00 €, oltre il limite di 2.840,51 €');
  });

  /* Il fatto mancante: l'età non c'è, e la Riga lo dice invece di
     far finta che il figlio non dia diritto. */
  test('la voce con il fatto mancante racconta che manca',()=>{
    assert.equal(righeDi('35000',[{tipo:'figlio'}])[0].formula,
      '0 — manca l’età: è l’età che decide se la detrazione spetta');
  });

  test('a reddito fuori intervallo cita il comma 4',()=>{
    assert.equal(righeDi('0',[{tipo:'ascendente'}])[0].formula,
      '0 — il rapporto dell’art. 12 non è utile: il c. 4 esclude zero, i negativi e uno');
  });

  /* La capienza è un fatto trasversale: vale per le detrazioni di
     famiglia come per quelle da lavoro. */
  test('una detrazione di famiglia incapiente mostra l\'avviso',()=>{
    const r=righeDi('17000',NUCLEO)[0];
    assert.match(r.formula,/spettante 690,00 €/);
    assert.match(r.formula,/capienza: usata .* € — le detrazioni non sono rimborsabili/);
  });

  /* La colonna «perché» della pagina ha bisogno di una frase corta.
     Nasce qui come le altre: la Riga è l'unico posto che parla. */
  test('ogni Riga porta una nota, anche vuota',()=>{
    for(const r of componiRighe(calcola('35000',{nucleo:NUCLEO}).voci))
      assert.equal(typeof r.nota,'string',`${r.id}: nota`);
    assert.equal(riga('35000','ivs').nota,'');
  });

  test('la nota dice in poche parole perché la detrazione spetta o no',()=>{
    const note=nucleo=>righeDi('35000',nucleo).map(r=>r.nota);
    assert.deepEqual(note([{tipo:'figlio',eta:22}]),['21–29 anni, a carico entro 4.000 €']);
    assert.deepEqual(note([{tipo:'figlio',eta:17}]),['sotto i 21 anni: Assegno Unico, non detrazione']);
    assert.deepEqual(note([{tipo:'figlio'}]),['manca l’età']);
    assert.deepEqual(note([{tipo:'figlio',eta:31}]),['30 anni compiuti: non spetta più']);
    assert.deepEqual(note([{tipo:'coniuge',reddito:'9000'}]),['non a carico: oltre 2.840,51 €']);
    assert.deepEqual(note([{tipo:'ascendente'}]),['convivente, a carico entro 2.840,51 €']);
    assert.deepEqual(note([{tipo:'coniuge'}]),['a carico entro 2.840,51 €']);
  });

  test('ogni familiare rimanda alla sua lettera dell\'art. 12',()=>{
    assert.deepEqual(righeDi('35000',NUCLEO).map(r=>r.fonte.titolo),[
      'TUIR, art. 12 c. 1 lett. a','TUIR, art. 12 c. 1 lett. c','TUIR, art. 12 c. 1 lett. d']);
  });

  test('una voce di famiglia senza i suoi fatti fallisce come le altre',()=>{
    const voci=calcola('35000',{nucleo:[{tipo:'coniuge'}]}).voci;
    const {esito,...senzaEsito}=voci.find(v=>v.id==='detrfam1');
    assert.throws(()=>componiRighe([senzaEsito]),/Voce detrfam1: fatto mancante esito/);
  });
});
