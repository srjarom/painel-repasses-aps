/* =========================================================================
   BASE — valores da Portaria, quadrimestres e formatação
   -------------------------------------------------------------------------
   Tudo o que é "regra fixa" e usado em vários lugares do painel:
   - valores por equipe da Portaria GM/MS nº 3.493/2024 (Fixo/IED, Vínculo, Qualidade);
   - cores e ordem das classificações (Ótimo, Bom, Suficiente, Regular);
   - leitura e formatação de quadrimestres ("2026Q2", "Q2/26"…) e de valores em R$.
   Se a Portaria mudar algum valor, é AQUI que se atualiza (ver docs/REGRAS_DE_NEGOCIO.md).

   UF_ATUAL: estado exibido agora no painel (muda pelo seletor de estado — ver estados.js).
   ESTADOS: as 27 UFs, com o nome, a preposição ("do Rio Grande do Sul", "da Bahia",
   "de São Paulo") e o código IBGE de 2 dígitos (o começo do código de cada município).
   ========================================================================= */

let UF_ATUAL='RS';
const UF_PADRAO='RS';
const ESTADOS=[
  {uf:'AC',nome:'Acre',de:'do',cod:'12'},{uf:'AL',nome:'Alagoas',de:'de',cod:'27'},
  {uf:'AP',nome:'Amapá',de:'do',cod:'16'},{uf:'AM',nome:'Amazonas',de:'do',cod:'13'},
  {uf:'BA',nome:'Bahia',de:'da',cod:'29'},{uf:'CE',nome:'Ceará',de:'do',cod:'23'},
  {uf:'DF',nome:'Distrito Federal',de:'do',cod:'53'},{uf:'ES',nome:'Espírito Santo',de:'do',cod:'32'},
  {uf:'GO',nome:'Goiás',de:'de',cod:'52'},{uf:'MA',nome:'Maranhão',de:'do',cod:'21'},
  {uf:'MT',nome:'Mato Grosso',de:'de',cod:'51'},{uf:'MS',nome:'Mato Grosso do Sul',de:'de',cod:'50'},
  {uf:'MG',nome:'Minas Gerais',de:'de',cod:'31'},{uf:'PA',nome:'Pará',de:'do',cod:'15'},
  {uf:'PB',nome:'Paraíba',de:'da',cod:'25'},{uf:'PR',nome:'Paraná',de:'do',cod:'41'},
  {uf:'PE',nome:'Pernambuco',de:'de',cod:'26'},{uf:'PI',nome:'Piauí',de:'do',cod:'22'},
  {uf:'RJ',nome:'Rio de Janeiro',de:'do',cod:'33'},{uf:'RN',nome:'Rio Grande do Norte',de:'do',cod:'24'},
  {uf:'RS',nome:'Rio Grande do Sul',de:'do',cod:'43'},{uf:'RO',nome:'Rondônia',de:'de',cod:'11'},
  {uf:'RR',nome:'Roraima',de:'de',cod:'14'},{uf:'SC',nome:'Santa Catarina',de:'de',cod:'42'},
  {uf:'SP',nome:'São Paulo',de:'de',cod:'35'},{uf:'SE',nome:'Sergipe',de:'de',cod:'28'},
  {uf:'TO',nome:'Tocantins',de:'do',cod:'17'}
];
function estadoInfo(uf){return ESTADOS.find(e=>e.uf===uf)||{uf,nome:uf,de:'de',cod:''};}
function nomeComPrep(uf){const e=estadoInfo(uf);return `${e.de} ${e.nome}`;}   // "do Rio Grande do Sul"
function ufDoIbge(ib){const c=String(ib||'').slice(0,2);const e=ESTADOS.find(x=>x.cod===c);return e?e.uf:'';}

const FIXO_ESTRATO={eSF:{1:18000,2:16000,3:14000,4:12000},eAP30:{1:10800,2:9600,3:8400,4:7200},eAP20:{1:7200,2:6400,3:5600,4:4800}};
// Valor fixo mensal por equipe (não depende do estrato IED).
//   eSB e eMulti: implantação/manutenção, conforme a modalidade.
//   eSFR: custeio mensal de R$ 24.000 por equipe (PRC 6/2017, art. 69, redação da Portaria GM/MS nº 5.850/2024).
//   eCR:  custeio mensal por modalidade — I R$ 20.000, II R$ 28.000, III R$ 36.000 (PRC 6/2017, art. 84,
//         redação da Portaria GM/MS nº 7.799/2025).
//   eAPP: o custeio mensal não entra no cálculo — não há valor federal vigente confirmado (só a Qualidade conta).
const FIXO_FLAT={I_comum:4014,II_comum:7064,I_quil:6021,II_quil:10596,ampliada:36000,complementar:24000,estrategica:12000,
  eSFR:24000,eCR_I:20000,eCR_II:28000,eCR_III:36000};
