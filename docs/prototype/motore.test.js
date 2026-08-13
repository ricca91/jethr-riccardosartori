/* ============================================================
   MATRICE DI PROVA — motore RAL → netto, regole-2026-v1
   node --test docs/prototype/

   Tre categorie, etichettate perché provano cose diverse:

   A — CORRETTEZZA.       Poche ancore, ciascuna verificata a mano
                          contro la norma. È l'unica categoria che
                          può dire "il numero è giusto".
   B — LIMITI.            Le discontinuità di legge e gli input
                          estremi: dove un motore sbagliato si rompe.
   C — NON-REGRESSIONE.   Rete larga. Dice "nessuno ha cambiato
                          niente", non "è giusto".

   Regola vincolante: i valori attesi si rigenerano dal motore, non
   si ricopiano dai ticket a monte. I ticket #2, #3 e #4 citano numeri
   nati da una convenzione di arrotondamento diversa da quella che il
   contratto impone (troncamento a 4 decimali sui rapporti dell'art. 13,
   netto = somma delle voci arrotondate). Il valore canonico a
   RAL 35.000 è 26.032,17.
   ============================================================ */

const test=require('node:test');
const assert=require('node:assert/strict');
const {calcola,applicaMensilita,parseRal,soglie,SALTI}=require('./motore.js');

const netto=r=>calcola(r,13).kpi.nettoAnnuo;
const voce=(res,id)=>res.voci.find(v=>v.id===id);
const importo=(res,id)=>{const v=voce(res,id);return v?v.importo:0;};
const c2=n=>Math.round(n*100)/100;


/* ============================================================
   A — CORRETTEZZA
   ============================================================ */
