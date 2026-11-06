/* =========================================================================
   INÍCIO — monta o painel a partir dos dados publicados
   -------------------------------------------------------------------------
   Roda por último (depois de todos os outros arquivos). Monta o seletor de
   estado, lê a lista de clientes e abre o estado inicial (ver estados.js).
   ========================================================================= */
(function iniciarPainel(){
  carteira.clientes=PainelDados.clientes();
  let pref=null;
  try{pref=localStorage.getItem('painel-repasses-filtro-clientes');}catch(e){/* sem preferência salva */}
  carteira.filtroClientes=pref==='1';
  montarSeletorUF();
  trocarEstado(ufInicial());
})();
