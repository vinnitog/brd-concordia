# Ativos de marca

O usuario autorizou o uso da identidade visual do BRD Assistant no BRD Concordia.

- `brd-logo-on-dark.png`: logotipo institucional BRD, proveniente de `public/brd-logo-on-dark.png` do BRD Assistant. Preservado sem alteracoes.
- `brd-logo-440.e4a543951f97.png` e `brd-logo-880.07d53b693c9e.png`: derivados responsivos RGBA de 440×119/880×239, com resampling LANCZOS e transparência. A página usa `srcset` 1x/2x, preservando caixas110×30/81×22. Não são lossless frente à matriz. Reprodução `scripts/resize-logo.py --check`; provas e limites em `docs/qa-logo-responsivo-2026-10-10.md`.
- `brd-logo-on-dark.3da21e7384ec.png`: empacotamento PNG lossless da matriz acima, preservando todos os pixels RGBA, dimensões e DPI. A página usa esta URL com hash; a matriz permanece disponível. Tooling opcional `scripts/package-logo.py --check`, Pillow 12.3.0, fora do runtime. Ver `docs/qa-logo-publicacao-2026-10-10.md`.
- `concordia-favicon.svg`: icone proprio da aba, com C branco vetorial sobre violeta BRD. Desenhado para leitura em tamanhos pequenos, sem depender de fontes.
- `DMSans-Regular.ttf`, `DMSans-Medium.ttf`, `DMSans-Bold.ttf`: fontes locais usadas pelo BRD Assistant, provenientes de `public/fonts/`. DM Sans e distribuida sob SIL Open Font License 1.1; consulte `OFL.txt`.
- `DMSans-Regular.woff2`, `DMSans-Medium.woff2`, `DMSans-Bold.woff2`: cópias completas compactadas dos TTF acima, sem subsetting ou mudança de desenho, métricas, nomes ou licença. O CSS prefere WOFF2 e mantém os TTF originais como fallback. Gere/valide com `scripts/convert-fonts.py` e as versões fixadas em `scripts/font-tools-requirements.txt`; detalhes em `docs/font-delivery-2026-10-10.md`.

Somente ativos visuais foram reutilizados. Nenhum codigo de outro projeto e importado.
