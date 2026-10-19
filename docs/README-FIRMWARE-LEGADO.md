# PilhaLab: calculadora manual + voltimetro digital ESP32

Projeto escolar de Informatica / Desenvolvimento Tecnologico. Faz calculos de pilhas em serie no navegador e mostra a tensao **real**, quando o ESP32 e o modulo ADS1115 estao conectados. Possui modo demonstracao **explicitamente simulado**, grafico, historico e CSV. Interface responsiva, adequada ao Safari do iPhone e ao Android, sem internet e sem assinatura.

## O que ja esta pronto

- Interface HTML/CSS/JS mobile e desktop.
- Calculadora por tipo de celula, tensao e quantidade. Suporta grupos de celulas.
- Leitura de tensao real no endpoint `/api/reading`, aprox. 1 vez/s.
- Grafico dos ultimos 48 valores e comparativo manual × medida.
- Historico no navegador, exportacao CSV e simulacao **identificada**.
- Firmware em C++ para ESP32 com servidor HTTP, Wi-Fi proprio e ADS1115.
- Testes automaticos da calculadora (`node --test tests/logic.test.js`).

**Importante:** o software e os testes de logica foram preparados, mas a precisao do sensor e a compatibilidade com a placa so podem ser confirmadas testando no hardware real. Nao informamos resultados experimentais ficticios como reais.

## Material necessario

1. 1 ESP32 DevKit V1, ou placa equivalente com GPIO21/22 e Wi-Fi.
2. 1 conversor ADS1115 I2C (modulo breakout, alimentado em 3,3 V).
3. 1 resistor **1 MΩ** (1 megaohm), 1 resistor **330 kΩ** (330 quiloohms), de preferencia 1%.
4. 1 capacitor **100 nF** (opcional, para suavizar leitura).
5. Protoboard, jumpers, cabo USB para o ESP32 e computador para programar.
6. Pilha experimental: dois metais **diferentes** (por exemplo, cobre e zinco galvanizado), recipiente com agua e sal, cabos de conexao.
7. Multimetro para conferir a leitura (recomendado). Para ligar LED, teste em um circuito separado e use resistor limitador apropriado.

**Uma mistura de agua e sal sozinha nao gera eletricidade:** o conjunto eletroquimico precisa de eletrodos adequados. A potencia pode ser pequena; mesmo detectando tensao, nao e garantido que um LED acenda.

## Ligacoes eletricas (essenciais)

Veja `docs/LIGACOES.txt`.

| Origem | Destino |
|---|---|
| ESP32 `3V3` | ADS1115 `VDD` |
| ESP32 `GND` | ADS1115 `GND` |
| ESP32 `GPIO21` | ADS1115 `SDA` |
| ESP32 `GPIO22` | ADS1115 `SCL` |
| ADS1115 `ADDR` | `GND` (endereco 0x48) |
| Pilha `-` | GND comum ESP32/ADS1115 |
| Pilha `+` | resistor **1 MΩ** → entrada `A0` do ADS1115 |
| Entrada ADS1115 `A0` | resistor **330 kΩ** → GND comum |
| Entrada ADS1115 `A0` | capacitor **100 nF** → GND (opcional) |

O divisor resistivo reduz a tensao: A0 recebe aproximadamente 330/(1000+330) = 24,8% da tensao. O codigo multiplica esse valor pelo fator inverso para recuperar a tensao original. Isso ajuda a proteger o ADS1115, mas ainda e necessaria a precaucao com polaridade e tensoes negativas. O ADS1115 alimentado em 3,3 V nao pode receber diretamente tensoes acima da alimentacao no pino analogico. A faixa de trabalho limitada pelo projeto e **0 a 10 V**, somente com o divisor montado corretamente. Consulte a folha de dados antes de modificar o circuito.

**Eletronica experimental:** a medida nao e garantia de exatidao de laboratorio, especialmente com pilhas de resistencia interna alta. Primeiro meca com multimetro; compare os valores; revise eletrodos, carga, fiacao e tolerancias dos resistores. Nao manipule fios com o circuito energizado. Nunca conecte rede eletrica/tomadas, carregadores, baterias de carro ou fontes desconhecidas ao sensor.

## Passo a passo no computador (VS Code + Codex + PlatformIO)

1. Extraia o arquivo ZIP e abra a pasta `pilha-lab-esp32` no **VS Code**.
2. Instale a extensao **PlatformIO IDE**. Codex pode abrir e evoluir este repositorio sem reescrever as partes existentes.
3. Ligue o ESP32 por USB no computador e identifique a porta serial.
4. Opcional pelo terminal PlatformIO: `pio run` para compilar. Ou use o botao *Build* da extensao.
5. Grave o firmware no ESP32: `pio run -t upload` (botao *Upload* no PlatformIO).
6. **Obrigatorio:** grave os arquivos do site na memoria da placa: `pio run -t uploadfs` (tarefa *Upload Filesystem Image*).
7. Reinicie o ESP32. Abra o monitor serial (`pio device monitor`, velocidade 115200) para ver o diagnostico. Deve aparecer o endereco **192.168.4.1** e, se ligado corretamente, `ADS1115 detectado`.
8. No iPhone ou outro celular, entre no Wi-Fi **PILHA-LAB** com senha **PilhaLab2026**. Pode surgir *Sem conexao com a Internet*: e normal, porque o ESP32 cria uma rede local independente. Permaneca nessa rede.
9. Abra Safari/Chrome e digite **http://192.168.4.1/** (com `http://`, nao `https://`).
10. Use a aba de medicao real e monte a calculadora manual. Salve os resultados e exporte CSV.

**Obs.:** uma fonte de 3,3 V do ESP32 pode alimentar o ADS1115. A **pilha experimental nao alimenta o ESP32**: USB e pilha sao circuitos distintos, com terra comum apenas para referencia de medicao.

## Visualizacao sem hardware (teste da interface)

No PC, abra um terminal dentro da pasta do projeto e execute:

```sh
cd data
python -m http.server 8000
```

Acesse `http://localhost:8000` no navegador. Use o botao **Ativar demonstracao** para ver um sinal **simulado** com grafico. O calculo manual funciona normalmente. O modo real so funciona quando a pagina e servida pelo ESP32 que possui `/api/reading`.

## Explicacao da formula

Quando as celulas estao **ligadas em serie** e com a mesma orientacao, a tensao teorica somada e:

`V_total = (N1 * V1) + (N2 * V2) + ...`

Exemplo **apenas ilustrativo**: 3 celulas de 0,60 V totalizam 1,80 V. O resultado experimental pode ser diferente, principalmente quando se conecta uma carga. **Celulas em paralelo nao somam tensao dessa forma.**

A leitura real do ADS1115 mede a tensao entre os dois terminais conectados ao divisor. Se voce quiser comparar o total de varias celulas, **meca o conjunto inteiro em serie, dentro do limite de 10 V**. Caso meca uma unica celula no sensor, compare com o calculo de uma unica celula.

## Problemas comuns

- **Modo real fica em "Aguardando conexao":** entre na rede Wi-Fi PILHA-LAB, use `http://192.168.4.1` e confirme se o ESP32 esta ligado.
- **Pagina vazia ou arquivos nao encontrados:** rode `pio run -t uploadfs`, reinicie a placa e atualize o Safari.
- **Sensor falha (`/api/reading` HTTP 503):** confira 3,3 V, GND, SDA GPIO21, SCL GPIO22, ADDR ao GND e conexoes do ADS1115. Veja o monitor serial.
- **Mostra 0 V:** pode haver circuito aberto, eletrodos inadequados, resistor/capacitor mal conectado, eletrolito com baixa condutividade ou tensao muito pequena. Confirme com multimetro. Nao invente uma leitura.
- **Valores variando:** contato eletrico ruim, pilha de alta resistencia interna, alteracoes quimicas ou ruido. O capacitor e uma calibracao contra multimetro podem ajudar.
- **Wi-Fi sem internet:** isso e proposital. Nao use um endereco HTTPS ou dominio publicado na internet para ler o sensor sem uma arquitetura diferente.

## Organizacao

```text
pilha-lab-esp32/
├── platformio.ini         Configuracao do PlatformIO
├── src/main.cpp           Firmware Arduino/C++: Wi-Fi, ADC e API
├── data/index.html        Interface
├── data/styles.css        Visual responsivo
├── data/logic.js          Regras da calculadora
├── data/app.js            Sensor, grafico, registro, exportacao
├── data/favicon.svg       Icone
├── tests/logic.test.js    Testes de logica
├── docs/LIGACOES.txt      Desenho textual das ligacoes
├── AGENTS.md              Diretrizes para Codex
└── PROMPT-CODEX.md        Prompt pronto para continuar o desenvolvimento
```

## Privacidade e dados

Os registros ficam salvos apenas no armazenamento local do navegador, e o CSV e gerado localmente. O ESP32 nao transmite dados a nuvem. A senha do Wi-Fi no codigo e demonstrativa; troque-a se for usar em ambiente publico.

## Fontes tecnicas

- [ADS1115 — Texas Instruments (datasheet)](https://www.ti.com/lit/ds/symlink/ads1115.pdf)
- [Adafruit ADS1X15 — exemplo Arduino](https://github.com/adafruit/Adafruit_ADS1X15/blob/master/examples/singleended/singleended.ino)
- [Espressif — Wi-Fi Access Point](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/wifi.html)
- [Espressif — Arduino WebServer e LittleFS](https://github.com/espressif/arduino-esp32/blob/master/libraries/WebServer/examples/WebServer/README.md)

## Revisão da interface e validação (Codex)

- Respostas HTTP antigas são descartadas ao trocar entre sensor e simulação.
- Valores acima de 10 V limpam a leitura e o comparativo e bloqueiam salvar.
- Simulação altera título, descrição, comparação e botão; histórico/CSV preservam a origem.
- O cálculo teórico pode ultrapassar 10 V, mas exibe aviso para não conectar esse conjunto.
- Campos de 16 px evitam zoom automático de foco no Safari; botões de remoção têm área de toque de 44 px; margens respeitam as áreas seguras do iPhone.
- Falha no armazenamento local gera aviso para exportar CSV antes de fechar.
- Firmware usa conversão não bloqueante, timeout e verificação I2C; só disponibiliza leitura após amostragem. LittleFS não é mais formatado automaticamente em caso de falha de montagem.

Validação executada: `node --test tests/logic.test.js` (8 testes),
`node --test tests/*.test.js` (12 testes) e `node --check data/app.js`
/ `node --check data/logic.js`. Teste de navegador Chromium em 375 px:
cálculo manual, simulação, histórico, download CSV e ausência de overflow horizontal.
Isso não substitui teste no Safari/iPhone físico.

PlatformIO não estava instalado no ambiente da revisão: firmware não compilado.
Antes de apresentar, no terminal PlatformIO, dentro desta pasta:

```sh
pio run
pio device list
pio run -t upload
pio run -t uploadfs
pio device monitor -b 115200
```

Se houver mais de uma placa/porta, acrescente `--upload-port SUA_PORTA` aos
comandos de upload. Encerre o monitor serial antes de gravar. O upload do firmware
não substitui o upload do site LittleFS. Após reiniciar, conecte ao Wi-Fi PILHA-LAB
e abra `http://192.168.4.1/`. Não há publicação na internet.

### Checklist obrigatório no hardware

1. Com a pilha desconectada, confirme o divisor 1 MΩ/330 kΩ, GND comum e VDD de 3,3 V.
2. Confira polaridade e tensão com multímetro antes de conectar. A0 deve ficar entre GND e VDD; 10 V na entrada corresponde nominalmente a cerca de 2,48 V no A0.
3. Teste sem ADS1115 e após desconectá-lo: a API deve retornar 503, `sensor_ok:false`, `voltage:null`, sem manter valor antigo na interface. Reconecte e verifique a recuperação.
4. Compare leituras de fontes conhecidas de baixa tensão e da pilha experimental com multímetro. O divisor de alta impedância e a impedância de entrada do ADC podem introduzir erro; a tolerância dos resistores e a carga sobre a pilha também importam. Não prometa precisão sem caracterização.
5. Confira no iPhone real: foco nos campos, rotação, reconexão Wi-Fi, retorno após bloquear a tela e abertura do CSV no app Arquivos.

O aviso por software não protege eletricamente o ADC. Não aumente a tensão para
provocar o alerta: use resposta de API em teste de software. Nunca conecte uma
entrada acima da alimentação diretamente ao ADS1115, mesmo que o ganho indique
faixa ±4,096 V. Preserve o circuito documentado.
