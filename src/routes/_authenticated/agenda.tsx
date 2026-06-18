import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Plus, Lock } from "lucide-react";
import { addDays, addWeeks, eachDayOfInterval, endOfWeek, format, startOfWeek, subWeeks, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_AGENDAMENTO, type StatusAgendamento } from "@/lib/dental";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: AgendaPage,
});

const HOURS = Array.from({ length: 22 - 7 }, (_, i) => i + 7); // 7..21
const STATUSES: StatusAgendamento[] = ["agendado", "confirmado", "em_atendimento", "concluido", "faltou", "bloqueio"];

function AgendaPage() {
  const qc = useQueryClient();
  const [anchor, setAnchor] = useState(new Date());
  const [view, setView] = useState<"semana" | "dia">("semana");
  const [dentistaFiltro, setDentistaFiltro] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState<{ data: Date; hora?: number } | null>(null);
  const [editing, setEditing] = useState<any>(null);

  const days = view === "semana"
    ? eachDayOfInterval({ start: startOfWeek(anchor, { weekStartsOn: 1 }), end: endOfWeek(anchor, { weekStartsOn: 1 }) })
    : [anchor];

  const { data: dentistas = [] } = useQuery({
    queryKey: ["dentistas"],
    queryFn: async () => (await supabase.from("dentistas").select("id, nome").order("nome")).data ?? [],
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes", "minimal"],
    queryFn: async () => (await supabase.from("pacientes").select("id, nome").order("nome")).data ?? [],
  });

  const rangeStart = days[0];
  const rangeEnd = addDays(days[days.length - 1], 1);

  const { data: agendamentos = [] } = useQuery({
    queryKey: ["agendamentos", rangeStart.toISOString(), rangeEnd.toISOString(), dentistaFiltro],
    queryFn: async () => {
      let q = supabase.from("agendamentos")
        .select("*, pacientes(nome), dentistas(nome)")
        .gte("data_hora", rangeStart.toISOString())
        .lt("data_hora", rangeEnd.toISOString());
      if (dentistaFiltro !== "all") q = q.eq("dentista_id", dentistaFiltro);
      return (await q).data ?? [];
    },
  });

  const byDayHour = useMemo(() => {
    const m = new Map<string, any[]>();
    agendamentos.forEach((a) => {
      const d = parseISO(a.data_hora);
      const key = `${format(d, "yyyy-MM-dd")}-${d.getHours()}`;
      const arr = m.get(key) ?? [];
      arr.push(a);
      m.set(key, arr);
    });
    return m;
  }, [agendamentos]);

  const upsert = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        const { error } = await supabase.from("agendamentos").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agendamentos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agendamentos"] }); toast.success("Agendamento salvo"); setOpen(false); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("agendamentos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agendamentos"] }); toast.success("Removido"); setOpen(false); setEditing(null); },
  });

  const openCreate = (d: Date, h: number) => { setEditing(null); setSlot({ data: d, hora: h }); setOpen(true); };
  const openEdit = (a: any) => { setEditing(a); setOpen(true); };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = fd.get("data") as string;
    const hora = fd.get("hora") as string;
    upsert.mutate({
      id: editing?.id,
      paciente_id: fd.get("paciente_id"),
      dentista_id: fd.get("dentista_id"),
      data_hora: new Date(`${data}T${hora}`).toISOString(),
      tipo: fd.get("tipo") || null,
      status: fd.get("status"),
      observacoes: fd.get("observacoes") || null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-sm text-muted-foreground">{view === "semana" ? `Semana de ${format(days[0], "dd/MM")}` : format(anchor, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={dentistaFiltro} onValueChange={setDentistaFiltro}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os dentistas</SelectItem>
              {dentistas.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="inline-flex rounded-md border">
            <Button variant={view === "semana" ? "default" : "ghost"} size="sm" onClick={() => setView("semana")}>Semana</Button>
            <Button variant={view === "dia" ? "default" : "ghost"} size="sm" onClick={() => setView("dia")}>Dia</Button>
          </div>
          <Button variant="outline" size="icon" onClick={() => setAnchor(view === "semana" ? subWeeks(anchor, 1) : addDays(anchor, -1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>Hoje</Button>
          <Button variant="outline" size="icon" onClick={() => setAnchor(view === "semana" ? addWeeks(anchor, 1) : addDays(anchor, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <Button onClick={() => { setEditing(null); setSlot({ data: new Date(), hora: 9 }); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Novo</Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid" style={{ gridTemplateColumns: `60px repeat(${days.length}, minmax(0, 1fr))` }}>
            <div className="border-b border-r p-2"></div>
            {days.map((d) => (
              <div key={d.toISOString()} className={cn("border-b p-2 text-center text-sm font-medium", isSameDay(d, new Date()) && "bg-primary/5 text-primary")}>
                {format(d, "EEE dd/MM", { locale: ptBR })}
              </div>
            ))}
            {HOURS.map((h) => (
              <>
                <div key={`h-${h}`} className="border-b border-r p-2 text-xs text-muted-foreground text-right">{`${h.toString().padStart(2, "0")}:00`}</div>
                {days.map((d) => {
                  const key = `${format(d, "yyyy-MM-dd")}-${h}`;
                  const items = byDayHour.get(key) ?? [];
                  return (
                    <div key={key} className="border-b border-l min-h-[60px] p-1 group relative">
                      <button onClick={() => openCreate(d, h)} className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-muted/50 transition" />
                      <div className="relative space-y-1">
                        {items.map((a) => {
                          const st = STATUS_AGENDAMENTO[(a.status as StatusAgendamento) ?? "agendado"];
                          return (
                            <button key={a.id} onClick={() => openEdit(a)} className={cn("w-full text-left rounded px-2 py-1 text-xs border", st.className)}>
                              <div className="font-medium truncate">{a.status === "bloqueio" ? <><Lock className="h-3 w-3 inline mr-1" />Bloqueio</> : a.pacientes?.nome}</div>
                              <div className="opacity-80 truncate">{format(parseISO(a.data_hora), "HH:mm")} · {a.dentistas?.nome}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Editar agendamento" : "Novo agendamento"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Data *</Label><Input name="data" type="date" required defaultValue={editing ? format(parseISO(editing.data_hora), "yyyy-MM-dd") : slot?.data ? format(slot.data, "yyyy-MM-dd") : ""} /></div>
            <div className="space-y-2"><Label>Hora *</Label><Input name="hora" type="time" required defaultValue={editing ? format(parseISO(editing.data_hora), "HH:mm") : slot?.hora ? `${String(slot.hora).padStart(2, "0")}:00` : ""} /></div>
            <div className="col-span-2 space-y-2">
              <Label>Paciente</Label>
              <Select name="paciente_id" defaultValue={editing?.paciente_id ?? ""}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{pacientes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Dentista *</Label>
              <Select name="dentista_id" defaultValue={editing?.dentista_id ?? ""} required>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{dentistas.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Tipo</Label><Input name="tipo" defaultValue={editing?.tipo ?? ""} placeholder="Consulta, retorno, limpeza..." /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue={editing?.status ?? "agendado"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_AGENDAMENTO[s].label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2"><Label>Observações</Label><Textarea name="observacoes" defaultValue={editing?.observacoes ?? ""} /></div>
            <DialogFooter className="col-span-2 flex justify-between sm:justify-between gap-2">
              {editing && <Button type="button" variant="destructive" onClick={() => del.mutate(editing.id)}>Excluir</Button>}
              <Button type="submit" disabled={upsert.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
