/* Filtro "Só clientes GOVBR Saúde / Celk": a lista vem de dados/clientes.js. */

/* =========================================================================
   LISTA DE CLIENTES (v1.27.0) — filtro "só clientes GOVBR Saúde / Celk"
   -------------------------------------------------------------------------
   A lista é publicada pela manutenção em dados/clientes.js (a partir da
   exportação do comercial com os contratos ativos do parceiro Celk). A lista fica salva junto da carteira (neste navegador e no
   backup .json) e liga um filtro que vale para os totais, o mapa e o
   ranking. Só guardamos o código IBGE e o nome do cliente — nenhum dado de
   contrato/valor da planilha é armazenado.
   ========================================================================= */
const CLIENTES_ROTULO='GOVBR Saúde / Celk';
// a lista pode ter clientes de vários estados: cada estado usa só os seus (pelo começo do código IBGE)
function clientesDaUF(){
  const c=carteira.clientes;
  return c&&Array.isArray(c.lista)?c.lista.filter(x=>ufDoIbge(x.ibge)===UF_ATUAL):[];
}
function clientesSet(){
  return new Set(clientesDaUF().map(x=>String(x.ibge)));
}
function setFiltroClientes(on){
  carteira.filtroClientes=!!on;
  try{localStorage.setItem('painel-repasses-filtro-clientes',on?'1':'0');}catch(e){/* só preferência de exibição */}
  renderCarteiraView();
}
function renderCliBar(list,cli,filtrar){
  const el=document.getElementById('cli-bar');if(!el)return;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const c=carteira.clientes,daUF=clientesDaUF();
  if(!daUF.length){
    el.innerHTML='';
    return;
  }
  const ids=new Set(list.map(m=>m.id));
  const comDados=daUF.filter(x=>ids.has(String(x.ibge)));
  const semDados=daUF.filter(x=>!ids.has(String(x.ibge)));
  const dt=new Date(c.importadoEm).toLocaleDateString('pt-BR');
  let h=`<div class="cli-row">
    <div class="map-metrics cli-toggle">
      <div class="map-metric-btn${filtrar?'':' active'}" onclick="setFiltroClientes(false)">Todos os municípios (${list.length})</div>
      <div class="map-metric-btn${filtrar?' active':''}" onclick="setFiltroClientes(true)">Só clientes ${esc(c.rotulo||CLIENTES_ROTULO)} (${comDados.length})</div>
    </div>
    <div class="cli-meta">${daUF.length} cliente${daUF.length>1?'s':''} ${nomeComPrep(UF_ATUAL)} na lista · atualizada em ${dt}</div>
  </div>`;
  if(semDados.length)h+=`<div class="cli-warn">${semDados.length} cliente${semDados.length>1?'s':''} da lista sem dados no relatório publicado: ${semDados.map(x=>esc(x.cliente)).join(', ')}.</div>`;
  el.innerHTML=h;
}
