/* =========================================================================
   DADOS PUBLICADOS — leitura (painel) e escrita (ferramenta de manutenção)
   -------------------------------------------------------------------------
   Os dados do painel ficam em arquivos .js dentro de site/dados/, gerados pela
   ferramenta de manutenção (manutencao/atualizar-dados.html). Cada arquivo
   "se registra" aqui ao ser carregado:

     dados/indice.js      PainelDados.registrarIndice({...})   estados com dados publicados
     dados/uf/<UF>.js     PainelDados.registrarUF({...})      municípios + indicadores
     dados/clientes.js    PainelDados.registrarClientes({...}) lista de clientes (todos os estados)
     dados/geo/<UF>.js    PainelDados.registrarGeo('RS',[...]) contornos do mapa

   O índice e os clientes carregam junto com a página; os arquivos de cada estado
   (uf/ e geo/) só quando o estado é escolhido no seletor (carregarEstado).

   Por que .js e não .json? Porque assim o painel também abre com dois cliques,
   direto do computador (sem servidor), e funciona igual em qualquer hospedagem.

   Formato compacto (para os arquivos ficarem pequenos e o histórico do Git
   mostrar exatamente quais municípios mudaram — um município por linha):
     quads       ["2025Q3","2026Q1","2026Q2"]  — os demais campos guardam o índice
     tipos       ["eSF","eAP","eSB","eMulti",…] — tipos de equipe do relatório por indicador
     indicadores ["Cuidado da Pessoa com Hipertensão",…]
     municipios[]: { ibge, nome, params:{estrato,eapMod,esbMod,emultiMod[,ecrMod,eappMod]},
                     r:   [[quad, classe, vEsf, vEap, qEsf, qEap, qEsb, qEmulti[, qEsfr, qEapp, qEcr]], …],
                     (as 3 últimas colunas — eSFR, eAPP e eCR — só aparecem quando não são zero)
                     ind: [[quad, tipo, indicador, regular, suficiente, bom, otimo], …] }
     classe: 0=Regular 1=Suficiente 2=Bom 3=Ótimo
   Detalhes em docs/FORMATO_DOS_DADOS.md.
   ========================================================================= */
