# QA da demonstração local

## Estado atual — 09/10/2026

Esta revisão substitui as pendências de interação das seções históricas abaixo.
Foram usados os papéis qa-senior e qa-automate, com Playwright 1.62.1 como
dependência de desenvolvimento e o runner nativo do Node. Aplicativo e testes de
modelo/HTTP continuam sem dependências de runtime.

| Camada | Execução | Resultado |
| --- | --- | --- |
| Regressão completa | `test.cmd` | 199 aprovados, zero falhas/ignorados |
| Modelo da demonstração | `node --test unit/preview-model.test.js` | 13 aprovados; centavos, vínculos, filtros, datas e serialização CSV |
| HTTP local | `node --test unit/preview-server.test.js` | 7 aprovados; servidor efêmero, tipos, métodos, isolamento de arquivos e rotas |
| Navegador | `BROWSER_CHANNEL=msedge`, `npm.cmd run test:browser` | 12 aprovados no Edge 154.0.4258.62, sem erros JS/console/recursos |

Os 13 e 7 testes estão incluídos nos 199, não são testes adicionais.
Logs locais ignorados pelo Git: `.tmp/interaction-audit/{unit,model,http,browser}-final.log`.
O job separado de navegador no CI usa Chromium e não recebe Secrets.
O [CI de integração](https://github.com/vinnitog/brd-concordia/actions/runs/37961504449)
também passou com 199 testes Node e 12 testes Chromium, além da verificação
autenticada da biblioteca privada em job separado. O clone limpo foi validado
conforme `docs/agent-rules/migration.md`.

I01–I04 estão cobertos por `browser/interface.test.js`: todos os períodos;
detalhes A/B, expansão, Escape e retorno de foco; quatro vistas, hash desconhecido,
interseção credor/busca e cancelamento do debounce; vazio, limpeza e download real
do CSV filtrado com BOM e CRLF. A suíte também cobre link de salto, Tab, foco
visível, seleção de período pelo teclado e rolagem horizontal da tabela.

Foram reproduzidos e corrigidos:

- O rótulo visualmente oculto da tabela excedia a largura da página (622 px em
  viewport de 390 px). O contêiner agora delimita seu posicionamento, preservando
  a rolagem da tabela e o nome acessível.
- Em Acordos com texto ampliado, o botão de exportação encolhia e seu texto gerava
  transbordamento. O cabeçalho permite quebra e o botão conserva sua largura.
- A região viva anunciava seis débitos em uma vista com quatro acordos. Agora
  anuncia acordos ou compromissos/período conforme o conteúdo apresentado.

As quatro vistas e os detalhes passaram nas larguras 1440, 768, 390 e 320 px.
Capturas de confirmação estão em `.tmp/interaction-audit/after-*.png`; desktop,
390 px e Acordos com texto ampliado foram inspecionados visualmente. São
artefatos locais, não arquivos necessários para executar a suíte.

**Limites:** texto a 200% foi simulado alterando a fonte raiz de 16 para 32 px em
viewport de 768 px; não equivale a zoom nativo. Não houve avaliação com
NVDA/JAWS/VoiceOver ou dispositivo móvel físico. O teste da região viva confirma
seu texto e semântica, não a fala de tecnologia assistiva. Contraste não foi
recalculado nesta rodada; as medições abaixo são históricas. Os testes HTTP
verificam o servidor Node local, não os cabeçalhos da hospedagem Pages.

## Plano e evidências históricos

Plano definido na etapa `qa-senior` em 19/09/2026. As limitações abaixo descrevem aquela etapa; consulte o estado atual acima para a validação posterior em navegador.

## Impacto

A entrega adiciona quatro vistas, filtros compartilhados, detalhes, exportação CSV e um servidor HTTP local. Os maiores riscos são valores financeiros incoerentes, vínculos errados entre débito/acordo/parcela, filtros que permanecem ativos inadvertidamente, JavaScript inválido que impede a inicialização e exposição de arquivos fora de `public/`. As políticas existentes de domínio permanecem sujeitas à regressão integral.

Usar somente Node.js e biblioteca padrão: `node:test`, `assert`, importação dos módulos de demonstração e servidor isolado com porta efêmera. Não adicionar dependências nem modificar os dados reais do app durante os testes. A data-base é fixa em 19/09/2026, sem dependência do relógio da máquina.

## Casos automatizados obrigatórios

| Caso | Verificação e resultado esperado |
| --- | --- |
| A01 — Regressão existente | Executar `test.cmd`; preservar todos os testes anteriores de domínio e repositório. |
| A02 — Inicialização | Verificar sintaxe de `public/app.js` com `node --check`, além da importação de `model.js` e `data.js`. Este caso deve detectar templates inválidos antes de abrir a interface. |
| A03 — Valores em centavos | Seis débitos, quatro acordos e dois débitos sem acordo. Saldo total 16.700.000 centavos, recuperado 4.600.000 e atraso 1.200.000. Confirmar totais de um subconjunto e do conjunto vazio, sem cálculos em reais fracionários. |
| A04 — Filtros compostos | Filtrar cada credor, buscar por devedor/credor/ID do débito/ID do acordo, ignorar maiúsculas, acentos e espaços nas pontas. Credor e busca se combinam por interseção; termo inexistente retorna vazio. `estacao`, por exemplo, encontra BRD-003. |
| A05 — Data e situação | Datas anterior, igual e posterior à referência retornam atraso, vence hoje e futuro. Parcela paga mantém situação Paga mesmo vencida. Confirmar 19/10/2026 como +30 e 20/10/2026 como +31. |
| A06 — Prazos | Dez compromissos pendentes: oito parcelas e dois manuais, ordenados por data. Não incluir parcelas pagas. Com a amostra completa: atraso 1, hoje 1 e próximos 30 dias 6; a prioridade soma 8, excluindo os dois vencimentos posteriores. Confirmar inclusão do limite +30 e exclusão de +31 e do dia zero na faixa futura. |
| A07 — Integridade dos vínculos | IDs únicos; credores, débitos e acordos referenciados existem; cada acordo da amostra pertence ao débito esperado e possui parcelas cuja soma coincide com seu valor. Detalhes não misturam parcelas; prazos manuais preservam responsável e justificativa. |
| A08 — CSV | BOM UTF-8, separador ponto e vírgula, CRLF, identificação de demonstração/data-base, cabeçalhos, valores decimais brasileiros e aspas escapadas. Exportação recebe apenas o subconjunto filtrado por credor e busca; vazio mantém identificação/cabeçalhos. |
| A09 — HTTP público | Instanciar `createPreviewServer()`, escutar em `127.0.0.1` com porta 0 e fechar após o teste. GET de `/`, CSS, JS, PNG e fonte retorna conteúdo e Content-Type compatíveis. HEAD retorna status/cabeçalhos equivalentes sem corpo. Conferir no-store e nosniff. |
| A10 — HTTP restrito | POST retorna 405 com Allow. Arquivo inexistente, `.git/config`, `.env`, `package.json`, arquivos privados e tentativas de traversal codificadas retornam 404; escape percentual inválido retorna 400. Enviar caminhos de ataque por `http.request` para evitar normalização prévia do cliente. Nenhuma resposta contém conteúdo privado. |

## Regressões de interação

Um harness mínimo de DOM em Node é aceitável para executar os handlers reais de `app.js`, caso seja viável sem criar uma segunda implementação da interface. Isso verifica estado e eventos, não layout, foco real do navegador ou acessibilidade assistiva. Se o harness não for implementado, registrar os casos abaixo como manuais pendentes, sem tratá-los como aprovados por inspeção de texto.

| Caso | Passos e resultado esperado |
| --- | --- |
| I01 — Todos os prazos | Visão geral → Em atraso → Visão geral → Todos os prazos. Período volta a Todos os períodos e exibe os dez compromissos sem outros filtros. |
| I02 — Detalhe e acessibilidade | Abrir detalhe A e depois detalhe B: acionador A deve ficar com `aria-expanded=false`, B com true. Fechar/Escape oculta detalhe e devolve foco ao acionador ainda conectado. Filtro ou troca de vista fecha o detalhe anterior. |
| I03 — Navegação e filtros | Percorrer as quatro vistas, usar hash desconhecido e combinar credor/busca. Vista ativa, título e resultados devem acompanhar a seleção; hash desconhecido volta à visão geral. Limpar filtros restaura credor, busca e período e cancela busca pendente. |
| I04 — Vazio e exportação | Buscar termo inexistente; mostrar mensagem útil, permitir limpar e desabilitar exportação. Restaurar registros e exportar: arquivo deve corresponder ao credor e à busca, conforme descrição da ação. |

## Verificações manuais de apresentação

Na avaliação visual autorizada pelo usuário, verificar larguras de 1440, 768 e 390 px, zoom de 200%, tabelas com rolagem sem sobreposição, quebra de títulos, contraste e legibilidade dos valores. Percorrer com teclado o link de salto, navegação, filtros, tabelas, ações e detalhe; verificar foco visível e anúncio dos resultados. Confirmar que dados fictícios/data-base continuam evidentes em todas as vistas.

Antes de usar navegador, executar `test.cmd` e seguir a política de browser do `AGENTS.md`. Havendo `ERR_BLOCKED_BY_CLIENT`, interromper a tentativa visual, sem contorno por outra URL ou CDP. Inspeções estáticas e testes locais não substituem uma aprovação visual.

## Critério de saída

Todos os testes automatizados executados com sucesso, regressões I01/I02 cobertas ou explicitamente pendentes, revisão final de `git diff --check` e de escopo. Registrar separadamente qualquer verificação manual não realizada e não confundir passagem dos testes locais com evidência de renderização no navegador.

## Execução de qa-automate — 19/09/2026

Foram adicionados 20 testes com Node nativo: 13 em `unit/preview-model.test.js` e sete em `unit/preview-server.test.js`. A execução integral de `test.cmd`, após atualizar a base do repositório, passou com **189 testes, zero falhas e zero testes ignorados**. O log local está em `.tmp/qa-interface-tests.log` (não versionado).

A cobertura verifica sintaxe dos módulos, cálculos, busca, vínculos, dados de prazos e CSV, além de requisições HTTP reais contra uma instância isolada em porta efêmera. A06 confirma os dados e as fronteiras temporais; a aplicação do período pelo controle da interface continua entre as verificações de interação.

**Pendentes manuais:** I01, I02, I03, I04 e a avaliação de apresentação/teclado. Não foi criado harness DOM nem usado navegador nesta etapa. A aprovação dos testes não comprova renderização, download pelo navegador, foco real ou anúncios de leitor de tela.

## Correção do endereço local — 19/09/2026

Na etapa `qa-senior`, o impacto foi delimitado à porta padrão 4317 e à documentação de acesso, sem mudança de interface. A regressão HTTP deve verificar que `/` entrega o título BRD Concordia com status 200 e sem cabeçalho Location, enquanto `/login` retorna 404 sem redirecionamento. A suíte usa porta efêmera para não disputar a instância de avaliação.

Na etapa `qa-automate`, essas verificações foram incorporadas ao teste existente de entrada do servidor. O usuário confirmou que o novo endereço na porta 4317 exibe o Concordia. O relato anterior de Assistant em 4173/login é compatível com cache/service worker antigo, mas essa causa não foi comprovada. Requisições HTTP diretas não executam nem inspecionam service workers do navegador; a confirmação do usuário valida o acesso corrigido, sem substituir os casos manuais I01–I04 e de apresentação.

Após a correção, `test.cmd` passou novamente com **189 testes, zero falhas e zero ignorados**. Log local: `.tmp/qa-port-4317-tests.log` (não versionado). Nenhum navegador foi utilizado nesta verificação.
