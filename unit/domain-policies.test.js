const test = require("node:test");
const assert = require("node:assert/strict");

const {
  decidirAtivacaoAcordo,
  validarPrazo,
  validarConferenciaPagamento,
} = require("../src/domain/policies");

test("um debito nao pode ativar um segundo acordo", () => {
  const decisao = decidirAtivacaoAcordo({
    idDebito: "debito-1",
    idCandidato: "acordo-2",
    acordos: [
      { id: "acordo-1", idDebito: "debito-1", status: "ativo" },
      { id: "acordo-2", idDebito: "debito-1" },
    ],
  });

  assert.deepEqual(decisao, {
    permitida: false,
    motivo: "acordo-ativo-existente",
    idAcordoAtivo: "acordo-1",
  });
});

test("um debito nao pode ativar um acordo fora de seu historico", () => {
  assert.deepEqual(
    decidirAtivacaoAcordo({
      idDebito: "debito-1",
      idCandidato: "acordo-2",
      acordos: [{ id: "acordo-1", idDebito: "debito-1" }],
    }),
    {
      permitida: false,
      motivo: "acordo-nao-encontrado",
    },
  );
});

test("um debito pode ativar um acordo quando nenhum outro esta ativo", () => {
  assert.deepEqual(
    decidirAtivacaoAcordo({
      idDebito: "debito-1",
      idCandidato: "acordo-2",
      acordos: [
        { id: "acordo-1", idDebito: "debito-1" },
        { id: "acordo-2", idDebito: "debito-1" },
      ],
    }),
    { permitida: true },
  );
});

test("um acordo ativo de outro debito nao bloqueia a ativacao", () => {
  assert.deepEqual(
    decidirAtivacaoAcordo({
      idDebito: "debito-2",
      idCandidato: "acordo-2",
      acordos: [
        { id: "acordo-1", idDebito: "debito-1", status: "ativo" },
        { id: "acordo-2", idDebito: "debito-2" },
      ],
    }),
    { permitida: true },
  );
});

test("um prazo derivado mantem referencia a sua origem", () => {
  assert.deepEqual(
    validarPrazo({
      venceEm: "2026-09-15",
      origem: "parcela",
    }),
    {
      valido: false,
      erros: ["id-origem-obrigatorio"],
    },
  );
});

test("um prazo manual identifica usuario responsavel e justificativa", () => {
  assert.deepEqual(
    validarPrazo({
      venceEm: "2026-09-15",
      origem: "manual",
    }),
    {
      valido: false,
      erros: ["usuario-responsavel-obrigatorio", "justificativa-obrigatoria"],
    },
  );
});

test("um prazo identifica data e origem suportada", () => {
  assert.deepEqual(
    validarPrazo({ origem: "email" }),
    {
      valido: false,
      erros: ["data-vencimento-obrigatoria", "origem-nao-suportada"],
    },
  );
});

test("um prazo rejeita data inexistente e campos manuais em branco", () => {
  assert.deepEqual(
    validarPrazo({
      venceEm: "2026-02-30",
      origem: "manual",
      idUsuarioResponsavel: " ",
      justificativa: " ",
    }),
    {
      valido: false,
      erros: [
        "data-vencimento-invalida",
        "usuario-responsavel-obrigatorio",
        "justificativa-obrigatoria",
      ],
    },
  );
});

test("um prazo usa data de calendario no formato ISO", () => {
  assert.deepEqual(
    validarPrazo({
      venceEm: "15/09/2026",
      origem: "parcela",
      idOrigem: "parcela-1",
    }),
    {
      valido: false,
      erros: ["data-vencimento-invalida"],
    },
  );
});

test("prazos derivados e manuais completos sao validos", () => {
  assert.deepEqual(
    validarPrazo({
      venceEm: "2026-09-15",
      origem: "parcela",
      idOrigem: "parcela-1",
    }),
    { valido: true },
  );
  assert.deepEqual(
    validarPrazo({
      venceEm: "2026-09-15",
      origem: "manual",
      idUsuarioResponsavel: "usuario-1",
      justificativa: "Prazo informado pela equipe juridica",
    }),
    { valido: true },
  );
});

test("uma conferencia de pagamento registra os dois papeis operacionais", () => {
  assert.deepEqual(
    validarConferenciaPagamento({
      registradoPor: "usuario-1",
      registradoEm: "2026-08-28T12:00:00Z",
      conferidoEm: "2026-08-28T12:05:00Z",
    }),
    {
      valida: false,
      erros: ["conferido-por-obrigatorio"],
    },
  );
});

test("uma conferencia informa todos os papeis operacionais ausentes", () => {
  assert.deepEqual(
    validarConferenciaPagamento({
      registradoEm: "2026-08-28T12:00:00Z",
      conferidoEm: "2026-08-28T12:05:00Z",
    }),
    {
      valida: false,
      erros: ["registrado-por-obrigatorio", "conferido-por-obrigatorio"],
    },
  );
});

test("uma conferencia registra quando cada papel foi exercido", () => {
  assert.deepEqual(
    validarConferenciaPagamento({
      registradoPor: "usuario-1",
      conferidoPor: "usuario-2",
    }),
    {
      valida: false,
      erros: ["registrado-em-obrigatorio", "conferido-em-obrigatorio"],
    },
  );
});

test("uma conferencia rejeita usuarios em branco e datas invalidas", () => {
  assert.deepEqual(
    validarConferenciaPagamento({
      registradoPor: " ",
      registradoEm: "ontem",
      conferidoPor: " ",
      conferidoEm: "amanha",
    }),
    {
      valida: false,
      erros: [
        "registrado-por-obrigatorio",
        "registrado-em-invalido",
        "conferido-por-obrigatorio",
        "conferido-em-invalido",
      ],
    },
  );
});

test("uma conferencia rejeita timestamp com data civil inexistente", () => {
  assert.deepEqual(
    validarConferenciaPagamento({
      registradoPor: "usuario-1",
      registradoEm: "2026-02-30T12:00:00Z",
      conferidoPor: "usuario-2",
      conferidoEm: "2026-02-30T12:05:00Z",
    }),
    {
      valida: false,
      erros: ["registrado-em-invalido", "conferido-em-invalido"],
    },
  );
});

test("uma conferencia nao pode anteceder o lancamento", () => {
  assert.deepEqual(
    validarConferenciaPagamento({
      registradoPor: "usuario-1",
      registradoEm: "2026-08-28T12:05:00Z",
      conferidoPor: "usuario-2",
      conferidoEm: "2026-08-28T12:00:00Z",
    }),
    {
      valida: false,
      erros: ["conferencia-anterior-ao-lancamento"],
    },
  );
});

test("um pagamento pode ser registrado e conferido pelo mesmo usuario", () => {
  assert.deepEqual(
    validarConferenciaPagamento({
      registradoPor: "usuario-1",
      registradoEm: "2026-08-28T12:00:00Z",
      conferidoPor: "usuario-1",
      conferidoEm: "2026-08-28T12:05:00Z",
    }),
    { valida: true },
  );
});
