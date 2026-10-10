# Logo e publicação: terceiro lote de QA

## Publicação consultada antes da mudança

GET somente leitura em `https://vinnitog.github.io/brd-concordia/` e nove assets,
com timeout de 10 segundos por request. HTML, CSS, app/model/data JS, logo,
favicon e três WOFF2: **10/10 HTTP 200 e SHA256 exatamente igual aos blobs Git**
do HEAD `8e403a31b3e373bdc333cbd409f437428c50765f`.
Comparar blobs evita falso desvio causado por CRLF no checkout Windows.

Todas as respostas observaram `cache-control: max-age=600`, `age: 0` e
`last-modified: Sat, 10 Oct 2026 17:36:45 GMT`. HTML/CSS/JS tiveram gzip;
logo/fontes/favicon não informaram content-encoding. O preview local `no-store`
é diferente do cache Pages. Nenhum service worker existe. Isso confirma essa
amostra de CDN, não todas as regiões ou um navegador com cache antigo.

## Empacotamento fiel da marca

A matriz institucional continua `public/assets/brd-logo-on-dark.png`, recebida
do BRD Assistant. O SVG em `assets/brand` é uma identidade anterior; substituí-lo
teria mudado a marca autorizada. Não houve desenho, recoloração ou resize.

O PNG derivado tem **367.577 bytes contra 399.778**, economia de **32.201 bytes
(8,1%)**. Dimensões **10.869 × 2.946**, todos os pixels RGBA (incluindo RGB sob
alpha zero), DPI e aspect permanecem iguais. Não houve quantização. O SHA da
matriz é `cb2fe59c2be992fb9a8613632b7e16ce503798eb3e79829d9fdc763549ae12f7`;
o derivado é `3da21e7384ec40bfe9ab1b5f44cc0d13337f2e89ecbd010f9f32c828449edb13`.

Tooling opcional Pillow 12.3.0, zlib runtime 1.3.2 nesta execução, separado do
runtime/build Node. `scripts/package-logo.py --check` reencoda e exige igualdade
do artefato versionado, pixels, dimensão e DPI; versões diferentes não podem
substituir silenciosamente a URL. O script preserva a matriz original.

```powershell
python scripts/package-logo.py --check
$env:BROWSER_CHANNEL='msedge'
npm.cmd test
npm.cmd run test:browser
```

Os 10 arquivos da carga fria somavam 519.594 bytes decodificados HTTP no Pages;
o artefato novo, com textos normalizados em LF, soma 487.406 bytes: economia
total de 32.188 bytes após o pequeno aumento da URL no HTML. Isso não mede bytes
gzip transferidos, latência real ou memória de decode. Dimensões grandes seguem
como limite; um vetor institucional correto ou resize aprovado pode ser avaliado
futuramente, mantendo a matriz. Não foi necessário criar um build.

## Evidências de render e regressão

Dois novos casos Edge reais, desktop 1440px/DPR1 e mobile 390px/DPR2, exigem
download de somente um logo, payload 367.577 bytes, geometria 110×30 / 81×22,
alt/nome/foco/Enter preservados. Comparação canvas com a matriz original em
1×/2×/4× tem **zero canais diferentes**, inclusive transparência. Screenshots
do logo na página real antes/depois de trocar para a matriz original são
**idênticos em bytes, sem tolerância** nos dois tamanhos.

Uma experiência WebP lossless preservou RGBA e reduziu mais bytes, mas foi
descartada: contexts frios mostraram suavização distinta no primeiro paint
desktop (3.482 canais diferentes, máximo 74/255), apesar de convergirem após
um segundo. Não mascaramos essa diferença com espera artificial no produto.
O PNG recomprimido mantém também o render imediato observado. Não restou
WebP, wrapper, CSS, MIME ou dependência dessa experiência no diff final.

199 testes Node e 17 casos Edge aprovados; os 15 casos anteriores mantêm
consulta, CSV, detalhe/foco, fontes/fallback, quatro viewports e texto ampliado.
Sem auth, banco, backend, serviço, dados reais ou mudança de domínio. Pins
preservados; revisão independente e publicação ficam a cargo do fluxo Git.

## Verificação depois da publicação

Esta mudança ainda não estava publicada na consulta acima. Após o deploy,
conferir HTML e novo PNG com seus blobs do commit publicado e content-type
image/png. A URL com hash evita confundir o asset novo com o PNG antigo; HTML
pode continuar em cache por até os 600s observados. Não inferir bytes publicados
somente pelo resultado verde do workflow.
