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
     "r":  [[quad, classe, vEsf, vEap, qEsf, qEap, qEsb, qEmulti], …],
     "ind":[[quad, tipo, indicador, regular, suficiente, bom, otimo], …]},
    …                                               // um município por linha
  ]}));
```

| Campo | Significado |
|---|---|
| `r` | Linhas do relatório "Vínculo e Acompanhamento Territorial e Qualidade". `quad` é um índice em `quads`. `classe`: 0 = Regular, 1 = Suficiente, 2 = Bom, 3 = Ótimo. As demais colunas são quantidades de equipes (ver [REGRAS_DE_NEGOCIO.md](REGRAS_DE_NEGOCIO.md)). |
| `ind` | Linhas do relatório "Qualidade – Conceito obtido por indicador". `quad`, `tipo` e `indicador` são índices nas listas do cabeçalho; os 4 números são quantidades de equipes em cada classificação. |
| `params` | Estrato IED (`"1"` a `"4"`) e modalidades: `eapMod` `"30"`/`"20"`; `esbMod` `I_comum`/`II_comum`/`I_quil`/`II_quil`; `emultiMod` `ampliada`/`complementar`/`estrategica`. |
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

Lista os estados que têm `dados/uf/<UF>.js`. É o que o seletor de estado usa para separar "com dados publicados" de "sem dados ainda", sem precisar baixar todos os estados. A ferramenta de manutenção gera este arquivo junto com os estados.

## Como o painel carrega os estados

`index.html` carrega só `indice.js`, `clientes.js` e `estratos-ied.js`. Quando um estado é escolhido no seletor (`site/js/estados.js`), `PainelDados.carregarEstado(uf)` acrescenta na página os `<script>` de `dados/geo/<UF>.js` e, se o estado estiver no índice, de `dados/uf/<UF>.js`. Usar `<script>`, e não `fetch`, mantém o painel funcionando por duplo clique (`file://`).

O estado escolhido vai para o endereço (`?uf=SC`) e fica guardado no navegador (`localStorage`, chave `painel-repasses-uf`).

Se `formato` precisar mudar (por exemplo, nova coluna), aumente o número e trate as duas versões em `PainelDados.municipios()`.
