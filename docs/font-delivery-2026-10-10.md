# Fontes locais e formatação — 10/10/2026

## Decisão e escopo

DM Sans, os pesos 400/500/700, o logotipo e a licença OFL foram preservados. A mudança é somente o contêiner: os três TTF completos têm derivados WOFF2 locais, preferidos pelo CSS, com os TTF originais mantidos como fallback. Nenhum glyph, métrica, nome ou tabela de layout foi editado e não houve subsetting. O servidor Node reconhece font/woff2; os caminhos relativos funcionam também sob o subdiretório do Pages.

Dois formatadores Intl são criados uma vez no model.js, mantendo locale pt-BR, BRL, entrada em centavos e data UTC. Nenhuma política de domínio, unidade monetária, regra de causa financeira ou dado da demonstração foi alterado. Não foi medido ganho de latência dessas duas reutilizações.

## Tamanho e fidelidade

| Peso | TTF original | WOFF2 | Economia |
| --- | ---: | ---: | ---: |
| Regular 400 | 56.348 B | 24.696 B | 31.652 B |
| Medium 500 | 56.376 B | 25.048 B | 31.328 B |
| Bold 700 | 56.268 B | 24.976 B | 31.292 B |
| Total | 168.992 B | 74.720 B | 94.272 B (55,8%) |

O script usa FontTools 4.60.1 e Brotli 1.2.0 sem transformações glyf/loca/hmtx, sem recalcular bounding boxes nem timestamps. Todas as 16 tabelas SFNT de cada fonte decodificada são comparadas por bytes com a fonte original. Somente head.checkSumAdjustment e o bit 11 que registra compressão lossless WOFF2 diferem por exigência do contêiner. Ordem dos 486 glifos, avanços/bearings e coordenadas/contornos também são comparados explicitamente. Tabelas de cmap, nomes, kerning e layout permanecem iguais.

Reprodução em tooling isolado, sem dependência de runtime/build para servir a aplicação:

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r scripts/font-tools-requirements.txt
.venv/Scripts/python.exe scripts/convert-fonts.py
.venv/Scripts/python.exe scripts/convert-fonts.py --check
```

--check não escreve arquivos: verifica fidelidade e igualdade dos bytes gerados com os WOFF2 versionados. O script verifica as três fontes antes de gravar e substitui cada derivado por rename de temporário; nunca modifica os TTF. A licença original permanece em public/assets/OFL.txt.

## QA e limites

- 199/199 testes Node: domínio, demonstração, contratos financeiros, gráfico real de assets nos caminhos local/Pages, HTTP GET/HEAD/MIME e isolamento.
- 14/14 testes Edge headless: 12 regressivos existentes, carregamento das três faces WOFF2 e 74.720 bytes de corpos HTTP numa origem local sem compressão adicional, sem download TTF na carga normal.
- Comparação no navegador dos três pesos com os TTF originais explicitamente carregados numa fixture separada: larguras Canvas e caixas de texto/reflow iguais, incluindo acentos, valores e texto da demonstração.
- Quatro vistas/detalhes aprovados em 1440/768/390/320 px, keyboard/foco/CSV preservados e texto a 200% simulado. --check e git diff --check passaram.
- Nenhuma API externa, credencial, deploy ou dado real foi acessado. Logs/prova locais em TEMP: concordia-font-unit.txt, concordia-font-browser.txt e concordia-font-proof.json.

A economia é de bytes dos assets e foi observada nas requisições locais das fontes; não representa redução comprovada do tempo total, CPU, custo ou experiência de rede em produção. Cache/headers do Pages, engines diferentes, dispositivo físico e leitor de tela não foram validados nesta rodada. Texto a 200% continua sendo simulação por fonte raiz, não zoom nativo do navegador. As pendências assistivas/nativas registradas em qa-interface.md continuam abertas.
