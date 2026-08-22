/* ============================================================
   MATRICE DI PROVA — motore RAL → netto, regole-2026-v1
   node --test prototipo/motore.test.js

   Tre categorie, etichettate perché provano cose diverse:

   A — CORRETTEZZA.       Poche ancore, ciascuna verificata a mano
                          contro la norma. È l'unica categoria che
                          può dire "il numero è giusto".
   B — LIMITI.            Le discontinuità di legge e gli input
                          estremi: dove un motore sbagliato si rompe.
   C — NON-REGRESSIONE.   Rete larga. Dice "nessuno ha cambiato
                          niente", non "è giusto".
   D — LE VOCI DA SOLE.   Ogni voce del contratto esercitata a un
                          imponibile scelto, con soli numeri, senza
                          passare da calcola(). È la categoria che
                          dice DOVE si è rotto, non solo CHE si è
                          rotto: A e B guardano il risultato finale,
                          qui si guarda una funzione alla volta.

   Regola vincolante: i valori attesi si rigenerano dal motore, non
   si ricopiano dai ticket a monte. I ticket #2, #3 e #4 citano numeri
   nati da una convenzione di arrotondamento diversa da quella che il
   contratto impone (troncamento a 4 decimali sui rapporti dell'art. 13,
   netto = somma delle voci arrotondate). Il valore canonico a
   RAL 35.000 è 26.032,17.
   ============================================================ */

const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('./motore.js');
const {calcola,applicaMensilita,parseRal,soglie,SALTI}=M;

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
   sotto:r=>{assert.equal(importo(r,'addreg'),0);assert.equal(voce(r,'somma').aliquota,0.071);},
   sopra:r=>{assert.ok(importo(r,'addreg')<0);assert.equal(voce(r,'somma').aliquota,0.053);}},
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
   sotto:r=>assert.equal(voce(r,'detrlav').maggiorazione,0),
   sopra:r=>assert.equal(voce(r,'detrlav').maggiorazione,65)},
  {ral:'38542.02', delta:-64.99,
   causa:'decade la maggiorazione di 65 € (imponibile 35.000 €)',
   sotto:r=>assert.equal(voce(r,'detrlav').maggiorazione,65),
   sopra:r=>assert.equal(voce(r,'detrlav').maggiorazione,0)},
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


/* ============================================================
   D — LE VOCI DA SOLE
   Ogni voce del contratto esercitata a un imponibile SCELTO, con
   soli numeri, senza passare da calcola(). Prima di #15 non si
   poteva: per esercitare l'art. 13 a 31.783,50 € bisognava
   trovare la RAL che quell'imponibile lo produce.

   Le funzioni parlano in decimale a virgola fissa, quindi i
   numeri entrano con dec() ed escono con toNumber(): sono le due
   sole parti di impalcatura che questa categoria tocca.
   ============================================================ */
const {dec,toNumber}=M;
const num=x=>c2(toNumber(x));

