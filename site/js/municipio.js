/* =========================================================================
   TELA DO MUNICÍPIO
   -------------------------------------------------------------------------
   Abre um município a partir do painel do estado (mapa, ranking, busca): mostra o
   repasse, a tendência, as abas (Visão geral, Raio-X, Diagnóstico, Detalhamento) e os
   botões de PDF. Estrato e modalidades vêm dos dados publicados; o usuário pode mudar
   na tela para simular, mas nada é salvo (os dados oficiais são mantidos na manutenção).
   ========================================================================= */

let parsed=null,charts={},lastRes=null,lastParams=null;
const sel=id=>document.getElementById(id).value;

/* sec-tabs — navegação por seção dentro da tela do município (Visão geral /
   Raio-X / Diagnóstico / Detalhamento), pra não depender de rolar a página
   inteira pra achar cada bloco.
   Os painéis não usam display:none pra alternar — um container com
   display:none tem largura 0, e é a partir dessa largura que o Chart.js
   dimensiona o canvas. Se um gráfico for (re)criado enquanto a aba "Visão
   geral" estiver com display:none, ele nasce com tamanho 0 (gráfico em
   branco) — e pior, o ResizeObserver do Chart.js pode zerar um gráfico já
   correto de forma assíncrona, depois que a aba foi escondida de novo. Por
   isso o painel inativo continua com largura normal (position:absolute,
   width:100%) e só fica com height:0/overflow:hidden — ver .sec-inactive. */
function showSecTab(sec){
  ['geral','raiox','diag','detalhe'].forEach(s=>{
    const panel=document.getElementById('sec-'+s);
    if(panel)panel.classList.toggle('sec-inactive',s!==sec);
  });
  document.querySelectorAll('.sec-tab').forEach(t=>t.classList.toggle('active',t.dataset.sec===sec));
  if(sec==='geral'){
    if(charts.r)charts.r.resize();
    if(charts.c)charts.c.resize();
  }
}
document.querySelectorAll('.sec-tab').forEach(t=>t.addEventListener('click',()=>showSecTab(t.dataset.sec)));
function render(){
  document.getElementById('results').style.display='block';
  hidePdfFallback('pdf-fallback-full');
  hidePdfFallback('pdf-fallback-resumo');
  document.getElementById('muni-name').textContent=parsed.nomeMuni||'Município';
  document.getElementById('uf-code').textContent=parsed.uf||'—';
  document.getElementById('ibge-code').textContent=parsed.ibge||'—';
  document.getElementById('field-eap').style.display=parsed.rows.some(r=>r.vEap||r.qEap)?'block':'none';
  document.getElementById('field-esb').style.display=parsed.rows.some(r=>r.qEsb)?'block':'none';
  document.getElementById('field-emulti').style.display=parsed.rows.some(r=>r.qEmulti)?'block':'none';
  document.getElementById('field-ecr').style.display=parsed.rows.some(r=>r.qEcr)?'block':'none';
  document.getElementById('field-eapp').style.display=parsed.rows.some(r=>r.qEapp)?'block':'none';

  // Auto-preenchimento do estrato pela base do Anexo VI (se o IBGE for conhecido)
  const est = ESTRATO_IED[String(parsed.ibge||'').trim()];
  const selEst = document.getElementById('sel-estrato');
  const badge = document.getElementById('estrato-badge');
  const hint = document.getElementById('estrato-hint');
  const pfield = selEst.closest('.pfield');
  if(est){
    selEst.value = String(est);
    badge.classList.add('show');
    pfield.classList.add('autofilled');
    hint.classList.add('estrato-hint-auto');
    hint.innerHTML = 'Identificado pelo código IBGE conforme o Anexo VI da Portaria 3.493/2024. Você pode ajustar se necessário.';
  } else {
    selEst.value = '';
    badge.classList.remove('show');
    pfield.classList.remove('autofilled');
    hint.classList.remove('estrato-hint-auto');
    hint.innerHTML = 'Não localizado na base automática. Selecione conforme o <a href="https://www.in.gov.br/web/dou/-/portaria-gm/ms-n-3.493-de-10-de-abril-de-2024-553573811" target="_blank">Anexo VI da Portaria 3.493/2024</a>.';
  }

  ['sel-estrato','sel-eap','sel-esb','sel-emulti','sel-ecr','sel-eapp'].forEach(id=>document.getElementById(id).onchange=recompute);
  window.scrollTo({top:0,behavior:'auto'});
  recompute();
}

