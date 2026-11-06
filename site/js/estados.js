/* =========================================================================
   NAVEGAÇÃO: BRASIL → ESTADO → MUNICÍPIO (v4.0.0)
   -------------------------------------------------------------------------
   O endereço diz onde a pessoa está, e dá para mandar o link de qualquer tela:
     (sem parâmetros)        tela inicial do Brasil
     ?uf=SC                  painel do estado
     ?uf=SC&m=420540         relatório do município
   Cada mudança de tela entra no histórico do navegador, então o botão "voltar"
   do navegador funciona. Os dados de cada estado (dados/uf/<UF>.js) e o mapa
   (dados/geo/<UF>.js) só são baixados quando o estado é aberto.
   ========================================================================= */
function lerRota(){
  let q;try{q=new URLSearchParams(location.search);}catch(e){q=new URLSearchParams('');}
  const uf=(q.get('uf')||'').toUpperCase(),m=(q.get('m')||'').replace(/\D/g,'');
  return{uf:SIGLAS_UF.has(uf)?uf:'',m:SIGLAS_UF.has(uf)?m:''};
}
function urlDaRota(r){
  const q=new URLSearchParams();if(r.uf)q.set('uf',r.uf);if(r.m)q.set('m',r.m);
  const s=q.toString();return location.pathname+(s?'?'+s:'');
}
function irPara(r){
  r={uf:r.uf||'',m:r.m||''};
  const atual=lerRota();
  if(atual.uf!==r.uf||atual.m!==r.m){
    try{history.pushState(r,'',urlDaRota(r));entrouNoMunicipioPeloPainel=!!r.m;}catch(e){/* file:// em alguns navegadores */}
  }
  return aplicarRota(r);
}
function irBrasil(){return irPara({});}
function irEstado(uf){return irPara({uf});}
function irMunicipio(ibge){return irPara({uf:ufDoIbge(ibge),m:String(ibge)});}
let entrouNoMunicipioPeloPainel=false;   // o "Voltar" da tela do município só usa o histórico se veio do painel
window.addEventListener('popstate',()=>{entrouNoMunicipioPeloPainel=false;aplicarRota(lerRota());});

let ufCarregada='',voltandoDoMunicipio=false;
async function aplicarRota(r){
  const loading=document.getElementById('view-loading');
  if(!r.uf){
    if(loading)loading.style.display='none';
    document.title='Painel de Repasses APS — Brasil — Governança Brasil';
    showView('brasil');
    return;
  }
  const vinhaDoMunicipio=document.getElementById('view-municipio').style.display!=='none';
  if(r.uf!==ufCarregada){
    if(loading)loading.style.display='';
    const ok=await trocarEstado(r.uf);
    if(loading)loading.style.display='none';
    if(!ok)return;   // o usuário já foi para outro lugar enquanto carregava
  }
  if(r.m&&carteira.municipios.some(x=>String(x.id)===r.m)){abrirMunicipio(r.m);return;}
  showView('carteira');
  if(vinhaDoMunicipio)window.scrollTo({top:scrollAntesDoMunicipio,behavior:'auto'});
}

function montarSeletorUF(){
  const sel=document.getElementById('sel-uf');if(!sel)return;
  const ind=PainelDados.indice();
  const com=ESTADOS.filter(e=>ind[e.uf]),sem=ESTADOS.filter(e=>!ind[e.uf]);
  const opt=e=>`<option value="${e.uf}">${e.nome}${ind[e.uf]?'':' — sem dados ainda'}</option>`;
  sel.innerHTML=(com.length?`<optgroup label="Com dados publicados">${com.map(opt).join('')}</optgroup>`:'')+
    (sem.length?`<optgroup label="Ainda sem dados">${sem.map(opt).join('')}</optgroup>`:'');
  sel.addEventListener('change',()=>irEstado(sel.value));
  const crumb=document.getElementById('crumb-brasil');
  if(crumb)crumb.addEventListener('click',e=>{e.preventDefault();irBrasil();});
}

let trocaEmAndamento=0;
async function trocarEstado(uf){
  const minhaTroca=++trocaEmAndamento;
  await PainelDados.carregarEstado(uf);
  if(minhaTroca!==trocaEmAndamento)return false;
  UF_ATUAL=uf;ufCarregada=uf;
  const d=PainelDados.uf(uf);
  carteira.municipios=PainelDados.municipios(uf);
  // volta os filtros, a seleção do mapa e a aba ao início (eram do estado anterior)
  trendFilter='all';mapSelId=null;rankBusca='';perdaVerTodos=false;abaEstado='mapa';
  {const b=document.getElementById('ranking-busca');if(b)b.value='';}

  const e=estadoInfo(uf);
  const sel=document.getElementById('sel-uf');if(sel)sel.value=uf;
  const tit=document.getElementById('painel-titulo');if(tit)tit.textContent=`Repasses da Atenção Primária — ${e.nome}`;
  const mt=document.getElementById('mapa-titulo');if(mt)mt.textContent=`Mapa ${nomeComPrep(uf)}`;
  const bu=document.getElementById('busca-uf');if(bu){bu.placeholder='Buscar município';bu.title='Busca qualquer município do Brasil ou um estado';}
  const vazio=document.getElementById('carteira-empty-msg');
  if(vazio)vazio.innerHTML=`Ainda não há dados publicados ${nomeComPrep(uf)}.<br><a href="?" onclick="event.preventDefault();irBrasil();">Voltar ao Brasil</a> ou escolha outro estado acima.`;
  document.title=`Painel de Repasses APS — ${e.nome} — Governança Brasil`;
  renderDadosInfo(d);
  mostrarAba('mapa',{semRender:true});
  return true;
}

