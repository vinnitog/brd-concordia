const test = require("node:test");
const assert = require("node:assert/strict");

const {
  classificarDocumento,
  avaliarExtracao,
  avaliarResumoCaso,
  avaliarMensagemSugerida,
  identificarDocumentosFaltantes,
  classificarRisco,
  liberarAnaliseParaUsuario,
} = require("../src/domain/ia-concordia");

test("um documento de tipo reconhecido e aceito e classificado", () => {
  assert.deepEqual(classificarDocumento("sentenca"), {
    aceito: true,
    tipo: "sentenca",
    reconhecido: true,
  });
});

test("um documento de tipo desconhecido tambem e aceito, sem prioridade", () => {
  assert.deepEqual(classificarDocumento("planilha-avulsa"), {
    aceito: true,
    tipo: "outro",
    reconhecido: false,
  });
  assert.deepEqual(classificarDocumento("  "), {
    aceito: true,
    tipo: "outro",
    reconhecido: false,
  });
});

test("uma extracao confiante e aceita", () => {
  assert.deepEqual(
    avaliarExtracao({ campo: "valorDivida", valor: "1500.00", confianca: 0.95 }),
    { status: "aceito" },
  );
});

test("uma extracao pouco confiante vai para confirmacao manual", () => {
  assert.deepEqual(
    avaliarExtracao({ campo: "vencimento", valor: "2026-09-15", confianca: 0.6 }),
    { status: "confirmar-manualmente", motivo: "confianca-abaixo-do-limite" },
  );
});

test("uma extracao sem valor vai para confirmacao manual", () => {
  assert.deepEqual(
    avaliarExtracao({ campo: "credor", valor: "", confianca: 0.99 }),
    { status: "confirmar-manualmente", motivo: "valor-ausente" },
  );
});

test("uma extracao respeita o limite de confianca informado", () => {
  assert.deepEqual(
    avaliarExtracao({
      campo: "valorDivida",
      valor: "1500.00",
      confianca: 0.7,
      confiancaMinima: 0.6,
    }),
    { status: "aceito" },
  );
});

test("uma extracao rejeita campo ausente e confianca invalida", () => {
  assert.deepEqual(avaliarExtracao({ valor: "x", confianca: 0.9 }), {
    status: "invalido",
    motivo: "campo-obrigatorio",
  });
  assert.deepEqual(
    avaliarExtracao({ campo: "valorDivida", valor: "x", confianca: 1.5 }),
    { status: "invalido", motivo: "confianca-invalida" },
  );
  assert.deepEqual(
    avaliarExtracao({ campo: "valorDivida", valor: "x", confianca: "alta" }),
    { status: "invalido", motivo: "confianca-invalida" },
  );
});

test("um resumo completo contem todos os elementos essenciais", () => {
  assert.deepEqual(
    avaliarResumoCaso({
      partes: ["Credor S.A.", "Devedor Ltda"],
      objeto: "Contrato de mutuo",
      valorDivida: "1500.00",
      formasPagamento: "Pix ou boleto",
      vencimentos: ["2026-09-15"],
      penalidades: "Multa de 2% e juros de mora",
    }),
    { completo: true },
  );
});

test("um resumo incompleto lista os elementos ausentes", () => {
  assert.deepEqual(
    avaliarResumoCaso({
      partes: ["Credor S.A.", "Devedor Ltda"],
      objeto: "Contrato de mutuo",
      valorDivida: " ",
      formasPagamento: "",
      vencimentos: [],
    }),
    {
      completo: false,
      ausentes: ["valorDivida", "formasPagamento", "vencimentos", "penalidades"],
    },
  );
});

test("uma mensagem valida e um aviso especifico por documento e situacao", () => {
  assert.deepEqual(
    avaliarMensagemSugerida({
      categoria: "aviso",
      tipoDocumento: "contrato",
      situacao: "vencimento-proximo",
      texto: "Prezado, lembramos cordialmente do vencimento em 15/09.",
    }),
    { valida: true },
  );
});

test("uma mensagem generica ou fora de aviso e recusada", () => {
  assert.deepEqual(
    avaliarMensagemSugerida({ categoria: "cobranca", texto: "Pague." }),
    {
      valida: false,
      erros: [
        "categoria-deve-ser-aviso",
        "tipo-documento-obrigatorio",
        "situacao-obrigatoria",
      ],
    },
  );
});

test("um acordo sem planilha atualizada aponta o documento faltante", () => {
  assert.deepEqual(
    identificarDocumentosFaltantes({
      documentosPresentes: ["contrato", "comprovante"],
    }),
    { acordoCompleto: false, faltantes: ["planilha-atualizada-debito"] },
  );
});

test("um acordo com a planilha atualizada esta completo", () => {
  assert.deepEqual(
    identificarDocumentosFaltantes({
      documentosPresentes: ["contrato", "planilha-atualizada-debito"],
    }),
    { acordoCompleto: true, faltantes: [] },
  );
});

test("um risco reconhecido e sinalizado", () => {
  assert.deepEqual(classificarRisco("clausula-abusiva"), {
    tipo: "clausula-abusiva",
    reconhecido: true,
  });
  assert.deepEqual(classificarRisco("atraso-logistico"), {
    tipo: "atraso-logistico",
    reconhecido: false,
  });
});

test("analises de risco e documentos faltantes exigem validacao de socio", () => {
  assert.deepEqual(
    liberarAnaliseParaUsuario({ tipoAnalise: "risco" }),
    { liberada: false, motivo: "aguardando-validacao-de-socio" },
  );
  assert.deepEqual(
    liberarAnaliseParaUsuario({
      tipoAnalise: "documentos-faltantes",
      validadoPorSocio: true,
    }),
    { liberada: true },
  );
});

test("uma extracao liberada nao exige validacao de socio", () => {
  assert.deepEqual(
    liberarAnaliseParaUsuario({ tipoAnalise: "extracao" }),
    { liberada: true },
  );
  assert.deepEqual(liberarAnaliseParaUsuario({}), {
    liberada: false,
    motivo: "tipo-analise-obrigatorio",
  });
});