test.describe('D — le voci da sole',()=>{

  test.describe('contributi', ()=>{
    /* INPS circ. 101/2024: 9,19% sull\'imponibile previdenziale. */
    test('contributiIvs — 9,19%, e la base si ferma al massimale',()=>{
      assert.equal(num(M.contributiIvs(dec('35000')).importo),3216.50);
      assert.equal(num(M.contributiIvs(dec('122295')).base),122295);
      assert.equal(num(M.contributiIvs(dec('122295')).importo),11238.91);
      // 122.295 × 9,19% = 11.238,9105 — sopra il massimale non si muove più
      assert.equal(num(M.contributiIvs(dec('200000')).base),122295);
      assert.equal(num(M.contributiIvs(dec('1000000')).importo),11238.91);
    });

    /* INPS circ. 6/2026: 1% sulla quota oltre la prima fascia (56.224 €),
       sulla stessa base contributiva, quindi anch\'essa tagliata al massimale. */
    test('contributoAggiuntivo — 1% oltre 56.224, mai sotto',()=>{
      assert.equal(num(M.contributoAggiuntivo(dec('50000')).importo),0);
      assert.equal(num(M.contributoAggiuntivo(dec('56224')).eccedenza),0);
      assert.equal(num(M.contributoAggiuntivo(dec('60000')).eccedenza),3776);
      assert.equal(num(M.contributoAggiuntivo(dec('60000')).importo),37.76);
      // (122.295 − 56.224) × 1% = 660,71 — e lì resta
      assert.equal(num(M.contributoAggiuntivo(dec('200000')).importo),660.71);
    });

    test('imponibile — RAL meno i contributi, arrotondati voce per voce',()=>{
      assert.equal(num(M.imponibile(dec('35000'))),31783.50);
      assert.equal(num(M.imponibile(dec('0'))),0);
      // 200.000 − (11.238,91 + 660,71) = 188.100,38
      assert.equal(num(M.imponibile(dec('200000'))),188100.38);
    });
  });

  test.describe('IRPEF',()=>{
    /* Progressività: ogni aliquota vede solo la quota che le compete.
       Se `perScaglioni` applicasse l\'aliquota all\'intero imponibile,
       a 60.000 € darebbe 25.800 invece di 18.000. */
    test('irpefLorda — 23 / 33 / 43 per scaglioni, non sull\'intero',()=>{
      assert.equal(num(M.irpefLorda(dec('0'))),0);
      assert.equal(num(M.irpefLorda(dec('28000'))),6440);          // 28.000 × 23%
      assert.equal(num(M.irpefLorda(dec('31783.50'))),7688.56);    // 6.440 + 3.783,50 × 33%
      assert.equal(num(M.irpefLorda(dec('60000'))),18000);         // 6.440 + 7.260 + 4.300
      assert.notEqual(num(M.irpefLorda(dec('60000'))),25800);      // 60.000 × 43%
    });

    /* TUIR art. 13. Dice quanto SPETTA: la capienza è un altro passo. */
    test('detrazioneLavoroDipendente — le tre fasce',()=>{
      assert.equal(num(M.detrazioneLavoroDipendente(dec('10000')).spettante),1955);
      assert.equal(num(M.detrazioneLavoroDipendente(dec('15000')).spettante),1955);
      // rapporto (28.000 − 21.500) ÷ 13.000 = 0,5 → 1.910 + 1.190 × 0,5
      assert.equal(num(M.detrazioneLavoroDipendente(dec('21500')).rapporto),0.5);
      assert.equal(num(M.detrazioneLavoroDipendente(dec('21500')).spettante),2505);
      assert.equal(num(M.detrazioneLavoroDipendente(dec('50000')).spettante),0);
      assert.equal(M.detrazioneLavoroDipendente(dec('60000')).rapporto,null);
      assert.equal(num(M.detrazioneLavoroDipendente(dec('60000')).spettante),0);
    });

    /* Il troncamento a quattro decimali, esercitato dove nasce invece
       che sul netto finale: (50.000 − 31.783,50) ÷ 22.000 = 0,828022…
       Arrotondando si otterrebbe 0,8280 lo stesso; il caso che
       distingue è il valore pieno, che darebbe 1.581,52. */
    test('detrazioneLavoroDipendente — il rapporto si tronca a 4 decimali',()=>{
      const d=M.detrazioneLavoroDipendente(dec('31783.50'));
      assert.equal(toNumber(d.rapporto),0.828);
      assert.equal(c2(toNumber(d.spettante)-65),1581.48);
      assert.notEqual(c2(toNumber(d.spettante)-65),1581.52);
    });

    /* La maggiorazione è una finestra chiusa a destra e aperta a sinistra. */
    test('detrazioneLavoroDipendente — i 65 € stanno fra 25.000 e 35.000',()=>{
      const magg=i=>toNumber(M.detrazioneLavoroDipendente(dec(i)).maggiorazione);
      assert.equal(magg('25000'),0);
      assert.equal(magg('25000.01'),65);
      assert.equal(magg('35000'),65);
      assert.equal(magg('35000.01'),0);
    });

    /* La maggiorazione si somma all'art. 13 e resta distinguibile:
       il trattamento integrativo guarda `articolo13`, non il totale. */
    test('detrazioneLavoroDipendente — art. 13 e maggiorazione restano separati',()=>{
      for(const i of ['10000','21500','31783.50','60000']){
        const d=M.detrazioneLavoroDipendente(dec(i));
        assert.equal(d.spettante,d.articolo13+d.maggiorazione,`imponibile ${i}`);
      }
      assert.equal(num(M.detrazioneLavoroDipendente(dec('31783.50')).articolo13),1581.48);
    });

    /* L. 207/2024 c. 6: piena fra 20.000 e 32.000, poi si consuma
       linearmente fino a 40.000, dove vale zero. */
    test('ulterioreDetrazione — piena, poi decrescente, poi niente',()=>{
      const sp=i=>num(M.ulterioreDetrazione(dec(i)).spettante);
      assert.equal(sp('20000'),0);
      assert.equal(sp('20000.01'),1000);
      assert.equal(sp('32000'),1000);
      assert.equal(sp('36000'),500);      // 1.000 × (40.000 − 36.000) ÷ 8.000
      assert.equal(sp('40000'),0);
      assert.equal(sp('45000'),0);
    });
  });

  /* La capienza è il passo che prima non aveva un nome: tre righe
     sciolte dentro calcola(). Qui si esercita con numeri inventati,
     senza RAL, senza aliquote e senza scaglioni. */
  test.describe('applicaCapienza',()=>{
    test('capiente — le detrazioni entrano intere e resta IRPEF netta',()=>{
      const {usi,residua}=M.applicaCapienza(dec('7688.56'),[dec('1646.48'),dec('1000')]);
      assert.deepEqual(usi.map(num),[1646.48,1000]);
      assert.equal(num(residua),5042.08);
    });

    test('incapiente — non si rimborsa, e la residua è zero',()=>{
      const {usi,residua}=M.applicaCapienza(dec('400'),[dec('1955'),dec('0')]);
      assert.deepEqual(usi.map(num),[400,0]);
      assert.equal(num(residua),0);
      const azero=M.applicaCapienza(dec('0'),[dec('1955'),dec('1000')]);
      assert.deepEqual(azero.usi.map(num),[0,0]);
      assert.equal(num(azero.residua),0);
    });

    /* L'ordine di consumo è la ragione per cui questo passo ha un nome.
       A 1.200 € di imposta, con 1.000 e 1.955 da consumare, chi va per
       primo prende tutto quello che gli spetta e lascia il resto. */
    test('l\'ordine dell\'array è l\'ordine di consumo',()=>{
      const prima1000=M.applicaCapienza(dec('1200'),[dec('1000'),dec('1955')]);
      assert.deepEqual(prima1000.usi.map(num),[1000,200]);
      const prima1955=M.applicaCapienza(dec('1200'),[dec('1955'),dec('1000')]);
      assert.deepEqual(prima1955.usi.map(num),[1200,0]);
    });
  });

  test.describe('addizionali locali',()=>{
    /* Progressive come l'IRPEF, ma dovute solo se resta imposta da pagare. */
    test('addizionaleRegionale — per scaglioni, e solo se dovuta',()=>{
      // 15.000 × 1,23% + 13.000 × 1,58% + 3.783,50 × 1,72%
      assert.equal(num(M.addizionaleRegionale(dec('31783.50'),true)),454.98);
      assert.equal(num(M.addizionaleRegionale(dec('15000'),true)),184.50);
      assert.equal(num(M.addizionaleRegionale(dec('31783.50'),false)),0);
    });

    /* Esenzione secca, non franchigia: un centesimo sopra i 23.000 €
       si paga lo 0,8% sull'INTERO imponibile, non sull'eccedenza. */
    test('addizionaleComunale — l\'esenzione è secca, non una franchigia',()=>{
      assert.equal(num(M.addizionaleComunale(dec('23000'),true)),0);
      assert.equal(num(M.addizionaleComunale(dec('23000.01'),true)),184.00);
      assert.notEqual(num(M.addizionaleComunale(dec('23000.01'),true)),0);
      assert.equal(num(M.addizionaleComunale(dec('31783.50'),true)),254.27);
      assert.equal(num(M.addizionaleComunale(dec('31783.50'),false)),0);
    });
  });

  test.describe('integrazioni di legge',()=>{
    /* Il cuneo: tre aliquote a gradino, non interpolate. */
    test('sommaNonImponibile — 7,1 / 5,3 / 4,8 fino a 20.000',()=>{
      assert.equal(toNumber(M.sommaNonImponibile(dec('8500')).aliquota),0.071);
      assert.equal(num(M.sommaNonImponibile(dec('8500')).importo),603.50);
      assert.equal(toNumber(M.sommaNonImponibile(dec('8500.01')).aliquota),0.053);
      assert.equal(num(M.sommaNonImponibile(dec('15000')).importo),795);
      assert.equal(toNumber(M.sommaNonImponibile(dec('20000')).aliquota),0.048);
      assert.equal(num(M.sommaNonImponibile(dec('20000')).importo),960);
      assert.equal(M.sommaNonImponibile(dec('20000.01')).aliquota,null);
      assert.equal(num(M.sommaNonImponibile(dec('20000.01')).importo),0);
    });

    /* D.L. 3/2020: sotto i 15.000 € di imponibile, e solo se l'IRPEF
       lorda SUPERA la detrazione diminuita di 75 €. Il confronto è
       stretto: a parità esatta non spetta. */
    test('trattamentoIntegrativo — la condizione sulla detrazione − 75',()=>{
      const ti=(i,l,d)=>num(M.trattamentoIntegrativo(dec(i),dec(l),dec(d)));
      assert.equal(ti('15000','1900','1955'),1200);   // 1.900 > 1.880
      assert.equal(ti('15000','1880','1955'),0);      // pari, non maggiore
      assert.equal(ti('15000','1000','1955'),0);      // 1.000 < 1.880
      assert.equal(ti('15000.01','5000','1955'),0);   // fuori dal limite
    });
  });

  /* La guardia. Verifica UNA somma: se ne arriverà una seconda —
     il costo azienda — questa continuerà a guardare la sua. */
  test.describe('riconcilia',()=>{
    const v=(tipo,importo,somma=M.NETTO_LAVORATORE)=>({tipo,somma,_i:dec(importo)});

    test('i conti tornano sulla somma chiesta',()=>{
      const r=M.riconcilia(dec('1000'),[v('contributo','-100'),v('imposta','-50'),
        v('integrazione','20')]);
      assert.equal(num(r.netto),870);
      assert.equal(r.quante,3);
      assert.ok(r.verificata);
    });

    test('una voce con un tipo fuori dall\'identità la rompe',()=>{
      const r=M.riconcilia(dec('1000'),[v('contributo','-100'),v('mancia','-50')]);
      assert.equal(num(r.netto),850);
      assert.ok(!r.verificata);
    });

    /* «Quella somma, non tutto»: le voci di un'altra somma non
       entrano nel conto e non lo rompono, nemmeno se sono malfatte.
       È la proprietà che permetterà al costo azienda di esistere
       senza toccare la riconciliazione del netto. */
    test('le voci di un\'altra somma restano fuori',()=>{
      const r=M.riconcilia(dec('1000'),
        [v('contributo','-100'),v('imposta','-50','costoAzienda')]);
      assert.equal(num(r.netto),900);
      assert.equal(r.quante,1);
      assert.ok(r.verificata);
      const conMalfatta=M.riconcilia(dec('1000'),
        [v('contributo','-100'),v('mancia','-50','costoAzienda')]);
      assert.ok(conMalfatta.verificata);
    });

    test('senza voci non c\'è niente da riconciliare',()=>{
      assert.ok(!M.riconcilia(dec('1000'),[]).verificata);
    });
  });

  /* La domanda che riconcilia() non fa, perché non è sulla singola
     somma: ogni voce ne dichiara una nota? Una che non lo fa
     sparirebbe da tutte le riconciliazioni, in silenzio. */
  test('sommeDichiarate — la voce orfana si vede',()=>{
    const v=(tipo,somma)=>({tipo,somma,_i:dec('-50')});
    assert.ok(M.sommeDichiarate([v('imposta',M.NETTO_LAVORATORE)]));
    assert.ok(!M.sommeDichiarate([{tipo:'imposta',_i:dec('-50')}]));
    assert.ok(!M.sommeDichiarate([v('imposta','costoAzienda')]));
  });

  /* Ogni voce emessa da calcola() dichiara la somma in cui entra:
     è il campo su cui la guardia filtra. */
  test('ogni voce porta somma: nettoLavoratore',()=>{
    for(const ral of ['0','9000','20000','35000','60000','200000'])
      for(const voce of calcola(ral,13).voci)
        assert.equal(voce.somma,M.NETTO_LAVORATORE,`${ral} → ${voce.id}`);
  });
});
