import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, DollarSign, UserPlus, AlertTriangle } from "lucide-react";
import { brl, STATUS_AGENDAMENTO, type StatusAgendamento } from "@/lib/dental";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subWeeks, startOfWeek, endOfWeek, format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const today = new Date();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [hoje, mes, novos, estoque] = await Promise.all([
        supabase.from("agendamentos").select("id", { count: "exact", head: true })
          .gte("data_hora", startOfDay(today).toISOString()).lte("data_hora", endOfDay(today).toISOString()),
        supabase.from("financeiro").select("valor")
          .gte("data_pagamento", format(startOfMonth(today), "yyyy-MM-dd"))
          .lte("data_pagamento", format(endOfMonth(today), "yyyy-MM-dd"))
          .eq("status", "pago"),
        supabase.from("pacientes").select("id", { count: "exact", head: true })
          .gte("created_at", startOfMonth(today).toISOString()),
        supabase.from("estoque").select("quantidade_atual, quantidade_minima"),
      ]);
      const fat = (mes.data ?? []).reduce((s, r) => s + Number(r.valor || 0), 0);
      const critico = (estoque.data ?? []).filter((e) => Number(e.quantidade_atual ?? 0) < Number(e.quantidade_minima ?? 0)).length;
      return { hoje: hoje.count ?? 0, fat, novos: novos.count ?? 0, critico };
    },
  });

  const { data: chart } = useQuery({
    queryKey: ["dashboard-chart"],
    queryFn: async () => {
      const weeks: { label: string; start: Date; end: Date }[] = [];
      for (let i = 3; i >= 0; i--) {
        const d = subWeeks(today, i);
        weeks.push({ label: format(startOfWeek(d), "dd/MM"), start: startOfWeek(d), end: endOfWeek(d) });
      }
      const res = await supabase.from("financeiro").select("valor, data_pagamento")
        .gte("data_pagamento", format(weeks[0].start, "yyyy-MM-dd"))
        .lte("data_pagamento", format(weeks[3].end, "yyyy-MM-dd"))
        .eq("status", "pago");
      return weeks.map((w) => ({
        semana: w.label,
        valor: (res.data ?? []).filter((r) => r.data_pagamento && new Date(r.data_pagamento) >= w.start && new Date(r.data_pagamento) <= w.end).reduce((s, r) => s + Number(r.valor || 0), 0),
      }));
    },
  });

  const { data: proximas } = useQuery({
    queryKey: ["dashboard-proximas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agendamentos")
        .select("id, data_hora, tipo, status, pacientes(nome), dentistas(nome)")
        .gte("data_hora", startOfDay(today).toISOString())
        .lte("data_hora", endOfDay(today).toISOString())
        .order("data_hora");
      return data ?? [];
    },
  });

  const cards = [
    { label: "Consultas hoje", value: stats?.hoje ?? 0, icon: CalendarCheck, color: "text-info" },
    { label: "Faturamento do mês", value: brl(stats?.fat ?? 0), icon: DollarSign, color: "text-success" },
    { label: "Novos pacientes (mês)", value: stats?.novos ?? 0, icon: UserPlus, color: "text-primary" },
    { label: "Estoque crítico", value: stats?.critico ?? 0, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da clínica em {format(today, "dd/MM/yyyy")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{c.label}</div>
                <div className="text-2xl font-semibold mt-1">{c.value}</div>
              </div>
              <c.icon className={`h-8 w-8 ${c.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Faturamento — últimas 4 semanas</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart ?? []}>
                <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Bar dataKey="valor" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Próximas consultas hoje</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(proximas ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma consulta hoje.</p>}
            {(proximas ?? []).map((a) => {
              const st = STATUS_AGENDAMENTO[(a.status as StatusAgendamento) ?? "agendado"];
              return (
                <div key={a.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                  <div>
                    <div className="font-medium text-sm">{a.pacientes?.nome ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(a.data_hora), "HH:mm")} · {a.dentistas?.nome}</div>
                  </div>
                  <Badge variant="outline" className={st.className}>{st.label}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
