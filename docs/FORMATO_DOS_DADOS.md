# Formato dos arquivos de dados (`site/dados/`)

Os arquivos de dados são gerados pela ferramenta de manutenção. **Não edite à mão.** Este documento serve para quem for mexer no código ou expandir o painel para outros estados.

## Por que `.js` e não `.json`

Cada arquivo é um script que "se registra" no objeto `PainelDados` (`site/js/dados.js`). Assim o painel:

- abre por duplo clique (`file://`), sem servidor, porque um navegador não deixa `fetch` de arquivo local;
- funciona igual em qualquer hospedagem estática.

## `dados/uf/<UF>.js`: municípios de um estado

```js
PainelDados.registrarUF(Object.assign(
  { formato: 1, uf: "RS", atualizadoEm: "2026-11-06",
    quads: ["2025Q3", "2026Q1", "2026Q2"],          // quadrimestres (os demais campos usam o índice)
    tipos: ["eAP", "eSF", "eSB", "eMulti", "eAPP", "eCR"],
    indicadores: ["Cuidado da Pessoa com Hipertensão", …] },
  { municipios: [
    {"ibge":"430003","nome":"Aceguá",
     "params":{"estrato":"3","eapMod":"30","esbMod":"II_comum","emultiMod":"complementar"},
     "r":  [[quad, classe, vEsf, vEap, qEsf, qEap, qEsb, qEmulti, qEsfr, qEapp, qEcr], …],   // as 3 últimas só quando não são zero
     "ind":[[quad, tipo, indicador, regular, suficiente, bom, otimo], …]},
    …                                               // um município por linha
  ]}));
```

| Campo | Significado |
|---|---|
| `r` | Linhas do relatório "Vínculo e Acompanhamento Territorial e Qualidade". `quad` é um índice em `quads`. `classe`: 0 = Regular, 1 = Suficiente, 2 = Bom, 3 = Ótimo. As demais colunas são quantidades de equipes (ver [REGRAS_DE_NEGOCIO.md](REGRAS_DE_NEGOCIO.md)). |
| `ind` | Linhas do relatório "Qualidade – Conceito obtido por indicador". `quad`, `tipo` e `indicador` são índices nas listas do cabeçalho; os 4 números são quantidades de equipes em cada classificação. |
| `params` | Estrato IED (`"1"` a `"4"`) e modalidades: `eapMod` `"30"`/`"20"`; `esbMod` `I_comum`/`II_comum`/`I_quil`/`II_quil`; `emultiMod` `ampliada`/`complementar`/`estrategica`; e, só quando diferem do padrão, `ecrMod` `I`/`II`/`III` (padrão `I`) e `eappMod` `ess20`/`ess30`/`amp20`/`amp30` (padrão `ess20`). |
| `nome` | Grafia oficial do IBGE (do arquivo do mapa). Se o município não estiver no mapa, vem do SIAPS com as iniciais maiúsculas. |

O painel converte isso, em `PainelDados.municipios(uf)`, para o formato usado pelo código:

```
{ id, ibge, nomeMuni, uf, params, parsed: { rows:[{quad, classe, vEsf, …}] }, indicadores: { rows:[…] } | null }
```

**Um município por linha** é proposital: no Git, o diff de uma atualização mostra exatamente quais municípios mudaram.

## `dados/clientes.js`: lista de clientes

```js
PainelDados.registrarClientes(Object.assign(
  { rotulo: "GOVBR Saúde / Celk", fonte: "Planilha comercial de clientes", importadoEm: "<data ISO>", naoIdentificados: [ … ] },
  { lista: [ {"ibge":"432240","cliente":"PM URUGUAIANA"}, … ] }));
```

Só código IBGE e nome do cliente. Se o arquivo não existir, o filtro de clientes simplesmente não aparece.

## `dados/estratos-ied.js`

`const ESTRATO_IED = { "110001": 3, … }`: estrato IED (1 a 4) dos 5.570 municípios, chaveado pelo IBGE de 6 dígitos. Fonte: Anexo VI da Portaria GM/MS nº 3.493/2024. Só muda se a Portaria mudar.

## `dados/geo/<UF>.js`

`PainelDados.registrarGeo('RS', [ { id: "430003", name: "Aceguá", polys: [[[ [lon, lat], … ]]] }, … ])`: contornos simplificados dos municípios para o mapa, um arquivo para cada um dos 27 estados. Fonte: IBGE, via o projeto `tbrugz/geodata-br`. Municípios criados depois da malha usada (por exemplo, Pinto Bandeira/RS, 431454) aparecem no ranking e nos relatórios, só não no mapa.

Os mapas foram gerados por `manutencao/ferramentas/gerar-mapas.pl`. Só é preciso rodá-lo de novo se a malha do IBGE mudar (instruções no próprio arquivo).

## `dados/indice.js`: estados publicados

```js
PainelDados.registrarIndice({
"RS":{"atualizadoEm":"2026-11-06","municipios":497,"ultimoQuad":"2026Q2"}
});
```

Lista os estados que têm `dados/uf/<UF>.js` e, desde a versão 4.0.0, traz também o resumo de cada estado no quadrimestre mais recente: `total`, `potencial`, `gap` (margem), `pct` (% do potencial), `delta`/`deltaPct` (variação vs. o anterior), `sobe`/`igual`/`desce` (municípios), `perda`/`perdaImpacto` (municípios com equipes a menos e o impacto estimado) e `primeiroQuad`. É a mesma conta do painel do estado (`site/js/resumo.js`). A tela do Brasil usa só esse resumo, sem baixar os 27 estados. Lista os estados que têm `dados/uf/<UF>.js`. É o que o seletor de estado usa para separar "com dados publicados" de "sem dados ainda", sem precisar baixar todos os estados. A ferramenta de manutenção gera este arquivo junto com os estados.

## `dados/busca.js`: busca do topo

`PainelDados.registrarBusca([["520005","Abadia de Goiás"], …])`: código IBGE e nome de todos os municípios publicados. Só é baixado quando a pessoa clica na busca. Gerado pela manutenção junto com o índice.

## `dados/geo/BR.js`: mapa do Brasil

Contornos dos 27 estados (`id` = sigla), da API de malhas do IBGE. Gerado por `manutencao/ferramentas/gerar-mapa-brasil.pl`.

## Como o painel carrega os estados

`index.html` carrega só `indice.js`, `clientes.js` e `estratos-ied.js`. O mapa do Brasil (`geo/BR.js`) é baixado ao abrir a tela inicial, e a lista da busca (`busca.js`) ao clicar na busca. Quando um estado é escolhido no seletor (`site/js/estados.js`), `PainelDados.carregarEstado(uf)` acrescenta na página os `<script>` de `dados/geo/<UF>.js` e, se o estado estiver no índice, de `dados/uf/<UF>.js`. Usar `<script>`, e não `fetch`, mantém o painel funcionando por duplo clique (`file://`).

O endereço acompanha a navegação: sem parâmetros é a tela do Brasil, `?uf=SC` é o painel do estado e `?uf=SC&m=420540` é o relatório do município. Cada mudança entra no histórico do navegador (`site/js/estados.js`).

Se `formato` precisar mudar (por exemplo, nova coluna), aumente o número e trate as duas versões em `PainelDados.municipios()`.
