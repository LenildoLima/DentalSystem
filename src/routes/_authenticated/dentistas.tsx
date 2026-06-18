import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dentistas")({
  component: DentistasPage,
});

function DentistasPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: itens = [] } = useQuery({
    queryKey: ["dentistas-full"],
    queryFn: async () => (await supabase.from("dentistas").select("*").order("nome")).data ?? [],
  });
  const add = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("dentistas").insert(p); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dentistas-full"] }); qc.invalidateQueries({ queryKey: ["dentistas"] }); toast.success("Cadastrado"); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Dentistas</h1><p className="text-sm text-muted-foreground">{itens.length} cadastrados</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo dentista</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Novo dentista</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); add.mutate({
              nome: fd.get("nome"), cro: fd.get("cro"), especialidade: fd.get("especialidade"), telefone: fd.get("telefone"), email: fd.get("email"),
            }); }} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2"><Label>Nome *</Label><Input name="nome" required /></div>
              <div className="space-y-2"><Label>CRO</Label><Input name="cro" /></div>
              <div className="space-y-2"><Label>Especialidade</Label><Input name="especialidade" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input name="telefone" /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input name="email" type="email" /></div>
              <DialogFooter className="col-span-2"><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>CRO</TableHead><TableHead>Especialidade</TableHead><TableHead>Telefone</TableHead><TableHead>E-mail</TableHead></TableRow></TableHeader>
          <TableBody>
            {itens.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum dentista</TableCell></TableRow>}
            {itens.map((d) => (<TableRow key={d.id}><TableCell className="font-medium">{d.nome}</TableCell><TableCell>{d.cro ?? "—"}</TableCell><TableCell>{d.especialidade ?? "—"}</TableCell><TableCell>{d.telefone ?? "—"}</TableCell><TableCell>{d.email ?? "—"}</TableCell></TableRow>))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
