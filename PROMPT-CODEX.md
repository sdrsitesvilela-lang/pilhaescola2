# PROMPT PARA USAR NO CODEX

Abra esta pasta no Codex e use o seguinte pedido:

> Voce e um desenvolvedor full-stack e de firmware especializado em Arduino/ESP32, sensores ADS1115 e interfaces mobile. Continue o projeto PilhaLab existente SEM recriar do zero. Ha firmware PlatformIO (`src/main.cpp`), site offline no LittleFS (`data/`), testes (`tests/`), esquema (`docs/LIGACOES.txt`) e instrucoes em `AGENTS.md`. Primeiro leia `README.md` e os arquivos existentes. Inspecione e corrija defeitos, se houver. Preserve modo manual, modo real e simulacao explicitamente rotulada. Melhore responsividade no Safari do iPhone e a experiencia de demonstracao escolar. Execute os testes `node --test tests/logic.test.js`, valide JavaScript, e, se houver toolchain PlatformIO, compile `pio run`. Nunca invente uma leitura real, nunca exponha o ADS1115 a tensoes acima de sua alimentacao e nao publique o projeto sem minha autorizacao. Forneca passos claros para upload do firmware (`pio run -t upload`) e do LittleFS (`pio run -t uploadfs`). Informe claramente o que depende de teste em hardware.

## Objetivo de apresentacao

- O publico pode inserir tensoes por celula e quantidades e ver a soma teorica.
- Ao conectar a pilha real com cobre, zinco e agua salgada, ADS1115 le a tensao e ESP32 transmite ao site via Wi-Fi local.
- Mostrar grafico, diferenca entre resultado manual e real, salvar e exportar CSV.
- Design premium, facil de explicar para uma banca escolar; sem substituir dados experimentais por simulados.
