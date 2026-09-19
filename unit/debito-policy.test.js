const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validarDebito,
  decidirTransicaoStatusDebito,
  validarAlteracaoDebito,
} = require("../src/domain/policies");

function debitoValido(sobrescreve = {}) {
  return {
    partes: [
      { idParte: "parte-credor", papel: "credor" },
      { idParte: "parte-devedor", papel: "devedor" },
    ],
    origem: "Contrato de prestacao de servicos",
    status: "em-avaliacao",
    fase: "extrajudicial",
    grauRecuperabilidade: "alto",
    ...sobrescreve,
  };
}

test("um debito completo com credor e devedor e valido", () => {
  assert.deepEqual(validarDebito(debitoValido()), { valido: true });
});

test("um debito exige ao menos uma parte cadastrada", () => {
  assert.deepEqual(validarDebito(debitoValido({ partes: [] })), {
    valido: false,
    erros: ["partes-obrigatorias"],
  });
});

test("uma parte precisa de identificacao e papel valido", () => {
  assert.deepEqual(
    validarDebito(
      debitoValido({
        partes: [
          { papel: "credor" },
          { idParte: "parte-x", papel: "intermediario" },
        ],
      }),
    ),
    {
      valido: false,
      erros: ["parte-id-obrigatorio", "papel-parte-invalido", "devedor-obrigatorio"],
    },
  );
});

test("um debito exige papel de credor e de devedor", () => {
  assert.deepEqual(
    validarDebito(
      debitoValido({
        partes: [{ idParte: "parte-credor", papel: "credor" }],
      }),
    ),
    { valido: false, erros: ["devedor-obrigatorio"] },
  );
});

test("a mesma parte pode acumular papeis (devedor tambem garantidor)", () => {
  assert.deepEqual(
    validarDebito(
      debitoValido({
        partes: [
          { idParte: "parte-credor", papel: "credor" },
          { idParte: "parte-devedor", papel: "devedor" },
          { idParte: "parte-devedor", papel: "garantidor" },
        ],
      }),
    ),
    { valido: true },
  );
});

test("um debito rejeita o mesmo papel repetido para a mesma parte", () => {
  assert.deepEqual(
    validarDebito(
      debitoValido({
        partes: [
          { idParte: "parte-credor", papel: "credor" },
          { idParte: "parte-devedor", papel: "devedor" },
          { idParte: "parte-devedor", papel: "devedor" },
        ],
      }),
    ),
    { valido: false, erros: ["parte-duplicada"] },
  );
});

test("a origem do debito e obrigatoria e aceita valores fora de um catalogo fixo", () => {
  assert.deepEqual(validarDebito(debitoValido({ origem: "  " })), {
    valido: false,
    erros: ["origem-obrigatoria"],
  });
  assert.deepEqual(
    validarDebito(debitoValido({ origem: "Origem nova ainda nao catalogada" })),
    { valido: true },
  );
});

test("o status atual precisa pertencer ao ciclo de vida do debito", () => {
  assert.deepEqual(validarDebito(debitoValido({ status: undefined })), {
    valido: false,
    erros: ["status-obrigatorio"],
  });
  assert.deepEqual(validarDebito(debitoValido({ status: "arquivado" })), {
    valido: false,
    erros: ["status-invalido"],
  });
});

test("a fase extrajudicial/judicial/pre-contenciosa e exclusiva e obrigatoria", () => {
  assert.deepEqual(validarDebito(debitoValido({ fase: undefined })), {
    valido: false,
    erros: ["fase-obrigatoria"],
  });
  assert.deepEqual(validarDebito(debitoValido({ fase: "contencioso" })), {
    valido: false,
    erros: ["fase-invalida"],
  });
});

test("o grau de recuperabilidade usa a classificacao predefinida", () => {
  assert.deepEqual(
    validarDebito(debitoValido({ grauRecuperabilidade: undefined })),
    { valido: false, erros: ["grau-recuperabilidade-obrigatorio"] },
  );
  assert.deepEqual(
    validarDebito(debitoValido({ grauRecuperabilidade: "otimo" })),
    { valido: false, erros: ["grau-recuperabilidade-invalido"] },
  );
});

test("as observacoes internas sao opcionais mas precisam ser texto", () => {
  assert.deepEqual(
    validarDebito(debitoValido({ observacoesInternas: "Contato preferencial por e-mail" })),
    { valido: true },
  );
  assert.deepEqual(validarDebito(debitoValido({ observacoesInternas: 42 })), {
    valido: false,
    erros: ["observacoes-internas-invalidas"],
  });
});

test("um debito reune todos os erros em ordem determinista", () => {
  assert.deepEqual(
    validarDebito({
      partes: [],
      origem: "",
      status: "arquivado",
      fase: "contencioso",
      grauRecuperabilidade: "otimo",
      observacoesInternas: 10,
    }),
    {
      valido: false,
      erros: [
        "partes-obrigatorias",
        "origem-obrigatoria",
        "status-invalido",
        "fase-invalida",
        "grau-recuperabilidade-invalido",
        "observacoes-internas-invalidas",
      ],
    },
  );
});

test("o debito avanca pelo fluxo definido pelos socios", () => {
  assert.deepEqual(
    decidirTransicaoStatusDebito({
      de: "em-avaliacao",
      para: "cobranca-extrajudicial",
    }),
    { permitida: true },
  );
  assert.deepEqual(
    decidirTransicaoStatusDebito({
      de: "negociacao-extrajudicial",
      para: "negociacao-concluida",
    }),
    { permitida: true },
  );
  assert.deepEqual(
    decidirTransicaoStatusDebito({
      de: "negociacao-infrutifera",
      para: "enviado-ao-judicial",
    }),
    { permitida: true },
  );
});

test("o debito nao pula etapas do fluxo", () => {
  assert.deepEqual(
    decidirTransicaoStatusDebito({
      de: "em-avaliacao",
      para: "debito-executado",
    }),
    { permitida: false, motivo: "transicao-nao-permitida" },
  );
});

test("um status terminal nao evolui", () => {
  assert.deepEqual(
    decidirTransicaoStatusDebito({
      de: "execucao-satisfeita",
      para: "debito-executado",
    }),
    { permitida: false, motivo: "transicao-nao-permitida" },
  );
});

test("uma transicao rejeita status desconhecidos", () => {
  assert.deepEqual(
    decidirTransicaoStatusDebito({ de: "inexistente", para: "em-avaliacao" }),
    { permitida: false, motivo: "status-atual-invalido" },
  );
  assert.deepEqual(
    decidirTransicaoStatusDebito({ de: "em-avaliacao", para: "inexistente" }),
    { permitida: false, motivo: "status-destino-invalido" },
  );
});

test("uma alteracao de debito registra autor, momento e campos alterados", () => {
  assert.deepEqual(
    validarAlteracaoDebito({
      alteradoPor: "usuario-1",
      alteradoEm: "2026-09-18T12:00:00Z",
      camposAlterados: ["grauRecuperabilidade", "status"],
    }),
    { valida: true },
  );
});

test("uma alteracao sem autor, data valida e campos e rejeitada", () => {
  assert.deepEqual(
    validarAlteracaoDebito({
      alteradoEm: "ontem",
      camposAlterados: [],
    }),
    {
      valida: false,
      erros: [
        "autor-alteracao-obrigatorio",
        "data-alteracao-invalida",
        "campos-alterados-obrigatorios",
      ],
    },
  );
});
