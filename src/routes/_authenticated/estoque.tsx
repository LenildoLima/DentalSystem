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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowDownUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/estoque")({
  component: EstoquePage,
});

function EstoquePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [movOpen, setMovOpen] = useState<{ id: string; nome: string } | null>(null);

  const { data: itens = [] } = useQuery({
    queryKey: ["estoque"],
    queryFn: async () => (await supabase.from("estoque").select("*").order("nome")).data ?? [],
  });

  const add = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("estoque").insert(p); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["estoque"] }); toast.success("Item cadastrado"); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const mov = useMutation({
    mutationFn: async ({ id, tipo, quantidade, motivo }: any) => {
      const item = itens.find((i) => i.id === id)!;
      const atual = Number(item.quantidade_atual ?? 0);
      const nova = tipo === "entrada" ? atual + Number(quantidade) : atual - Number(quantidade);
      const { error: e1 } = await supabase.from("estoque_movimentacoes").insert({ estoque_id: id, tipo, quantidade, motivo });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("estoque").update({ quantidade_atual: nova }).eq("id", id);
      if (e2) throw e2;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["estoque"] }); toast.success("Movimentação registrada"); setMovOpen(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-semibold">Estoque</h1><p className="text-sm text-muted-foreground">{itens.length} itens cadastrados</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo item</Button></DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Novo item de estoque</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); add.mutate({
              nome: fd.get("nome"), categoria: fd.get("categoria"), unidade: fd.get("unidade"),
              quantidade_atual: Number(fd.get("quantidade_atual") || 0),
              quantidade_minima: Number(fd.get("quantidade_minima") || 0),
              fornecedor: fd.get("fornecedor"),
            }); }} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2"><Label>Nome *</Label><Input name="nome" required /></div>
              <div className="space-y-2"><Label>Categoria</Label><Input name="categoria" /></div>
              <div className="space-y-2"><Label>Unidade</Label><Input name="unidade" placeholder="un, ml, g..." /></div>
              <div className="space-y-2"><Label>Quantidade atual</Label><Input name="quantidade_atual" type="number" defaultValue={0} /></div>
              <div className="space-y-2"><Label>Quantidade mínima</Label><Input name="quantidade_minima" type="number" defaultValue={0} /></div>
              <div className="col-span-2 space-y-2"><Label>Fornecedor</Label><Input name="fornecedor" /></div>
              <DialogFooter className="col-span-2"><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Fornecedor</TableHead><TableHead className="text-right">Atual</TableHead><TableHead className="text-right">Mínimo</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {itens.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sem itens</TableCell></TableRow>}
            {itens.map((i) => {
              const baixo = Number(i.quantidade_atual ?? 0) < Number(i.quantidade_minima ?? 0);
              return (
                <TableRow key={i.id} className={baixo ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium flex items-center gap-2">{baixo && <AlertTriangle className="h-4 w-4 text-destructive" />}{i.nome}</TableCell>
                  <TableCell>{i.categoria ?? "—"}</TableCell>
                  <TableCell>{i.fornecedor ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {baixo ? <Badge variant="destructive">{i.quantidade_atual} {i.unidade}</Badge> : <span>{i.quantidade_atual} {i.unidade}</span>}
                  </TableCell>
                  <TableCell className="text-right">{i.quantidade_minima} {i.unidade}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => setMovOpen({ id: i.id, nome: i.nome })}><ArrowDownUp className="h-3 w-3 mr-1" />Mov.</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!movOpen} onOpenChange={(v) => !v && setMovOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Movimentação · {movOpen?.nome}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); mov.mutate({
            id: movOpen!.id, tipo: fd.get("tipo"), quantidade: Number(fd.get("quantidade")), motivo: fd.get("motivo") || null
          }); }} className="space-y-4">
            <div className="space-y-2"><Label>Tipo</Label>
              <Select name="tipo" defaultValue="entrada"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Quantidade *</Label><Input name="quantidade" type="number" step="0.01" required /></div>
            <div className="space-y-2"><Label>Motivo</Label><Input name="motivo" /></div>
            <DialogFooter><Button type="submit" disabled={mov.isPending}>Registrar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
