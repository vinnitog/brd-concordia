const test = require("node:test");
const assert = require("node:assert/strict");

const { validarProcessoJudicial, TIPOS_ACAO } = require("../src/domain/judicial");

function processoValido(sobrescreve = {}) {
  return {
    numeroProcesso: "0001234-56.2026.8.26.0100",
    vara: "2a Vara Civel",
    comarca: "Sao Paulo",
    tipoAcao: "acao-de-cobranca",
    valorCausa: 15000.5,
    dataDistribuicao: "2026-03-10",
    dataSuspensao: "2026-06-01",
    ...sobrescreve,
  };
}

test("um processo judicial com todos os dados preenchidos e valido", () => {
  assert.deepEqual(validarProcessoJudicial(processoValido()), { valido: true });
});

test("todos os campos judiciais sao opcionais: um processo vazio e valido", () => {
  assert.deepEqual(validarProcessoJudicial(), { valido: true });
  assert.deepEqual(validarProcessoJudicial({}), { valido: true });
});

test("as quatro opcoes de tipo de acao sao aceitas", () => {
  for (const tipoAcao of TIPOS_ACAO) {
    assert.deepEqual(
      validarProcessoJudicial({ tipoAcao }),
      { valido: true },
      `tipo de acao ${tipoAcao} deveria ser aceito`,
    );
  }
});

test("tipo de acao fora da lista pre-definida e rejeitado", () => {
  assert.deepEqual(validarProcessoJudicial({ tipoAcao: "acao-cautelar" }), {
    valido: false,
    erros: ["tipo-acao-invalido"],
  });
});

test("campos de texto informados nao podem ser vazios ou nao-texto", () => {
  assert.deepEqual(validarProcessoJudicial({ numeroProcesso: "   " }), {
    valido: false,
    erros: ["numero-processo-invalido"],
  });
  assert.deepEqual(validarProcessoJudicial({ vara: 42 }), {
    valido: false,
    erros: ["vara-invalida"],
  });
  assert.deepEqual(validarProcessoJudicial({ comarca: "" }), {
    valido: false,
    erros: ["comarca-invalida"],
  });
});

test("o valor da causa, quando informado, precisa ser monetario valido", () => {
  assert.deepEqual(validarProcessoJudicial({ valorCausa: 0 }), { valido: true });
  assert.deepEqual(validarProcessoJudicial({ valorCausa: -1 }), {
    valido: false,
    erros: ["valor-causa-invalido"],
  });
  assert.deepEqual(validarProcessoJudicial({ valorCausa: "10000" }), {
    valido: false,
    erros: ["valor-causa-invalido"],
  });
});

test("datas informadas precisam ser datas de calendario validas", () => {
  assert.deepEqual(validarProcessoJudicial({ dataDistribuicao: "10/03/2026" }), {
    valido: false,
    erros: ["data-distribuicao-invalida"],
  });
  assert.deepEqual(validarProcessoJudicial({ dataSuspensao: "2026-02-30" }), {
    valido: false,
    erros: ["data-suspensao-invalida"],
  });
});

test("uma suspensao so pode vir depois da distribuicao", () => {
  assert.deepEqual(
    validarProcessoJudicial({
      dataDistribuicao: "2026-06-01",
      dataSuspensao: "2026-03-10",
    }),
    { valido: false, erros: ["data-suspensao-anterior-a-distribuicao"] },
  );
  assert.deepEqual(
    validarProcessoJudicial({
      dataDistribuicao: "2026-03-10",
      dataSuspensao: "2026-03-10",
    }),
    { valido: true },
  );
});

test("um processo reune todos os erros em ordem determinista", () => {
  assert.deepEqual(
    validarProcessoJudicial({
      numeroProcesso: "",
      vara: 1,
      comarca: "  ",
      tipoAcao: "acao-cautelar",
      valorCausa: -5,
      dataDistribuicao: "ontem",
      dataSuspensao: "amanha",
    }),
    {
      valido: false,
      erros: [
        "numero-processo-invalido",
        "vara-invalida",
        "comarca-invalida",
        "tipo-acao-invalido",
        "valor-causa-invalido",
        "data-distribuicao-invalida",
        "data-suspensao-invalida",
      ],
    },
  );
});