const VINCULO={eSF:{"Ótimo":8000,"Bom":6000,"Suficiente":4000,"Regular":2000},eAP30:{"Ótimo":4000,"Bom":3000,"Suficiente":2000,"Regular":1000},eAP20:{"Ótimo":3000,"Bom":2250,"Suficiente":1500,"Regular":750}};
const QUALIDADE={
  eSF:{"Ótimo":8000,"Bom":6000,"Suficiente":4000,"Regular":2000},eAP30:{"Ótimo":4000,"Bom":3000,"Suficiente":2000,"Regular":1000},eAP20:{"Ótimo":3000,"Bom":2250,"Suficiente":1500,"Regular":750},
  ampliada:{"Ótimo":9000,"Bom":6750,"Suficiente":4500,"Regular":2250},complementar:{"Ótimo":6000,"Bom":4500,"Suficiente":3000,"Regular":1500},estrategica:{"Ótimo":3000,"Bom":2250,"Suficiente":1500,"Regular":750},
  I_comum:{"Ótimo":2449,"Bom":1836.75,"Suficiente":1224.5,"Regular":612.25},II_comum:{"Ótimo":3267,"Bom":2450.25,"Suficiente":1633.5,"Regular":816.75},
  I_quil:{"Ótimo":3673.5,"Bom":2755.13,"Suficiente":1836.75,"Regular":918.38},II_quil:{"Ótimo":4900.5,"Bom":3675.38,"Suficiente":2450.25,"Regular":1225.13},
  // Anexo XCIX-B (redação da Portaria GM/MS nº 7.799/2025): eSFR, eCR (modalidades I a III) e eAPP
  eSFR:{"Ótimo":8000,"Bom":6000,"Suficiente":4000,"Regular":2000},
  eCR_III:{"Ótimo":8000,"Bom":6000,"Suficiente":4000,"Regular":2000},eCR_II:{"Ótimo":7000,"Bom":5250,"Suficiente":3500,"Regular":1750},
  eCR_I:{"Ótimo":6000,"Bom":4500,"Suficiente":3000,"Regular":1500},
  eAPP_amp30:{"Ótimo":8000,"Bom":6000,"Suficiente":4000,"Regular":2000},eAPP_amp20:{"Ótimo":6000,"Bom":4500,"Suficiente":3000,"Regular":1500},
  eAPP_ess30:{"Ótimo":7000,"Bom":5250,"Suficiente":3500,"Regular":1750},eAPP_ess20:{"Ótimo":5000,"Bom":3750,"Suficiente":2500,"Regular":1250}
};
// Tipos de equipe do cálculo, na ordem em que aparecem na tela.
//   n = coluna com o nº de equipes; q = coluna de Qualidade; v = coluna de Vínculo (CVAT, só eSF e eAP).
const TIPOS_EQUIPE=[
  {k:'esf',l:'eSF',n:'vEsf',q:'qEsf',v:'vEsf'},
  {k:'eap',l:'eAP',n:'vEap',q:'qEap',v:'vEap'},
  {k:'esfr',l:'eSFR',n:'qEsfr',q:'qEsfr'},
  {k:'esb',l:'eSB',n:'qEsb',q:'qEsb'},
  {k:'emulti',l:'eMulti',n:'qEmulti',q:'qEmulti'},
  {k:'eapp',l:'eAPP',n:'qEapp',q:'qEapp'},
  {k:'ecr',l:'eCR',n:'qEcr',q:'qEcr'}
];
// modalidades padrão (quando a modalidade real do município não é conhecida)
const PARAMS_PADRAO_MUNI={estrato:'',eapMod:'30',esbMod:'II_comum',emultiMod:'complementar',ecrMod:'I',eappMod:'ess20'};
// tabelas de Qualidade, Vínculo e valor fixo de cada tipo, conforme as modalidades do município
function tabelasTipos(p){
  const ek=p.eapMod==='30'?'eAP30':'eAP20';
  const ecr='eCR_'+(p.ecrMod||PARAMS_PADRAO_MUNI.ecrMod),eapp='eAPP_'+(p.eappMod||PARAMS_PADRAO_MUNI.eappMod);
  const est=p.estrato;
  return{ek,
    Q:{esf:QUALIDADE.eSF,eap:QUALIDADE[ek],esfr:QUALIDADE.eSFR,esb:QUALIDADE[p.esbMod],emulti:QUALIDADE[p.emultiMod],
       eapp:QUALIDADE[eapp],ecr:QUALIDADE[ecr]},
    V:{esf:VINCULO.eSF,eap:VINCULO[ek]},
    F:{esf:est?FIXO_ESTRATO.eSF[est]:0,eap:est?FIXO_ESTRATO[ek][est]:0,esfr:FIXO_FLAT.eSFR,
       esb:FIXO_FLAT[p.esbMod],emulti:FIXO_FLAT[p.emultiMod],eapp:0,ecr:FIXO_FLAT[ecr]}};
}
const CC={"Ótimo":"#2E6FE0","Bom":"#3E9B4F","Suficiente":"#E0A82E","Regular":"#D0483C"};
const CO=["Ótimo","Bom","Suficiente","Regular"];
// quadParts(): extrai {q:número do quadrimestre, y:ano} de qualquer um dos dois formatos
// que os relatórios do SIAPS usam para o mesmo dado — o relatório principal escreve o
// quadrimestre primeiro ("1º Quadrimestre/2025"), já o relatório "Qualidade – Conceito
// obtido por indicador" (v1.17.0) escreve o ano primeiro ("2025Q2"). Centralizar aqui faz
// quadKey/abbrevQuad/quadLabel entenderem os dois sem precisar normalizar cada arquivo.
function quadParts(q){
  const s=String(q);
  let m=s.match(/(\d)[^\d]*?(\d{4})/);
  if(m)return{q:+m[1],y:+m[2]};
  m=s.match(/(\d{4})[^\d]*?(\d)/);
  if(m)return{q:+m[2],y:+m[1]};
  return null;
}
function abbrevQuad(q){
  const p=quadParts(q);
  return p?`${p.q}ºQ/${String(p.y).slice(2)}`:String(q);
}
function quadLabel(q){
  const p=quadParts(q);
  return p?`${p.q}º Quad/${p.y}`:String(q);
}
// chave cronológica do quadrimestre (nº do quadrimestre + ano), pois o texto bruto ("1º Quadrimestre/2025")
// não ordena corretamente com sort() alfabético ao cruzar virada de ano (ex.: 2025 -> 2026)
function quadKey(q){
  const p=quadParts(q);
  return p?p.y*10+p.q:0;
}
const fmtBRL=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});


