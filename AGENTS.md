# DABDM — instruções atuais

A solicitação atual do usuário substitui a integração de sensores por digitação manual do multímetro.

1. Evolua a interface existente em data/, sem recriar o projeto.
2. Preserve data/logic.js e a fórmula de soma em série; não altere valores para obter resultados desejados.
3. Mantenha a chave pilhalab-registros-v1 e todos os registros anteriores. Não exclua, trunque ou migre silenciosamente.
4. Nenhuma leitura automática, integração Arduino/ESP32 ou simulação de novas medições. Registros legados devem manter a origem explícita.
5. Texto do usuário deve usar textContent; valide entradas. Nenhuma dependência de CDN.
6. Preserve responsividade, campos de no mínimo 16 px, redução de movimento e saída da introdução mesmo em falhas.
7. Execute node --test tests/logic.test.js, node --check data/app.js e node --check data/intro.js. Execute tests/app.test.js com Playwright/Chromium quando disponíveis.
8. Sincronize as duas prévias HTML independentes após mudar data/.
9. Não publique nem altere repositórios remotos sem autorização explícita.
