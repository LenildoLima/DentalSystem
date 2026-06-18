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

export const Route = createFileRoute("/_authenticated/convenios")({
  component: ConveniosPage,
});

function ConveniosPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: itens = [] } = useQuery({
    queryKey: ["convenios-full"],
    queryFn: async () => (await supabase.from("convenios").select("*").order("nome")).data ?? [],
  });
  const add = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("convenios").insert(p); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["convenios-full"] }); qc.invalidateQueries({ queryKey: ["convenios"] }); toast.success("Cadastrado"); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Convênios</h1><p className="text-sm text-muted-foreground">{itens.length} cadastrados</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo convênio</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Novo convênio</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); add.mutate({ nome: fd.get("nome") }); }} className="space-y-4">
              <div className="space-y-2"><Label>Nome *</Label><Input name="nome" required /></div>
              <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead></TableRow></TableHeader>
          <TableBody>
            {itens.length === 0 && <TableRow><TableCell className="text-center text-muted-foreground py-8">Nenhum convênio</TableCell></TableRow>}
            {itens.map((c) => (<TableRow key={c.id}><TableCell className="font-medium">{c.nome}</TableCell></TableRow>))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