const PainelDados=(function(){
  const CLASSES=['Regular','Suficiente','Bom','Ótimo'];
  const COLS_R=['vEsf','vEap','qEsf','qEap','qEsb','qEmulti','qEsfr','qEapp','qEcr'];
  const ufs={},geos={};
  let clientes=null,indice={},busca=[];

  function registrarUF(d){if(d&&d.uf)ufs[d.uf]=d;}
  function registrarGeo(uf,lista){geos[uf]=lista||[];}
  function registrarClientes(c){clientes=c||null;}
  // dados/indice.js: quais estados têm dados publicados (para o seletor saber sem baixar tudo)
  function registrarIndice(i){indice=i||{};}
  // dados/busca.js: [[ibge,nome],…] de todos os municípios do Brasil, para a busca do topo
  function registrarBusca(l){busca=l||[];}

  // Carrega um arquivo de dados só quando ele é preciso (cada estado ~1 MB).
  // Usa <script> em vez de fetch: assim funciona também abrindo o painel com dois cliques (file://).
  const carregados={};
  function carregarScript(src){
    if(!carregados[src])carregados[src]=new Promise(ok=>{
      const s=document.createElement('script');
      s.src=src;s.onload=()=>ok(true);s.onerror=()=>{delete carregados[src];ok(false);};
      document.head.appendChild(s);
    });
    return carregados[src];
  }
  // base = caminho até a pasta site/ ('' no painel, '../site/' na manutenção)
  async function carregarEstado(uf,base=''){
    const tarefas=[];
    if(!geos[uf])tarefas.push(carregarScript(`${base}dados/geo/${uf}.js`));
    if(!ufs[uf]&&indice[uf])tarefas.push(carregarScript(`${base}dados/uf/${uf}.js`));
    await Promise.all(tarefas);
    return !!ufs[uf];
  }

  // Converte o formato compacto no formato usado pelo resto do painel
  // (o mesmo que a antiga "carteira" usava: parsed.rows / indicadores.rows / params).
  function municipios(uf){
    const d=ufs[uf];if(!d)return[];
    return d.municipios.map(m=>{
      const rows=(m.r||[]).map(x=>{
        const o={quad:d.quads[x[0]],classe:CLASSES[x[1]]};
        COLS_R.forEach((c,i)=>o[c]=x[2+i]||0);
        return o;
      });
      const ind=(m.ind||[]).map(x=>({quad:d.quads[x[0]],tipo:d.tipos[x[1]],indicador:d.indicadores[x[2]],
        regular:x[3]||0,suficiente:x[4]||0,bom:x[5]||0,otimo:x[6]||0}));
      return{
        id:m.ibge,ibge:m.ibge,nomeMuni:m.nome,uf:d.uf,
        params:Object.assign({},PARAMS_PADRAO_MUNI,m.params||{}),
        parsed:{nomeMuni:m.nome,uf:d.uf,ibge:m.ibge,rows},
        indicadores:ind.length?{nomeMuni:m.nome,uf:d.uf,ibge:m.ibge,rows:ind}:null
      };
    });
  }

  // ---- escrita (usada só pela ferramenta de manutenção) ----
  // parâmetros gravados no arquivo: os quatro de sempre; ecrMod/eappMod só quando diferem do padrão
  function paramsParaArquivo(p){
    p=Object.assign({},PARAMS_PADRAO_MUNI,p||{});
    const o={estrato:String(p.estrato||''),eapMod:p.eapMod,esbMod:p.esbMod,emultiMod:p.emultiMod};
    if(p.ecrMod!==PARAMS_PADRAO_MUNI.ecrMod)o.ecrMod=p.ecrMod;
    if(p.eappMod!==PARAMS_PADRAO_MUNI.eappMod)o.eappMod=p.eappMod;
    return o;
  }
  // lista: municípios no formato do painel ({ibge,nomeMuni,params,parsed:{rows},indicadores:{rows}})
  function codificarUF(uf,lista,meta){
    const qs=new Set(),ts=new Set(),is=new Set();
    lista.forEach(m=>{
      (m.parsed&&m.parsed.rows||[]).forEach(r=>qs.add(r.quad));
      (m.indicadores&&m.indicadores.rows||[]).forEach(r=>{qs.add(r.quad);ts.add(r.tipo);is.add(r.indicador);});
    });
    const quads=[...qs].sort((a,b)=>quadKey(a)-quadKey(b));
    const tipos=[...ts],indicadores=[...is];
    const qi=new Map(quads.map((q,i)=>[q,i])),ti=new Map(tipos.map((t,i)=>[t,i])),ii=new Map(indicadores.map((t,i)=>[t,i]));
    const ord=(a,b)=>a.nomeMuni.localeCompare(b.nomeMuni,'pt-BR');
    const municipiosC=[...lista].sort(ord).map(m=>({
      ibge:String(m.ibge),nome:m.nomeMuni,
      params:paramsParaArquivo(m.params),
      r:(m.parsed&&m.parsed.rows||[]).slice().sort((a,b)=>quadKey(a.quad)-quadKey(b.quad)||CLASSES.indexOf(a.classe)-CLASSES.indexOf(b.classe))
        .map(r=>{const a=[qi.get(r.quad),CLASSES.indexOf(r.classe),...COLS_R.map(c=>+r[c]||0)];
          while(a.length>8&&a[a.length-1]===0)a.pop();   // eSFR/eAPP/eCR zerados não ocupam espaço
          return a;}),
      ind:(m.indicadores&&m.indicadores.rows||[]).slice().sort((a,b)=>quadKey(a.quad)-quadKey(b.quad))
        .map(r=>[qi.get(r.quad),ti.get(r.tipo),ii.get(r.indicador),r.regular||0,r.suficiente||0,r.bom||0,r.otimo||0])
    }));
    return Object.assign({formato:1,uf,atualizadoEm:new Date().toISOString().slice(0,10)},meta||{},{quads,tipos,indicadores,municipios:municipiosC});
  }
  // texto do arquivo dados/uf/<UF>.js — um município por linha (diffs legíveis no Git)
  function textoArquivoUF(obj){
    const {municipios:ms,...cab}=obj;
    return `/* Dados do Painel de Repasses APS — ${obj.uf}. Gerado pela ferramenta de manutenção em ${obj.atualizadoEm}.\n`+
      `   NÃO editar à mão: para atualizar, use manutencao/atualizar-dados.html (ver docs/ATUALIZAR_OS_DADOS.md). */\n`+
      `PainelDados.registrarUF(Object.assign(${JSON.stringify(cab)},{municipios:[\n`+
      ms.map(m=>JSON.stringify(m)).join(',\n')+`\n]}));\n`;
  }
  function textoArquivoClientes(c){
    const {lista,...cab}=c;
    return `/* Lista de clientes GOVBR Saúde / Celk do Painel de Repasses APS. Gerado pela ferramenta de manutenção.\n`+
      `   Só código IBGE + nome do cliente (nenhum dado de contrato). NÃO editar à mão. */\n`+
      `PainelDados.registrarClientes(Object.assign(${JSON.stringify(cab)},{lista:[\n`+
      (lista||[]).map(x=>JSON.stringify(x)).join(',\n')+`\n]}));\n`;
  }

  // texto do arquivo dados/indice.js (gerado pela manutenção junto com o arquivo do estado)
  function textoArquivoIndice(ind){
    const ks=Object.keys(ind).sort();
    return `/* Estados com dados publicados no Painel de Repasses APS. Gerado pela ferramenta de manutenção.\n`+
      `   NÃO editar à mão: é atualizado junto com o arquivo do estado (ver docs/ATUALIZAR_OS_DADOS.md). */\n`+
      `PainelDados.registrarIndice({\n`+ks.map(k=>JSON.stringify(k)+':'+JSON.stringify(ind[k])).join(',\n')+`\n});\n`;
  }
  // texto do arquivo dados/busca.js — um município por linha
  function textoArquivoBusca(lista){
    return `/* Nomes de todos os municípios com dados publicados — usados só pela busca do topo do painel.\n`+
      `   Gerado pela ferramenta de manutenção junto com o índice. NÃO editar à mão. */\n`+
      `PainelDados.registrarBusca([\n`+lista.map(x=>JSON.stringify(x)).join(',\n')+`\n]);\n`;
  }
  // resumo de um estado para o índice
  function resumoIndice(d){
    const ult=d.quads[d.quads.length-1]||'';
    return{atualizadoEm:d.atualizadoEm,municipios:d.municipios.length,ultimoQuad:ult&&typeof qCode==='function'?qCode(ult):ult};
  }

  return{registrarUF,registrarGeo,registrarClientes,registrarIndice,registrarBusca,carregarEstado,textoArquivoBusca,busca:()=>busca,
    municipios,codificarUF,textoArquivoUF,textoArquivoClientes,textoArquivoIndice,resumoIndice,
    carregarScript,uf:k=>ufs[k]||null,ufs:()=>Object.keys(ufs),geo:k=>geos[k]||[],clientes:()=>clientes,indice:()=>indice};
})();
