/* Raio-X por indicador: nota de cada indicador de Qualidade por tipo de equipe (relatório
   "Qualidade – Conceito obtido por indicador"), já publicado em dados/uf/<UF>.js. */

/* =========================================================================
   RAIO-X POR INDICADOR (v1.17.0) — diagnóstico granular a partir do
   relatório complementar do SIAPS "Qualidade – Conceito obtido por
   indicador". Diferente do relatório principal (que só informa a
   classificação final de cada equipe), este relatório quebra o resultado em
   cada um dos indicadores que compõem essa classificação — permite apontar
   exatamente QUAL indicador está pesando, não só que a equipe está "Bom" em
   vez de "Ótimo". Upload independente e opcional, sobre o município já
   carregado na tela (não substitui o relatório principal, complementa).
   ========================================================================= */
const PESO_CONCEITO={Regular:0.25,Suficiente:0.50,Bom:0.75,'Ótimo':1};
const TYPE_META_IND={eSF:'ESF',eAP:'eAP',eSFR:'eSFR',eSB:'eSB',eMulti:'eMulti',eAPP:'eAPP',eCR:'eCR'};
// ordem das abas do Raio-X e nome completo (aparece ao passar o mouse na aba)
const TIPOS_RAIOX=['eSF','eAP','eSFR','eSB','eMulti','eAPP','eCR'];
const TIPO_NOME_IND={eSF:'Saúde da Família',eAP:'Atenção Primária',eSFR:'Saúde da Família Ribeirinha',eSB:'Saúde Bucal',
  eMulti:'Multiprofissional',eAPP:'Atenção Primária Prisional',eCR:'Consultório na Rua'};
// Ação sugerida por indicador — texto curto, de uso interno (consultor/vendas), para que
// o Raio-X não só aponte o indicador mais crítico, mas já sugira por onde começar a
// conversa técnica com a equipe. Indicador não mapeado aqui simplesmente não mostra a
// linha de ação (sem quebrar o restante do painel caso o SIAPS acrescente indicadores).
const ACAO_INDICADOR={
  'Cuidado da Pessoa com Hipertensão':'Verificar cobertura de aferição de PA e adesão ao tratamento.',
  'Cuidado da Pessoa com Diabetes Mellitus':'Verificar solicitação de HbA1c e acompanhamento em grupo/individual.',
  'Cuidado da Pessoa Idosa':'Verificar preenchimento da Caderneta da Pessoa Idosa e avaliação multidimensional.',
  'Cuidado da Gestante e da Puérpera':'Verificar nº de consultas de pré-natal e a consulta de puerpério registradas.',
  'Cuidado no Desenvolvimento Infantil':'Verificar consultas de puericultura e situação vacinal registradas.',
  'Cuidado Integral à Saúde da Mulher':'Verificar cobertura de citopatológico (Papanicolau) e mamografia.',
  'Mais Acesso à Atenção Primária à Saúde':'Verificar agenda/oferta de consultas e tempo de espera na unidade.',
  '1ª Consulta Odontológica programada na APS':'Verificar agendamento da 1ª consulta odontológica programática.',
  'Tratamento Odontológico concluído na APS':'Verificar acompanhamento até a conclusão do tratamento iniciado.',
  'Taxa de exodontias na APS':'Verificar se a proporção de extrações em relação aos demais procedimentos está alta.',
  'Escovação Supervisionada na APS':'Verificar registro das ações coletivas de escovação supervisionada.',
  'Procedimentos Odontológicos preventivos na APS':'Verificar registro de procedimentos preventivos (ex.: aplicação de flúor).',
  'Tratamento Restaurador Atraumático na APS':'Verificar registro de procedimentos de Tratamento Restaurador Atraumático (TRA).',
  'Média de atendimentos da eMulti por pessoa':'Verificar frequência de atendimentos da equipe multiprofissional por usuário acompanhado.',
  'Ações interprofissionais realizadas pela eMulti na APS':'Verificar registro de ações interprofissionais (matriciamento, atendimento compartilhado).',
  // equipes de Saúde da Família Ribeirinha (eSFR)
  'Mais Acesso à equipe de Saúde da Família Ribeirinha (eSFR)':'Verificar agenda/oferta de consultas e o registro dos atendimentos nas comunidades ribeirinhas.',
  'Cuidado da pessoa com hipertensão realizado pela equipe de Saúde da Família Ribeirinha (eSFR)':'Verificar cobertura de aferição de PA e adesão ao tratamento.',
  'Cuidado da pessoa com diabetes realizado pela equipe de Saúde da Família Ribeirinha (eSFR)':'Verificar solicitação de HbA1c e acompanhamento em grupo/individual.',
  'Cuidado na Gestação e Puerpério realizado pela equipe de Saúde da Família Ribeirinha (eSFR)':'Verificar nº de consultas de pré-natal e a consulta de puerpério registradas.',
  'Cuidado no desenvolvimento infantil realizado pela equipe de Saúde da Família Ribeirinha (eSFR)':'Verificar consultas de puericultura e situação vacinal registradas.',
  'Cuidado da mulher na prevenção do câncer realizado pela equipe de Saúde da Família Ribeirinha (eSFR)':'Verificar cobertura de citopatológico (Papanicolau) e mamografia.',
  // equipes de Atenção Primária Prisional (eAPP)
  'Mais Acesso à Atenção Primária Prisional (eAPP)':'Verificar agenda/oferta de atendimentos na unidade prisional e o registro deles.',
  'Cuidado da pessoa com diabetes e/ou hipertensão pelas equipes de Atenção Primária Prisional (eAPP)':'Verificar aferição de PA, HbA1c e acompanhamento das pessoas privadas de liberdade com doença crônica.',
  'Cuidado da pessoa com tuberculose pelas equipes de Atenção Primária Prisional (eAPP)':'Verificar busca ativa de sintomáticos respiratórios, exames e acompanhamento do tratamento.',
  'Cuidado na Gestação realizado pela equipe de Primária Prisional (eAPP)':'Verificar nº de consultas de pré-natal registradas das gestantes privadas de liberdade.',
  'Cuidado da mulher na prevenção do câncer pelas equipes de Primária Prisional (eAPP)':'Verificar cobertura de citopatológico (Papanicolau) e mamografia.',
  'Rastreio das Infecções Sexualmente Transmissíveis pela equipe de Atenção Primária Prisional (eAPP)':'Verificar oferta e registro de testes rápidos de IST (HIV, sífilis, hepatites).',
  // equipes de Consultório na Rua (eCR)
  'Mais Acesso à equipe de Consultório na Rua (eCR)':'Verificar a oferta de atendimentos e o registro de cada atendimento à população em situação de rua.',
  'Cuidado da pessoa com Tuberculose pelas equipes de Consultório na Rua (eCR)':'Verificar busca ativa de sintomáticos respiratórios, exames e acompanhamento do tratamento.',
  'Cuidado das pessoas gestantes pelas equipes de Consultório na Rua (eCR)':'Verificar identificação das gestantes em situação de rua e consultas de pré-natal registradas.',
  'Rastreio das Infecções Sexualmente Transmissíveis pela equipe de Consultório na Rua (eCR)':'Verificar oferta e registro de testes rápidos de IST (HIV, sífilis, hepatites).'
};