function renderDadosInfo(d){
  const info=document.getElementById('dados-info');if(!info)return;
  if(d&&d.quads&&d.quads.length){
    const ult=quadParts(d.quads[d.quads.length-1]);
    const dt=d.atualizadoEm?new Date(d.atualizadoEm+'T12:00:00').toLocaleDateString('pt-BR'):'—';
    const n=d.municipios.length;
    info.textContent=`${ult.q}º quadrimestre de ${ult.y} · ${n.toLocaleString('pt-BR')} ${n===1?'município':'municípios'} · histórico desde ${qCode(d.quads[0])} · atualizado em ${dt}`;
  }else{
    info.textContent='Sem dados publicados';
  }
}

/* ---------- abas do painel do estado: Mapa · Ranking · Equipes a menos ---------- */
let abaEstado='mapa';
function mostrarAba(nome,opts={}){
  abaEstado=nome;
  agendarAjusteAltura();
  document.querySelectorAll('.tabs .tab-btn').forEach(b=>{const on=b.dataset.aba===nome;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;});
  ['mapa','ranking','perda'].forEach(a=>{const p=document.getElementById('painel-'+a);if(p)p.hidden=a!==nome;});
  // o filtro de tendência vale para o Mapa e o Ranking; na aba de equipes a menos ele some
  {const ts=document.getElementById('trend-strip');if(ts)ts.hidden=nome==='perda';}
  // a busca no mapa e o município selecionado (no painel do lado) só fazem sentido na aba Mapa
  {const sm=document.getElementById('side-mapa');if(sm)sm.hidden=nome!=='mapa';}
  {const mm=document.getElementById('rsmap-metrics');if(mm)mm.hidden=nome!=='mapa';}
  if(opts.rolar){const t=document.querySelector('.tabs');if(t&&t.getBoundingClientRect().top<0)t.scrollIntoView({block:'start'});}
}
(function initAbas(){
  const tabs=[...document.querySelectorAll('.tabs .tab-btn')];
  tabs.forEach((b,i)=>{
    b.addEventListener('click',()=>mostrarAba(b.dataset.aba,{rolar:true}));
    // setas do teclado trocam de aba (padrão de acessibilidade para abas)
    b.addEventListener('keydown',e=>{
      if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;
      const vis=tabs.filter(t=>t.style.display!=='none');
      const j=(vis.indexOf(b)+(e.key==='ArrowRight'?1:-1)+vis.length)%vis.length;
      vis[j].focus();mostrarAba(vis[j].dataset.aba);
    });
  });
})();

// altura da barra de navegação, para a barra do estado ficar presa logo abaixo dela
function ajustarAlturaNav(){
  const nav=document.querySelector('.nav');
  if(nav)document.documentElement.style.setProperty('--nav-h',nav.offsetHeight+'px');
}
window.addEventListener('resize',ajustarAlturaNav);

/* ---------- layout "cabe na tela" (v4.3.0) ----------
   Em telas de computador, o mapa, o ranking, a lista de equipes a menos e a tela do
   Brasil ocupam exatamente a altura que sobra na janela: a página não precisa rolar e
   cada quadro rola por dentro. Em telas pequenas (celular) tudo volta ao fluxo normal. */
const MQ_FIT=window.matchMedia('(min-width:1000px) and (min-height:600px)');
function ajustarAlturaUtil(){
  const fit=MQ_FIT.matches;
  document.documentElement.classList.toggle('layout-fit',fit);
  if(!fit)return;
  document.querySelectorAll('.fit-h').forEach(el=>{
    if(el.offsetParent===null)return;          // escondido (outra aba/tela)
    const top=el.getBoundingClientRect().top+window.scrollY;
    el.style.setProperty('--fit-h',Math.max(440,Math.floor(window.innerHeight-top-16))+'px');
  });
}
function agendarAjusteAltura(){requestAnimationFrame(()=>requestAnimationFrame(ajustarAlturaUtil));}
window.addEventListener('resize',agendarAjusteAltura);
if(MQ_FIT.addEventListener)MQ_FIT.addEventListener('change',agendarAjusteAltura);
