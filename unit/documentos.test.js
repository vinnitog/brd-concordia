const test = require("node:test");
const assert = require("node:assert/strict");

const {
  VERSAO_BIBLIOTECA,
  listarCatalogo,
  gerarDocumento,
} = require("../src/domain/documentos");

const CASO_COMPLETO = {
  credor: { nome: "BRD Recuperacao", documento: "00.000.000/0001-00" },
  devedor: { nome: "Fulano de Tal", documento: "000.000.000-00" },
  debito: { numero: "DEB-1", valorAtualizado: "R$ 10.000,00" },
  acordo: { numero: "ACD-1", quantidadeParcelas: 6 },
  processo: { numero: "PROC-1", vara: "1a Vara Civel", comarca: "Sao Paulo" },
};

test("a biblioteca lista categorias em ordem alfabetica", () => {
  const catalogo = listarCatalogo();
  const categorias = catalogo.map((item) => item.categoria);

  assert.deepEqual(categorias, [...categorias].sort((a, b) => a.localeCompare(b, "pt-BR")));
  assert.ok(categorias.includes("Pesquisas patrimoniais"));
});

test("cada categoria aninha seus subtipos em ordem alfabetica", () => {
  for (const { subtipos } of listarCatalogo()) {
    const nomes = subtipos.map((item) => item.subtipo);
    assert.ok(nomes.length > 0);
    assert.deepEqual(nomes, [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR")));
  }
});

test("as pesquisas patrimoniais incluem SISBAJUD, RENAJUD e INFOJUD", () => {
  const pesquisas = listarCatalogo().find(
    (item) => item.categoria === "Pesquisas patrimoniais",
  );

  const ids = pesquisas.subtipos.map((item) => item.id);
  assert.deepEqual(ids.sort(), [
    "pesquisas-patrimoniais-infojud",
    "pesquisas-patrimoniais-renajud",
    "pesquisas-patrimoniais-sisbajud",
  ]);
});

test("gerar um documento preenche o modelo com os dados do caso", () => {
  const resultado = gerarDocumento({
    idModelo: "quitacao-termo-quitacao",
    caso: CASO_COMPLETO,
    geradoPor: "usuario-1",
    geradoEm: "2026-09-18T12:00:00Z",
  });

  assert.equal(resultado.gerado, true);
  assert.equal(resultado.documento.idModelo, "quitacao-termo-quitacao");
  assert.equal(resultado.documento.versaoModelo, VERSAO_BIBLIOTECA);
  assert.equal(resultado.documento.geradoPor, "usuario-1");
  assert.deepEqual(resultado.documento.vinculo, {
    idDebito: "DEB-1",
    idAcordo: "ACD-1",
    idProcesso: "PROC-1",
  });
  assert.match(resultado.documento.conteudo, /Fulano de Tal/);
  assert.doesNotMatch(resultado.documento.conteudo, /\{\{/);
});

test("gerar um documento de modelo inexistente e recusado", () => {
  assert.deepEqual(
    gerarDocumento({
      idModelo: "modelo-que-nao-existe",
      caso: CASO_COMPLETO,
      geradoPor: "usuario-1",
      geradoEm: "2026-09-18T12:00:00Z",
    }),
    { gerado: false, erros: ["modelo-nao-encontrado"] },
  );
});

test("gerar um documento exige autoria e data de emissao", () => {
  const resultado = gerarDocumento({
    idModelo: "quitacao-termo-quitacao",
    caso: CASO_COMPLETO,
  });

  assert.equal(resultado.gerado, false);
  assert.ok(resultado.erros.includes("gerado-por-obrigatorio"));
  assert.ok(resultado.erros.includes("gerado-em-obrigatorio"));
});

test("gerar um documento rejeita data de emissao invalida", () => {
  const resultado = gerarDocumento({
    idModelo: "quitacao-termo-quitacao",
    caso: CASO_COMPLETO,
    geradoPor: "usuario-1",
    geradoEm: "ontem",
  });

  assert.equal(resultado.gerado, false);
  assert.ok(resultado.erros.includes("gerado-em-invalido"));
});

test("gerar um documento aponta os campos ausentes do caso", () => {
  const resultado = gerarDocumento({
    idModelo: "quitacao-termo-quitacao",
    caso: { credor: { nome: "BRD Recuperacao" } },
    geradoPor: "usuario-1",
    geradoEm: "2026-09-18T12:00:00Z",
  });

  assert.equal(resultado.gerado, false);
  assert.ok(resultado.erros.includes("dados-do-caso-incompletos"));
  assert.deepEqual(resultado.camposFaltantes, [
    "credor.documento",
    "devedor.nome",
    "devedor.documento",
    "debito.numero",
    "acordo.numero",
  ]);
});

test("um valor numerico zero e aceito como dado preenchido", () => {
  const resultado = gerarDocumento({
    idModelo: "cobranca-extrajudicial-notificacao",
    caso: {
      credor: { nome: "BRD Recuperacao" },
      devedor: { nome: "Fulano de Tal" },
      debito: { numero: "DEB-1", valorAtualizado: 0 },
    },
    geradoPor: "usuario-1",
    geradoEm: "2026-09-18T12:00:00Z",
  });

  assert.equal(resultado.gerado, true);
  assert.match(resultado.documento.conteudo, /valor atualizado de 0/);
});

test("um documento extrajudicial preserva vinculo apenas com o debito", () => {
  const resultado = gerarDocumento({
    idModelo: "cobranca-extrajudicial-carta-amigavel",
    caso: {
      devedor: { nome: "Fulano de Tal" },
      debito: { numero: "DEB-1", valorAtualizado: "R$ 500,00" },
    },
    geradoPor: "usuario-1",
    geradoEm: "2026-09-18T12:00:00Z",
  });

  assert.equal(resultado.gerado, true);
  assert.deepEqual(resultado.documento.vinculo, { idDebito: "DEB-1" });
});
