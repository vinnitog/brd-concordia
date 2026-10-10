# QA do fallback de fontes e referência de assets

Segundo lote em `codex/second-lot-20261010`, somente QA. A demonstração continua
HTML/CSS/JS nativo, com dados fictícios, sem backend, autenticação ou persistência.
AGENTS/context/auditorias/regras e biblioteca no pin `bd46a3d293ae` preservados.
Nenhum arquivo de produto, fonte, imagem, dependência ou configuração foi editado.

## Lacuna relevante e cobertura

O primeiro lote já provou WOFF2 normal, economia dos bytes e igualdade de
métricas com TTF explicitamente carregado em uma fixture. Faltava exercitar a
seleção automática do TTF quando o primeiro formato do CSS falhasse.

Novo teste em `browser/interface.test.js` começa numa página normal com contexto
novo, mede avanços de texto nos três pesos e, no mesmo caso, recarrega com as
respostas WOFF2 substituídas por bytes sintéticos inválidos. O navegador real
deve então obter os três TTF locais, carregar as faces 400/500/700 e preservar
as larguras de texto com acentos e moeda. Também percorre Débitos, filtro Aurora,
abertura de detalhe, foco e Escape. A injeção termina com o contexto do teste;
não depende da ordem de outros casos e não altera servidor ou arquivos.

Resultado: fallback funcional, 168.992 B dos três TTF recebidos; mesmas larguras
dos WOFF2 normais. O harness continua exigindo ausência de erro JS/console ou
recurso HTTP. Os avisos de decodificação das fontes são falhas sintéticas
esperadas, sem remoção genérica de checks. Não foi reproduzido defeito do app
que justificasse mudança de produto neste lote.

## Referência objetiva de tamanho

Medição dos arquivos versionados com `fs.readFileSync` e `zlib.gzipSync` no Node
24.12.0. Lista de dez assets da carga normal; não inclui licenças/README nem TTF
quando WOFF2 funciona. Gzip é estimativa estática por arquivo, não tráfego medido
do Pages, compressão configurada no servidor local ou garantia de cache.

| Grupo | Bytes de arquivo | Gzip estimado |
| --- | ---: | ---: |
| HTML | 4.291 | 1.736 |
| CSS | 16.445 | 4.039 |
| app/model/data JS | 24.682 | 7.423 |
| Logo PNG original | 399.778 | 274.425 |
| Favicon SVG | 235 | 189 |
| Três WOFF2 | 74.720 | 74.103 |
| Total | 520.151 | 361.915 |

O logo concentra 76,9% dos bytes sem compressão. O IHDR do PNG informa
10.869 × 2.946 px, enquanto o HTML o apresenta a 110 × 30 px. Uma variante local
menor é uma hipótese mensurável para um próximo lote (já P3 na auditoria), com
original e identidade preservados. Não se atribui memória decodificada real,
latência ou ganho de renderização apenas às dimensões, e nenhum derivado foi
gerado nesta etapa.

## Gates e limites

- `npm.cmd test`: 199/199 Node, zero falhas/skips/cancelamentos.
- `BROWSER_CHANNEL=msedge`, `npm.cmd run test:browser`: 15/15; catorze anteriores
  mais fallback. O caso adicional também passou isoladamente por nome.
- Bootstrap verify com UtilitiesPath explícito do pin: 49 bindings.
- `git diff --check`: aprovado.

Logs locais em TEMP: `concordia-second-lot-unit.log` e
`concordia-second-lot-browser.log`. O primeiro ensaio do novo cenário falhou por
um ID de credor inexistente no teste (`c1`); corrigido para a fixture `aurora`
com dois registros. A prova de fontes já passava, e a repetição isolada e a suíte
completa passaram após a correção do teste.

Serviço somente loopback/porta efêmera e dados fictícios. Sem navegador de UI,
credencial, serviço externo, produção, deploy, rebrand ou atualização de pin.
Papéis senior-dev/clean-code, UI/UX/acessibilidade, code-reviewer, qa-senior e
qa-automate aplicados proporcionalmente; revisão independente pelo responsável
antes de publicar. Sem commit/push pelo implementador.

Zoom nativo, NVDA/JAWS/VoiceOver, dispositivo físico, outras engines e headers/
cache do Pages permanecem pendentes. Foco e consulta no fallback não certificam
WCAG completa. Não há nova melhoria de desempenho alegada; apenas referência
de tamanho e cobertura de degradação controlada das fontes.

## Revisão independente final

Revisor conferiu bloqueio sintético WOFF2, fonte local TTF, métricas, fluxo e limites do baseline. Nenhuma alteração de runtime, assets ou identidade; sem bloqueadores no teste adicional.
