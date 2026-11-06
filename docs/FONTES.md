# Fontes oficiais da Governança Brasil

| Fonte | Uso no painel | Licença |
|---|---|---|
| **Guanabara Sans** (Rodrigo Saiani / Plau) | Títulos, nome do município, números de destaque | **Comercial.** Licença da Governança Brasil. |
| **IBM Plex Sans** (IBM) | Textos, tabelas, botões, gráficos | SIL Open Font License 1.1, livre |

## Onde estão os arquivos

- **`marca/fontes/`:** arquivos originais (TTF/OTF) recebidos da Governança Brasil. Servem de referência e para regerar os arquivos abaixo. **Não são publicados.**
- **`site/fontes/*.woff2`:** versão para a web, usada pelo painel. Só tem os caracteres do português e a pontuação usada, por isso os 9 arquivos somam 236 KB. É declarada no topo de `site/css/painel.css` (`@font-face`, variáveis `--font-titulo` e `--font-texto`).
- **`site/js/pdf/fontes-pdf.js`:** as mesmas fontes, embutidas nos PDFs (Plex normal, negrito e itálico; Guanabara Bold), cerca de 140 KB.
  - Os geradores de PDF continuam chamando `setFont('helvetica', …)`. A função `prepararFontesPdf()` troca para Plex e, quando o texto é negrito de 13 pt ou mais, para Guanabara.
  - Se der algum problema, o PDF sai em Helvetica.

## Licença da Guanabara Sans (verificar com Marketing/Jurídico)

A Guanabara Sans é uma fonte comercial (foundry Plau, vendida pela MyFonts). O painel usa a fonte de duas formas:

- **web:** a fonte é servida em `site/fontes/`;
- **incorporação em PDF:** os PDFs gerados levam um subconjunto embutido.

Confirme que a licença da empresa cobre os dois usos. Se não cobrir, basta trocar `--font-titulo` para `'IBM Plex Sans'` no CSS e remover a Guanabara de `fontes-pdf.js`. O painel funciona igual.

## Regerar os arquivos (se a fonte for atualizada)

Precisa de Python com `fonttools` e `brotli` (`pip install fonttools brotli`).

1. Antes, os arquivos ganharam o mapeamento do espaço não separável (U+00A0, usado em "R$ 1.000"), que a Guanabara não tem.
2. Depois:

```
pyftsubset "Guanabara Sans Bold.ttf" --unicodes="U+0020-007E,U+00A0-00FF,U+0100-017F,U+2010-2027,U+202F,U+2030-203A,U+20AC,U+2122,U+2190-2193,U+2212,U+2248,U+2264-2265,U+2116" --flavor=woff2 --layout-features="kern,liga,tnum,lnum,case" --output-file=guanabara-700.woff2
```

Para o PDF, use o mesmo comando sem `--flavor`, com `--no-hinting --layout-features=""`. Converta o resultado para base64 dentro de `fontes-pdf.js`.