function recompute(){
  if(!parsed)return;
  const p={estrato:sel('sel-estrato'),eapMod:sel('sel-eap'),esbMod:sel('sel-esb'),emultiMod:sel('sel-emulti'),ecrMod:sel('sel-ecr'),eappMod:sel('sel-eapp')};
  const res=compute(parsed.rows,p),last=res[res.length-1];
  lastRes=res;lastParams=p;
  const resumoBtn=document.getElementById('btn-resumo');
  if(resumoBtn)resumoBtn.classList.toggle('disabled',!p.estrato);
  const hl=document.getElementById('headline');
  if(!p.estrato){
    hl.innerHTML='<div class="needest">Selecione o <b>Estrato IED</b> do município para calcular o Componente Fixo e o repasse total.</div>';
  }else{
    const atual=last.vin+last.qual+last.fixo;
    const gap=last.potencial-atual;
    const pct=Math.round(atual/last.potencial*100);
    hl.innerHTML=`
      <div class="primary">
        <div class="cap">Repasse mensal · ${last.quad}</div>
        <div class="big mono">${fmtBRL(last.total)}</div>
        <div class="hl-trend">${trendChipHTML(tendenciaDe(res),'onnavy')}</div>
        <div class="sub">Fixo/IED ${fmtBRL(last.fixo)} &nbsp;·&nbsp; Vínculo ${fmtBRL(last.vin)} &nbsp;·&nbsp; Qualidade ${fmtBRL(last.qual)}</div>
        <div class="quad-note">≈ <b>${fmtBRL(last.total*4)}</b> no quadrimestre (4 meses)</div>
      </div>
      <div class="split">
        <div class="mini"><div class="l">Potencial — tudo Ótimo</div><div class="v mono">${fmtBRL(last.potencial)}</div></div>
        <div class="mini gap"><div class="l">Margem em aberto por mês</div><div class="v mono">+ ${fmtBRL(gap)}</div>
          <div class="barwrap"><i style="width:${pct}%"></i></div>
          <div class="barlbl">${pct}% do potencial máximo já alcançado</div>
          <div class="quad-note">≈ <b>${fmtBRL(gap*4)}</b> em aberto no quadrimestre</div>
        </div>
      </div>
      <div class="quad-footnote">Estimativa do quadrimestre: assume a mesma classificação mantida pelos 4 meses seguintes à avaliação de ${last.quad}.</div>`;
  }
  chartRepasse(res);tblRepasse(res);tblEquipesFixo(res);chartClass(res);renderByType(res,!!p.estrato);
  renderAlertaMunicipio(res);
  renderDiagnostico(diagnose(res,!!p.estrato));
}

