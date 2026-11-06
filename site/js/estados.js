/* =========================================================================
   SELETOR DE ESTADO (v3.0.0)
   -------------------------------------------------------------------------
   O painel mostra um estado por vez. Os dados de cada estado (dados/uf/<UF>.js)
   e o mapa (dados/geo/<UF>.js) só são baixados quando o estado é escolhido.
   O estado escolhido vai para o endereço (…/?uf=SC), para dar para mandar o link
   de um estado direto a um colega, e fica lembrado neste navegador.
   ========================================================================= */
const PREF_UF='painel-repasses-uf';

// estado inicial: ?uf= no endereço → último escolhido neste navegador → padrão
function ufInicial(){
  let uf='';
  try{uf=(new URLSearchParams(location.search).get('uf')||'').toUpperCase();}catch(e){/* endereço sem parâmetros */}
  if(!SIGLAS_UF.has(uf)){try{uf=(localStorage.getItem(PREF_UF)||'').toUpperCase();}catch(e){uf='';}}
  if(!SIGLAS_UF.has(uf))uf=UF_PADRAO;
  return uf;
}

function montarSeletorUF(){
  const sel=document.getElementById('sel-uf');if(!sel)return;
  const ind=PainelDados.indice();
  const com=ESTADOS.filter(e=>ind[e.uf]),sem=ESTADOS.filter(e=>!ind[e.uf]);
  const opt=e=>`<option value="${e.uf}">${e.nome} (${e.uf})${ind[e.uf]?'':' — sem dados ainda'}</option>`;
  sel.innerHTML=(com.length?`<optgroup label="Com dados publicados">${com.map(opt).join('')}</optgroup>`:'')+
    (sem.length?`<optgroup label="Ainda sem dados">${sem.map(opt).join('')}</optgroup>`:'');
  sel.addEventListener('change',()=>trocarEstado(sel.value));
}

let trocaEmAndamento=0;
async function trocarEstado(uf){
  const minhaTroca=++trocaEmAndamento;
  const loading=document.getElementById('view-loading');
  if(loading)loading.style.display='';
  await PainelDados.carregarEstado(uf);
  if(minhaTroca!==trocaEmAndamento)return;   // o usuário já escolheu outro estado
  UF_ATUAL=uf;
  const d=PainelDados.uf(uf);
  carteira.municipios=PainelDados.municipios(uf);
  // volta os filtros e a seleção do mapa ao início (eram do estado anterior)
  trendFilter='all';mapSelId=null;rankBusca='';
  {const b=document.getElementById('ranking-busca');if(b)b.value='';}

  const e=estadoInfo(uf);
  const sel=document.getElementById('sel-uf');if(sel)sel.value=uf;
  const tit=document.getElementById('painel-titulo');if(tit)tit.textContent=`Repasses da Atenção Primária — ${e.nome}`;
  const mt=document.getElementById('mapa-titulo');if(mt)mt.textContent=`Mapa ${nomeComPrep(uf)}`;
  const vazio=document.getElementById('carteira-empty-msg');
  if(vazio)vazio.innerHTML=`Ainda não há dados publicados ${nomeComPrep(uf)}.<br>Escolha outro estado no seletor acima.`;
  document.title=`Painel de Repasses APS — ${e.nome} — Governança Brasil`;
  renderDadosInfo(d);

  try{localStorage.setItem(PREF_UF,uf);}catch(x){/* só preferência */}
  try{const u=new URL(location.href);u.searchParams.set('uf',uf);history.replaceState(null,'',u);}catch(x){/* file:// em alguns navegadores */}

  if(loading)loading.style.display='none';
  showView('carteira');
}

function renderDadosInfo(d){
  const info=document.getElementById('dados-info');if(!info)return;
  if(d&&d.quads&&d.quads.length){
    const ult=quadParts(d.quads[d.quads.length-1]);
    const dt=d.atualizadoEm?new Date(d.atualizadoEm+'T12:00:00').toLocaleDateString('pt-BR'):'—';
    info.innerHTML=`<div class="di-l">Avaliação mais recente</div><div class="di-v">${ult.q}º quadrimestre de ${ult.y}</div>`+
      `<div class="di-s">${d.municipios.length} municípios · dados de ${qCode(d.quads[0])} a ${qCode(d.quads[d.quads.length-1])}<br>atualizado em ${dt}</div>`;
  }else{
    info.innerHTML='<div class="di-s">Sem dados publicados</div>';
  }
}
