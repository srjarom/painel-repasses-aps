/* Aba Diagnóstico da tela do município: pontos de atenção e sugestões de agenda. */

/* =========================================================================
   DIAGNÓSTICO E OPORTUNIDADES
   Lê a série histórica (todos os quadrimestres do arquivo) e aponta padrões
   que sinalizam valor em uma agenda técnica presencial — sem depender de
   nenhum dado que o relatório público do SIAPS não traga (não há INE nem
   nome de equipe nesse relatório; o diagnóstico trabalha por tipo de equipe).
   ========================================================================= */
const DIAG_META={
  estagnacao:{icon:'⏸',label:'Estagnação',cor:'var(--suficiente)'},
  gap:{icon:'💰',label:'Oportunidade financeira',cor:'var(--otimo)'},
  queda:{icon:'📉',label:'Queda de desempenho',cor:'var(--regular)'},
  anomalia:{icon:'⚠️',label:'Ponto a confirmar',cor:'var(--regular)'},
  cvat:{icon:'🧭',label:'Oportunidade em CVAT',cor:'var(--teal)'}
};
// nota de fonte/programa anexada a toda sugestão de agenda copiável — muitos municípios ainda chamam
// o programa de "novo financiamento da Atenção Primária" e não pelo nome comercial "Saúde Brasil 360",
// então reforçamos os dois nomes, além de deixar claro que a observação vem de relatório público do SIAPS.
function withSourceNote(text){
  return `Com base no relatório público do SIAPS, no âmbito do novo financiamento da Atenção Primária (Saúde Brasil 360), ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}
function diagnose(res,hasEstrato){
  const order=['esf','eap','esb','emulti'];
  const last=res[res.length-1];
  const muni=parsed&&parsed.nomeMuni?parsed.nomeMuni:'seu município';
  const perdaDiag=parsed?analisarPerdaEquipes(res,parsed.rows,0):null;
  const finds=[];
  order.forEach(k=>{
    const meta=TYPE_META[k];
    const maxN=Math.max(0,...res.map(r=>(r.byType[k]||{}).n||0));
    if(!maxN)return; // tipo de equipe nunca apareceu no arquivo deste município
    const series=res.map(r=>{
      const t=r.byType[k]||{n:0,total:0,potencial:0,gap:0};
      const dist=r.cd[k]||{};
      const distTotal=CO.reduce((s,c)=>s+(dist[c]||0),0);
      const badN=(dist['Suficiente']||0)+(dist['Regular']||0);
      const boaN=(dist['Ótimo']||0)+(dist['Bom']||0);
      return{quad:r.quad,n:t.n,total:t.total,potencial:t.potencial,gap:t.gap,distTotal,badN,boaN,dist,
        badPct:distTotal?badN/distTotal:0,boaPct:distTotal?boaN/distTotal:0};
    });
    const lastS=series[series.length-1];
    const prevS=series.length>1?series[series.length-2]:null;
    // histórico curto (até 5 quadrimestres com dados) para dar contexto visual a cada ponto do diagnóstico
    const historico=series.filter(s=>s.distTotal>0).slice(-5);
    const startIdx=finds.length;

    // A) Estagnação — desempenho baixo (Suficiente/Regular) mantido nos últimos quadrimestres disponíveis
    const janela=series.slice(-3).filter(s=>s.distTotal>0);
    if(janela.length>=2&&janela.every(s=>s.badPct>=0.34)){
      finds.push({
        k,kind:'estagnacao',severity:3+lastS.badPct,
        title:`${meta.label} — estagnação em Suficiente/Regular`,
        detail:`${lastS.badN} de ${lastS.distTotal} equipes ${meta.label} (${meta.full}) permanecem em Suficiente ou Regular há ${janela.length} quadrimestres seguidos (${janela.map(s=>s.quad).join(', ')}). Padrão estrutural, não pontual.`,
        impacto:lastS.gap>0?lastS.gap:null,
        copy:`Notamos que ${lastS.badN} de ${lastS.distTotal} equipes de ${meta.full} (${meta.label}) de ${muni} permanecem classificadas em Suficiente ou Regular há ${janela.length} quadrimestres consecutivos${lastS.gap>0?`, representando hoje uma margem em aberto de ${fmtBRL(lastS.gap)}/mês`:''}. Sugerimos uma agenda técnica presencial da Governança Brasil para investigar as causas e apoiar a equipe na evolução dessa classificação. Podemos agendar uma visita para aprofundar esse diagnóstico?`
      });
    }

    // B) Maior gap financeiro (só faz sentido com estrato selecionado, senão o Fixo/IED fica de fora da conta)
    if(hasEstrato&&lastS.potencial>0&&lastS.gap>0&&(lastS.gap/lastS.potencial)>=0.08){
      finds.push({
        k,kind:'gap',severity:2+(lastS.gap/lastS.potencial),
        title:`${meta.label} — maior margem em aberto`,
        detail:`As equipes ${meta.label} têm hoje ${fmtBRL(lastS.total)}/mês e poderiam alcançar até ${fmtBRL(lastS.potencial)}/mês com classificação Ótima em todos os componentes — uma margem de ${fmtBRL(lastS.gap)}/mês (${Math.round(lastS.gap/lastS.potencial*100)}% do potencial ainda não capturado).`,
        impacto:lastS.gap,
        copy:`Em ${last.quad}, as equipes de ${meta.full} (${meta.label}) de ${muni} têm uma margem de ${fmtBRL(lastS.gap)}/mês ainda em aberto no repasse federal — hoje recebem ${fmtBRL(lastS.total)}, mas poderiam alcançar ${fmtBRL(lastS.potencial)} com desempenho Ótimo em todos os componentes. Podemos propor uma agenda técnica para trabalhar esse ganho junto à equipe?`
      });
    }

    // C) Queda de tendência — proporção em Ótimo/Bom caiu 15pp ou mais no último quadrimestre
    if(prevS&&prevS.distTotal>0&&lastS.distTotal>0){
      const queda=prevS.boaPct-lastS.boaPct;
      if(queda>=0.15){
        finds.push({
          k,kind:'queda',severity:2+queda,
          title:`${meta.label} — queda de desempenho`,
          detail:`A proporção de equipes ${meta.label} em Ótimo/Bom caiu de ${Math.round(prevS.boaPct*100)}% em ${prevS.quad} para ${Math.round(lastS.boaPct*100)}% em ${lastS.quad}. Vale investigar o que mudou antes que o padrão se repita.`,
          impacto:null,
          copy:`Identificamos uma queda de desempenho nas equipes de ${meta.full} (${meta.label}) de ${muni}: a proporção em Ótimo/Bom caiu de ${Math.round(prevS.boaPct*100)}% (${prevS.quad}) para ${Math.round(lastS.boaPct*100)}% (${lastS.quad}). Sugerimos uma agenda técnica para entender a causa antes do próximo quadrimestre. Podemos agendar?`
        });
      }
    }

    // D) Indicador zerado/anômalo — equipes que somem do relatório (todas ou parte), ou tipo 100% em Suficiente/Regular
    const perdaK=perdaDiag&&perdaDiag.recente.find(x=>x.k===k&&x.para>0);
    if(perdaK){
      finds.push({
        k,kind:'anomalia',severity:4.5+Math.min(1,perdaK.n/Math.max(1,perdaK.de)),
        title:`${meta.label} — ${perdaK.n} equipe${perdaK.n>1?'s':''} a menos no relatório`,
        detail:`Eram ${perdaK.de} equipes ${meta.label} em ${perdaDiag.prevQuad} e ${perdaK.para} em ${lastS.quad} — impacto estimado de −${fmtBRL(perdaK.impacto)}/mês (o Componente Fixo/IED cai junto). Pode ser descredenciamento, desativação no CNES, suspensão por falta de envio de produção ou equipe não avaliada no quadrimestre — vale confirmar no e-Gestor AB e no CNES.`,
        impacto:perdaK.impacto,
        copy:`Identificamos que ${muni} tinha ${perdaK.de} equipe(s) de ${meta.full} (${meta.label}) no relatório do SIAPS em ${perdaDiag.prevQuad} e ${perdaK.para} em ${lastS.quad} — uma redução estimada de ${fmtBRL(perdaK.impacto)}/mês no repasse federal. Pode ser descredenciamento, suspensão por falta de envio de produção ou equipe não avaliada. Podemos apoiar a coordenação para entender o que aconteceu e evitar a perda nos próximos quadrimestres?`
      });
    }else if(prevS&&prevS.n>0&&lastS.n===0){
      finds.push({
        k,kind:'anomalia',severity:5,
        title:`${meta.label} — parou de aparecer no relatório`,
        detail:`Todas as equipes ${meta.label} (${prevS.n} em ${prevS.quad}) deixaram de aparecer no relatório em ${lastS.quad}. Pode ser encerramento de equipe(s) ou falha no envio de produção — vale confirmar antes de assumir perda real de repasse.`,
        impacto:null,
        copy:`As equipes de ${meta.full} (${meta.label}) de ${muni} — ${prevS.n} equipe(s) em ${prevS.quad} — deixaram de aparecer no relatório do SIAPS em ${lastS.quad}. Antes de assumir perda de repasse, vale confirmar se é falha no envio de produção. Podemos agendar uma visita técnica para checar isso com a equipe?`
      });
    }else if(lastS.distTotal>0&&lastS.badPct>=0.999){
      finds.push({
        k,kind:'anomalia',severity:4,
        title:`${meta.label} — 100% em Suficiente/Regular`,
        detail:`Nenhuma equipe ${meta.label} atingiu Ótimo ou Bom em ${lastS.quad}. Pode ser desempenho real ou falha de registro/envio de produção — vale confirmar com a equipe antes de agir.`,
        impacto:lastS.gap>0?lastS.gap:null,
        copy:`Em ${lastS.quad}, nenhuma equipe de ${meta.full} (${meta.label}) de ${muni} atingiu Ótimo ou Bom — 100% em Suficiente/Regular. Isso pode ser desempenho real ou falha de registro. Sugerimos uma agenda técnica para confirmar a causa e agir rápido. Podemos agendar?`
      });
    }

    // E) Oportunidade específica em CVAT — só existe para ESF/eAP. Diferente dos pontos acima
    // (que já usam a distribuição de classificação de Vínculo para esf/eap, mas com foco em
    // tendência ao longo do tempo), este ponto isola a margem financeira específica do
    // componente de Vínculo (vinOt-vin, independente do Fixo/estrato) e propõe uma agenda
    // operacional concreta: qualificação/atualização de cadastro pelos ACS, vínculo correto
    // da família com a equipe do território — que é o que de fato move a nota de CVAT.
    if(k==='esf'||k==='eap'){
      const tCvat=last.byType[k];
      const vinGap=Math.max(0,tCvat.vinOt-tCvat.vin);
      if(tCvat.vinOt>0&&(vinGap/tCvat.vinOt)>=0.08){
        finds.push({
          k,kind:'cvat',severity:2+(vinGap/tCvat.vinOt),
          title:`${meta.label} — oportunidade em CVAT (Vínculo e Acompanhamento Territorial)`,
          detail:`O componente de Vínculo das equipes ${meta.label} está hoje em ${fmtBRL(tCvat.vin)}/mês, com margem de ${fmtBRL(vinGap)}/mês até a classificação "Ótimo" (${Math.round(vinGap/tCvat.vinOt*100)}% do potencial de CVAT ainda não capturado). Esse componente reflete a qualidade e a atualização dos cadastros das famílias vinculadas ao território.`,
          impacto:vinGap,
          copy:`O componente de Vínculo e Acompanhamento Territorial (CVAT) das equipes de ${meta.full} (${meta.label}) de ${muni} tem hoje uma margem de ${fmtBRL(vinGap)}/mês até a classificação "Ótimo". Esse componente é pago pela qualidade do vínculo da equipe com o território — cadastro das famílias atualizado, corretamente vinculado à equipe responsável, e o acompanhamento (visitas domiciliares) devidamente registrado pelos ACS. Sugerimos uma agenda técnica com foco em: (1) atualização e qualificação dos cadastros das famílias no sistema (e-SUS/CDS); (2) revisão do vínculo de cada família com a equipe responsável pelo território; (3) apoio à rotina dos ACS de visita domiciliar e registro do acompanhamento. Podemos agendar uma visita técnica para apoiar essa agenda junto à equipe?`
        });
      }
    }

    // anexa o histórico curto e a nota de fonte/programa a todos os pontos encontrados para este
    // tipo de equipe, para que o quadro mostre o movimento ao longo dos quadrimestres (não só o
    // número isolado) e para que toda sugestão de agenda copiável já cite a fonte e os dois nomes do programa
    for(let i=startIdx;i<finds.length;i++){
      finds[i].historico=historico;
      finds[i].copy=withSourceNote(finds[i].copy);
    }
  });
  finds.sort((a,b)=>b.severity-a.severity);
  return finds;
}
function renderDiagHist(historico){
  if(!historico||historico.length<2)return'';
  const rows=historico.map((s,i)=>{
    const bar=CO.map(c=>{const n=(s.dist&&s.dist[c])||0;if(!n)return'';const w=(n/s.distTotal*100).toFixed(1);return `<span style="width:${w}%;background:${CC[c]}" title="${c}: ${n}"></span>`;}).join('');
    const isLast=i===historico.length-1;
    return `<div class="dh-row${isLast?' is-last':''}"><span class="dh-q">${abbrevQuad(s.quad)}</span><span class="dh-bar">${bar}</span><span class="dh-pct">${Math.round(s.boaPct*100)}%</span></div>`;
  }).join('');
  return `<div class="diag-hist"><div class="diag-hist-label">Ótimo/Bom por quadrimestre</div>${rows}</div>`;
}
function renderDiagnostico(allFinds){
  const wrap=document.getElementById('diag-wrap'),grid=document.getElementById('diag-grid'),more=document.getElementById('diag-more');
  const emptyHint=document.getElementById('diag-empty-hint'),flag=document.getElementById('sec-flag-diag');
  if(!allFinds.length){
    wrap.style.display='none';
    if(emptyHint)emptyHint.style.display='block';
    if(flag){flag.textContent='';flag.classList.remove('warn');}
    window.__diagFinds=[];return;
  }
  wrap.style.display='block';
  if(emptyHint)emptyHint.style.display='none';
  if(flag){flag.textContent=` (${allFinds.length})`;flag.classList.add('warn');}
  const MAXCARDS=6;
  const finds=allFinds.slice(0,MAXCARDS);
  window.__diagFinds=finds;
  grid.innerHTML=finds.map((f,i)=>{
    const dm=DIAG_META[f.kind];
    return `<div class="diag-card diag-${f.kind}">
      <div class="diag-top"><span class="diag-badge">${dm.icon} ${dm.label}</span>${f.impacto?`<span class="diag-impacto">${fmtBRL(f.impacto)}/mês</span>`:''}</div>
      <div class="diag-title">${f.title}</div>
      <div class="diag-detail">${f.detail}</div>
      ${renderDiagHist(f.historico)}
      <button class="diag-copy" type="button" data-i="${i}" onclick="copyDiag(${i})">📋 Copiar sugestão de agenda</button>
    </div>`;
  }).join('');
  more.textContent=allFinds.length>MAXCARDS?`+ ${allFinds.length-MAXCARDS} outro(s) ponto(s) identificado(s) — refine os filtros de modalidade para reduzir o escopo.`:'';
}
function copyDiag(i){
  const f=(window.__diagFinds||[])[i];
  if(!f)return;
  const btn=document.querySelector('.diag-copy[data-i="'+i+'"]');
  const restore=prev=>{setTimeout(()=>{btn.textContent=prev;btn.classList.remove('copied');},1800);};
  const onOk=()=>{const prev=btn.textContent;btn.textContent='✓ Copiado!';btn.classList.add('copied');restore(prev);};
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(f.copy).then(onOk).catch(()=>alert('Não foi possível copiar automaticamente. Texto:\n\n'+f.copy));
  }else{
    alert('Texto da sugestão:\n\n'+f.copy);
  }
}