test.describe('A — correttezza (verificata a mano contro la norma)',()=>{

  /* Derivazione a mano, RAL 35.000, Milano, regole 2026:
       contributi IVS   35.000,00 × 9,19%                    =  3.216,50
       imponibile       35.000,00 − 3.216,50                 = 31.783,50
       IRPEF lorda      28.000 × 23%              = 6.440,00
                        3.783,50 × 33%            = 1.248,555
                                                             =  7.688,56  (arrot. HALF_UP)
       detrazione art.13  rapporto (50.000 − 31.783,50) ÷ 22.000
                          = 0,828022…  TRONCATO a 4 decimali = 0,8280
                          1.910 × 0,8280           = 1.581,48
                          + 65 (imponibile 25–35k)           =  1.646,48
       ulteriore detr.  1.000,00 (imponibile 20–32k)         =  1.000,00
       add. regionale   15.000×1,23% + 13.000×1,58% + 3.783,50×1,72%
                        = 184,50 + 205,40 + 65,0762          =    454,98
       add. comunale    31.783,50 × 0,8%                     =    254,27
       netto = 35.000 − 3.216,50 − 7.688,56 + 1.646,48 + 1.000 − 454,98 − 254,27
             = 26.032,17
     Fonti: INPS circ. 101/2024 · L. 199/2025 art. 1 c. 3 · TUIR art. 13 ·
            L. 207/2024 art. 1 c. 6 · Regione Lombardia · Comune di Milano */
  test('RAL 35.000 — la catena voce per voce',()=>{
    const r=calcola('35000',13);
    assert.equal(r.imponibile,31783.50);
    assert.equal(importo(r,'ivs'),-3216.50);
    assert.equal(importo(r,'lorda'),-7688.56);
    assert.equal(importo(r,'detrlav'),1646.48);
    assert.equal(importo(r,'detrult'),1000);
    assert.equal(importo(r,'addreg'),-454.98);
    assert.equal(importo(r,'addcom'),-254.27);
    assert.equal(r.kpi.nettoAnnuo,26032.17);
  });

  /* Il troncamento a 4 decimali del rapporto dell'art. 13 non è cosmetico:
     a precisione piena la detrazione sarebbe 1.581,52 e il netto 26.032,21.
     È la differenza fra il valore canonico e i numeri citati nei ticket. */
  test('RAL 35.000 — il rapporto dell\'art. 13 è troncato, non arrotondato',()=>{
    const r=calcola('35000',13);
    assert.equal(c2(importo(r,'detrlav')-65),1581.48);
    assert.notEqual(c2(importo(r,'detrlav')-65),1581.52);
  });

  /* L'esenzione dell'addizionale comunale di Milano vale fino a 23.000 € di
     imponibile. È un'esenzione, non una franchigia: superata la soglia si
     paga lo 0,8% sull'intero imponibile, non sull'eccedenza. Un centesimo
     lordo in più costa quindi ~184 € netti. È legge, non un bug. */
  test('RAL 25.327,61 → ,62 — l\'esenzione comunale è secca, non una franchigia',()=>{
    const sotto=calcola('25327.61',13),sopra=calcola('25327.62',13);
    assert.equal(sotto.imponibile,23000.00);
    assert.equal(sopra.imponibile,23000.01);
    assert.equal(importo(sotto,'addcom'),0);
    assert.equal(importo(sopra,'addcom'),-184.00);   // 23.000,01 × 0,8%
    assert.equal(c2(sopra.kpi.nettoAnnuo-sotto.kpi.nettoAnnuo),-183.99);
  });

  /* Massimale contributivo 2026: 122.295 €. Sopra si fermano entrambi i
     contributi, il 9,19% e l'1% sull'eccedenza oltre 56.224 €, perché la
     base è la stessa. Da qui la contribuzione regressiva. */
  test('RAL 122.295 e oltre — i contributi si fermano al massimale',()=>{
    const tetto=calcola('122295',13);
    // 122.295 × 9,19% = 11.238,91  +  (122.295 − 56.224) × 1% = 660,71
    assert.equal(tetto.kpi.totaleContributi,11899.62);
    for(const ral of ['122295.01','200000','1000000'])
      assert.equal(calcola(ral,13).kpi.totaleContributi,11899.62);
    assert.equal(c2(tetto.aliquotaContributivaEffettiva),9.73);
    assert.equal(c2(calcola('200000',13).aliquotaContributivaEffettiva),5.95);
    assert.equal(c2(calcola('1000000',13).aliquotaContributivaEffettiva),1.19);
  });

  /* Capienza: le detrazioni abbattono l'imposta, non sono rimborsabili.
     Sommando le voci senza questo vincolo, a RAL 0 il netto risulterebbe
     1.955 € — l'intera detrazione da lavoro dipendente pagata a chi non ha
     imposta da abbattere. Il caso è il test più economico dell'intera classe. */
  test('RAL 0 → netto 0 (capienza)',()=>{
    assert.equal(calcola('0',13).kpi.nettoAnnuo,0);
  });

  test('fascia bassa — nessuna detrazione supera l\'IRPEF lorda',()=>{
    for(let ral=0;ral<=20000;ral+=250){
      const r=calcola(String(ral),13);
      const lorda=-importo(r,'lorda');
      const detr=importo(r,'detrlav')+importo(r,'detrult');
      assert.ok(detr<=lorda+1e-9,`RAL ${ral}: detrazioni ${detr} > IRPEF lorda ${lorda}`);
    }
  });
});


/* ============================================================
   B — COMPORTAMENTO AI LIMITI
   ============================================================ */

/* Le sette soglie, localizzate al centesimo per scansione sul motore
   (non dedotte a mano, non copiate da #4: sei su sette cadono uno o due
   centesimi più in alto di quanto scritto lì).
   Per ognuna: il salto atteso, e una verifica STRUTTURALE della causa —
   quale voce compare o sparisce. La verifica strutturale è la parte che
   un motore sbagliato ma internamente coerente non può superare. */
