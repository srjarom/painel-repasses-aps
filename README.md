# Painel de Repasses APS — Governança Brasil

Painel de monitoramento do repasse federal da Atenção Primária à Saúde (Portaria GM/MS nº 3.493/2024, "Saúde Brasil 360") por município. Ele mostra quanto cada município recebe por mês, a tendência em relação ao quadrimestre anterior, as equipes que saíram do relatório e quanto ainda pode ser conquistado. Também gera os PDFs para apresentar ao município.

- **Usuários:** equipes da Governança Brasil. O painel é **só de consulta**.
- **Responsável pelo painel (código, dados e publicação):** Jarom Rosa.
- **Infraestrutura / TI:** autoriza a publicação no hub. Veja a [ficha técnica](docs/FICHA_TECNICA.md).
- **Versão atual:** 4.16.3. Veja o [histórico](docs/HISTORICO_DE_VERSOES.md).

---

## O que tem em cada pasta

```
painel-repasses-aps/
├── site/                  ← O PAINEL. É só esta pasta que vai para o hub.
│   ├── index.html         página principal (abre com dois cliques)
│   ├── css/painel.css     aparência (cores, modo escuro, celular)
│   ├── js/                código, um arquivo por assunto (ver lista abaixo)
│   ├── dados/             OS DADOS — gerados pela ferramenta de manutenção
│   │   ├── indice.js        estados publicados + resumo de cada um (tela do Brasil)
│   │   ├── busca.js         nomes dos municípios do Brasil (busca do topo)
│   │   ├── uf/<UF>.js       municípios de cada estado: equipes, classificações, indicadores
│   │   ├── clientes.js      lista de clientes GOVBR Saúde / Celk (só IBGE + nome)
│   │   ├── estratos-ied.js  estrato IED dos 5.570 municípios (Anexo VI da Portaria)
│   │   └── geo/<UF>.js      contornos do mapa dos 27 estados e do Brasil (BR.js), do IBGE
│   ├── img/               logos e ícones
│   ├── fontes/            fontes oficiais (Guanabara Sans e IBM Plex Sans) para a web
│   └── vendor/            bibliotecas prontas (gráficos e PDF) — não mexer
│
├── manutencao/            ← SÓ DO RESPONSÁVEL PELOS DADOS. NUNCA publicar.
│   ├── atualizar-dados.html   ferramenta para importar SIAPS e clientes
│   ├── js/                    leitura das planilhas e geração dos arquivos
│   └── vendor/                biblioteca de leitura de Excel
│
├── marca/fontes/          ← arquivos originais das fontes da marca (não publicar)
├── docs/                  ← documentação (em português simples)
└── testes/                ← teste automático opcional (antes de publicar)
```

### Código do painel (`site/js/`)

| Arquivo | O que faz |
|---|---|
| `dados.js` | Recebe os arquivos de `site/dados/` e entrega aos demais. |
| `base.js` | Valores da Portaria, quadrimestres, formatação em R$. **Se a Portaria mudar, é aqui.** |
| `calculo.js` | Cálculo do repasse (Fixo/IED, Vínculo, Qualidade), do potencial e da margem. |
| `carteira.js` | Tela "Painel do estado": totais, ranking e navegação. |
| `mapa.js` | Mapa do estado. |
| `estados.js` | Navegação Brasil → estado → município: endereço (`?uf=SC`, `?uf=SC&m=420540`), voltar do navegador e abas do estado. |
| `brasil.js` | Tela inicial do Brasil (números, mapa por estado, lista dos estados) e a busca do topo. |
| `resumo.js` | Números de cada município e o resumo de cada estado (usado na tela do Brasil e pela manutenção). |
| `tendencia.js` | Tendência (subiu / igual / caiu). |
| `alerta-equipes.js` | Alerta "Possível perda de equipes". |
| `clientes.js` | Filtro "Só clientes GOVBR Saúde / Celk". |
| `municipio.js`, `graficos.js`, `diagnostico.js`, `raiox.js` | Tela do município (Visão geral, Raio-X, Diagnóstico, Detalhamento). |
| `pdf/` | Os três PDFs: relatório do quadrimestre, resumo para o secretário e Raio-X. |
| `tema.js`, `tema-inicial.js` | Modo claro/escuro. |
| `versao.js` | Número da versão e histórico (rodapé). |
| `inicio.js` | Roda por último e abre o painel. |

---

## Como abrir o painel no seu computador

Dê dois cliques em `site/index.html`. Ele abre no navegador sem precisar de internet nem de servidor.

## Como atualizar os dados (a cada novo quadrimestre do SIAPS)

Resumo:

1. Baixe os dois relatórios no SIAPS (pode marcar vários estados de uma vez).
2. Abra `manutencao/atualizar-dados.html`.
3. Importe os relatórios.
4. Baixe os arquivos gerados e coloque-os em `site/dados/`.
5. Confira o painel e envie para o GitHub.

O passo a passo completo está em [docs/ATUALIZAR_OS_DADOS.md](docs/ATUALIZAR_OS_DADOS.md).

## Como publicar no hub

Depois da autorização da Infraestrutura/TI, siga [docs/PUBLICAR_NO_HUB.md](docs/PUBLICAR_NO_HUB.md). **Só a pasta `site/` é publicada.**

## Como guardar as mudanças no GitHub

Veja [docs/PRIMEIROS_PASSOS_GITHUB.md](docs/PRIMEIROS_PASSOS_GITHUB.md). Ele explica, do zero, como usar o GitHub Desktop e o VS Code.

## Outros documentos

- [docs/REGRAS_DE_NEGOCIO.md](docs/REGRAS_DE_NEGOCIO.md): como o repasse é calculado e o que cada alerta significa.
- [docs/FICHA_TECNICA.md](docs/FICHA_TECNICA.md): resumo técnico para a autorização da Infraestrutura/TI (arquitetura, dados, LGPD, o que precisa ser autorizado).
- [docs/FONTES.md](docs/FONTES.md): as fontes oficiais, onde estão e a licença.
- [docs/FORMATO_DOS_DADOS.md](docs/FORMATO_DOS_DADOS.md): como os arquivos de `site/dados/` são organizados, para expandir a outros estados.

---

## Cuidados importantes

- **Os valores do painel são estimativas** a partir dos relatórios públicos do SIAPS. Eles **podem divergir do que é efetivamente creditado no Fundo Municipal de Saúde.** Esse aviso aparece na tela e em todos os PDFs e não deve ser removido.
- O painel **não envia nem grava** nada do que o usuário digita. Só guarda no navegador duas preferências: o tema e o filtro de clientes.
- A lista de clientes guarda **só o código IBGE e o nome do cliente**, sem valores de contrato.
- Antes de publicar um link aberto (fora do hub), confirme com a política de TI/IA da empresa.
