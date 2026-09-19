const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

let model;
let data;
test.before(async () => {
  model = await import('../public/model.js');
  data = await import('../public/data.js');
});

test('preview: entry point and browser modules parse before startup', () => {
  for (const file of ['app.js', 'model.js', 'data.js']) {
    const result = spawnSync(process.execPath, ['--check', path.join(__dirname, '../public', file)], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
});

test('preview: portfolio totals use integer cents and only paid installments count as recovered', () => {
  const rows = model.debtRows();
  assert.equal(rows.length, 6);
  assert.deepEqual(model.summary(rows), {
    balance: 16700000, recovered: 4600000, overdue: 1200000, agreements: 4, withoutAgreement: 2,
  });
  assert.deepEqual(model.summary(model.debtRows({ creditorId: 'aurora' })), {
    balance: 7200000, recovered: 3600000, overdue: 1200000, agreements: 2, withoutAgreement: 0,
  });
  for (const row of rows) {
    assert.ok(Number.isSafeInteger(row.balance));
    assert.equal(row.balance + row.recovered, row.amount);
  }
});

test('preview: each creditor filters its own obligations', () => {
  for (const [creditorId, expected] of [
    ['aurora', ['BRD-001', 'BRD-004']], ['vertice', ['BRD-002', 'BRD-005']], ['alameda', ['BRD-003', 'BRD-006']],
  ]) {
    assert.deepEqual(model.debtRows({ creditorId }).map(row => row.id), expected);
  }
});

test('preview: search ignores accents, case and surrounding spaces across supported fields', () => {
  for (const [query, expected] of [
    ['  ESTACAO  ', ['BRD-003']], ['vertice', ['BRD-002', 'BRD-005']],
    ['brd-004', ['BRD-004']], ['ac-004', ['BRD-005']], ['NORTE SUL LOGISTICA', ['BRD-002']],
  ]) {
    assert.deepEqual(model.debtRows({ query }).map(row => row.id), expected);
  }
  assert.equal(model.debtRows({ query: '  ' }).length, 6);
});

test('preview: creditor and query intersect and empty results have zero totals', () => {
  assert.deepEqual(model.debtRows({ creditorId: 'aurora', query: 'cedro' }).map(row => row.id), ['BRD-004']);
  assert.deepEqual(model.debtRows({ creditorId: 'vertice', query: 'cedro' }), []);
  assert.deepEqual(model.debtRows({ query: 'sem-correspondencia' }), []);
  assert.deepEqual(model.summary([]), { balance: 0, recovered: 0, overdue: 0, agreements: 0, withoutAgreement: 0 });
  assert.deepEqual(model.deadlineRows([]), []);
});

test('preview: reference date and month boundary are stable without the system clock', () => {
  assert.equal(data.REFERENCE_DATE, '2026-09-19');
  for (const [date, days] of [['2026-09-18', -1], ['2026-09-19', 0], ['2026-09-20', 1], ['2026-10-19', 30], ['2026-10-20', 31]]) {
    assert.equal(model.daysFromReference(date), days);
  }
  assert.equal(model.date('2026-09-19'), '19/09/2026');
  assert.equal(model.money(123456).replace(/\s/g, ' '), 'R$ 1.234,56');
});

test('preview: installment status prioritizes payment then overdue, today and future', () => {
  assert.deepEqual(model.installmentStatus({ paid: true, dueDate: '2026-09-10' }), { label: 'Paga', tone: 'success' });
  assert.deepEqual(model.installmentStatus({ paid: false, dueDate: '2026-09-10' }), { label: '9 dias em atraso', tone: 'danger' });
  assert.deepEqual(model.installmentStatus({ paid: false, dueDate: '2026-09-19' }), { label: 'Vence hoje', tone: 'warning' });
  assert.deepEqual(model.installmentStatus({ paid: false, dueDate: '2026-10-19' }), { label: 'Em 30 dias', tone: 'neutral' });
});

test('preview: sample references and installment amounts are internally consistent', () => {
  for (const collection of [data.creditors, data.debts, data.agreements, data.installments, data.manualDeadlines]) {
    assert.equal(new Set(collection.map(item => item.id)).size, collection.length);
  }
  for (const debt of data.debts) assert.ok(data.creditors.some(creditor => creditor.id === debt.creditorId));
  for (const agreement of data.agreements) {
    const debt = data.debts.find(item => item.id === agreement.debtId);
    assert.ok(debt);
    const installments = data.installments.filter(item => item.agreementId === agreement.id);
    assert.equal(installments.reduce((sum, item) => sum + item.amount, 0), debt.amount);
    assert.deepEqual(installments.map(item => item.number), [1, 2, 3]);
  }
  for (const installment of data.installments) assert.ok(data.agreements.some(item => item.id === installment.agreementId));
  for (const deadline of data.manualDeadlines) {
    assert.ok(data.debts.some(item => item.id === deadline.debtId));
    assert.ok(deadline.owner && deadline.justification);
  }
});

test('preview: debt detail associations do not mix agreements or installments', () => {
  for (const row of model.debtRows()) {
    if (!row.agreement) {
      assert.deepEqual(row.installments, []);
      assert.equal(row.recovered, 0);
    } else {
      assert.equal(row.agreement.debtId, row.id);
      assert.ok(row.installments.every(item => item.agreementId === row.agreement.id));
    }
  }
});

test('preview: deadlines exclude paid installments, preserve manual context and order by date', () => {
  const deadlines = model.deadlineRows(model.debtRows());
  assert.equal(deadlines.length, 10);
  assert.equal(deadlines.filter(item => item.kind === 'installment').length, 8);
  assert.equal(deadlines.filter(item => item.kind === 'manual').length, 2);
  assert.ok(deadlines.every(item => !item.paid));
  assert.deepEqual(deadlines.map(item => item.dueDate), [...deadlines.map(item => item.dueDate)].sort());
  for (const manual of deadlines.filter(item => item.kind === 'manual')) {
    assert.equal(manual.debt.id, manual.debtId);
    assert.ok(manual.owner && manual.justification);
  }
  assert.deepEqual(model.deadlineRows(model.debtRows({ creditorId: 'alameda' })).map(item => item.id), ['PR-001', 'PR-002']);
});

test('preview: sample contains overdue, today, thirty-day boundary and later deadlines', () => {
  const deadlines = model.deadlineRows(model.debtRows());
  const days = deadlines.map(item => model.daysFromReference(item.dueDate));
  assert.equal(days.filter(day => day < 0).length, 1);
  assert.equal(days.filter(day => day === 0).length, 1);
  assert.equal(days.filter(day => day > 0 && day <= 30).length, 6);
  assert.equal(days.filter(day => day > 30).length, 2);
  assert.equal(model.daysFromReference(deadlines.find(item => item.id === 'P-005').dueDate), 30);
});

test('preview: CSV identifies sample date and exports only filtered obligations', () => {
  const csv = model.toCsv(model.debtRows({ creditorId: 'aurora', query: 'cedro' }));
  assert.equal(csv.charCodeAt(0), 0xfeff);
  const lines = csv.slice(1).split('\r\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], '"DEMONSTRAÇÃO — dados fictícios";"Referência: 19/09/2026"');
  assert.equal(lines[1], '"Débito";"Devedor";"Credor";"Fase";"Saldo em aberto (BRL)";"Acordo"');
  assert.equal(lines[2], '"BRD-004";"Cedro Empreendimentos";"Aurora Participações";"Judicial";"48000,00";"AC-003"');
});

test('preview: CSV escapes quotes and delimiters and handles no agreement or no rows', () => {
  const row = { ...model.debtRows({ query: 'BRD-003' })[0], debtor: 'Teste "A"; filial', balance: 101 };
  assert.ok(model.toCsv([row]).endsWith('"BRD-003";"Teste ""A""; filial";"Alameda Empreendimentos";"Pré-contenciosa";"1,01";"Sem acordo"'));
  assert.equal(model.toCsv([]).split('\r\n').length, 2);
});
