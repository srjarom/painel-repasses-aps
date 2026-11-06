# Como publicar o painel no hub

Quem publica é o responsável pelo painel. A publicação só acontece depois da autorização da Infraestrutura/TI (veja a seção 7 da [FICHA_TECNICA.md](FICHA_TECNICA.md)). As instruções do ambiente (onde e como subir os arquivos) vêm dessa autorização. Anote-as no fim deste documento quando as receber.

## A regra de ouro

**Só o conteúdo da pasta `site/` vai para o hub.** Nunca publique `manutencao/`, `marca/`, `docs/` nem `testes/`.

## Antes de publicar (checklist)

1. **Tudo salvo no GitHub:** no GitHub Desktop, não pode haver alterações pendentes. Faça Commit e Push antes.
2. **Painel conferido no seu computador:** abra `site/index.html` com dois cliques e confira:
   - o topo mostra o quadrimestre e a data certos;
   - o mapa aparece colorido;
   - um município abre e o PDF é gerado.
3. **Versão** (só se houve mudança de código, não de dados): atualizada em `site/js/versao.js` e em [HISTORICO_DE_VERSOES.md](HISTORICO_DE_VERSOES.md).
4. **Teste automático** (opcional, se tiver Node instalado): `cd testes`, depois `npm install` (só na primeira vez) e `npm test`. Precisa terminar com "Tudo certo.".

## Publicar

Siga o formato combinado na autorização. Os mais comuns:

- **Envio de arquivos** (upload, pasta de rede, painel do hub): copie **todo o conteúdo de `site/`** para o local do painel, substituindo o que estava lá. Mantenha as subpastas (`css/`, `js/`, `dados/`, `fontes/`, `img/`, `vendor/`) como estão.
- **Publicação automática pelo GitHub** (pipeline ou GitHub Actions): basta o **Push** na branch principal. A automação copia a pasta `site/` sozinha.

## Depois de publicar

1. Abra o endereço do painel no hub e recarregue com **Ctrl+F5**, para não ver a versão guardada no navegador.
2. Confira o rodapé (número da versão) e o "Avaliação mais recente" no topo.
3. Se algo der errado, publique de novo a versão anterior. No GitHub Desktop, use a aba **History** e "Revert changes in commit"; depois, publique de novo.

---

## Instruções do ambiente (preencher após a autorização)

- Endereço do painel:
- Onde/como enviar os arquivos:
- Quem autorizou / data:
- Observações:
