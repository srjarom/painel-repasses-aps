/* =========================================================================
   INÍCIO — monta o painel a partir dos dados publicados
   -------------------------------------------------------------------------
   Roda por último (depois de todos os outros arquivos). Monta o seletor de
   estado, lê a lista de clientes e abre a tela que está no endereço
   (Brasil, um estado ou um município — ver estados.js).
   ========================================================================= */
(function iniciarPainel(){
  carteira.clientes=PainelDados.clientes();
  let pref=null;
  try{pref=localStorage.getItem('painel-repasses-filtro-clientes');}catch(e){/* sem preferência salva */}
  carteira.filtroClientes=pref==='1';
  ajustarAlturaNav();
  montarSeletorUF();
  const r=lerRota();
  try{history.replaceState(r,'',urlDaRota(r));}catch(e){/* file:// em alguns navegadores */}
  aplicarRota(r);
})();
