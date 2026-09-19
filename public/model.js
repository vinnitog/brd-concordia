import { REFERENCE_DATE, creditors, debts, agreements, installments, manualDeadlines } from './data.js';

export const money = (cents) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const date = (iso) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
export const daysFromReference = (iso) => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${REFERENCE_DATE}T00:00:00Z`)) / 86400000);
export const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function installmentStatus(installment) {
  if (installment.paid) return { label: 'Paga', tone: 'success' };
  const days = daysFromReference(installment.dueDate);
  if (days < 0) return { label: `${Math.abs(days)} dias em atraso`, tone: 'danger' };
  if (days === 0) return { label: 'Vence hoje', tone: 'warning' };
  return { label: `Em ${days} dias`, tone: 'neutral' };
}

export function debtRows({ creditorId = '', query = '' } = {}) {
  const search = normalize(query);
  return debts.map((debt) => {
    const creditor = creditors.find((item) => item.id === debt.creditorId);
    const agreement = agreements.find((item) => item.debtId === debt.id);
    const payments = installments.filter((item) => item.agreementId === agreement?.id);
    const recovered = payments.filter((item) => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const overdue = payments.filter((item) => !item.paid && daysFromReference(item.dueDate) < 0).reduce((sum, item) => sum + item.amount, 0);
    return { ...debt, creditor: creditor.name, agreement, installments: payments, recovered, overdue, balance: debt.amount - recovered };
  }).filter((debt) => (!creditorId || debt.creditorId === creditorId) && (!search || normalize(`${debt.id} ${debt.debtor} ${debt.creditor} ${debt.agreement?.id ?? ''}`).includes(search)));
}

export function deadlineRows(rows) {
  return rows.flatMap((debt) => [
    ...debt.installments.filter((item) => !item.paid).map((item) => ({ ...item, debt, title: `Parcela ${item.number} de ${debt.installments.length}`, origin: `Acordo ${debt.agreement.id}`, status: installmentStatus(item), kind: 'installment' })),
    ...manualDeadlines.filter((item) => item.debtId === debt.id).map((item) => ({ ...item, debt, origin: 'Prazo manual', status: installmentStatus(item), kind: 'manual' })),
  ]).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.debt.id.localeCompare(b.debt.id));
}

export function summary(rows) {
  return rows.reduce((totals, debt) => ({ balance: totals.balance + debt.balance, recovered: totals.recovered + debt.recovered, overdue: totals.overdue + debt.overdue, agreements: totals.agreements + Number(Boolean(debt.agreement)), withoutAgreement: totals.withoutAgreement + Number(!debt.agreement) }), { balance: 0, recovered: 0, overdue: 0, agreements: 0, withoutAgreement: 0 });
}

export function toCsv(rows) {
  const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
  return '\uFEFF' + [
    ['DEMONSTRAÇÃO — dados fictícios', `Referência: ${date(REFERENCE_DATE)}`],
    ['Débito', 'Devedor', 'Credor', 'Fase', 'Saldo em aberto (BRL)', 'Acordo'],
    ...rows.map((row) => [row.id, row.debtor, row.creditor, row.phase, (row.balance / 100).toFixed(2).replace('.', ','), row.agreement?.id ?? 'Sem acordo']),
  ].map((row) => row.map(quote).join(';')).join('\r\n');
}
