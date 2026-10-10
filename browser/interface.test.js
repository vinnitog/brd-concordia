const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { once } = require('node:events');
const { readFile } = require('node:fs/promises');
const { chromium } = require('playwright');
const { createPreviewServer } = require('../server');

let browser;
let server;
let baseURL;
let blockedByClient = false;

before(async () => {
  server = createPreviewServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseURL = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
});

after(async () => {
  try {
    await browser?.close();
  } finally {
    if (server?.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

async function withPage(run, { viewport = { width: 1440, height: 1000 }, hash = '', clock = false } = {}) {
  assert.equal(blockedByClient, false, 'Browser interrompido após ERR_BLOCKED_BY_CLIENT, sem outra tentativa.');
  const context = await browser.newContext({ viewport, acceptDownloads: true, locale: 'pt-BR', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('requestfailed', (request) => {
    const failure = `${request.url()}: ${request.failure()?.errorText}`;
    if (failure.includes('ERR_BLOCKED_BY_CLIENT')) blockedByClient = true;
    errors.push(failure);
  });
  try {
    if (clock) await page.clock.install();
    await page.goto(`${baseURL}/${hash}`);
    await page.locator('#content table').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await run(page);
    assert.deepEqual(errors, [], 'Nenhum erro JavaScript, console ou recurso HTTP.');
  } catch (error) {
    if (errors.length) error.message += `\nErros do navegador:\n${errors.join('\n')}`;
    throw error;
  } finally {
    await context.close();
  }
}

async function title(page, expected) {
  await page.waitForFunction((text) => document.querySelector('#page-title').textContent === text, expected);
  assert.equal(await page.title(), `${expected} · BRD Concordia`);
}

test('fontes: DM Sans local usa três WOFF2, sem baixar TTF, com bytes menores', async () => {
  const names = ['DMSans-Regular', 'DMSans-Medium', 'DMSans-Bold'];
  const originalBytes = (await Promise.all(names.map(name => readFile(`${__dirname}/../public/assets/${name}.ttf`))))
    .reduce((total, font) => total + font.length, 0);
  const compressedBytes = (await Promise.all(names.map(name => readFile(`${__dirname}/../public/assets/${name}.woff2`))))
    .reduce((total, font) => total + font.length, 0);
  await withPage(async page => {
    const loaded = await page.evaluate(async () => {
      await Promise.all([400, 500, 700].map(weight => document.fonts.load(`${weight} 16px "DM Sans"`)));
      return {
        faces: [...document.fonts].filter(face => face.family.replaceAll('"', '') === 'DM Sans').map(face => ({ weight: face.weight, status: face.status })),
        resources: performance.getEntriesByType('resource').filter(entry => /\.(?:woff2|ttf)$/.test(new URL(entry.name).pathname))
          .map(entry => ({ name: new URL(entry.name).pathname, bytes: entry.encodedBodySize })),
      };
    });
    assert.deepEqual(loaded.faces.map(face => face.weight).sort(), ['400', '500', '700']);
    assert.ok(loaded.faces.every(face => face.status === 'loaded'), 'Os três pesos devem estar carregados.');
    assert.equal(loaded.resources.length, 3);
    assert.ok(loaded.resources.every(resource => resource.name.endsWith('.woff2')), 'TTF é apenas fallback, sem download duplicado.');
    assert.equal(loaded.resources.reduce((total, resource) => total + resource.bytes, 0), compressedBytes);
    assert.ok(compressedBytes < originalBytes * 0.5, 'A conversão deve economizar mais da metade do payload original.');
  });
});

test('fontes: WOFF2 preserva larguras e caixas de texto dos TTF originais no navegador', async () => {
  await withPage(async page => {
    const metrics = await page.evaluate(async () => {
      const variants = [[400, 'Regular'], [500, 'Medium'], [700, 'Bold']];
      const sample = 'BRD Concordia · Débitos · Acordos · São José · ÀÉÍÓÚâêôãõÇ · R$ 1.234,56';
      const results = [];
      for (const [weight, variant] of variants) {
        const original = new FontFace('DM Sans original', `url(./assets/DMSans-${variant}.ttf)`, { weight: String(weight) });
        document.fonts.add(await original.load());
        const canvas = document.createElement('canvas').getContext('2d');
        canvas.font = `${weight} 32px "DM Sans"`;
        const compressedWidth = canvas.measureText(sample).width;
        canvas.font = `${weight} 32px "DM Sans original"`;
        const originalWidth = canvas.measureText(sample).width;
        const element = document.createElement('div');
        Object.assign(element.style, { position: 'absolute', visibility: 'hidden', width: '300px', fontSize: '32px', fontWeight: String(weight), fontFamily: 'DM Sans' });
        element.textContent = sample; document.body.append(element);
        const compressedHeight = element.getBoundingClientRect().height;
        element.style.fontFamily = 'DM Sans original';
        const originalHeight = element.getBoundingClientRect().height;
        element.remove();
        results.push({ weight, compressedWidth, originalWidth, compressedHeight, originalHeight });
      }
      return results;
    });
    for (const metric of metrics) {
      assert.equal(metric.compressedWidth, metric.originalWidth, `Avanço do peso ${metric.weight}`);
      assert.equal(metric.compressedHeight, metric.originalHeight, `Reflow do peso ${metric.weight}`);
    }
  });
});

async function rowCount(page, expected) {
  await page.waitForFunction((count) => document.querySelectorAll('#content tbody tr').length === count, expected);
}

async function focused(page, selector) {
  assert.equal(await page.locator(selector).evaluate((element) => element === document.activeElement), true, `Foco em ${selector}`);
}

test('I01: Todos os prazos restaura dez compromissos após consultar atrasados', async () => {
  await withPage(async (page) => {
    await page.getByRole('button', { name: /^Em atraso/ }).click();
    await title(page, 'Prazos');
    await rowCount(page, 1);
    assert.equal(await page.getByLabel('Período', { exact: true }).inputValue(), 'overdue');
    await page.locator('nav').getByRole('link', { name: 'Visão geral' }).click();
    await title(page, 'Visão geral');
    await page.getByRole('link', { name: 'Todos os prazos' }).click();
    await title(page, 'Prazos');
    await rowCount(page, 10);
    assert.equal(await page.getByLabel('Período', { exact: true }).inputValue(), 'all');
    assert.equal(await page.locator('#clear-filters').isDisabled(), true);
  });
});

test('I02: detalhes preservam vínculo, expansão e foco ao trocar, fechar e usar Escape', async () => {
  await withPage(async (page) => {
    const first = page.getByRole('button', { name: 'Ver débito de Horizonte Comercial', exact: true });
    const second = page.getByRole('button', { name: 'Ver débito de Norte Sul Logística', exact: true });
    await first.click();
    await focused(page, '#detail-title');
    assert.match(await page.locator('#detail').innerText(), /Acordo AC-001/);
    assert.equal(await first.getAttribute('aria-expanded'), 'true');
    assert.equal(await first.getAttribute('aria-controls'), 'detail');
    await second.click();
    assert.equal(await first.getAttribute('aria-expanded'), 'false');
    assert.equal(await second.getAttribute('aria-expanded'), 'true');
    assert.match(await page.locator('#detail').innerText(), /Acordo AC-002/);
    assert.doesNotMatch(await page.locator('#detail').innerText(), /AC-001/);
    assert.equal(await page.locator('#detail tbody tr').count(), 3);
    await focused(page, '#detail-title');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#detail').isVisible(), false);
    assert.equal(await second.getAttribute('aria-expanded'), 'false');
    await focused(page, '[data-debt="BRD-002"]');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Fechar detalhe' }).click();
    await focused(page, '[data-debt="BRD-002"]');
    assert.equal(await page.locator('#detail').isVisible(), false);
    await first.click();
    await page.getByLabel('Credor', { exact: true }).selectOption('vertice');
    assert.equal(await page.locator('#detail').isVisible(), false);
    await page.locator('[data-debt="BRD-002"]').click();
    await page.locator('nav').getByRole('link', { name: 'Acordos', exact: true }).click();
    await title(page, 'Acordos');
    assert.equal(await page.locator('#detail').isVisible(), false);
    await focused(page, '#page-title');
  }, { hash: '#debts' });
});

test('I03: navegação, hash desconhecido e interseção de credor/busca/período', async () => {
  await withPage(async (page) => {
    for (const [view, heading, count] of [['debts', 'Débitos', 6], ['agreements', 'Acordos', 4], ['deadlines', 'Prazos', 10], ['overview', 'Visão geral', 8]]) {
      await page.locator(`nav [data-view="${view}"]`).click();
      await title(page, heading);
      await rowCount(page, count);
      assert.equal(await page.locator('nav [aria-current="page"]').getAttribute('data-view'), view);
    }
    await page.evaluate(() => { location.hash = 'desconhecido'; });
    await title(page, 'Visão geral');
    assert.equal(await page.locator('nav [aria-current="page"]').getAttribute('data-view'), 'overview');
    await page.locator('nav [data-view="deadlines"]').click();
    await title(page, 'Prazos');
    await page.getByLabel('Credor', { exact: true }).selectOption('vertice');
    await rowCount(page, 4);
    await page.getByLabel('Buscar nos registros').fill('  NORTE SUL  ');
    await rowCount(page, 3);
    await page.getByLabel('Período', { exact: true }).selectOption('next30');
    await rowCount(page, 1);
    assert.deepEqual(await page.locator('#content time').evaluateAll((elements) => elements.map((element) => element.dateTime)), ['2026-10-19']);
    assert.match(await page.locator('#content tbody').innerText(), /Norte Sul Logística/);
    await page.getByRole('button', { name: 'Limpar filtros', exact: true }).click();
    await rowCount(page, 10);
    assert.equal(await page.locator('#search').inputValue(), '');
    assert.equal(await page.locator('#creditor').inputValue(), '');
    assert.equal(await page.locator('#period').inputValue(), 'all');
    await focused(page, '#search');
  });
});

test('I04: vazio permite limpar e CSV baixado contém BOM e somente o subconjunto filtrado', async () => {
  await withPage(async (page) => {
    await page.getByLabel('Buscar nos registros').fill('inexistente');
    await page.getByRole('heading', { name: 'Nenhum débito encontrado' }).waitFor();
    assert.equal(await page.locator('#export').isDisabled(), true);
    await page.locator('[data-clear]').click();
    await rowCount(page, 6);
    await focused(page, '#search');
    await page.getByLabel('Credor', { exact: true }).selectOption('aurora');
    await page.getByLabel('Buscar nos registros').fill('cedro');
    await rowCount(page, 1);
    const pendingDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar débitos' }).click();
    const download = await pendingDownload;
    assert.equal(download.suggestedFilename(), 'brd-concordia-demo-2026-09-19.csv');
    assert.equal(await download.failure(), null);
    const bytes = await readFile(await download.path());
    assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
    const csv = bytes.toString('utf8');
    assert.match(csv, /"BRD-004";"Cedro Empreendimentos";"Aurora Participações";/);
    assert.doesNotMatch(csv, /BRD-00[12356]/);
    assert.match(csv, /48000,00/);
    assert.match(csv, /\r\n/);
    assert.match(csv, /Referência: 19\/09\/2026/);
    assert.match(await page.locator('#result-status').innerText(), /1 débito fictício/);
  }, { hash: '#debts' });
});

test('I03: limpar cancela uma busca pendente sem renderização tardia nem perda de foco', async () => {
  await withPage(async (page) => {
    await page.getByLabel('Credor', { exact: true }).selectOption('aurora');
    await page.getByLabel('Buscar nos registros').fill('cedro');
    await page.locator('#clear-filters').click();
    await rowCount(page, 6);
    await page.locator('[data-debt="BRD-001"]').click();
    // Avança o relógio virtual além do debounce; não há espera fixa de execução.
    await page.clock.runFor(200);
    assert.equal(await page.locator('#detail').isVisible(), true, 'Timer cancelado não deve fechar detalhe aberto depois de limpar.');
    await focused(page, '#detail-title');
    assert.equal(await page.locator('#search').inputValue(), '');
  }, { hash: '#debts', clock: true });
});

test('teclado: salto, Tab, navegação, foco visível e seleção de período', async () => {
  await withPage(async (page) => {
    await page.keyboard.press('Tab');
    await focused(page, '.skip-link');
    const skip = await page.locator('.skip-link').boundingBox();
    assert.ok(skip.y >= 0, 'Link de salto visível quando focado.');
    await page.keyboard.press('Enter');
    await focused(page, '#main');
    await page.keyboard.press('Tab');
    await focused(page, '#export');
    assert.equal(await page.locator('#export').evaluate((element) => getComputedStyle(element).outlineStyle), 'solid');
    await page.keyboard.press('Tab');
    await focused(page, '#creditor');
    await page.keyboard.press('Tab');
    await focused(page, '#search');
    await page.locator('nav [data-view="deadlines"]').focus();
    await page.keyboard.press('Enter');
    await title(page, 'Prazos');
    await focused(page, '#page-title');
    await page.locator('#period').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await rowCount(page, 1);
    await focused(page, '#period');
    assert.equal(await page.locator('#period').inputValue(), 'overdue');
    assert.match(await page.locator('#result-status').innerText(), /Período: Em atraso/);
    assert.equal(await page.locator('#result-status').getAttribute('role'), 'status');
    assert.equal(await page.locator('#result-status').getAttribute('aria-live'), 'polite');
  });
});

test('acessibilidade: anúncios acompanham os resultados exibidos em acordos e prazos', async () => {
  await withPage(async (page) => {
    await page.locator('nav [data-view="agreements"]').click();
    await title(page, 'Acordos');
    assert.match(await page.locator('#result-status').innerText(), /4 acordos/);
    await page.locator('#creditor').selectOption('alameda');
    await page.getByRole('heading', { name: 'Nenhum acordo encontrado' }).waitFor();
    assert.match(await page.locator('#result-status').innerText(), /0 acordos/);
    await page.locator('#clear-filters').click();
    await page.locator('nav [data-view="deadlines"]').click();
    await title(page, 'Prazos');
    assert.match(await page.locator('#result-status').innerText(), /Compromissos pendentes 10\. Período: Todos os períodos/);
    await page.locator('#period').selectOption('next30');
    await rowCount(page, 6);
    await page.locator('#creditor').selectOption('vertice');
    await rowCount(page, 2);
    assert.match(await page.locator('#result-status').innerText(), /Compromissos pendentes 2\. Período: Próximos 30 dias/);
  });
});

for (const width of [1440, 768, 390, 320]) {
  test(`apresentação ${width}px: quatro vistas e detalhe sem overflow global; tabela rola pelo teclado`, async () => {
    await withPage(async (page) => {
      for (const [view, heading] of [['overview', 'Visão geral'], ['debts', 'Débitos'], ['agreements', 'Acordos'], ['deadlines', 'Prazos']]) {
        await page.locator(`nav [data-view="${view}"]`).click();
        await title(page, heading);
        const geometry = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth }));
        assert.ok(geometry.document <= geometry.width, `${view}: página ${geometry.document}px excede viewport ${geometry.width}px`);
        assert.match(await page.locator('.demo-note').innerText(), /Demonstração[\s\S]*fictícios/);
        assert.match(await page.locator('.reference-date').innerText(), /19 set. 2026/);
        const table = page.locator('#content .table-scroll').first();
        if (await table.evaluate((element) => element.scrollWidth > element.clientWidth)) {
          await table.focus();
          await page.keyboard.press('ArrowRight');
          await page.waitForFunction(() => document.querySelector('#content .table-scroll').scrollLeft > 0);
        }
      }
      await page.locator('#content [data-debt]').first().click();
      const geometry = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth }));
      assert.ok(geometry.document <= geometry.width, `Detalhe ${geometry.document}px excede viewport ${geometry.width}px`);
      await focused(page, '#detail-title');
    }, { viewport: { width, height: 1000 } });
  });
}

test('texto a 200% simulado: reflow de quatro vistas e detalhe em viewport de 768px', async () => {
  await withPage(async (page) => {
    // Aumenta a raiz de 16px a 32px: simulação de texto 200%, não zoom nativo do navegador.
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    for (const [view, heading] of [['overview', 'Visão geral'], ['debts', 'Débitos'], ['agreements', 'Acordos'], ['deadlines', 'Prazos']]) {
      await page.locator(`nav [data-view="${view}"]`).click();
      await title(page, heading);
      const geometry = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth }));
      assert.ok(geometry.document <= geometry.width, `${view}: página ${geometry.document}px excede viewport ${geometry.width}px com texto 200%.`);
    }
    await page.locator('#content [data-debt]').first().click();
    assert.equal(await page.locator('#close-detail').isVisible(), true);
    const geometry = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth }));
    assert.ok(geometry.document <= geometry.width);
  }, { viewport: { width: 768, height: 1000 } });
});