const SOGLIE_ATTESE=[
  {ral:'9001.12', delta:1200.01,
   causa:'si attiva il trattamento integrativo',
   sotto:r=>assert.equal(voce(r,'ti'),undefined),
   sopra:r=>assert.equal(importo(r,'ti'),1200)},
  {ral:'9360.21', delta:-257.54,
   causa:'scattano le addizionali e la somma non imponibile passa dal 7,1% al 5,3%',
   sotto:r=>{assert.equal(importo(r,'addreg'),0);assert.match(voce(r,'somma').formula,/7,1%/);},
   sopra:r=>{assert.ok(importo(r,'addreg')<0);assert.match(voce(r,'somma').formula,/5,3%/);}},
  {ral:'16518.02', delta:-130.11,
   causa:'decade il trattamento integrativo (imponibile 15.000 €)',
   sotto:r=>assert.equal(importo(r,'ti'),1200),
   sopra:r=>assert.equal(voce(r,'ti'),undefined)},
  {ral:'22024.02', delta:40.01,
   causa:'la somma non imponibile lascia il posto all\'ulteriore detrazione (imponibile 20.000 €)',
   sotto:r=>{assert.ok(importo(r,'somma')>0);assert.equal(voce(r,'detrult'),undefined);},
   sopra:r=>{assert.equal(voce(r,'somma'),undefined);assert.equal(importo(r,'detrult'),1000);}},
  {ral:'25327.62', delta:-183.99,
   causa:'finisce l\'esenzione dell\'addizionale comunale di Milano (imponibile 23.000 €)',
   sotto:r=>assert.equal(importo(r,'addcom'),0),
   sopra:r=>assert.ok(importo(r,'addcom')<0)},
  {ral:'27530.02', delta:65.01,
   causa:'si attiva la maggiorazione di 65 € (imponibile 25.000 €)',
   sotto:r=>assert.doesNotMatch(voce(r,'detrlav').et,/\+65/),
   sopra:r=>assert.match(voce(r,'detrlav').et,/\+65 €/)},
  {ral:'38542.02', delta:-64.99,
   causa:'decade la maggiorazione di 65 € (imponibile 35.000 €)',
   sotto:r=>assert.match(voce(r,'detrlav').et,/\+65 €/),
   sopra:r=>assert.doesNotMatch(voce(r,'detrlav').et,/\+65/)},
];

/* Netto continuo, derivata discontinua: qui il netto NON salta, cambia il
   ritmo con cui cresce. Un salto in questi punti sarebbe un bug. */
const PENDENZE=[
  {ral:30833.61, causa:'inizia lo scaglione IRPEF al 33%'},
  {ral:55060.02, causa:'inizia lo scaglione IRPEF al 43%'},
  {ral:56224,    causa:'si attiva il contributo aggiuntivo dell\'1%'},
  {ral:122295,   causa:'massimale contributivo: i contributi si fermano'},
];

