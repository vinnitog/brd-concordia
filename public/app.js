import { creditors, REFERENCE_DATE } from './data.js';
import { debtRows, deadlineRows, summary, money, date, daysFromReference, installmentStatus, toCsv } from './model.js';

const views = {
  overview: { title: 'Visão geral', description: 'O que precisa da sua atenção, em um só lugar.' },
  debts: { title: 'Débitos', description: 'Consulte as obrigações, seus saldos e a fase de cobrança.' },
  agreements: { title: 'Acordos', description: 'Acompanhe as condições negociadas e o andamento das parcelas.' },
  deadlines: { title: 'Prazos', description: 'Vencimentos de parcelas e compromissos da equipe, em ordem de data.' },
};
const state = { view: 'overview', creditorId: '', query: '', period: 'all', detailId: null };
const content = document.querySelector('#content');
const detail = document.querySelector('#detail');
const status = document.querySelector('#result-status');
let detailTrigger = null;
let searchTimer;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const badge = ({ label, tone }) => `<span class="badge ${tone}">${escapeHtml(label)}</span>`;
const countLabel = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;
const openButton = (debt, text = 'Ver débito') => `<button class="row-action" type="button" data-debt="${escapeHtml(debt.id)}" aria-label="${escapeHtml(text)} de ${escapeHtml(debt.debtor)}">${escapeHtml(text)}<span aria-hidden="true"> →</span></button>`;

function emptyState(noun) {
  return `<div class="empty-state"><h3>Nenhum ${noun} encontrado</h3><p>Altere o credor ou a busca para consultar outros registros da demonstração.</p><button class="button secondary" type="button" data-clear>Limpar filtros</button></div>`;
}

function renderSummary(rows) {
  const totals = summary(rows);
  return `<section class="portfolio" aria-labelledby="portfolio-title"><div class="section-heading"><h2 id="portfolio-title">Carteira em acompanhamento</h2><span>${countLabel(rows.length, 'débito', 'débitos')}</span></div><dl class="summary-strip"><div><dt>Saldo em aberto</dt><dd>${money(totals.balance)}</dd></div><div><dt>Recuperado nos acordos</dt><dd>${money(totals.recovered)}</dd></div><div><dt>Parcelas em atraso</dt><dd class="danger-text">${money(totals.overdue)}</dd></div><div><dt>Sem acordo</dt><dd>${countLabel(totals.withoutAgreement, 'débito', 'débitos')}</dd></div></dl></section>`;
}

