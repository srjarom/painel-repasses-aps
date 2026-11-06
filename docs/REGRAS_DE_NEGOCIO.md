# Regras de negócio do painel

Referência: **Portaria GM/MS nº 3.493/2024** (cofinanciamento federal da APS, "Saúde Brasil 360"). Os valores ficam em `site/js/base.js`. **Se a Portaria mudar, é lá que se atualiza.** O cálculo fica em `site/js/calculo.js`.

> **Aviso obrigatório:** os valores são **estimativas** a partir dos relatórios públicos do SIAPS e **podem divergir do que é efetivamente creditado no Fundo Municipal de Saúde** (descontos, ajustes, competências, equipes em homologação etc.). O aviso aparece na tela e em todos os PDFs e deve continuar lá.

## 1. De onde vêm os números

São dois relatórios públicos do SIAPS ("Avaliação do Quadrimestre"):

1. **Vínculo e Acompanhamento Territorial e Qualidade**: por município, quadrimestre e classificação (Ótimo, Bom, Suficiente, Regular), traz a quantidade de equipes:
   - eSF e eAP em **Vínculo** (colunas `vEsf`, `vEap`);
   - eSF, eAP, eSB e eMulti em **Qualidade** (`qEsf`, `qEap`, `qEsb`, `qEmulti`).
2. **Qualidade – Conceito obtido por indicador**: por município, quadrimestre, tipo de equipe e indicador, quantas equipes ficaram em cada classificação. Alimenta o **Raio-X por indicador** e o "indicador mais crítico" do ranking.

Cada avaliação de quadrimestre define o repasse **dos meses seguintes**. O painel trata o valor calculado como **repasse mensal** e estima o quadrimestre como 4 × o valor mensal.

## 2. Parâmetros de cada município

| Parâmetro | Valores | Origem |
|---|---|---|
| Estrato IED | I a IV | Anexo VI da Portaria, pelo código IBGE (`site/dados/estratos-ied.js`) |
| Modalidade eAP | 30h ou 20h | Padrão 30h; ajustável na manutenção |
| Modalidade eSB | I ou II, comum ou quilombola/assentamento | Padrão II comum |
| Modalidade eMulti | Ampliada, Complementar, Estratégica | Padrão Complementar |

Na tela do município, o usuário pode mudar esses parâmetros para **simular**. Nada é salvo. Os oficiais são os publicados pela manutenção.

## 3. Cálculo do repasse mensal (por quadrimestre)

**Repasse = Fixo/IED + Vínculo (CVAT) + Qualidade**

- **Componente Fixo/IED:** número de equipes × valor fixo por equipe.
  - eSF e eAP: o valor depende do **estrato** (e da carga horária, na eAP). A contagem usa as equipes da coluna de Vínculo.
  - eSB e eMulti: valor fixo pela modalidade.
  - Sem estrato definido, o Fixo fica zerado. A manutenção avisa quando isso acontece.
- **Vínculo (CVAT):** para cada classificação, equipes eSF/eAP nessa classificação × valor da classificação.
- **Qualidade:** para cada classificação, equipes eSF/eAP/eSB/eMulti nessa classificação × valor da classificação para o tipo ou modalidade.
- **Potencial:** o mesmo cálculo com **todas as equipes em "Ótimo"**. O potencial de Qualidade usa a contagem de equipes avaliadas em Qualidade (corrigido na 1.27.0).
- **Margem em aberto** = Potencial − Repasse atual (nunca negativa).
- **% atingido** = Repasse atual ÷ Potencial.

Tipos que o SIAPS também lista, mas que **não entram no cálculo**: eSFR, eAPP e eCR. Eles aparecem no Raio-X.

## 4. Tendência (subiu, igual, caiu)

- **Variação** = repasse mensal do quadrimestre mais recente − repasse do quadrimestre anterior, comparando valores arredondados ao real.
- **Faixas:** até 2%, de 2% a 5% e acima de 5%. Elas foram escolhidas pela distribuição real do RS (metade das variações fica abaixo de cerca de 3%).
- **Cores:** azul = subiu; cinza = igual; vermelho = caiu. A combinação azul × vermelho é legível para daltônicos.
- Município que **não aparece** no relatório mais recente fica marcado à parte ("fora do relatório"), e não como "caiu".

## 5. Alerta "Possível perda de equipes"

Como o Fixo é **por equipe presente no relatório**, quando o Fixo cai é porque há menos equipes no relatório. As causas possíveis são:

- equipe descredenciada ou desativada no CNES;
- equipe suspensa por não enviar produção;
- equipe não avaliada no quadrimestre;
- dado preliminar.

O alerta serve como ponto de partida para oferecer apoio ao município. Ele funciona assim:

1. **Conta as equipes por tipo em cada quadrimestre.** Primeiro soma cada coluna do relatório; depois, para eSF e eAP, pega o maior valor entre Vínculo e Qualidade.
2. **Desconta conversões entre eAP e eSF.** Por exemplo, uma eAP que virou eSF não é equipe perdida.
3. **Separa três situações:**
   - **Recente:** menos equipes que no quadrimestre anterior.
   - **Anterior que não voltou:** menos equipes que o maior número dos quadrimestres anteriores.
   - **Ausente:** o município nem aparece no relatório mais recente.
4. **Estima o impacto em R$/mês:** equipes a menos × valor médio por equipe daquele tipo no quadrimestre em que elas ainda estavam lá.
5. **Mostra também o que entrou no mesmo período (desde 2.1.0).** Equipes de outro tipo que entraram podem compensar a perda. Exemplo: Rosário do Sul perdeu 1 eMulti (−R$ 24.000 de Fixo), mas ganhou 3 eAP (+R$ 21.600). O Fixo caiu só R$ 2.400 e o repasse total subiu. O alerta continua aparecendo, porque a equipe que saiu ainda merece ser investigada. A aba Detalhamento mostra, quadrimestre a quadrimestre, as equipes de cada tipo e quanto cada mudança alterou o Fixo.

## 6. Raio-X por indicador e "indicador mais crítico"

A nota de cada indicador é a média ponderada das equipes classificadas nele, com os pesos oficiais do SIAPS: Regular 0,25 · Suficiente 0,50 · Bom 0,75 · Ótimo 1. Quanto mais perto de 25%, mais aquele indicador está segurando a equipe abaixo de "Ótimo". O ranking mostra o de menor nota no quadrimestre mais recente.

## 7. "Próximo passo" (resumo para o secretário)

Em vez do potencial máximo, o resumo mostra um ganho realista: o maior ganho mensal de **um grupo de equipes que já existe subir um nível** de classificação (por exemplo, 2 eSF de "Bom" para "Ótimo" em Qualidade).

## 8. Lista de clientes

O filtro "Só clientes GOVBR Saúde / Celk" usa a lista mantida pelo Jarom, que guarda **só o código IBGE e o nome do cliente**. Todos os usuários veem o filtro.