// computeIndicadorDiagnostico(): agrupa por tipo de equipe as linhas do quadrimestre-alvo
// (ou, se não houver linhas nesse quadrimestre, o quadrimestre mais recente disponível no
// próprio relatório) e calcula a nota ponderada de cada indicador — média das equipes
// classificadas nele, usando os pesos oficiais do SIAPS (PESO_CONCEITO acima). Ordena do
// indicador mais crítico (nota mais baixa) para o mais consolidado.
function computeIndicadorDiagnostico(indRows,targetKey){
  if(!indRows||!indRows.length)return{};
  let rowsAtQuad=targetKey!=null?indRows.filter(r=>quadKey(r.quad)===targetKey):[];
  if(!rowsAtQuad.length){
    const keys=[...new Set(indRows.map(r=>quadKey(r.quad)))].sort((a,b)=>a-b);
    const lastKey=keys[keys.length-1];
    rowsAtQuad=indRows.filter(r=>quadKey(r.quad)===lastKey);
  }
  const byTipo={};
  rowsAtQuad.forEach(r=>{
    const total=r.regular+r.suficiente+r.bom+r.otimo;
    if(!total)return;
    const score=(r.regular*PESO_CONCEITO.Regular+r.suficiente*PESO_CONCEITO.Suficiente+r.bom*PESO_CONCEITO.Bom+r.otimo*PESO_CONCEITO['Ótimo'])/total;
    (byTipo[r.tipo]=byTipo[r.tipo]||[]).push({indicador:r.indicador,total,regular:r.regular,suficiente:r.suficiente,bom:r.bom,otimo:r.otimo,score,quad:r.quad});
  });
  Object.values(byTipo).forEach(list=>list.sort((a,b)=>a.score-b.score));
  return byTipo;
}

// worstIndicadorFor(): usado na Carteira (renderCarteiraView) para mostrar, de cada
// município salvo que também tenha o relatório por indicador importado, qual é hoje o
// indicador mais crítico — sem precisar abrir o município um a um.
function worstIndicadorFor(entry,lastQuadStr){
  if(!entry||!entry.indicadores||!entry.indicadores.rows||!entry.indicadores.rows.length)return null;
  const diag=computeIndicadorDiagnostico(entry.indicadores.rows,quadKey(lastQuadStr));
  let worst=null;
  Object.keys(diag).forEach(t=>{
    const first=diag[t][0];
    if(first&&(!worst||first.score<worst.item.score))worst={tipo:t,item:first};
  });
  return worst;
}

