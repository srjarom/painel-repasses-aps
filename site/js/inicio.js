/* =========================================================================
   INÍCIO — monta o painel a partir dos dados publicados
   -------------------------------------------------------------------------
   Roda por último (depois de todos os outros arquivos). Lê os dados que os
   arquivos de site/dados/ registraram em PainelDados, monta o objeto
   `carteira` usado pelo painel do estado e abre a tela inicial.
   ========================================================================= */
(function iniciarPainel(){
  const d=PainelDados.uf(UF_ATUAL);
  carteira.municipios=PainelDados.municipios(UF_ATUAL);
  carteira.clientes=PainelDados.clientes();
  let pref=null;
  try{pref=localStorage.getItem('painel-repasses-filtro-clientes');}catch(e){/* sem preferência salva */}
  carteira.filtroClientes=pref==='1';

  const info=document.getElementById('dados-info');
  if(info){
    if(d&&d.quads&&d.quads.length){
      const dt=d.atualizadoEm?new Date(d.atualizadoEm+'T12:00:00').toLocaleDateString('pt-BR'):'—';
      info.innerHTML=`<div class="di-l">Avaliação mais recente</div><div class="di-v">${quadParts(d.quads[d.quads.length-1]).q}º quadrimestre de ${quadParts(d.quads[d.quads.length-1]).y}</div>`+
        `<div class="di-s">${d.municipios.length} municípios · dados de ${qCode(d.quads[0])} a ${qCode(d.quads[d.quads.length-1])}<br>atualizado em ${dt}</div>`;
    }else{
      info.innerHTML='<div class="di-s">Sem dados publicados</div>';
    }
  }
  renderCarteiraBadge();
  const loading=document.getElementById('view-loading');
  if(loading)loading.style.display='none';
  showView('carteira');
})();