function renderDeadlineTable(deadlines) {
  if (!deadlines.length) return emptyState('prazo');
  return `<div class="table-scroll" role="region" tabindex="0" aria-label="Prazos: tabela com rolagem horizontal"><table class="deadlines-table"><caption class="sr-only">Prazos e parcelas pendentes, em ordem de vencimento</caption><thead><tr><th scope="col">Vencimento</th><th scope="col">Devedor / compromisso</th><th scope="col">Situação</th><th scope="col" class="numeric">Valor da parcela</th><th scope="col"><span class="sr-only">Detalhes</span></th></tr></thead><tbody>${deadlines.map((item) => `<tr><td class="date-cell"><time datetime="${item.dueDate}">${date(item.dueDate)}</time><small>${escapeHtml(item.origin)}</small></td><td><strong>${escapeHtml(item.debt.debtor)}</strong><small>${escapeHtml(item.title)}</small></td><td>${badge(item.status)}</td><td class="numeric">${item.kind === 'manual' ? '<span class="muted">Não se aplica</span>' : money(item.amount)}</td><td>${openButton(item.debt)}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderOverview(rows) {
  const deadlines = deadlineRows(rows);
  const priority = deadlines.filter((item) => daysFromReference(item.dueDate) <= 30);
  const overdue = deadlines.filter((item) => daysFromReference(item.dueDate) < 0).length;
  const today = deadlines.filter((item) => daysFromReference(item.dueDate) === 0).length;
  const next = deadlines.filter((item) => daysFromReference(item.dueDate) > 0 && daysFromReference(item.dueDate) <= 30).length;
  const lastPayments = rows.filter((row) => row.agreement && row.installments.filter((item) => !item.paid).length === 1);
  return `${renderSummary(rows)}<section class="priority-section" aria-labelledby="priority-title"><div class="section-heading"><div><h2 id="priority-title">Prioridades da carteira</h2><p>Atrasos e compromissos dos próximos 30 dias.</p></div><a class="inline-link" href="#deadlines" data-period="all">Todos os prazos <span aria-hidden="true">→</span></a></div><div class="priority-tabs" aria-label="Consultar prazos por período"><button type="button" data-period="overdue"><span class="status-dot danger-dot" aria-hidden="true"></span>Em atraso <strong>${overdue}</strong></button><button type="button" data-period="today"><span class="status-dot warning-dot" aria-hidden="true"></span>Vencem hoje <strong>${today}</strong></button><button type="button" data-period="next30"><span class="status-dot neutral-dot" aria-hidden="true"></span>Próximos 30 dias <strong>${next}</strong></button></div>${renderDeadlineTable(priority)}</section><section class="closing-section" aria-labelledby="closing-title"><div class="section-heading"><div><h2 id="closing-title">Na última parcela</h2><p>Acordos com apenas uma parcela em aberto.</p></div></div>${lastPayments.length ? lastPayments.map((row) => `<div class="closing-row"><div><strong>${escapeHtml(row.debtor)}</strong><p>${escapeHtml(row.agreement.id)} · ${escapeHtml(row.creditor)}</p></div><div class="closing-amount"><strong>${money(row.balance)}</strong><span>saldo do acordo</span></div>${openButton(row, 'Ver acordo')}</div>`).join('') : '<p class="quiet-empty">Nenhum acordo na última parcela para os filtros selecionados.</p>'}</section>`;
}

function renderDebts(rows) {
  return `${renderSummary(rows)}<section aria-labelledby="debts-title"><div class="section-heading"><h2 id="debts-title">Débitos da carteira</h2><span>${countLabel(rows.length, 'registro', 'registros')}</span></div>${rows.length ? `<div class="table-scroll" role="region" tabindex="0" aria-label="Débitos: tabela com rolagem horizontal"><table><caption class="sr-only">Débitos filtrados e saldos em aberto</caption><thead><tr><th scope="col">Devedor</th><th scope="col">Credor</th><th scope="col">Fase / acordo</th><th scope="col" class="numeric">Saldo em aberto</th><th scope="col"><span class="sr-only">Detalhes</span></th></tr></thead><tbody>${rows.map((row) => `<tr><td><strong>${escapeHtml(row.debtor)}</strong><small>${row.id}</small></td><td>${escapeHtml(row.creditor)}</td><td>${escapeHtml(row.phase)}<small>${row.agreement ? row.agreement.id : 'Sem acordo'}</small></td><td class="numeric">${money(row.balance)}</td><td>${openButton(row)}</td></tr>`).join('')}</tbody></table></div>` : emptyState('débito')}</section>`;
}

function renderAgreements(rows) {
  const agreed = rows.filter((row) => row.agreement);
  return `<section aria-labelledby="agreements-title"><div class="section-heading"><h2 id="agreements-title">Acordos ativos</h2><span>${countLabel(agreed.length, 'acordo', 'acordos')}</span></div>${agreed.length ? `<div class="table-scroll" role="region" tabindex="0" aria-label="Acordos: tabela com rolagem horizontal"><table><caption class="sr-only">Acordos ativos vinculados aos débitos filtrados</caption><thead><tr><th scope="col">Acordo / devedor</th><th scope="col">Parcelas pagas</th><th scope="col">Situação das parcelas</th><th scope="col" class="numeric">Saldo do acordo</th><th scope="col"><span class="sr-only">Detalhes</span></th></tr></thead><tbody>${agreed.map((row) => `<tr><td><strong>${escapeHtml(row.debtor)}</strong><small>${row.agreement.id} · firmado em ${date(row.agreement.signedAt)}</small></td><td>${row.installments.filter((item) => item.paid).length} de ${row.installments.length}</td><td>${badge(row.overdue ? { label: 'Parcela em atraso', tone: 'danger' } : { label: 'Sem atraso', tone: 'success' })}</td><td class="numeric">${money(row.balance)}</td><td>${openButton(row, 'Ver acordo')}</td></tr>`).join('')}</tbody></table></div>` : emptyState('acordo')}</section><p class="section-note">Cada acordo está vinculado a um único débito. O pagamento das parcelas e a situação do acordo são acompanhados separadamente.</p>`;
}

function renderDeadlines(rows) {
  const all = deadlineRows(rows);
  const filtered = all.filter((item) => {
    const days = daysFromReference(item.dueDate);
    return state.period === 'all' || (state.period === 'overdue' && days < 0) || (state.period === 'today' && days === 0) || (state.period === 'next30' && days > 0 && days <= 30);
  });
  return `<section aria-labelledby="deadlines-title"><div class="section-heading"><h2 id="deadlines-title">Compromissos pendentes <span class="heading-count">${filtered.length}</span></h2><div class="period-field"><label for="period">Período</label><select id="period">${[['all', 'Todos os períodos'], ['overdue', 'Em atraso'], ['today', 'Vencem hoje'], ['next30', 'Próximos 30 dias']].map(([value, label]) => `<option value="${value}"${state.period === value ? ' selected' : ''}>${label}</option>`).join('')}</select></div></div>${renderDeadlineTable(filtered)}</section><p class="section-note">Parcelas pagas não aparecem nesta lista. Prazos manuais podem ser consultados no detalhe do débito, com responsável e justificativa.</p>`;
}

function render(announce = true) {
  const rows = debtRows(state);
  const view = views[state.view];
  document.querySelector('#page-title').textContent = view.title;
  document.querySelector('#page-description').textContent = view.description;
  document.title = `${view.title} · BRD Concordia`;
  document.querySelectorAll('[data-view]').forEach((link) => {
    if (link.dataset.view === state.view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('#clear-filters').disabled = !state.creditorId && !state.query && state.period === 'all';
  document.querySelector('#export').disabled = rows.length === 0;
  content.innerHTML = { overview: renderOverview, debts: renderDebts, agreements: renderAgreements, deadlines: renderDeadlines }[state.view](rows);
  closeDetail(false);
  if (announce) status.textContent = `${view.title}. ${countLabel(rows.length, 'débito encontrado', 'débitos encontrados')}.`;
}

function showDetail(id, trigger) {
  const row = debtRows(state).find((item) => item.id === id);
  if (!row) return;
  closeDetail(false);
  detailTrigger = trigger;
  state.detailId = id;
  const manual = deadlineRows([row]).filter((item) => item.kind === 'manual');
  detail.innerHTML = `<div class="detail-header"><div><h2 id="detail-title" tabindex="-1">${escapeHtml(row.debtor)}</h2><span class="detail-code">${row.id} · Detalhe do débito</span></div><button class="button secondary" id="close-detail" type="button">Fechar detalhe</button></div><dl class="detail-grid"><div><dt>Credor</dt><dd>${escapeHtml(row.creditor)}</dd></div><div><dt>Devedor</dt><dd>${escapeHtml(row.debtor)}</dd></div><div><dt>Origem da obrigação</dt><dd>${escapeHtml(row.origin)}</dd></div><div><dt>Fase de cobrança</dt><dd>${escapeHtml(row.phase)}</dd></div><div><dt>Valor da obrigação</dt><dd>${money(row.amount)}</dd></div><div><dt>Saldo em aberto</dt><dd>${money(row.balance)}</dd></div><div><dt>Recuperado no acordo</dt><dd>${money(row.recovered)}</dd></div><div><dt>Responsável</dt><dd>${escapeHtml(row.owner)}</dd></div></dl><p class="detail-note">${escapeHtml(row.note)}</p><div class="section-heading"><h3>${row.agreement ? `Acordo ${row.agreement.id}` : 'Sem acordo formalizado'}</h3>${row.agreement ? badge({ label: row.agreement.status, tone: 'neutral' }) : ''}</div>${row.agreement ? `<p class="muted agreement-description">Firmado em ${date(row.agreement.signedAt)} · ${row.installments.length} parcelas · total de ${money(row.amount)}.</p><div class="table-scroll" role="region" tabindex="0" aria-label="Parcelas do acordo: tabela com rolagem horizontal"><table class="installments-table"><caption class="sr-only">Parcelas do acordo ${row.agreement.id}</caption><thead><tr><th scope="col">Parcela</th><th scope="col">Vencimento</th><th scope="col" class="numeric">Valor</th><th scope="col">Situação</th></tr></thead><tbody>${row.installments.map((item) => `<tr><td>${item.number} de ${row.installments.length}</td><td>${date(item.dueDate)}</td><td class="numeric">${money(item.amount)}</td><td>${badge(installmentStatus(item))}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Este débito ainda não possui condições negociadas nem parcelas de acordo.</p>'}${manual.length ? `<h3 class="manual-title">Prazos manuais</h3>${manual.map((item) => `<div class="manual-deadline"><strong>${escapeHtml(item.title)}</strong><p>${date(item.dueDate)} · ${escapeHtml(item.owner)}</p><p>Justificativa: ${escapeHtml(item.justification)}</p></div>`).join('')}` : ''}`;
  detail.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  trigger.setAttribute('aria-controls', 'detail');
  document.querySelector('#detail-title').focus();
  detail.scrollIntoView({ block: 'start', behavior: 'instant' });
}

function closeDetail(restoreFocus = true) {
  detail.hidden = true;
  state.detailId = null;
  if (detailTrigger?.isConnected) {
    detailTrigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) detailTrigger.focus();
  }
  detailTrigger = null;
}

function clearFilters() {
  state.creditorId = '';
  state.query = '';
  state.period = 'all';
  document.querySelector('#creditor').value = '';
  document.querySelector('#search').value = '';
  clearTimeout(searchTimer);
  render();
  document.querySelector('#search').focus();
}

function navigate() {
  const requested = location.hash.slice(1);
  state.view = Object.hasOwn(views, requested) ? requested : 'overview';
  render();
  document.querySelector('#page-title').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

document.querySelector('#creditor').insertAdjacentHTML('beforeend', creditors.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join(''));
document.querySelector('.skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  document.querySelector('#main').focus();
});
document.querySelector('#filters').addEventListener('submit', (event) => event.preventDefault());
document.querySelector('#creditor').addEventListener('change', (event) => { state.creditorId = event.target.value; render(); });
document.querySelector('#search').addEventListener('input', (event) => {
  state.query = event.target.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => render(), 120);
});
document.querySelector('#clear-filters').addEventListener('click', clearFilters);
content.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-debt]');
  if (trigger) showDetail(trigger.dataset.debt, trigger);
  if (event.target.closest('[data-clear]')) clearFilters();
  const period = event.target.closest('[data-period]');
  if (period) { state.period = period.dataset.period; location.hash = 'deadlines'; }
});
content.addEventListener('change', (event) => {
  if (event.target.id === 'period') {
    state.period = event.target.value;
    render();
    document.querySelector('#period').focus();
    status.textContent = `${document.querySelector('#deadlines-title').textContent}. Período: ${document.querySelector('#period').selectedOptions[0].textContent}.`;
  }
});
detail.addEventListener('click', (event) => { if (event.target.closest('#close-detail')) closeDetail(); });
detail.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDetail(); });
document.querySelector('#export').addEventListener('click', () => {
  const rows = debtRows(state);
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `brd-concordia-demo-${REFERENCE_DATE}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = `Exportação preparada com ${countLabel(rows.length, 'débito fictício', 'débitos fictícios')}, respeitando os filtros de credor e busca.`;
});
window.addEventListener('hashchange', navigate);
state.view = Object.hasOwn(views, location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
render(false);
