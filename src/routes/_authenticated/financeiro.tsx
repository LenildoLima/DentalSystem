import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { brl, STATUS_FINANCEIRO, FORMA_PAGAMENTO, FORMA_PAGAMENTO_LABEL } from "@/lib/dental";
import { Plus, QrCode } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import QRCode from "qrcode";

export const Route = createFileRoute("/_authenticated/financeiro")({
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const qc = useQueryClient();
  const today = new Date();
  const [from, setFrom] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(endOfMonth(today), "yyyy-MM-dd"));
  const [dentistaId, setDentistaId] = useState("all");
  const [forma, setForma] = useState("all");
  const [open, setOpen] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [pixQR, setPixQR] = useState<string | null>(null);

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes", "minimal"],
    queryFn: async () => (await supabase.from("pacientes").select("id, nome").order("nome")).data ?? [],
  });
  const { data: dentistas = [] } = useQuery({
    queryKey: ["dentistas"],
    queryFn: async () => (await supabase.from("dentistas").select("id, nome").order("nome")).data ?? [],
  });

  const { data: cobrancas = [] } = useQuery({
    queryKey: ["financeiro", from, to, dentistaId, forma],
    queryFn: async () => {
      let q = supabase.from("financeiro").select("*, pacientes(nome), tratamentos(procedimento, dentista_id)")
        .gte("created_at", new Date(from).toISOString())
        .lte("created_at", new Date(to + "T23:59:59").toISOString())
        .order("created_at", { ascending: false });
      if (forma !== "all") q = q.eq("forma_pagamento", forma);
      const res = (await q).data ?? [];
      return dentistaId === "all" ? res : res.filter((r: any) => r.tratamentos?.dentista_id === dentistaId);
    },
  });

  const totalPago = useMemo(() => cobrancas.filter((c) => c.status === "pago").reduce((s, c) => s + Number(c.valor || 0), 0), [cobrancas]);
  const totalPendente = useMemo(() => cobrancas.filter((c) => c.status === "pendente").reduce((s, c) => s + Number(c.valor || 0), 0), [cobrancas]);

  const add = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("financeiro").insert(p); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financeiro"] }); toast.success("Cobrança registrada"); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("financeiro").update({ status, data_pagamento: status === "pago" ? format(new Date(), "yyyy-MM-dd") : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financeiro"] }),
  });

  const gerarPIX = async (valor: number) => {
    // Simple static PIX payload (placeholder — clinic chave should be configured)
    const payload = `PIX|DentalSystem|valor=${valor.toFixed(2)}`;
    const url = await QRCode.toDataURL(payload, { width: 240, margin: 1 });
    setPixQR(url); setPixOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-semibold">Financeiro</h1><p className="text-sm text-muted-foreground">Cobranças e faturamento</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova cobrança</Button></DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Nova cobrança</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); add.mutate({
              paciente_id: fd.get("paciente_id"),
              valor: Number(fd.get("valor")),
              forma_pagamento: fd.get("forma_pagamento"),
              parcelas: Number(fd.get("parcelas") || 1),
              data_pagamento: fd.get("data_pagamento") || null,
              convenio_guia: fd.get("convenio_guia") || null,
              status: fd.get("status"),
            }); }} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2"><Label>Paciente *</Label>
                <Select name="paciente_id" required><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{pacientes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Valor *</Label><Input name="valor" type="number" step="0.01" required /></div>
              <div className="space-y-2"><Label>Parcelas</Label><Input name="parcelas" type="number" defaultValue={1} min={1} /></div>
              <div className="space-y-2"><Label>Forma de pagamento *</Label>
                <Select name="forma_pagamento" required><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FORMA_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{FORMA_PAGAMENTO_LABEL[f]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Data de pagamento</Label><Input name="data_pagamento" type="date" /></div>
              <div className="space-y-2"><Label>Guia convênio</Label><Input name="convenio_guia" /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select name="status" defaultValue="pendente"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_FINANCEIRO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <DialogFooter className="col-span-2"><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Recebido no período</div><div className="text-2xl font-semibold mt-1 text-success">{brl(totalPago)}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">A receber</div><div className="text-2xl font-semibold mt-1 text-warning-foreground">{brl(totalPendente)}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Total</div><div className="text-2xl font-semibold mt-1">{brl(totalPago + totalPendente)}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 grid sm:grid-cols-4 gap-3">
          <div><Label>De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label>Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div><Label>Dentista</Label>
            <Select value={dentistaId} onValueChange={setDentistaId}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos</SelectItem>{dentistas.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Forma</Label>
            <Select value={forma} onValueChange={setForma}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas</SelectItem>{FORMA_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{FORMA_PAGAMENTO_LABEL[f]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Forma</TableHead><TableHead>Parcelas</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {cobrancas.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sem cobranças no período</TableCell></TableRow>}
            {cobrancas.map((c: any) => {
              const st = STATUS_FINANCEIRO[(c.status as keyof typeof STATUS_FINANCEIRO) ?? "pendente"];
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.pacientes?.nome}</TableCell>
                  <TableCell>{FORMA_PAGAMENTO_LABEL[c.forma_pagamento as keyof typeof FORMA_PAGAMENTO_LABEL] ?? "—"}</TableCell>
                  <TableCell>{c.parcelas ?? 1}x</TableCell>
                  <TableCell>
                    <Select value={c.status ?? "pendente"} onValueChange={(v) => setStatus.mutate({ id: c.id, status: v })}>
                      <SelectTrigger className="h-7 w-32"><Badge className={st.className}>{st.label}</Badge></SelectTrigger>
                      <SelectContent>{Object.entries(STATUS_FINANCEIRO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">{brl(Number(c.valor))}</TableCell>
                  <TableCell>{c.forma_pagamento === "pix" && <Button size="icon" variant="ghost" onClick={() => gerarPIX(Number(c.valor))}><QrCode className="h-4 w-4" /></Button>}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={pixOpen} onOpenChange={setPixOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>QR Code PIX</DialogTitle></DialogHeader>
          {pixQR && <img src={pixQR} alt="PIX QR" className="mx-auto" />}
          <p className="text-xs text-center text-muted-foreground">Pagamento via PIX</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
