/* =========================================================================
   RESUMO POR MUNICÍPIO E POR ESTADO (v4.0.0)
   -------------------------------------------------------------------------
   linhaMunicipio(): os números de um município usados no mapa, no ranking e nos
   alertas (repasse do quadrimestre mais recente, potencial, margem, tendência e
   equipes a menos). É a mesma conta do painel do estado.
   resumoEstado(): soma tudo isso para o estado. A ferramenta de manutenção grava
   esse resumo em dados/indice.js — é o que alimenta a tela inicial (Brasil) sem
   precisar baixar os 27 estados.
   Depende de calculo.js, tendencia.js e alerta-equipes.js.
   ========================================================================= */
// quadrimestre mais recente entre todos os municípios da lista
function refKeyDe(lista){
  return lista.reduce((mx,m)=>Math.max(mx,...((m.parsed&&m.parsed.rows)||[]).map(r=>quadKey(r.quad)),0),0);
}
function linhaMunicipio(entry,refKey){
  const res=compute(entry.parsed.rows,entry.params);
  const last=res[res.length-1];
  const gap=last.potencial-last.total;
  const pct=last.potencial>0?Math.round(last.total/last.potencial*100):100;
  const perda=analisarPerdaEquipes(res,entry.parsed.rows,refKey);
  let trend=tendenciaDe(res);
  // município que nem aparece no relatório mais recente: a "tendência" antiga enganaria
  if(perda&&perda.ausente)trend={dir:null,ausente:true,delta:0,pct:null,prevQuad:null,quad:last.quad,ref:perda.ausente.ref};
  return{entry,last,gap,pct,trend,perda};
}
function resumoEstado(lista){
  const ref=refKeyDe(lista);
  const rows=lista.map(m=>linhaMunicipio(m,ref));
  const soma=f=>rows.reduce((s,r)=>s+f(r),0);
  const total=soma(r=>r.last.total),potencial=soma(r=>r.last.potencial);
  const delta=soma(r=>r.trend&&r.trend.dir!=null?r.trend.delta:0);
  const perd=rows.filter(r=>temAlertaEquipes(r.perda));
  const arred=v=>Math.round(v);
  return{
    total:arred(total),potencial:arred(potencial),gap:arred(Math.max(0,potencial-total)),
    pct:potencial>0?Math.round(total/potencial*1000)/10:100,
    delta:arred(delta),deltaPct:total-delta>0?Math.round(delta/(total-delta)*1000)/10:null,
    sobe:rows.filter(r=>r.trend.dir===1).length,igual:rows.filter(r=>r.trend.dir===0).length,
    desce:rows.filter(r=>r.trend.dir===-1).length,
    perda:perd.length,perdaImpacto:arred(perd.reduce((s,r)=>s+(r.perda.impacto||0),0))
  };
}
