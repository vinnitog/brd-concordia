const ORIGENS_PRAZO = new Set(["parcela", "acordo", "judicial", "manual"]);

function temTexto(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
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

module.exports = {
  decidirAtivacaoAcordo,
  validarPrazo,
  validarConferenciaPagamento,
};