let indicador=null,raioxActiveTipo=null;

function resetRaioX(){
  indicador=null;raioxActiveTipo=null;
  const empty=document.getElementById('raiox-empty'),content=document.getElementById('raiox-content'),
        foot=document.getElementById('raiox-foot'),actions=document.getElementById('raiox-actions'),
        err=document.getElementById('raiox-err');
  if(empty)empty.style.display='block';
  if(content)content.style.display='none';
  if(foot)foot.style.display='none';
  if(actions)actions.style.display='none';
  if(err)err.style.display='none';
  const flag=document.getElementById('sec-flag-raiox');
  if(flag){flag.textContent='';flag.classList.remove('warn');}
  hidePdfFallback('pdf-fallback-raiox');
}


function renderRaioX(){
  if(!indicador)return;
  const empty=document.getElementById('raiox-empty'),content=document.getElementById('raiox-content'),
        foot=document.getElementById('raiox-foot'),actions=document.getElementById('raiox-actions');
  if(empty)empty.style.display='none';
  if(content)content.style.display='block';
  if(foot)foot.style.display='block';
  if(actions)actions.style.display='flex';

  const targetKey=(lastRes&&lastRes.length)?quadKey(lastRes[lastRes.length-1].quad):null;
  const diag=computeIndicadorDiagnostico(indicador.rows,targetKey);

  const tiposPresentes=TIPOS_RAIOX.filter(t=>diag[t]&&diag[t].length);
  if(!raioxActiveTipo||!diag[raioxActiveTipo])raioxActiveTipo=tiposPresentes[0]||null;

  const usedQuad=raioxActiveTipo&&diag[raioxActiveTipo]&&diag[raioxActiveTipo][0]?diag[raioxActiveTipo][0].quad:null;
  const ref=document.getElementById('raiox-quad-ref');
  if(ref)ref.textContent=usedQuad?quadLabel(usedQuad):'—';
  // badge visível logo acima das abas/lista — a menção ao quadrimestre não pode ficar só no
  // rodapé "Como ler" (fácil de não notar); aqui é a primeira coisa que se vê ao abrir o Raio-X.
  const badgeVal=document.getElementById('raiox-quad-badge-val');
  if(badgeVal)badgeVal.textContent=usedQuad?quadLabel(usedQuad):'quadrimestre não identificado';

  const tabsEl=document.getElementById('ind-tabs');
  if(tabsEl)tabsEl.innerHTML=tiposPresentes.map(t=>
    `<div class="tb${t===raioxActiveTipo?' active':''}" onclick="raioxSetTipo('${t}')" title="${TIPO_NOME_IND[t]||t}">${TYPE_META_IND[t]||t}</div>`).join('');

  renderIndList(raioxActiveTipo?(diag[raioxActiveTipo]||[]):[]);

  // sinaliza na aba quantos indicadores estão em "Prioridade" (nota < 50%) —
  // é o que dá ao Raio-X mais relevância mesmo antes de abrir a aba.
  const flag=document.getElementById('sec-flag-raiox');
  if(flag){
    const totalCrit=tiposPresentes.reduce((n,t)=>n+diag[t].filter(it=>it.score<0.5).length,0);
    flag.textContent=totalCrit?` (${totalCrit})`:'';
    flag.classList.toggle('warn',totalCrit>0);
  }
}
function raioxSetTipo(t){raioxActiveTipo=t;renderRaioX();}

function renderIndList(list){
  const wrap=document.getElementById('ind-list-wrap');
  if(!wrap)return;
  if(!list.length){wrap.innerHTML='<div class="ind-empty-hint">Sem indicadores para este tipo de equipe no quadrimestre de referência.</div>';return;}
  const CHAVE={'Ótimo':'otimo',Bom:'bom',Suficiente:'suficiente',Regular:'regular'};
  wrap.innerHTML='<div class="ind-list">'+list.map(it=>{
    const pct=Math.round(it.score*100);
    const segs=CO.map(c=>{
      const n=it[CHAVE[c]]||0;if(!n)return'';
      const w=(n/it.total*100).toFixed(1);
      return `<span style="width:${w}%;background:${CC[c]}" title="${c}: ${n} equipe(s)"></span>`;
    }).join('');
    const tagHtml=pct<50?'<div class="ind-tag crit">Prioridade</div>':(pct>=90?'<div class="ind-tag ok">Consolidado</div>':'');
    const acao=ACAO_INDICADOR[it.indicador];
    return `<div class="ind-row">
      <div class="ind-name">${it.indicador}${acao?`<div class="ind-acao">${acao}</div>`:''}</div>
      <div class="ind-bar">${segs}</div>
      <div class="ind-score">${pct}%</div>
      ${tagHtml}
    </div>`;
  }).join('')+'</div>';
}
