// Agenda de acordos: transforma vencimentos e parcelas de acordos celebrados
// em colunas (vence hoje / proximos 30 dias / vencido) e nos formatos lista e
// calendario. Decisoes de produto confirmadas pelos socios no card do Trello:
// - mostra todos os acordos de todos os clientes, apenas os celebrados;
// - parcelas sao calculadas a partir da quantidade (ex.: 12x) e do valor total;
// - "vence hoje" = a data de referencia; "proximos 30 dias" = ate 30 dias apos
//   a data de referencia, contados do vencimento de cada parcela;
// - "vencido" = parcela em aberto com vencimento anterior a data de referencia;
// - a agenda mostra tudo por padrao, com filtros opcionais por cliente, tipo e
//   status do acordo.

const JANELA_PROXIMOS_DIAS = 30;
const STATUS_CELEBRADO = new Set(["ativo", "cumprido", "cancelado"]);
const MS_POR_DIA = 86400000;

function dataCalendarioValida(valor) {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
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

function somarMeses(dataIso, meses) {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const totalMeses = mes - 1 + meses;
  const anoAlvo = ano + Math.floor(totalMeses / 12);
  const mesAlvo = ((totalMeses % 12) + 12) % 12;
  const ultimoDia = new Date(Date.UTC(anoAlvo, mesAlvo + 1, 0)).getUTCDate();
  const diaAlvo = Math.min(dia, ultimoDia);

  return `${anoAlvo}-${String(mesAlvo + 1).padStart(2, "0")}-${String(diaAlvo).padStart(2, "0")}`;
}

function diferencaEmDias(dataInicial, dataFinal) {
  const [anoI, mesI, diaI] = dataInicial.split("-").map(Number);
  const [anoF, mesF, diaF] = dataFinal.split("-").map(Number);

  return Math.round(
    (Date.UTC(anoF, mesF - 1, diaF) - Date.UTC(anoI, mesI - 1, diaI)) / MS_POR_DIA,
  );
}

function classificarSituacao(diasAteVencimento) {
  if (diasAteVencimento < 0) {
    return "vencido";
  }

  if (diasAteVencimento === 0) {
    return "vence_hoje";
  }

  if (diasAteVencimento <= JANELA_PROXIMOS_DIAS) {
    return "proximos_30_dias";
  }

  return "agendado";
}

// Calcula as parcelas de um acordo a partir do valor total (em centavos) e da
// quantidade escolhida, distribuindo os centavos que sobram nas primeiras
// parcelas para que a soma reproduza exatamente o valor total.
function gerarParcelas({
  valorTotalEmCentavos,
  quantidadeParcelas,
  primeiroVencimento,
} = {}) {
  const erros = [];

  if (!Number.isInteger(valorTotalEmCentavos) || valorTotalEmCentavos <= 0) {
    erros.push("valor-total-invalido");
  }

  if (!Number.isInteger(quantidadeParcelas) || quantidadeParcelas <= 0) {
    erros.push("quantidade-parcelas-invalida");
  }

  if (!dataCalendarioValida(primeiroVencimento)) {
    erros.push("primeiro-vencimento-invalido");
  }

  if (erros.length > 0) {
    return { valido: false, erros };
  }

  const valorBase = Math.floor(valorTotalEmCentavos / quantidadeParcelas);
  const centavosExcedentes = valorTotalEmCentavos - valorBase * quantidadeParcelas;

  const parcelas = [];
  for (let indice = 0; indice < quantidadeParcelas; indice += 1) {
    parcelas.push({
      numero: indice + 1,
      valorEmCentavos: valorBase + (indice < centavosExcedentes ? 1 : 0),
      venceEm: somarMeses(primeiroVencimento, indice),
    });
  }

  return { valido: true, parcelas };
}

function acordoAtendeFiltros(acordo, filtros) {
  if (filtros.status && acordo.status !== filtros.status) {
    return false;
  }

  if (filtros.idCliente && acordo.idCliente !== filtros.idCliente) {
    return false;
  }

  if (filtros.tipo && acordo.tipo !== filtros.tipo) {
    return false;
  }

  return true;
}

function ordenarPorVencimento(itemA, itemB) {
  if (itemA.venceEm !== itemB.venceEm) {
    return itemA.venceEm < itemB.venceEm ? -1 : 1;
  }

  if (itemA.idAcordo !== itemB.idAcordo) {
    return itemA.idAcordo < itemB.idAcordo ? -1 : 1;
  }

  return itemA.numeroParcela - itemB.numeroParcela;
}

// Monta a agenda a partir dos acordos celebrados, considerando apenas parcelas
// em aberto. Retorna as tres colunas de foco, a lista ordenada por vencimento e
// o calendario agrupado por dia, todos derivados dos mesmos itens.
function montarAgenda({ acordos = [], hoje, filtros = {} } = {}) {
  if (!dataCalendarioValida(hoje)) {
    return { valido: false, erros: ["data-referencia-invalida"] };
  }

  const itens = [];
  for (const acordo of acordos) {
    if (!STATUS_CELEBRADO.has(acordo.status)) {
      continue;
    }

    if (!acordoAtendeFiltros(acordo, filtros)) {
      continue;
    }

    for (const parcela of acordo.parcelas ?? []) {
      if (parcela.pago) {
        continue;
      }

      if (!dataCalendarioValida(parcela.venceEm)) {
        continue;
      }

      const diasAteVencimento = diferencaEmDias(hoje, parcela.venceEm);
      itens.push({
        idAcordo: acordo.id ?? null,
        idCliente: acordo.idCliente ?? null,
        tipo: acordo.tipo ?? null,
        status: acordo.status,
        numeroParcela: parcela.numero,
        valorEmCentavos: parcela.valorEmCentavos ?? null,
        venceEm: parcela.venceEm,
        diasAteVencimento,
        situacao: classificarSituacao(diasAteVencimento),
      });
    }
  }

  itens.sort(ordenarPorVencimento);

  const colunas = { venceHoje: [], proximos30Dias: [], vencido: [] };
  const calendario = {};
  for (const item of itens) {
    if (item.situacao === "vence_hoje") {
      colunas.venceHoje.push(item);
    } else if (item.situacao === "proximos_30_dias") {
      colunas.proximos30Dias.push(item);
    } else if (item.situacao === "vencido") {
      colunas.vencido.push(item);
    }

    (calendario[item.venceEm] ??= []).push(item);
  }

  return { valido: true, colunas, lista: itens, calendario };
}

module.exports = {
  gerarParcelas,
  montarAgenda,
};
