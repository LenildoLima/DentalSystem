import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";

export function Evolucao({ pacienteId }: { pacienteId: string }) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [dentistaId, setDentistaId] = useState("");

  const { data: itens = [] } = useQuery({
    queryKey: ["evolucao", pacienteId],
    queryFn: async () => (await supabase.from("prontuario_evolucao").select("*, dentistas(nome)").eq("paciente_id", pacienteId).order("data", { ascending: false })).data ?? [],
  });
  const { data: dentistas = [] } = useQuery({
    queryKey: ["dentistas"],
    queryFn: async () => (await supabase.from("dentistas").select("id, nome").order("nome")).data ?? [],
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!texto.trim() || !dentistaId) throw new Error("Preencha texto e dentista");
      const { error } = await supabase.from("prontuario_evolucao").insert({ paciente_id: pacienteId, texto, dentista_id: dentistaId });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["evolucao", pacienteId] }); setTexto(""); toast.success("Anotação salva"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-[1fr_240px] gap-3 items-end">
        <div className="space-y-2"><Label>Nova anotação</Label><Textarea rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Descreva a evolução clínica..." /></div>
        <div className="space-y-2">
          <Label>Dentista</Label>
          <Select value={dentistaId} onValueChange={setDentistaId}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{dentistas.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => add.mutate()} disabled={add.isPending} className="w-full">Adicionar</Button>
        </div>
      </div>
      <div className="space-y-3">
        {itens.length === 0 && <p className="text-sm text-muted-foreground">Sem registros.</p>}
        {itens.map((i) => (
          <div key={i.id} className="border-l-2 border-primary pl-3 py-1">
            <div className="text-xs text-muted-foreground">{i.data ? format(new Date(i.data), "dd/MM/yyyy HH:mm") : ""} · {i.dentistas?.nome}</div>
            <div className="text-sm mt-1 whitespace-pre-wrap">{i.texto}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
