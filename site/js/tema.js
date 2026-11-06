/* Modo claro/escuro (o tema inicial é aplicado antes em tema-inicial.js, para não piscar). */

/* =========================================================================
   MODO CLARO / ESCURO
   -------------------------------------------------------------------------
   A troca de tema em si é 100% CSS (variáveis sob [data-theme="dark"], já
   definidas no <style>). Este bloco só cuida do que o CSS não alcança:
   1) persistir a escolha (best-effort, com fallback silencioso — o painel
      continua funcionando normalmente mesmo sem localStorage disponível);
   2) redesenhar o que foi pintado via JS com cores fixas (canvas do
      Chart.js, preenchimento "sem dado" do mapa da carteira), já que esses
      não reagem sozinhos a uma troca de variável CSS.
   ========================================================================= */
function cssVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function chartThemeColors(){
  const dark=document.documentElement.getAttribute('data-theme')==='dark';
  return{text:dark?'#c9d6df':'#3c5163',grid:dark?'rgba(255,255,255,.09)':'#eef3f5'};
}
function currentTheme(){
  return document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';
}
function applyThemeSideEffects(){
  // Redesenha os gráficos do município (se houver um carregado) e o mapa da
  // carteira (se estiver com dados) usando as cores corretas do tema atual.
  if(parsed&&lastRes){chartRepasse(lastRes);chartClass(lastRes);}
  if(carteiraMapRows&&carteiraMapRows.length)renderCarteiraMap(carteiraMapRows);
}
function setTheme(theme){
  if(theme==='dark')document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
  try{localStorage.setItem('painel-repasses-tema',theme);}catch(e){/* segue só nesta sessão, sem persistir */}
  applyThemeSideEffects();
}
(function initThemeToggle(){
  const btn=document.getElementById('theme-toggle');
  if(!btn)return;
  btn.addEventListener('click',()=>setTheme(currentTheme()==='dark'?'light':'dark'));
})();
