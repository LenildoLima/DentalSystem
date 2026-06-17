export const STATUS_AGENDAMENTO = {
  agendado: { label: "Agendado", className: "bg-muted text-muted-foreground border-border" },
  confirmado: { label: "Confirmado", className: "bg-info/15 text-info border-info/30" },
  em_atendimento: { label: "Em atendimento", className: "bg-warning/20 text-warning-foreground border-warning/40" },
  concluido: { label: "Concluído", className: "bg-success/15 text-success border-success/30" },
  faltou: { label: "Faltou", className: "bg-destructive/15 text-destructive border-destructive/30" },
  bloqueio: { label: "Bloqueio", className: "bg-foreground/10 text-foreground border-border" },
} as const;

export type StatusAgendamento = keyof typeof STATUS_AGENDAMENTO;

export const STATUS_TRATAMENTO = {
  pendente: { label: "Pendente", className: "bg-muted text-muted-foreground" },
  em_andamento: { label: "Em andamento", className: "bg-info/15 text-info" },
  concluido: { label: "Concluído", className: "bg-success/15 text-success" },
} as const;

export const STATUS_FINANCEIRO = {
  pendente: { label: "Pendente", className: "bg-warning/15 text-warning-foreground" },
  pago: { label: "Pago", className: "bg-success/15 text-success" },
  cancelado: { label: "Cancelado", className: "bg-destructive/15 text-destructive" },
} as const;

export const FORMA_PAGAMENTO = ["pix", "cartao_debito", "cartao_credito", "dinheiro", "convenio"] as const;
export const FORMA_PAGAMENTO_LABEL: Record<(typeof FORMA_PAGAMENTO)[number], string> = {
  pix: "PIX",
  cartao_debito: "Cartão Débito",
  cartao_credito: "Cartão Crédito",
  dinheiro: "Dinheiro",
  convenio: "Convênio",
};

export const ODONTO_STATUS = {
  higido: { label: "Hígido", color: "#e5e7eb" },
  carie: { label: "Cárie", color: "#ef4444" },
  restauracao: { label: "Restauração", color: "#3b82f6" },
  extracao: { label: "Extração", color: "#111827" },
  implante: { label: "Implante", color: "#8b5cf6" },
  coroa: { label: "Coroa", color: "#f59e0b" },
  ausente: { label: "Ausente", color: "#9ca3af" },
} as const;

export type OdontoStatus = keyof typeof ODONTO_STATUS;

// FDI numbering: upper-right 18-11, upper-left 21-28, lower-left 38-31, lower-right 41-48
export const FDI_TEETH = {
  topRight: [18, 17, 16, 15, 14, 13, 12, 11],
  topLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  bottomLeft: [38, 37, 36, 35, 34, 33, 32, 31],
  bottomRight: [41, 42, 43, 44, 45, 46, 47, 48],
};

export const FACES = ["oclusal", "vestibular", "lingual", "mesial", "distal"] as const;
export type Face = (typeof FACES)[number];

export function brl(v: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);
}
export function formatCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
export function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}
