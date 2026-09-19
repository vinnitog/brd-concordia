const test = require("node:test");
const assert = require("node:assert/strict");

const {
  gerarMensagemCobranca,
  gerarMensagensCobranca,
  classificarMomentoCobranca,
  registrarMensagemEnviada,
} = require("../src/domain/cobranca-mensagens");

test("mensagem antes do vencimento preenche nome, valor e data e nasce como rascunho", () => {
  const resultado = gerarMensagemCobranca({
    tipo: "antes-do-vencimento",
    destinatario: "Maria Souza",
    papelDestinatario: "devedor",
    valor: 1234.5,
    vencimento: "2026-09-20",
  });

  assert.equal(resultado.gerada, true);
  assert.equal(resultado.mensagem.tipo, "antes-do-vencimento");
  assert.equal(resultado.mensagem.papelDestinatario, "devedor");
  assert.equal(resultado.mensagem.destinatario, "Maria Souza");
  assert.equal(resultado.mensagem.situacao, "rascunho");
  assert.match(resultado.mensagem.texto, /Maria Souza/);
  assert.match(resultado.mensagem.texto, /R\$ 1\.234,50/);
  assert.match(resultado.mensagem.texto, /20\/09\/2026/);
  assert.match(resultado.mensagem.texto, /BRD Concordia/);
});

test("mensagem apos o vencimento solicita regularizacao", () => {
  const resultado = gerarMensagemCobranca({
    tipo: "apos-vencimento",
    destinatario: "Joao",
    papelDestinatario: "fiador",
    valor: 200,
    vencimento: "2026-09-10",
  });

  assert.equal(resultado.gerada, true);
  assert.match(resultado.mensagem.texto, /em aberto/);
  assert.match(resultado.mensagem.texto, /regulariza/i);
});

test("mensagem incisiva avisa sobre as medidas juridicas cabiveis", () => {
  const resultado = gerarMensagemCobranca({
    tipo: "incisiva",
    destinatario: "Empresa XPTO",
    papelDestinatario: "devedor",
    valor: 5000,
    vencimento: "2026-08-01",
  });

  assert.equal(resultado.gerada, true);
  assert.match(resultado.mensagem.texto, /medidas juridicas cabiveis/);
});

test("uma assinatura informada substitui a marca padrao", () => {
  const resultado = gerarMensagemCobranca({
    tipo: "antes-do-vencimento",
    destinatario: "Ana",
    papelDestinatario: "devedor",
    valor: 100,
    vencimento: "2026-09-20",
    assinatura: "BRD Pactum",
  });

  assert.match(resultado.mensagem.texto, /BRD Pactum\.$/);
});

test("um tipo de mensagem nao suportado e rejeitado", () => {
  assert.deepEqual(
    gerarMensagemCobranca({
      tipo: "promocional",
      destinatario: "Ana",
      papelDestinatario: "devedor",
      valor: 100,
      vencimento: "2026-09-20",
    }),
    { gerada: false, erros: ["tipo-nao-suportado"] },
  );
});

test("uma mensagem informa todos os campos obrigatorios ausentes", () => {
  assert.deepEqual(gerarMensagemCobranca({}), {
    gerada: false,
    erros: [
      "tipo-nao-suportado",
      "destinatario-obrigatorio",
      "papel-destinatario-invalido",
      "valor-invalido",
      "vencimento-obrigatorio",
    ],
  });
});

test("um valor nao positivo e rejeitado", () => {
  assert.deepEqual(
    gerarMensagemCobranca({
      tipo: "incisiva",
      destinatario: "Ana",
      papelDestinatario: "devedor",
      valor: 0,
      vencimento: "2026-09-20",
    }),
    { gerada: false, erros: ["valor-invalido"] },
  );
});

test("uma data de vencimento inexistente e rejeitada", () => {
  assert.deepEqual(
    gerarMensagemCobranca({
      tipo: "incisiva",
      destinatario: "Ana",
      papelDestinatario: "devedor",
      valor: 100,
      vencimento: "2026-02-30",
    }),
    { gerada: false, erros: ["vencimento-invalido"] },
  );
});

test("um papel de destinatario fora de devedor ou fiador e rejeitado", () => {
  assert.deepEqual(
    gerarMensagemCobranca({
      tipo: "incisiva",
      destinatario: "Ana",
      papelDestinatario: "credor",
      valor: 100,
      vencimento: "2026-09-20",
    }),
    { gerada: false, erros: ["papel-destinatario-invalido"] },
  );
});