function qCode(q){const p=quadParts(q);return p?`${p.y}Q${p.q}`:String(q);}
function qShort(q){const p=quadParts(q);return p?`Q${p.q}/${String(p.y).slice(2)}`:String(q);}
function qCodeKey(k){return `${Math.floor(k/10)}Q${k%10}`;}
function qShortKey(k){return `Q${k%10}/${String(Math.floor(k/10)).slice(2)}`;}
function joinPt(arr){
  if(!arr.length)return '';
  if(arr.length===1)return arr[0];
  return arr.slice(0,-1).join(', ')+' e '+arr[arr.length-1];
}
function numExt(n){return({2:'dois',3:'três',4:'quatro',5:'cinco',6:'seis'})[n]||String(n);}
function clsTotal(c){return c?(c.Regular||0)+(c.Suficiente||0)+(c.Bom||0)+(c['Ótimo']||0):0;}
function indScore(c){
  const t=clsTotal(c);if(!t)return null;
  return CLASS_ORDEM.reduce((s,k)=>s+(c[k]||0)*PESO_CONCEITO[k],0)/t;
}

// Nome de município sem acento, sem "PM ", sem "-RS"/"/SP" no fim — usado para casar nomes
// vindos de planilhas (ex.: lista de clientes do comercial) com o código IBGE.
const SIGLAS_UF=new Set(ESTADOS.map(e=>e.uf));
function normNomeCliente(x){
  let s=String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();
  s=s.replace(/^\s*(P\.?\s?M\.?|PREFEITURA MUNICIPAL DE|PREFEITURA DE|MUNICIPIO DE)\s+/,'');
  s=s.replace(/\s*[-\/]\s*([A-Z]{2})\s*$/,(m,uf)=>SIGLAS_UF.has(uf)?'':m);
  return s.replace(/[^A-Z]+/g,' ').trim();
}
