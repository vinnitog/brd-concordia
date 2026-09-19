# BRD Concordia

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Advogados e equipe interna BRD que acompanham cobrança e recuperação de crédito, conforme PROJECT_CONTEXT.md.

## Product Purpose

Organizar débitos, acordos e prazos, permitindo identificar pendências e consultar os respectivos vínculos.

## Operating Context

O usuário solicitou e confirmou a criação da primeira interface para avaliação em servidor local. Esta entrega é uma demonstração navegável; os registros são fictícios e não representam operações reais.

## Capabilities and Constraints

Node.js e biblioteca padrão já existentes. A interface inicial usa HTML, CSS e JavaScript sem build nem dependências externas. Não há autenticação, banco de dados ou integração. Não coletar dados pessoais reais na demonstração. Preservar as políticas puras e o vocabulário de CONTEXT.md.

## Brand Commitments

Nome: BRD Concordia. O usuário escolheu seguir a identidade visual do BRD Assistant: fundo escuro com subtom violeta, violeta BRD, logotipo institucional e DM Sans, inclusive nos títulos em negrito. A referência é a implementação atual do Assistant; o handoff antigo que citava Gupter não prevalece sobre seu CSS atual. Ativos de marca são copiados localmente; não há importação de código nem dependência entre repositórios.

## Evidence on Hand

PROJECT_CONTEXT.md, CONTEXT.md e src/domain/policies.js. Referência visual autorizada: BRD Assistant, src/styles/index.css e tokens do design handoff. Não há interface anterior do Concordia nem dados operacionais. Fontes e logotipo reutilizados estão em public/assets.

Na sincronização com develop foram incorporados assets e guia anteriores do Concordia (`assets/brand/`, `docs/identidade-visual.md`), preservados sem alteração. Para esta demonstração, a escolha explícita do usuário pelo BRD Assistant rege a apresentação. As quatro vistas entregues são um recorte de avaliação e não redefinem as oito abas do contrato de navegação de domínio.

## Product Principles

- Priorizar pendências e seus vínculos jurídicos.
- Distinguir débitos, acordos e parcelas.
- Identificar os dados demonstrativos e os limites da avaliação.
- Manter a leitura acessível e as ações explícitas.
