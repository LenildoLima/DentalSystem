import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, FileDown, PenLine } from "lucide-react";
import { brl, STATUS_TRATAMENTO } from "@/lib/dental";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { SignaturePad } from "@/components/dental/SignaturePad";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/tratamentos")({
  component: TratamentosPage,
});

function TratamentosPage() {
  const qc = useQueryClient();
  const [pacienteId, setPacienteId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes", "minimal"],
    queryFn: async () => (await supabase.from("pacientes").select("id, nome").order("nome")).data ?? [],
  });
  const { data: dentistas = [] } = useQuery({
    queryKey: ["dentistas"],
    queryFn: async () => (await supabase.from("dentistas").select("id, nome").order("nome")).data ?? [],
  });
  const { data: tratamentos = [] } = useQuery({
    queryKey: ["tratamentos", pacienteId],
    enabled: !!pacienteId,
    queryFn: async () => (await supabase.from("tratamentos").select("*, dentistas(nome)").eq("paciente_id", pacienteId).order("created_at", { ascending: false })).data ?? [],
  });

  const add = useMutation({
    mutationFn: async (payload: any) => { const { error } = await supabase.from("tratamentos").insert(payload); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tratamentos", pacienteId] }); toast.success("Adicionado"); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tratamentos").update({ status, data_conclusao: status === "concluido" ? format(new Date(), "yyyy-MM-dd") : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tratamentos", pacienteId] }),
  });

  const total = tratamentos.reduce((s, t) => s + Number(t.valor || 0), 0);
  const paciente = pacientes.find((p) => p.id === pacienteId);

  const gerarPDF = () => {
    if (!paciente) return;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Orçamento de Tratamento", 14, 18);
    doc.setFontSize(11); doc.text(`Paciente: ${paciente.nome}`, 14, 28);
    doc.text(`Data: ${format(new Date(), "dd/MM/yyyy")}`, 14, 34);
    let y = 48;
    doc.setFont("helvetica", "bold");
    doc.text("Procedimento", 14, y); doc.text("Dente", 110, y); doc.text("Valor", 160, y);
    doc.setFont("helvetica", "normal"); y += 6;
    tratamentos.forEach((t) => {
      doc.text(String(t.procedimento).slice(0, 50), 14, y);
      doc.text(String(t.dente_numero ?? "—"), 110, y);
      doc.text(brl(Number(t.valor)), 160, y);
      y += 6;
    });
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${brl(total)}`, 14, y);
    if (signature) { doc.addImage(signature, "PNG", 14, y + 20, 80, 30); doc.text("Assinatura do paciente", 14, y + 56); }
    doc.save(`orcamento-${paciente.nome}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1.5"><Label>Paciente</Label>
          <Select value={pacienteId} onValueChange={setPacienteId}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Selecione um paciente" /></SelectTrigger>
            <SelectContent>{pacientes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {pacienteId && (
          <>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Procedimento</Button></DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader><DialogTitle>Novo procedimento</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); add.mutate({
                  paciente_id: pacienteId,
                  dentista_id: fd.get("dentista_id"),
                  procedimento: fd.get("procedimento"),
                  dente_numero: fd.get("dente_numero") ? Number(fd.get("dente_numero")) : null,
                  valor: fd.get("valor") ? Number(fd.get("valor")) : null,
                  status: fd.get("status"),
                  data_prevista: fd.get("data_prevista") || null,
                }); }} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2"><Label>Procedimento *</Label><Input name="procedimento" required /></div>
                  <div className="space-y-2"><Label>Dente</Label><Input name="dente_numero" type="number" /></div>
                  <div className="space-y-2"><Label>Valor</Label><Input name="valor" type="number" step="0.01" /></div>
                  <div className="space-y-2"><Label>Dentista *</Label>
                    <Select name="dentista_id" required><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{dentistas.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Data prevista</Label><Input name="data_prevista" type="date" /></div>
                  <div className="col-span-2 space-y-2"><Label>Status</Label>
                    <Select name="status" defaultValue="pendente"><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(STATUS_TRATAMENTO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="col-span-2"><Button type="submit">Adicionar</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={sigOpen} onOpenChange={setSigOpen}>
              <DialogTrigger asChild><Button variant="outline"><PenLine className="h-4 w-4 mr-2" />Assinatura</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Assinatura do paciente</DialogTitle></DialogHeader>
                <SignaturePad onChange={setSignature} />
                <DialogFooter><Button onClick={() => setSigOpen(false)}>Concluir</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={gerarPDF}><FileDown className="h-4 w-4 mr-2" />Gerar PDF</Button>
          </>
        )}
      </div>

      {pacienteId && (
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Procedimento</TableHead><TableHead>Dente</TableHead><TableHead>Dentista</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
            <TableBody>
              {tratamentos.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum procedimento</TableCell></TableRow>}
              {tratamentos.map((t) => {
                const st = STATUS_TRATAMENTO[(t.status as keyof typeof STATUS_TRATAMENTO) ?? "pendente"];
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.procedimento}</TableCell>
                    <TableCell>{t.dente_numero ?? "—"}</TableCell>
                    <TableCell>{t.dentistas?.nome}</TableCell>
                    <TableCell>
                      <Select value={t.status ?? "pendente"} onValueChange={(v) => updateStatus.mutate({ id: t.id, status: v })}>
                        <SelectTrigger className="h-7 w-36"><Badge className={st.className}>{st.label}</Badge></SelectTrigger>
                        <SelectContent>{Object.entries(STATUS_TRATAMENTO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">{brl(Number(t.valor))}</TableCell>
                  </TableRow>
                );
              })}
              {tratamentos.length > 0 && <TableRow><TableCell colSpan={4} className="text-right font-semibold">Total</TableCell><TableCell className="text-right font-semibold">{brl(total)}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
