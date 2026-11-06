/* Aplica o tema salvo (ou a preferência do sistema operacional) ANTES do
   <body> ser desenhado, pra não piscar claro→escuro na primeira carga.
   Tudo protegido por try/catch: se localStorage não estiver disponível
   neste contexto (ex.: alguns sandboxes de pré-visualização), o painel
   simplesmente cai na preferência do sistema ou no modo claro — nunca
   quebra. Nenhum dado sai do navegador; é só uma preferência de exibição. */
(function(){
  try{
    var saved=null;
    try{saved=localStorage.getItem('painel-repasses-tema');}catch(e){}
    var theme=saved;
    if(theme!=='light'&&theme!=='dark'){
      theme=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';
    }
    if(theme==='dark')document.documentElement.setAttribute('data-theme','dark');
  }catch(e){/* segue no modo claro padrão */}
})();
