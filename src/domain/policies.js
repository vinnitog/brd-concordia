const ORIGENS_PRAZO = new Set(["parcela", "acordo", "judicial", "manual"]);
const TIPOS_PARTE = new Set(["PF", "PJ"]);
const PAPEIS_PARTE = new Set(["credor", "devedor"]);

function temTexto(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

function informado(valor) {
  if (valor === undefined || valor === null) {
    return false;
  }

  if (typeof valor === "string") {
    return valor.trim().length > 0;
  }

  if (Array.isArray(valor)) {
    return valor.length > 0;
  }

  if (typeof valor === "object") {
    return Object.keys(valor).length > 0;
  }

  return true;
}

function dataCalendarioValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

function dataHoraValida(valor) {
  if (!temTexto(valor)) {
    return false;
  }

  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(
    valor,
  );

  if (!partes) {
    return false;
  }

  const [, ano, mes, dia, hora, minuto, segundo, fuso] = partes;
  const [, horaFuso = "00", minutoFuso = "00"] = /[+-](\d{2}):(\d{2})/.exec(fuso) ?? [];

  return (
    dataCalendarioValida(`${ano}-${mes}-${dia}`) &&
    Number(hora) <= 23 &&
    Number(minuto) <= 59 &&
    Number(segundo) <= 59 &&
    Number(horaFuso) <= 23 &&
    Number(minutoFuso) <= 59 &&
    !Number.isNaN(Date.parse(valor))
  );
}

function decidirAtivacaoAcordo({ idDebito, idCandidato, acordos = [] } = {}) {
  const candidato = acordos.find(
    (acordo) => acordo.id === idCandidato && acordo.idDebito === idDebito,
  );

  if (!candidato) {
    return { permitida: false, motivo: "acordo-nao-encontrado" };
  }

  const acordoAtivo = acordos.find(
    (acordo) =>
      acordo.idDebito === idDebito &&
      acordo.status === "ativo" &&
      acordo.id !== idCandidato,
  );

  if (acordoAtivo) {
    return {
      permitida: false,
      motivo: "acordo-ativo-existente",
      idAcordoAtivo: acordoAtivo.id,
    };
  }

  return { permitida: true };
}

function validarPrazo({
  venceEm,
  origem,
  idOrigem,
  idUsuarioResponsavel,
  justificativa,
} = {}) {
  const erros = [];

  if (!temTexto(venceEm)) {
    erros.push("data-vencimento-obrigatoria");
  } else if (!dataCalendarioValida(venceEm)) {
    erros.push("data-vencimento-invalida");
  }

  if (!ORIGENS_PRAZO.has(origem)) {
    erros.push("origem-nao-suportada");
  }

  if (ORIGENS_PRAZO.has(origem) && origem !== "manual" && !temTexto(idOrigem)) {
    erros.push("id-origem-obrigatorio");
  }

  if (origem === "manual" && !temTexto(idUsuarioResponsavel)) {
    erros.push("usuario-responsavel-obrigatorio");
  }

  if (origem === "manual" && !temTexto(justificativa)) {
    erros.push("justificativa-obrigatoria");
  }

  return erros.length === 0 ? { valido: true } : { valido: false, erros };
}

function validarConferenciaPagamento({
  registradoPor,
  registradoEm,
  conferidoPor,
  conferidoEm,
} = {}) {
  const erros = [];
  const registradoEmValido = dataHoraValida(registradoEm);
  const conferidoEmValido = dataHoraValida(conferidoEm);

  if (!temTexto(registradoPor)) {
    erros.push("registrado-por-obrigatorio");
  }

  if (!temTexto(registradoEm)) {
    erros.push("registrado-em-obrigatorio");
  } else if (!registradoEmValido) {
    erros.push("registrado-em-invalido");
  }

  if (!temTexto(conferidoPor)) {
    erros.push("conferido-por-obrigatorio");
  }

  if (!temTexto(conferidoEm)) {
    erros.push("conferido-em-obrigatorio");
  } else if (!conferidoEmValido) {
    erros.push("conferido-em-invalido");
  }

  if (
    registradoEmValido &&
    conferidoEmValido &&
    Date.parse(conferidoEm) < Date.parse(registradoEm)
  ) {
    erros.push("conferencia-anterior-ao-lancamento");
  }

  return erros.length === 0 ? { valida: true } : { valida: false, erros };
}

// Cadastro unico de Parte com selecao de tipo (PF/PJ). Decisoes dos socios na
// Issue #9: um unico cadastro com selecao de tipo; credor e devedor sao papeis
// que a mesma Parte pode assumir simultaneamente ou em momentos distintos;
// representante legal so faz sentido para PJ; demais dados sao opcionais nesta
// fase e CPF/CNPJ aceita qualquer entrada (sem validacao de formato).
function validarCadastroParte({ tipo, papeis, representanteLegal } = {}) {
  const erros = [];

  if (!temTexto(tipo)) {
    erros.push("tipo-obrigatorio");
  } else if (!TIPOS_PARTE.has(tipo)) {
    erros.push("tipo-invalido");
  }

  const listaPapeis = Array.isArray(papeis) ? papeis : papeis == null ? [] : [papeis];
  if (listaPapeis.some((papel) => !PAPEIS_PARTE.has(papel))) {
    erros.push("papel-invalido");
  }

  if (tipo === "PF" && informado(representanteLegal)) {
    erros.push("representante-legal-nao-se-aplica-a-pf");
  }

  return erros.length === 0 ? { valido: true } : { valido: false, erros };
}

// Acordos celebrados por cliente. Decisao dos socios na Issue #9: a Parte enxerga
// todos os acordos em que participa (como credor ou devedor) e o resumo expoe os
// dados que revelam o dinheiro a entrar: valor do acordo, quantidade e valor das
// parcelas e seus vencimentos. A forma de visualizacao ficou em aberto pelos socios.
function resumirAcordosCelebrados({ idParte, acordos = [] } = {}) {
  const doCliente = acordos.filter(
    (acordo) =>
      acordo && (acordo.idCredor === idParte || acordo.idDevedor === idParte),
  );

  const itens = doCliente.map((acordo) => {
    const parcelas = Array.isArray(acordo.parcelas) ? acordo.parcelas : [];

    return {
      idAcordo: acordo.id,
      valor: typeof acordo.valor === "number" ? acordo.valor : null,
      quantidadeParcelas: parcelas.length,
      vencimentos: parcelas.map((parcela) => parcela.vencimento ?? null),
      valoresParcelas: parcelas.map((parcela) =>
        typeof parcela.valor === "number" ? parcela.valor : null,
      ),
    };
  });

  const totalPrevisto = itens.reduce(
    (soma, item) =>
      soma +
      item.valoresParcelas
        .filter((valor) => typeof valor === "number")
        .reduce((parcial, valor) => parcial + valor, 0),
    0,
  );

  return {
    idParte,
    quantidadeAcordos: itens.length,
    itens,
    totalPrevisto,
  };
}

module.exports = {
  decidirAtivacaoAcordo,
  validarPrazo,
  validarConferenciaPagamento,
  validarCadastroParte,
  resumirAcordosCelebrados,
};
