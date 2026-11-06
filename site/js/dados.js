/* =========================================================================
   DADOS PUBLICADOS — leitura (painel) e escrita (ferramenta de manutenção)
   -------------------------------------------------------------------------
   Os dados do painel ficam em arquivos .js dentro de site/dados/, gerados pela
   ferramenta de manutenção (manutencao/atualizar-dados.html). Cada arquivo
   "se registra" aqui ao ser carregado:

     dados/uf/RS.js       PainelDados.registrarUF({...})      municípios + indicadores
     dados/clientes.js    PainelDados.registrarClientes({...}) lista de clientes
     dados/geo/RS.js      PainelDados.registrarGeo('RS',[...]) contornos do mapa

   Por que .js e não .json? Porque assim o painel também abre com dois cliques,
   direto do computador (sem servidor), e funciona igual em qualquer hospedagem.

   Formato compacto (para os arquivos ficarem pequenos e o histórico do Git
   mostrar exatamente quais municípios mudaram — um município por linha):
     quads       ["2025Q3","2026Q1","2026Q2"]  — os demais campos guardam o índice
     tipos       ["eSF","eAP","eSB","eMulti",…] — tipos de equipe do relatório por indicador
     indicadores ["Cuidado da Pessoa com Hipertensão",…]
     municipios[]: { ibge, nome, params:{estrato,eapMod,esbMod,emultiMod},
                     r:   [[quad, classe, vEsf, vEap, qEsf, qEap, qEsb, qEmulti], …],
                     ind: [[quad, tipo, indicador, regular, suficiente, bom, otimo], …] }
     classe: 0=Regular 1=Suficiente 2=Bom 3=Ótimo
   Detalhes em docs/FORMATO_DOS_DADOS.md.
   ========================================================================= */
const PainelDados=(function(){
  const CLASSES=['Regular','Suficiente','Bom','Ótimo'];
  const COLS_R=['vEsf','vEap','qEsf','qEap','qEsb','qEmulti'];
  const ufs={},geos={};
  let clientes=null;

  function registrarUF(d){if(d&&d.uf)ufs[d.uf]=d;}
  function registrarGeo(uf,lista){geos[uf]=lista||[];}
  function registrarClientes(c){clientes=c||null;}

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
        params:Object.assign({estrato:'',eapMod:'30',esbMod:'II_comum',emultiMod:'complementar'},m.params||{}),
        parsed:{nomeMuni:m.nome,uf:d.uf,ibge:m.ibge,rows},
        indicadores:ind.length?{nomeMuni:m.nome,uf:d.uf,ibge:m.ibge,rows:ind}:null
      };
    });
  }

  // ---- escrita (usada só pela ferramenta de manutenção) ----
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
      params:{estrato:String(m.params&&m.params.estrato||''),eapMod:m.params&&m.params.eapMod||'30',
              esbMod:m.params&&m.params.esbMod||'II_comum',emultiMod:m.params&&m.params.emultiMod||'complementar'},
      r:(m.parsed&&m.parsed.rows||[]).slice().sort((a,b)=>quadKey(a.quad)-quadKey(b.quad)||CLASSES.indexOf(a.classe)-CLASSES.indexOf(b.classe))
        .map(r=>[qi.get(r.quad),CLASSES.indexOf(r.classe),...COLS_R.map(c=>+r[c]||0)]),
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

  return{registrarUF,registrarGeo,registrarClientes,municipios,codificarUF,textoArquivoUF,textoArquivoClientes,
    uf:k=>ufs[k]||null,ufs:()=>Object.keys(ufs),geo:k=>geos[k]||[],clientes:()=>clientes};
})();