const TYPE_META={
  esf:{label:'ESF',full:'Equipes de Saúde da Família'},
  eap:{label:'eAP',full:'Equipes de Atenção Primária'},
  esb:{label:'eSB',full:'Equipes de Saúde Bucal'},
  emulti:{label:'eMulti',full:'Equipes Multiprofissionais'},
  esfr:{label:'eSFR',full:'Equipes de Saúde da Família Ribeirinha'},
  eapp:{label:'eAPP',full:'Equipes de Atenção Primária Prisional'},
  ecr:{label:'eCR',full:'Equipes de Consultório na Rua'}
};
function renderByType(res,hasEstrato){
  const grid=document.getElementById('bytype-grid');
  const last=res[res.length-1];
  const sub=document.getElementById('bytype-sub');
  sub.textContent=`Repasse mensal de cada tipo de equipe em ${last.quad} e a margem que ainda pode ser conquistada — o CVAT tem um cartão próprio logo abaixo de ESF/eAP, já que é um componente que atravessa os dois tipos.`;
  const order=TIPOS_EQUIPE.map(t=>t.k);   // só aparecem os tipos que o município tem (n>0)
  const cardsByType={};
  order.forEach(k=>{
    const t=last.byType[k];
    if(!t||t.n===0)return;
    const pct=t.potencial>0?Math.round(t.total/t.potencial*100):100;
    let pillCls='mid',pillTxt=`${pct}% do potencial`;
    if(pct>=100){pillCls='full';pillTxt='no máximo';}
    else if(pct<70){pillCls='low';pillTxt=`${pct}% do potencial`;}
    // distribuição de classificação para este tipo (último quadrimestre)
    const dist=last.cd[k]||{};
    const distTotal=CO.reduce((s,c)=>s+(dist[c]||0),0)||1;
    const distBar=CO.map(c=>{const n=dist[c]||0;if(!n)return'';const w=(n/distTotal*100).toFixed(1);return `<span style="width:${w}%;background:${CC[c]}" title="${c}: ${n}"></span>`;}).join('');
    // CVAT (Componente de Vínculo e Acompanhamento Territorial) só existe para eSF/eAP — eSB e
    // eMulti têm apenas Fixo + Qualidade, conforme a Portaria 3.493/2024. Ele ganhou um cartão
    // próprio (abaixo, cruzando ESF+eAP) em vez de ficar só como uma linha dentro destes
    // cartões — por isso aqui só listamos Fixo e Qualidade, iguais para os quatro tipos.
    const hasVinculo=(k==='esf'||k==='eap');
    const gapQual=Math.max(0,t.qualOt-t.qual);
    const gapLine=hasEstrato
      ? `<div class="tcard-meta"><span>Potencial ${fmtBRL(t.potencial)}</span><span>Margem <b>+ ${fmtBRL(t.gap)}</b></span></div>`
      : `<div class="tcard-meta"><span>Selecione o estrato para o valor total</span></div>`;
    const nowVal=hasEstrato?fmtBRL(t.total):fmtBRL(t.vin+t.qual)+' *';
    // eAPP: só o componente de Qualidade entra no cálculo (custeio mensal federal não confirmado)
    const soQual=k==='eapp';
    const nowLbl=soQual?'Repasse mensal (só Qualidade)':hasEstrato?(hasVinculo?'Repasse mensal (Fixo + CVAT + Qualidade)':'Repasse mensal (Fixo + Qualidade)'):'Repasse mensal (sem Fixo)';
    const compParts=[];
    if(hasEstrato&&!soQual)compParts.push(`${hasVinculo?'Fixo/IED':'Fixo'} <b>${fmtBRL(t.fixo)}</b>`);
    if(hasVinculo)compParts.push(`Vínculo (CVAT) <b>${fmtBRL(t.vin)}</b> <span style="color:var(--muted);font-weight:400;">— ver cartão CVAT</span>`);
    compParts.push(`Qualidade <b>${fmtBRL(t.qual)}</b>${gapQual>0.5?` <span class="comp-gap">+ ${fmtBRL(gapQual)} até Ótimo</span>`:''}`);
    const compLine=`<div class="tcard-comp">${compParts.map(p=>`<span>${p}</span>`).join('')}</div>`;
    cardsByType[k]=`
      <div class="tcard">
        <div class="tcard-top">
          <div><div class="tt">${TYPE_META[k].label}</div><div class="cnt">${t.n} equipe${t.n>1?'s':''} · ${TYPE_META[k].full}</div></div>
          ${hasEstrato?`<div class="pill ${pillCls}">${pillTxt}</div>`:''}
        </div>
        <div class="tcard-body">
          <div class="nowlbl">${nowLbl}</div>
          <div class="now mono">${nowVal}</div>
          ${hasEstrato?`<div class="tcard-prog"><i style="width:${Math.min(pct,100)}%"></i></div>`:''}
          ${compLine}
          ${gapLine}
        </div>
        <div class="tcard-foot">
          Classificação em ${last.quad}
          <div class="dist">${distBar}</div>
        </div>
      </div>`;
  });

  // Cartão dedicado ao CVAT — junta ESF+eAP (únicos tipos com esse componente) num único
  // cartão, em vez de deixar o CVAT diluído dentro dos cartões de cada tipo de equipe. A
  // distribuição de classificação aqui é a de Vínculo (vEsf/vEap), que pode ser diferente da
  // distribuição de Qualidade mostrada nos cartões de ESF/eAP — são avaliações independentes.
  const vinTypes=['esf','eap'].filter(k=>last.byType[k]&&last.byType[k].n>0);
  let cvatHtml='';
  if(vinTypes.length){
    const vinNow=vinTypes.reduce((s,k)=>s+last.byType[k].vin,0);
    const vinPot=vinTypes.reduce((s,k)=>s+last.byType[k].vinOt,0);
    const vinGap=Math.max(0,vinPot-vinNow);
    const vinPct=vinPot>0?Math.round(vinNow/vinPot*100):100;
    let vPillCls='mid',vPillTxt=`${vinPct}% do potencial`;
    if(vinPct>=100){vPillCls='full';vPillTxt='no máximo';}
    else if(vinPct<70){vPillCls='low';}
    const perTeam=vinTypes.map(k=>`${TYPE_META[k].label} <b>${fmtBRL(last.byType[k].vin)}</b>`).join('<span style="color:var(--line-2);">·</span>');
    const vinDist={};
    vinTypes.forEach(k=>{const d=last.cd[k]||{};CO.forEach(c=>{vinDist[c]=(vinDist[c]||0)+(d[c]||0);});});
    const vinDistTotal=CO.reduce((s,c)=>s+(vinDist[c]||0),0)||1;
    const vinDistBar=CO.map(c=>{const n=vinDist[c]||0;if(!n)return'';const w=(n/vinDistTotal*100).toFixed(1);return `<span style="width:${w}%;background:${CC[c]}" title="${c}: ${n}"></span>`;}).join('');
    cvatHtml=`
      <div class="tcard cvat-card">
        <div class="tcard-top">
          <div><div class="tt">CVAT</div><div class="cnt">Vínculo e Acompanhamento Territorial · ${vinTypes.map(k=>TYPE_META[k].label).join(' + ')}</div></div>
          <div class="pill ${vPillCls}">${vPillTxt}</div>
        </div>
        <div class="tcard-body">
          <div class="nowlbl">Repasse mensal — componente CVAT</div>
          <div class="now mono">${fmtBRL(vinNow)}</div>
          <div class="tcard-prog"><i style="width:${Math.min(vinPct,100)}%"></i></div>
          <div class="tcard-comp"><span>${perTeam}</span></div>
          <div class="tcard-meta"><span>Potencial ${fmtBRL(vinPot)}</span><span>Margem <b>+ ${fmtBRL(vinGap)}</b></span></div>
        </div>
        <div class="tcard-foot">
          Classificação de Vínculo em ${last.quad} <span style="color:var(--muted);">(avaliada à parte da Qualidade — pode ter uma distribuição diferente)</span>
          <div class="dist">${vinDistBar}</div>
        </div>
      </div>`;
  }

  // ESF, eAP, o cartão do CVAT e depois os demais tipos (só os que o município tem)
  const html=(cardsByType.esf||'')+(cardsByType.eap||'')+cvatHtml+order.filter(k=>k!=='esf'&&k!=='eap').map(k=>cardsByType[k]||'').join('');
  grid.innerHTML=html || '<div style="color:var(--muted);font-size:13px;padding:10px 2px;">Nenhum tipo de equipe identificado no arquivo.</div>';
}
