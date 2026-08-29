---
status: accepted
---

# Preservar Estado Auditavel Sem Event Sourcing

O BRD Concordia precisa explicar alteracoes financeiras e juridicas sem introduzir infraestrutura prematura. Registros relevantes, como pagamentos, conferencias, memorias de calculo e acordos sucessivos, serao preservados como fatos imutaveis; o estado atual sera derivado ou mantido com historico explicito, usando persistencia convencional quando ela existir, e nao event sourcing.

## Consequencias

O modelo exige autoria e data nos fatos auditaveis, alem de motivo quando a operacao representar alteracao ou excecao justificavel, e nao pode sobrescrever silenciosamente historico relevante. Em contrapartida, evita a complexidade operacional e de versionamento de um event store durante o ciclo de scaffold.
