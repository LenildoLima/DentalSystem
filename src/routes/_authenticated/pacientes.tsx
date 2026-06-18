import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatCPF, formatPhone } from "@/lib/dental";

export const Route = createFileRoute("/_authenticated/pacientes")({
  component: PacientesPage,
});

function PacientesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("*, convenios(nome)")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios"],
    queryFn: async () => (await supabase.from("convenios").select("id, nome").order("nome")).data ?? [],
  });

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return pacientes.filter((p) => !s || p.nome?.toLowerCase().includes(s) || p.cpf?.includes(s) || p.telefone?.includes(s));
  }, [pacientes, q]);

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { error } = await supabase.from("pacientes").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pacientes"] }); toast.success("Paciente cadastrado"); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const convenio_id = fd.get("convenio_id") as string;
    create.mutate({
      nome: fd.get("nome"),
      cpf: fd.get("cpf") || null,
      data_nascimento: fd.get("data_nascimento") || null,
      telefone: fd.get("telefone") || null,
      email: fd.get("email") || null,
      endereco: fd.get("endereco") || null,
      convenio_id: convenio_id && convenio_id !== "none" ? convenio_id : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <p className="text-sm text-muted-foreground">{pacientes.length} cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo paciente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Novo paciente</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2"><Label>Nome *</Label><Input name="nome" required /></div>
              <div className="space-y-2"><Label>CPF</Label><Input name="cpf" onChange={(e) => (e.target.value = formatCPF(e.target.value))} /></div>
              <div className="space-y-2"><Label>Data de nascimento</Label><Input name="data_nascimento" type="date" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input name="telefone" onChange={(e) => (e.target.value = formatPhone(e.target.value))} /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input name="email" type="email" /></div>
              <div className="col-span-2 space-y-2"><Label>Endereço</Label><Input name="endereco" /></div>
              <div className="col-span-2 space-y-2">
                <Label>Convênio</Label>
                <Select name="convenio_id" defaultValue="none">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Particular</SelectItem>
                    {convenios.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="col-span-2">
                <Button type="submit" disabled={create.isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome, CPF ou telefone..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Convênio</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum paciente</TableCell></TableRow>}
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell>{p.cpf || "—"}</TableCell>
                <TableCell>{p.telefone || "—"}</TableCell>
                <TableCell>{p.convenios?.nome || "Particular"}</TableCell>
                <TableCell>
                  <Button asChild size="icon" variant="ghost"><Link to="/pacientes/$id" params={{ id: p.id }}><Eye className="h-4 w-4" /></Link></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
