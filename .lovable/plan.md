## DentalSystem — Sistema de Gestão para Clínica Odontológica

Sistema completo com 7 módulos, autenticação Supabase e UI profissional em React + TanStack Start.

### Stack
- TanStack Start (já configurado) + React 19 + TypeScript
- Tailwind v4 + shadcn/ui
- Supabase (auth + DB já conectado; tabelas já existem no schema)
- react-hook-form + zod
- jsPDF (orçamentos), qrcode (PIX), recharts (dashboard), date-fns
- sonner para toasts

### Design System
- Paleta neutra (slate/zinc) com **teal** como cor primária
- Tipografia: Inter
- Layout: Sidebar fixa (colapsável) + Topbar + área de conteúdo
- Cards limpos, badges coloridos para status, modais `max-w-3xl`
- Tokens semânticos em `src/styles.css` (oklch), variantes de Button/Badge customizadas

### Estrutura de Rotas (TanStack file-based)
```
src/routes/
  __root.tsx                    (shell + QueryClient + Toaster + AuthListener)
  index.tsx                     (redirect → /dashboard ou /auth)
  auth.tsx                      (login email/senha)
  _authenticated/
    route.tsx                   (gate gerenciado — ssr:false)
    dashboard.tsx
    pacientes.tsx               (lista + busca)
    pacientes.$id.tsx           (perfil com abas)
    agenda.tsx                  (calendário semanal/diário)
    prontuario.$pacienteId.tsx  (atalho odontograma — opcional)
    tratamentos.tsx
    financeiro.tsx
    estoque.tsx
    dentistas.tsx               (cadastro auxiliar)
    convenios.tsx               (cadastro auxiliar)
```

### Módulos

**1. Dashboard** — 4 cards (consultas hoje, faturamento mês, novos pacientes mês, estoque crítico) + gráfico de barras (recharts, 4 semanas) + lista de consultas do dia.

**2. Pacientes** — Tabela com busca (nome/CPF/telefone), modal de cadastro/edição. Perfil com Tabs: Dados | Prontuário (odontograma + evolução + anamnese) | Tratamentos | Financeiro | Documentos.

**3. Agenda** — Visualização semanal (grid 7 dias × horários) e diária. Filtro por dentista. Modal de criar/editar agendamento. Status com cores: cinza/azul/amarelo/verde/vermelho. Botão "bloquear horário" (cria agendamento tipo=bloqueio).

**4. Prontuário** (dentro do perfil paciente)
- Odontograma SVG: 32 dentes FDI (quadrantes 1-4 superior, 5-8 inferior, dentes 11-18, 21-28, 31-38, 41-48). Cada dente com 5 faces clicáveis (oclusal/mesial/distal/vestibular/lingual). Modal para registrar status por face.
- Evolução: lista cronológica + textarea para nova nota.
- Anamnese: form (histórico, alergias, medicamentos) — upsert.

**5. Plano de Tratamento** — Lista por paciente, CRUD de procedimentos. Botão "Gerar Orçamento PDF" (jsPDF). Modal de assinatura com `<canvas>` (mouse/touch) salvando como dataURL no PDF.

**6. Financeiro** — Lista de cobranças, modal de pagamento (forma, valor, parcelas, data, guia convênio). Para PIX: modal com QR Code (qrcode lib, payload estático com valor). Relatório com filtro de período/dentista/forma + totalizadores.

**7. Estoque** — Tabela com badge vermelho quando `quantidade_atual < quantidade_minima`. Modal de movimentação (entrada/saída) que atualiza saldo via transação.

### Autenticação
- Supabase Auth email/senha
- Página `/auth` (login + cadastro)
- Layout `_authenticated/route.tsx` gerenciado pela integração
- Topbar mostra email do usuário + botão sair
- Tabela `usuarios` já existe; criar trigger para popular no signup (opcional nesta fase)

### Banco de Dados
✅ Todas as tabelas já existem no schema atual. **Nenhuma migration necessária** — vou validar campos e usar os tipos gerados em `src/integrations/supabase/types.ts`.

Conforme solicitado: **sem RLS por enquanto**. Vou apenas garantir GRANTs para `authenticated` nas tabelas (necessário para PostgREST funcionar). Como o schema atual pode não ter os grants, incluirei uma migration apenas com `GRANT` statements.

### Data Layer
- TanStack Query para todas as leituras/mutations
- Hooks por entidade em `src/hooks/queries/` (ex: `usePacientes`, `useAgendamentos`)
- Client Supabase browser-side direto (sem RLS = sem necessidade de server fns por enquanto)

### Entregáveis desta primeira iteração
Pela amplitude do escopo, vou entregar **tudo funcional** mas priorizando:
1. Design system + shell (sidebar/topbar) + auth
2. Dashboard, Pacientes (lista + perfil completo), Agenda
3. Odontograma + Evolução + Anamnese
4. Tratamentos + PDF + assinatura
5. Financeiro + PIX QR
6. Estoque
7. Cadastros auxiliares (dentistas, convênios)

### Notas técnicas
- Sem RLS conforme pedido — adicionarei GRANT mínimo para `authenticated` para o Data API funcionar
- CPF/telefone com máscaras simples (sem libs extras)
- Toasts via `sonner`
- Validação com zod em todos os forms

Posso prosseguir com a implementação?