test.describe('B — comportamento ai limiti',()=>{

  test.describe('i sette salti, a ±0,01 dalla soglia',()=>{
    for(const s of SOGLIE_ATTESE){
      test(`${s.ral} — ${s.causa}`,()=>{
        const sotto=calcola((Number(s.ral)-0.01).toFixed(2),13);
        const sopra=calcola(s.ral,13);
        const delta=c2(sopra.kpi.nettoAnnuo-sotto.kpi.nettoAnnuo);
        assert.equal(Math.sign(delta),Math.sign(s.delta),'il segno del salto');
        assert.ok(Math.abs(delta-s.delta)<=0.01,
          `salto ${delta} atteso ${s.delta} (tolleranza 0,01)`);
        s.sotto(sotto);   // la causa, non solo l'effetto
        s.sopra(sopra);
      });
    }

    test('la tabella delle soglie del motore concorda con la matrice',()=>{
      assert.equal(soglie().length,SOGLIE_ATTESE.length);
      assert.deepEqual(SALTI.map(([r])=>r),SOGLIE_ATTESE.map(s=>s.ral));
      for(const s of soglie()){
        const atteso=SOGLIE_ATTESE.find(x=>Number(x.ral)===s.ral);
        assert.ok(atteso,`soglia non prevista: ${s.ral}`);
        assert.ok(Math.abs(s.delta-atteso.delta)<=0.01);
      }
    });
  });

  test.describe('i quattro cambi di pendenza',()=>{
    for(const p of PENDENZE){
      test(`${p.ral} — ${p.causa}`,()=>{
        const n=x=>netto(x.toFixed(2));
        const sotto=n(p.ral-0.01),sopra=n(p.ral);
        assert.ok(Math.abs(c2(sopra-sotto))<=0.01,
          `il netto deve restare continuo qui: ${sotto} → ${sopra}`);
        const prima=(sotto-n(p.ral-100.01))/100;
        const dopo=(n(p.ral+99.99)-sotto)/100;
        assert.ok(Math.abs(dopo-prima)>0.004,
          `la pendenza deve cambiare: ${prima.toFixed(4)} → ${dopo.toFixed(4)}`);
      });
    }
  });

  test.describe('input ai limiti',()=>{
    test('campo vuoto → nessun risultato, non zero',()=>{
      assert.equal(parseRal(''),null);
      assert.equal(parseRal('   '),null);
    });
    test('zero → calcola',()=>{assert.equal(parseRal('0'),'0');});
    test('negativo → bloccato',()=>{
      for(const v of ['-1','-35000',' -0,5'])assert.equal(parseRal(v),'-1');
    });
    test('non numerico → bloccato',()=>{
      for(const v of ['abc','35k','1,2,3','3.5.7'])assert.ok(Number.isNaN(parseRal(v)));
    });
    /* Il simbolo di valuta viene tolto prima di leggere: '€' da solo è un
       campo vuoto, non un input non numerico. Sono due messaggi diversi. */
    test('il simbolo € da solo vale campo vuoto',()=>{
      assert.equal(parseRal('€'),null);
    });
    test('decimali con virgola e con punto sono equivalenti',()=>{
      assert.equal(parseRal('35.000,50'),'35000.50');
      assert.equal(parseRal('35000.50'),'35000.50');
      assert.equal(parseRal('35.000'),'35000');
      assert.equal(parseRal('35 000 €'),'35000');
      assert.equal(calcola(parseRal('35.000,50'),13).kpi.nettoAnnuo,
                   calcola(parseRal('35000.50'),13).kpi.nettoAnnuo);
    });
    test('sette cifre → calcola, senza clamp silenzioso',()=>{
      const r=calcola('9999999',13);
      assert.equal(r.kpi.totaleContributi,11899.62);
      assert.ok(r.kpi.nettoAnnuo>0&&r.kpi.nettoAnnuo<9999999);
    });
  });
});


/* ============================================================
   C — NON-REGRESSIONE
   Questa categoria non prova la correttezza. Prova che nessuno ha
   cambiato niente: se il motore sbagliasse oggi, congelerebbe
   l'errore e ci metterebbe un test verde a guardia.
   ============================================================ */
