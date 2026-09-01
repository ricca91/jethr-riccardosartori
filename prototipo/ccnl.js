/* Catalogo di presentazione: il CCNL suggerisce come distribuire il netto
   annuale, ma non entra mai nel motore fiscale o contributivo. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CCNL_CATALOGO=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const VERSIONE_CATALOGO='2026-09-01';
  const congela=contratto=>Object.freeze({...contratto,fonte:Object.freeze(contratto.fonte)});
  const CCNL=Object.freeze([
    congela({
      id:'terziario-confcommercio-h011',
      nome:'Terziario, Distribuzione e Servizi',
      parti:'Confcommercio',
      codiceCnel:'H011',
      mensilita:14,
      dataRiferimento:'2024-03-22',
      fonte:{
        titolo:'Accordo di rinnovo del CCNL Terziario, 22 marzo 2024',
        url:'https://www.confcommerciomilano.it/it/contratti_lavoro/contrattazione_collettiva/ccnl_terziario_22_marzo_2024.html',
      },
    }),
    congela({
      id:'metalmeccanica-industria-c011',
      nome:'Industria Metalmeccanica e Installazione Impianti',
      parti:'Federmeccanica / Assistal',
      codiceCnel:'C011',
      mensilita:13,
      dataRiferimento:'2025-11-22',
      fonte:{
        titolo:'CCNL Metalmeccanica, rinnovo 22 novembre 2025',
        url:'https://www.federmeccanica.it/relazioni-industriali/documenti-ccnl-22-novembre-2025.html',
      },
    }),
    congela({
      id:'funzioni-centrali',
      nome:'Comparto Funzioni Centrali — personale non dirigente',
      parti:'ARAN / organizzazioni sindacali',
      codiceCnel:null,
      mensilita:13,
      dataRiferimento:'2025-01-27',
      fonte:{
        titolo:'CCNL Comparto Funzioni Centrali 2022–2024',
        url:'https://www.aranagenzia.it/documento_pubblico/contratto-collettivo-nazionale-di-lavoro-del-comparto-funzioni-centrali-periodo-2022-2024/',
      },
    }),
  ]);
  const perId=new Map(CCNL.map(contratto=>[contratto.id,contratto]));

  function trovaCcnl(id){
    if(!id)return null;
    return perId.get(id)||null;
  }
  function suggerisciMensilita(id,mensilitaAttuali=13){
    if(!id)return mensilitaAttuali;
    const contratto=trovaCcnl(id);
    if(!contratto)throw new RangeError(`CCNL sconosciuto: ${id}`);
    return contratto.mensilita;
  }
  function statoMensilita(id,mensilitaAttuali){
    const contratto=trovaCcnl(id);
    if(!contratto)return{personalizzato:false,consigliate:null};
    return{personalizzato:mensilitaAttuali!==contratto.mensilita,
      consigliate:contratto.mensilita};
  }
  function preferenzaDaUrl(id,mensilitaRaw,mensilitaAttuali,mensilitaAmmesse){
    const contratto=trovaCcnl(id);
    const ccnl=contratto?id:'';
    let mensilita=contratto?contratto.mensilita:mensilitaAttuali;
    const esplicite=Number(mensilitaRaw);
    if(mensilitaAmmesse.includes(esplicite))mensilita=esplicite;
    return{ccnl,mensilita};
  }

  return Object.freeze({VERSIONE_CATALOGO,CCNL,trovaCcnl,suggerisciMensilita,
    statoMensilita,preferenzaDaUrl});
});