test("valores na casa dos milhares recebem separador de milhar", () => {
  const resultado = gerarMensagemCobranca({
    tipo: "apos-vencimento",
    destinatario: "Ana",
    papelDestinatario: "devedor",
    valor: 12345.6,
    vencimento: "2026-09-20",
  });

  assert.match(resultado.mensagem.texto, /R\$ 12\.345,60/);
});

test("a cobranca gera um rascunho para devedor e outro para fiador", () => {
  const resultado = gerarMensagensCobranca({
    tipo: "apos-vencimento",
    devedor: "Maria",
    fiador: "Jose",
    valor: 100,
    vencimento: "2026-09-20",
  });

  assert.equal(resultado.gerada, true);
  assert.equal(resultado.mensagens.length, 2);
  assert.deepEqual(
    resultado.mensagens.map((m) => m.papelDestinatario),
    ["devedor", "fiador"],
  );
});

test("a cobranca gera apenas para o papel informado", () => {
  const resultado = gerarMensagensCobranca({
    tipo: "apos-vencimento",
    devedor: "Maria",
    valor: 100,
    vencimento: "2026-09-20",
  });

  assert.equal(resultado.mensagens.length, 1);
  assert.equal(resultado.mensagens[0].papelDestinatario, "devedor");
});

test("a cobranca sem destinatario informado e rejeitada", () => {
  assert.deepEqual(
    gerarMensagensCobranca({
      tipo: "apos-vencimento",
      valor: 100,
      vencimento: "2026-09-20",
    }),
    { gerada: false, erros: ["destinatario-obrigatorio"] },
  );
});

test("a cobranca em lote propaga o erro de validacao encontrado", () => {
  assert.deepEqual(
    gerarMensagensCobranca({
      tipo: "apos-vencimento",
      devedor: "Maria",
      valor: -1,
      vencimento: "2026-09-20",
    }),
    { gerada: false, erros: ["valor-invalido"] },
  );
});

test("o rascunho e disparado dois dias antes do vencimento", () => {
  assert.deepEqual(
    classificarMomentoCobranca({
      vencimento: "2026-09-20",
      referencia: "2026-09-18",
    }),
    { valido: true, tipo: "antes-do-vencimento" },
  );
});

test("o rascunho e disparado vinte e quatro horas apos o vencimento", () => {
  assert.deepEqual(
    classificarMomentoCobranca({
      vencimento: "2026-09-20",
      referencia: "2026-09-21",
    }),
    { valido: true, tipo: "apos-vencimento" },
  );
});

test("um dia fora da agenda nao gera disparo automatico", () => {
  assert.deepEqual(
    classificarMomentoCobranca({
      vencimento: "2026-09-20",
      referencia: "2026-09-19",
    }),
    { valido: true, tipo: null },
  );
});

test("a classificacao rejeita datas ausentes ou invalidas", () => {
  assert.deepEqual(classificarMomentoCobranca({ referencia: "2026-13-01" }), {
    valido: false,
    erros: ["vencimento-obrigatorio", "referencia-invalida"],
  });
});

test("o envio registrado preserva o historico anterior e fica visivel ao cliente", () => {
  const historicoAnterior = [{ tipo: "antes-do-vencimento" }];
  const resultado = registrarMensagemEnviada({
    historico: historicoAnterior,
    mensagem: {
      tipo: "apos-vencimento",
      destinatario: "Maria",
      papelDestinatario: "devedor",
      texto: "Ola, Maria...",
    },
    enviadaPor: "usuario-1",
    enviadaEm: "2026-09-21T09:00:00Z",
  });

  assert.equal(resultado.registrado, true);
  assert.equal(resultado.historico.length, 2);
  assert.deepEqual(resultado.historico[1], {
    tipo: "apos-vencimento",
    destinatario: "Maria",
    papelDestinatario: "devedor",
    texto: "Ola, Maria...",
    enviadaPor: "usuario-1",
    enviadaEm: "2026-09-21T09:00:00Z",
    visivelParaCliente: true,
  });
  // O historico original nao e mutado.
  assert.equal(historicoAnterior.length, 1);
});

test("o registro de envio exige mensagem, autor e data do envio", () => {
  assert.deepEqual(registrarMensagemEnviada({}), {
    registrado: false,
    erros: [
      "mensagem-obrigatoria",
      "enviada-por-obrigatorio",
      "enviada-em-obrigatorio",
    ],
  });
});
