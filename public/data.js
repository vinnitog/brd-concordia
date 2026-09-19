export const REFERENCE_DATE = '2026-09-19';

// Todos os nomes, valores e vínculos desta demonstração são fictícios.
export const creditors = [
  { id: 'aurora', name: 'Aurora Participações' },
  { id: 'vertice', name: 'Vértice Distribuidora' },
  { id: 'alameda', name: 'Alameda Empreendimentos' },
];

export const debts = [
  { id: 'BRD-001', creditorId: 'aurora', debtor: 'Horizonte Comercial', origin: 'Prestação de serviços · contrato 014/2025', phase: 'Extrajudicial', amount: 3600000, owner: 'Equipe de negociação', note: 'Acompanhar a regularização da segunda parcela do acordo.' },
  { id: 'BRD-002', creditorId: 'vertice', debtor: 'Norte Sul Logística', origin: 'Fornecimento de mercadorias · pedido 082/2025', phase: 'Extrajudicial', amount: 4800000, owner: 'Equipe de negociação', note: 'Parcela com vencimento na data de referência. Aguardar registro de pagamento.' },
  { id: 'BRD-003', creditorId: 'alameda', debtor: 'Estação Serviços', origin: 'Locação comercial · contrato 031/2025', phase: 'Pré-contenciosa', amount: 1800000, owner: 'Equipe jurídica', note: 'Reunir os documentos da obrigação para avaliação da estratégia de cobrança.' },
  { id: 'BRD-004', creditorId: 'aurora', debtor: 'Cedro Empreendimentos', origin: 'Prestação de serviços · contrato 062/2025', phase: 'Judicial', amount: 7200000, owner: 'Equipe jurídica', note: 'Acordo em acompanhamento. O tratamento judicial tem ciclo independente.' },
  { id: 'BRD-005', creditorId: 'vertice', debtor: 'Pontal Comércio', origin: 'Fornecimento de mercadorias · pedido 096/2025', phase: 'Extrajudicial', amount: 1500000, owner: 'Equipe de negociação', note: 'Última parcela em aberto. Confirmar pagamento antes de avaliar a quitação.' },
  { id: 'BRD-006', creditorId: 'alameda', debtor: 'Jardim Oficina', origin: 'Locação comercial · contrato 043/2025', phase: 'Extrajudicial', amount: 2400000, owner: 'Equipe de negociação', note: 'Sem acordo formalizado. Preparar contato para iniciar negociação.' },
];

export const agreements = [
  { id: 'AC-001', debtId: 'BRD-001', signedAt: '2026-07-10', status: 'Ativo' },
  { id: 'AC-002', debtId: 'BRD-002', signedAt: '2026-08-15', status: 'Ativo' },
  { id: 'AC-003', debtId: 'BRD-004', signedAt: '2026-08-20', status: 'Ativo' },
  { id: 'AC-004', debtId: 'BRD-005', signedAt: '2026-07-25', status: 'Ativo' },
];

export const installments = [
  { id: 'P-001', agreementId: 'AC-001', number: 1, amount: 1200000, dueDate: '2026-08-10', paid: true },
  { id: 'P-002', agreementId: 'AC-001', number: 2, amount: 1200000, dueDate: '2026-09-10', paid: false },
  { id: 'P-003', agreementId: 'AC-001', number: 3, amount: 1200000, dueDate: '2026-10-10', paid: false },
  { id: 'P-004', agreementId: 'AC-002', number: 1, amount: 1600000, dueDate: '2026-09-19', paid: false },
  { id: 'P-005', agreementId: 'AC-002', number: 2, amount: 1600000, dueDate: '2026-10-19', paid: false },
  { id: 'P-006', agreementId: 'AC-002', number: 3, amount: 1600000, dueDate: '2026-11-19', paid: false },
  { id: 'P-007', agreementId: 'AC-003', number: 1, amount: 2400000, dueDate: '2026-08-22', paid: true },
  { id: 'P-008', agreementId: 'AC-003', number: 2, amount: 2400000, dueDate: '2026-09-22', paid: false },
  { id: 'P-009', agreementId: 'AC-003', number: 3, amount: 2400000, dueDate: '2026-10-22', paid: false },
  { id: 'P-010', agreementId: 'AC-004', number: 1, amount: 500000, dueDate: '2026-07-25', paid: true },
  { id: 'P-011', agreementId: 'AC-004', number: 2, amount: 500000, dueDate: '2026-08-25', paid: true },
  { id: 'P-012', agreementId: 'AC-004', number: 3, amount: 500000, dueDate: '2026-09-25', paid: false },
];

export const manualDeadlines = [
  { id: 'PR-001', debtId: 'BRD-003', title: 'Revisar documentos da obrigação', dueDate: '2026-09-23', owner: 'Equipe jurídica', justification: 'Preparação da análise pré-contenciosa.' },
  { id: 'PR-002', debtId: 'BRD-006', title: 'Preparar proposta de negociação', dueDate: '2026-09-28', owner: 'Equipe de negociação', justification: 'Início da negociação extrajudicial.' },
];