test.describe('C — non-regressione',()=>{

  const PASSO=100,MAX=200000;
  const campioni=[];
  for(let ral=0;ral<=MAX;ral+=PASSO)campioni.push(calcola(String(ral),13));

  test(`riconciliazione su ${campioni.length} campioni (passo ${PASSO} €, 0–${MAX} €)`,()=>{
    for(const r of campioni){
      assert.ok(r.riconciliazione.verificata,`riconciliazione rotta a RAL ${r.input.ral}`);
      const somma=c2(r.voci.reduce((a,v)=>a+v.importo,r.input.ral));
      assert.equal(somma,r.kpi.nettoAnnuo,`la somma delle voci non torna a RAL ${r.input.ral}`);
    }
  });

  /* L'invariante di monotonicità nella forma che NON boccia il motore giusto.
     «Il netto cresce sempre» sarebbe falso: quattro dei sette salti vanno
     all'ingiù, e sono legge. La formulazione corretta è: il netto è continuo
     e crescente ovunque TRANNE nelle sette soglie note. */
  test('il netto cresce ovunque, tranne che nelle sette soglie note',()=>{
    const soglieRal=SOGLIE_ATTESE.map(s=>Number(s.ral));
    for(let i=1;i<campioni.length;i++){
      const a=campioni[i-1],b=campioni[i];
      const attraversa=soglieRal.some(s=>s>a.input.ral&&s<=b.input.ral);
      if(attraversa)continue;                       // coperto dalla categoria B
      const d=b.kpi.nettoAnnuo-a.kpi.nettoAnnuo;
      assert.ok(d>0,`netto non crescente fra ${a.input.ral} e ${b.input.ral}: ${d}`);
      assert.ok(d<=PASSO,`${PASSO} € lordi in più danno ${d} € netti in più a RAL ${b.input.ral}`);
    }
  });

  test('nessuna soglia sconosciuta: ogni discontinuità è nella matrice',()=>{
    const soglieRal=SOGLIE_ATTESE.map(s=>Number(s.ral));
    for(let i=1;i<campioni.length;i++){
      const a=campioni[i-1],b=campioni[i];
      if(soglieRal.some(s=>s>a.input.ral&&s<=b.input.ral))continue;
      // fuori dalle soglie note il netto marginale resta in una banda plausibile
      const marg=(b.kpi.nettoAnnuo-a.kpi.nettoAnnuo)/PASSO;
      assert.ok(marg>0.35&&marg<=1,
        `netto marginale anomalo fra ${a.input.ral} e ${b.input.ral}: ${marg.toFixed(4)}`);
    }
  });

  /* La tesi del contratto, resa verificabile: le mensilità sono presentazione.
     Se questo test diventasse rosso, la pagina direbbe il contrario di quello
     che afferma a schermo. */
  test('invariante 12/13 — cambia la rata, non l\'anno',()=>{
    for(const ral of ['0','12000','26000','35000','60000','150000']){
      const a13=calcola(ral,13),a12=calcola(ral,12);
      assert.equal(a12.kpi.nettoAnnuo,a13.kpi.nettoAnnuo);
      assert.equal(a12.kpi.totaleImposte,a13.kpi.totaleImposte);
      assert.equal(a12.kpi.totaleContributi,a13.kpi.totaleContributi);
      // applicare la mensilità senza ricalcolare dà lo stesso risultato
      const applicato=applicaMensilita(a13,12);
      assert.equal(applicato.kpi.nettoAnnuo,a13.kpi.nettoAnnuo);
      assert.equal(applicato.kpi.mediaMensile,a12.kpi.mediaMensile);
      assert.deepEqual(applicato.voci,a13.voci);
    }
  });

  test('la media è una media: 13 × rata non ricompone l\'anno',()=>{
    const r=calcola('35000',13);
    assert.equal(r.kpi.mediaMensile,2002.47);
    assert.notEqual(c2(r.kpi.mediaMensile*13),r.kpi.nettoAnnuo);
  });

  /* Golden: rigenerato dal motore, non copiato. Congela il comportamento
     attuale nei punti di riferimento. Non dice che sono giusti — lo dice
     la categoria A. */
  /* Il campo `fonte` di ogni voce e' una chiave che la pagina usa per pescare
     la citazione dalla tabella FONTI. Le due cose vivono in file diversi:
     rinominare una chiave qui rompe il pannello del dettaglio in silenzio.
     Questo test blocca l'insieme delle chiavi che il motore puo' emettere. */
  test('le chiavi delle fonti sono quelle che la pagina si aspetta',()=>{
    const attese=['inps101','inps6','l199','tuir13','l207c4','l207c6','dl3','lomb','mi'];
    const viste=new Set();
    for(let ral=0;ral<=200000;ral+=500)
      for(const v of calcola(String(ral),13).voci)viste.add(v.fonte);
    for(const k of viste)assert.ok(attese.includes(k),`fonte sconosciuta: ${k}`);
    assert.deepEqual([...viste].sort(),attese.filter(k=>viste.has(k)).sort());
  });

  test('golden — netto annuo nei punti di riferimento',()=>{
    const golden={
      '0':0,           '9000':8753.18,     '15000':14197.95,   '20000':17432.53,
      '25000':20569.65, '30000':23425.49,  '35000':26032.17,   '40000':27960.18,
      '50000':32567.65, '56224':35707.45,  '60000':37554.66,   '120000':66906.37,
      '122295':68029.07,'200000':110354.98,
    };
    for(const[ral,atteso]of Object.entries(golden))
      assert.equal(netto(ral),atteso,`RAL ${ral}`);
  });
});
