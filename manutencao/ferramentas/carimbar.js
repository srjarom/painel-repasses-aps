/* =========================================================================
   CARIMBAR — põe a versão e o carimbo dos dados no site/index.html
   -------------------------------------------------------------------------
   Por que existe: o navegador guarda os arquivos do painel por um tempo. Se a
   página nova chama "js/painel.js" e o navegador já tem esse arquivo guardado,
   ele usa o antigo — e o painel fica com partes novas e partes velhas.
   Para evitar isso, cada arquivo é chamado com um "carimbo" no endereço:
     - código e visual (js/ e css/):  ?v=<APP_VERSION de site/js/versao.js>
     - dados (dados/):                ?d=<impressão digital dos arquivos de dados>
   Quando a versão ou os dados mudam, o carimbo muda e o navegador baixa de novo.

   Como usar (na pasta testes/):  npm run carimbar
   O pacote para o hub (npm run pacote) e a publicação no GitHub já carimbam sozinhos.
   O teste automático (npm test) avisa se o index.html estiver com carimbo velho.
   ========================================================================= */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const RAIZ=path.resolve(__dirname,'..','..');
const SITE=path.join(RAIZ,'site');
const INDEX=path.join(SITE,'index.html');

function versaoDoPainel(){
  const m=fs.readFileSync(path.join(SITE,'js','versao.js'),'utf8').match(/APP_VERSION='([^']+)'/);
  if(!m)throw new Error('Não achei APP_VERSION em site/js/versao.js');
  return m[1];
}
// impressão digital (8 letras) de todos os arquivos da pasta site/dados: muda se qualquer dado mudar
function carimboDosDados(){
  const arquivos=[];
  (function andar(dir){
    fs.readdirSync(dir,{withFileTypes:true}).forEach(e=>{
      const p=path.join(dir,e.name);
      if(e.isDirectory())andar(p);else arquivos.push(p);
    });
  })(path.join(SITE,'dados'));
  arquivos.sort();
  const h=crypto.createHash('sha1');
  arquivos.forEach(p=>{h.update(path.relative(SITE,p).split(path.sep).join('/'));h.update(fs.readFileSync(p));});
  return h.digest('hex').slice(0,8);
}
// devolve o index.html com os carimbos certos (não grava)
function carimbarTexto(html,ver,dados){
  return html
    .replace(/((?:src|href)="(?:js|css)\/[^"?]+)(\?v=[^"]*)?"/g,`$1?v=${ver}"`)
    .replace(/(src="dados\/[^"?]+)(\?d=[^"]*)?"/g,`$1?d=${dados}"`)
    .replace(/window\.DADOS_VERSAO='[^']*'/,`window.DADOS_VERSAO='${dados}'`);
}
function carimbar({silencioso}={}){
  const ver=versaoDoPainel(),dados=carimboDosDados();
  const antes=fs.readFileSync(INDEX,'utf8');
  const depois=carimbarTexto(antes,ver,dados);
  if(depois!==antes)fs.writeFileSync(INDEX,depois);
  if(!silencioso)console.log(depois!==antes?`Carimbado: versão ${ver} · dados ${dados}`:`Já estava carimbado: versão ${ver} · dados ${dados}`);
  return{ver,dados,mudou:depois!==antes};
}
module.exports={versaoDoPainel,carimboDosDados,carimbarTexto,carimbar,INDEX,SITE,RAIZ};
if(require.main===module)carimbar();
