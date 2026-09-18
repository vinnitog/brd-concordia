const ORIGENS_PRAZO = new Set(["parcela", "acordo", "judicial", "manual"]);

const PAPEIS_DEBITO = new Set(["credor", "devedor", "garantidor"]);

const FASES_DEBITO = new Set(["pre-contencioso", "extrajudicial", "judicial"]);

const GRAUS_RECUPERABILIDADE = new Set(["alto", "medio", "baixo"]);

// Ciclo de vida do debito conforme decisao dos socios (ata 10/07). A transicao
// entre status obedece o fluxo abaixo; os status terminais nao evoluem.
const TRANSICOES_STATUS_DEBITO = {
  "em-avaliacao": ["cobranca-extrajudicial"],
  "cobranca-extrajudicial": ["negociacao-extrajudicial"],
  "negociacao-extrajudicial": ["negociacao-concluida", "negociacao-infrutifera"],
  "negociacao-concluida": [],
  "negociacao-infrutifera": ["enviado-ao-judicial"],
  "enviado-ao-judicial": ["debito-executado"],
  "debito-executado": ["execucao-frustrada", "execucao-satisfeita"],
  "execucao-frustrada": [],
  "execucao-satisfeita": [],
};

const STATUS_DEBITO = new Set(Object.keys(TRANSICOES_STATUS_DEBITO));

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

function validarPartesDebito(partes, erros) {
  if (!Array.isArray(partes) || partes.length === 0) {
    erros.push("partes-obrigatorias");
    return;
  }

  const combinacoesVistas = new Set();
  let idAusente = false;
  let papelInvalido = false;
  let parteDuplicada = false;
  let temCredor = false;
  let temDevedor = false;

  for (const bruta of partes) {
    const parte = bruta ?? {};

    if (!temTexto(parte.idParte)) {
      idAusente = true;
    }

    if (!PAPEIS_DEBITO.has(parte.papel)) {
      papelInvalido = true;
      continue;
    }

    if (temTexto(parte.idParte)) {
      const combinacao = `${parte.idParte}:${parte.papel}`;
      if (combinacoesVistas.has(combinacao)) {
        parteDuplicada = true;
      }
      combinacoesVistas.add(combinacao);
    }

    if (parte.papel === "credor") {
      temCredor = true;
    }
    if (parte.papel === "devedor") {
      temDevedor = true;
    }
  }

  if (idAusente) {
    erros.push("parte-id-obrigatorio");
  }
  if (papelInvalido) {
    erros.push("papel-parte-invalido");
  }
  if (parteDuplicada) {
    erros.push("parte-duplicada");
  }
  if (!temCredor) {
    erros.push("credor-obrigatorio");
  }
  if (!temDevedor) {
    erros.push("devedor-obrigatorio");
  }
}

function validarDebito({
  partes,
  origem,
  status,
  fase,
  grauRecuperabilidade,
  observacoesInternas,
} = {}) {
  const erros = [];

  validarPartesDebito(partes, erros);

  // Origem e lista aberta (pode crescer no futuro); exige apenas presenca.
  if (!temTexto(origem)) {
    erros.push("origem-obrigatoria");
  }

  if (!temTexto(status)) {
    erros.push("status-obrigatorio");
  } else if (!STATUS_DEBITO.has(status)) {
    erros.push("status-invalido");
  }

  // Fase extrajudicial/judicial/pre-contenciosa e exclusiva (um unico valor).
  if (!temTexto(fase)) {
    erros.push("fase-obrigatoria");
  } else if (!FASES_DEBITO.has(fase)) {
    erros.push("fase-invalida");
  }

  if (!temTexto(grauRecuperabilidade)) {
    erros.push("grau-recuperabilidade-obrigatorio");
  } else if (!GRAUS_RECUPERABILIDADE.has(grauRecuperabilidade)) {
    erros.push("grau-recuperabilidade-invalido");
  }

  if (observacoesInternas !== undefined && typeof observacoesInternas !== "string") {
    erros.push("observacoes-internas-invalidas");
  }

  return erros.length === 0 ? { valido: true } : { valido: false, erros };
}

function decidirTransicaoStatusDebito({ de, para } = {}) {
  if (!STATUS_DEBITO.has(de)) {
    return { permitida: false, motivo: "status-atual-invalido" };
  }

  if (!STATUS_DEBITO.has(para)) {
    return { permitida: false, motivo: "status-destino-invalido" };
  }

  if (!TRANSICOES_STATUS_DEBITO[de].includes(para)) {
    return { permitida: false, motivo: "transicao-nao-permitida" };
  }

  return { permitida: true };
}

function validarAlteracaoDebito({ alteradoPor, alteradoEm, camposAlterados } = {}) {
  const erros = [];

  if (!temTexto(alteradoPor)) {
    erros.push("autor-alteracao-obrigatorio");
  }

  if (!temTexto(alteradoEm)) {
    erros.push("data-alteracao-obrigatoria");
  } else if (!dataHoraValida(alteradoEm)) {
    erros.push("data-alteracao-invalida");
  }

  const camposValidos =
    Array.isArray(camposAlterados) &&
    camposAlterados.length > 0 &&
    camposAlterados.every((campo) => temTexto(campo));

  if (!camposValidos) {
    erros.push("campos-alterados-obrigatorios");
  }

  return erros.length === 0 ? { valida: true } : { valida: false, erros };
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
  validarDebito,
  decidirTransicaoStatusDebito,
  validarAlteracaoDebito,
  validarPrazo,
  validarConferenciaPagamento,
  PAPEIS_DEBITO,
  FASES_DEBITO,
  GRAUS_RECUPERABILIDADE,
  STATUS_DEBITO,
  TRANSICOES_STATUS_DEBITO,
};
