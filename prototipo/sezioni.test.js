const test=require('node:test');
const assert=require('node:assert/strict');
const {riepilogoNucleo,riepilogoPacchetto,sezioniAperte}=require('./sezioni.js');

const vuoto={nucleo:[],welfareRaw:'',fringeRaw:'',
  buoniTipo:'elettronici',buoniValoreRaw:'',buoniNumeroRaw:''};
const con=(patch)=>({...vuoto,...patch});
const figlio=(eta)=>({tipo:'figlio',eta,disabilita:false,reddito:0});

test.describe('riepilogo del nucleo familiare',()=>{
  test('senza familiari lo dice, invece di restare muto',()=>{
    assert.deepEqual(riepilogoNucleo(vuoto),['Nessun familiare']);
  });
  test('conta al singolare e al plurale quando il tipo e uno solo',()=>{
    assert.deepEqual(riepilogoNucleo(con({nucleo:[figlio(22)]})),['1 figlio']);
    assert.deepEqual(riepilogoNucleo(con({nucleo:[figlio(22),figlio(25)]})),['2 figli']);
    assert.deepEqual(riepilogoNucleo(con({nucleo:[{tipo:'coniuge'}]})),['1 coniuge']);
    assert.deepEqual(riepilogoNucleo(con({nucleo:[{tipo:'ascendente'},{tipo:'ascendente'}]})),
      ['2 ascendenti']);
  });
  test('con tipi diversi usa il termine generico',()=>{
    assert.deepEqual(riepilogoNucleo(con({nucleo:[figlio(22),{tipo:'coniuge'}]})),
      ['2 familiari']);
  });
  test('la detrazione compare solo quando è quella dell’ultimo calcolo',()=>{
    const stato=con({nucleo:[figlio(22)]});
    assert.deepEqual(riepilogoNucleo(stato),['1 figlio']);
    assert.deepEqual(riepilogoNucleo({...stato,detrazione:null}),['1 figlio']);
    assert.deepEqual(riepilogoNucleo({...stato,detrazione:950}),
      ['1 figlio','Detrazione 950,00 €']);
  });
  test('una detrazione azzerata è un’informazione, non un vuoto',()=>{
    assert.deepEqual(riepilogoNucleo(con({nucleo:[figlio(12)],detrazione:0})),
      ['1 figlio','Detrazione 0,00 €']);
  });
  test('senza familiari la detrazione non viene mai mostrata',()=>{
    assert.deepEqual(riepilogoNucleo({...vuoto,detrazione:0}),['Nessun familiare']);
  });
});

test.describe('riepilogo del pacchetto retributivo',()=>{
  test('un pacchetto vuoto lo dichiara',()=>{
    assert.deepEqual(riepilogoPacchetto(vuoto),['Non configurato']);
  });
  test('elenca gli elementi presenti senza sommarli',()=>{
    assert.deepEqual(riepilogoPacchetto(con({welfareRaw:'1.000'})),['Welfare']);
    assert.deepEqual(riepilogoPacchetto(con({welfareRaw:'1.000',fringeRaw:'600'})),
      ['Welfare + fringe']);
    assert.deepEqual(riepilogoPacchetto(con({welfareRaw:'1.000',fringeRaw:'600',
      buoniValoreRaw:'8',buoniNumeroRaw:'220'})),['Welfare + fringe + buoni pasto']);
  });
  test('i buoni contano anche se è compilato un solo campo',()=>{
    assert.deepEqual(riepilogoPacchetto(con({buoniValoreRaw:'8'})),['Buoni pasto']);
    assert.deepEqual(riepilogoPacchetto(con({buoniNumeroRaw:'220'})),['Buoni pasto']);
  });
  test('scegliere i cartacei è già una configurazione',()=>{
    assert.deepEqual(riepilogoPacchetto(con({buoniTipo:'cartacei'})),['Buoni pasto']);
  });
  test('zeri e testo non validi non configurano niente',()=>{
    assert.deepEqual(riepilogoPacchetto(con({welfareRaw:'0',fringeRaw:'0,00',
      buoniValoreRaw:'0',buoniNumeroRaw:'0'})),['Non configurato']);
    assert.deepEqual(riepilogoPacchetto(con({welfareRaw:'abc'})),['Non configurato']);
    assert.deepEqual(riepilogoPacchetto(con({welfareRaw:'   '})),['Non configurato']);
  });
  test('accetta le forme che l’utente scrive davvero',()=>{
    assert.deepEqual(riepilogoPacchetto(con({welfareRaw:'1.000,50'})),['Welfare']);
    assert.deepEqual(riepilogoPacchetto(con({welfareRaw:' 1 000 € '})),['Welfare']);
  });
});

test.describe('quali sezioni partono aperte',()=>{
  test('un modulo vuoto le tiene entrambe chiuse',()=>{
    assert.deepEqual(sezioniAperte(vuoto),{nucleo:false,pacchetto:false});
  });
  test('i dati arrivati dall’URL aprono la sezione che li contiene',()=>{
    assert.deepEqual(sezioniAperte(con({nucleo:[figlio(22)]})),
      {nucleo:true,pacchetto:false});
    assert.deepEqual(sezioniAperte(con({welfareRaw:'1.000'})),
      {nucleo:false,pacchetto:true});
    assert.deepEqual(sezioniAperte(con({fringeRaw:'600'})),
      {nucleo:false,pacchetto:true});
    assert.deepEqual(sezioniAperte(con({buoniTipo:'cartacei'})),
      {nucleo:false,pacchetto:true});
    assert.deepEqual(sezioniAperte(con({buoniValoreRaw:'8'})),
      {nucleo:false,pacchetto:true});
    assert.deepEqual(sezioniAperte(con({buoniNumeroRaw:'220'})),
      {nucleo:false,pacchetto:true});
  });
  test('non tocca lo stato che riceve',()=>{
    const stato=con({nucleo:[figlio(22)],welfareRaw:'1.000'});
    const copia=JSON.parse(JSON.stringify(stato));
    sezioniAperte(stato);riepilogoNucleo(stato);riepilogoPacchetto(stato);
    assert.deepEqual(stato,copia);
  });
});
