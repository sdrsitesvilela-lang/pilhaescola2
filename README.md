# DABDM — Leitor de Voltagem da Pilha

Sistema de Monitoramento de Voltagem para o trabalho escolar de Desenvolvimento Tecnológico.
Evolução da interface PilhaLab existente, agora com registro manual de leituras de um multímetro físico.
Não conecta instrumentos, não precisa de Arduino/ESP32 e não gera medições fictícias.

## Prévia para aprovação, sem publicação

Abra `DABDM-PREVIA.html` no navegador do computador. É um arquivo autossuficiente,
com HTML, CSS, JavaScript e ícone incorporados; funciona sem internet.
No celular, use um navegador que execute HTML local ou sirva `data/` na rede local.
Visualizadores de anexos podem não executar JavaScript.

Para desenvolver, na pasta do projeto:

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory data
```

Acesse a porta 8000 no navegador local. Não há publicação ou hospedagem externa.

## Apresentação em cinco passos

1. Meça a pilha de água e sal no multímetro físico.
2. Escolha o tipo de pilha, digite o valor observado e clique em **Registrar medição**.
3. Consulte o gráfico. Toque para selecionar um ponto ou use o controle abaixo dele (também funciona com setas do teclado).
4. Na calculadora, digite a tensão de uma célula e sua quantidade. Adicione o grupo para obter a soma teórica; grupos diferentes continuam permitidos.
5. Compare duas leituras, consulte o histórico completo e exporte CSV para guardar uma cópia.

A faixa original de entrada, de 0 a 10 V por leitura/célula, e a quantidade de 1 a
100 por grupo foram preservadas. Não altere uma leitura para fazê-la caber: um
valor fora dessa faixa exige ampliar a validação em uma alteração futura.
O total teórico é `Σ(tensão × quantidade)`, sem alteração de `data/logic.js`.
Só se aplica a células em série com mesma orientação; células em paralelo não
somam tensões dessa forma. Um cálculo salvo fica identificado como **CÁLCULO TEÓRICO**.

## Histórico e privacidade

- Mantida a chave original `pilhalab-registros-v1`. Nenhuma limpeza automática.
- Registros anteriores mantêm valores, tipos, horários e campos adicionais.
- Removido o limite de 150 registros: todos permanecem até exclusão confirmada ou limite do navegador.
- Registros legados de sensor, cálculo e simulação ficam identificados no histórico/CSV. O novo gráfico e a comparação usam exclusivamente leituras digitadas do multímetro.
- A persistência depende de usar **o mesmo navegador, perfil e endereço/origem**. Abrir uma cópia HTML em outro endereço não transfere os dados antigos; continue no endereço anterior para acessá-los e exporte uma cópia antes de migrar.
- Se armazenamento estiver indisponível/cheio, um aviso pede exportação; o app não afirma ter salvo. Conteúdo ilegível anterior não é sobrescrito.
- Limpar registros requer confirmação. Exportar CSV não apaga nada.
- Não há analytics, CDN, consultas a APIs ou envio de medições para servidores.

## Abertura e acessibilidade

Abertura decorativa de aproximadamente 2,5 segundos em toda abertura/atualização,
com progresso visual até 100%, partículas CSS e transição suave. Não representa
carregamento de sensor ou medição. Inicialização da aplicação é independente.
Há saída por timer e CSS caso o efeito falhe. Com redução de movimento, a abertura
é dispensada. Campos de 16 px ou mais, alvos de toque, foco visível e safe areas
facilitam uso no celular. Não há bloqueio de zoom.

## Verificação

```sh
node --check data/app.js
node --check data/intro.js
node --check data/logic.js
node --test tests/logic.test.js
node --test tests/*.test.js
```

A suíte de navegador usa `playwright` e Chromium. Instale esses recursos no seu
ambiente de desenvolvimento se ausentes; pode definir `CHROMIUM_PATH` com o caminho
do executável. O aplicativo distribuído não depende de Node nem de Playwright.

Nesta revisão: **14 testes passaram** (8 de lógica + 6 de navegador), cobrindo
animação/reabertura, movimento reduzido, falha do efeito, formulário, gráfico,
comparação, cálculo, CSV, persistência, confirmação de exclusão, falha de
armazenamento, preservação de 180 registros legados e larguras de 320 a 1440 px.
Os testes usam dados controlados em contextos isolados, não exemplos inseridos na prévia.
Safari/WebKit não estava disponível: é necessário conferir a prévia no iPhone
físico, principalmente teclado, download CSV e persistência no navegador escolhido.

## Arquivos

- `data/index.html`, `data/styles.css`, `data/app.js`: interface existente adaptada.
- `data/logic.js`: lógica original preservada integralmente.
- `data/intro.js`: apresentação independente e tolerante a falhas.
- `DABDM-PREVIA.html`: prévia em arquivo único; `PREVIA-SEM-HARDWARE.html` contém a mesma versão atualizada.
- `tests/`: testes de cálculo e integração em navegador.

Na pasta de trabalho, os arquivos antigos de firmware e ligações foram mantidos
apenas como referência histórica. Não fazem parte da execução do DABDM nem são
necessários para esta apresentação. A documentação anterior está em
`docs/README-FIRMWARE-LEGADO.md`.

## Edição editorial — História, Relatório e Equipe

O site agora tem quatro páginas conectadas:

- **Laboratório** (`index.html`): registro manual existente, cálculo, gráfico, comparação e histórico.
- **História** (`historia.html`): seis capítulos baseados no cartaz, com telefone ilustrado que acompanha a rolagem, progresso e animações que se repetem ao revisitar o conteúdo.
- **Relatório** (`relatorio.html`): oito seções revisadas conforme o PDF mais recente, com materiais, montagem, tentativas e resultados documentados. O download do PDF antigo foi temporariamente desativado para evitar inconsistência.
- **Equipe** (`equipe.html`): Davi Guimaraes, Ana Luiza Renar, Bernardo Vilela, Davi Favalessa e Maria Fernanda, conforme a lista atualizada solicitada.

A identidade usa verde profundo, marfim, dourado discreto e tipografia serifada.
O relatório atualizado descreve tentativas e ajustes, sem tensão numérica registrada nem confirmação expressa de LED aceso. Nenhum valor experimental foi inventado. Os metais exatos dos eletrodos não foram identificados no documento; nenhuma reação específica foi atribuída à montagem sem evidência.

Para a prévia completa, **extraia o ZIP inteiro e abra `index.html`**. Mantenha as
outras páginas juntas para que a navegação funcione. A página `relatorio.html` incorpora o conteúdo atualizado do relatório recebido; a cópia antiga em `documentos/` não é apresentada ao visitante nem oferecida para download. O arquivo legado pode ser substituído em uma próxima revisão.
As páginas da prévia incorporam CSS/JS; não dependem de CDN ou fontes externas.
Os links de referências só usam internet quando abertos explicitamente.

Gere novamente as prévias após alterações:

```sh
python scripts/build-preview.py
```

Validação da versão anterior: **16 testes passaram**, incluindo capítulos em ambas as direções,
320–1440 px, nomes da equipe, leitura do PDF, navegação preservando registros,
movimento reduzido e conteúdo visível sem JavaScript. Em segundo plano, o efeito
contínuo é pausado; a rolagem usa eventos passivos e no máximo um frame pendente.
Não há garantia de ausência absoluta de bugs: teste também no Safari/iPhone real,
que não está disponível neste ambiente. Nenhuma publicação foi realizada.
