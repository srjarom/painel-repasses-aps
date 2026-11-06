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

`PainelDados.registrarGeo('RS', [ { id: "430003", name: "Aceguá", polys: [[[ [lon, lat], … ]]] }, … ])`: contornos simplificados dos municípios para o mapa. Fonte: IBGE, via o projeto `tbrugz/geodata-br`. Hoje falta Pinto Bandeira (431454), emancipado depois da malha usada. O município aparece no ranking e nos relatórios, só não no mapa.

## Expandir para outro estado (roteiro)

1. Gerar `dados/geo/<UF>.js` no mesmo formato.
2. Na manutenção, permitir escolher a UF. Hoje ela usa `UF_ATUAL` de `site/js/base.js`.
3. No painel, incluir os `<script>` do novo estado em `site/index.html` e criar um seletor de estado que troque `UF_ATUAL` e recarregue a tela.
4. Ajustar textos fixos que dizem "Rio Grande do Sul" (`site/index.html`, título do mapa e PDFs).

Se `formato` precisar mudar (por exemplo, nova coluna), aumente o número e trate as duas versões em `PainelDados.municipios()`.
