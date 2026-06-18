import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AnamneseForm({ pacienteId }: { pacienteId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["anamnese", pacienteId],
    queryFn: async () => (await supabase.from("anamnese").select("*").eq("paciente_id", pacienteId).maybeSingle()).data,
  });

  const save = useMutation({
    mutationFn: async (payload: any) => {
      if (data?.id) {
        const { error } = await supabase.from("anamnese").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("anamnese").insert({ ...payload, paciente_id: pacienteId });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["anamnese", pacienteId] }); toast.success("Anamnese salva"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      save.mutate({
        historico_medico: fd.get("historico_medico"),
        alergias: fd.get("alergias"),
        medicamentos: fd.get("medicamentos"),
      });
    }} className="space-y-4">
      <div className="space-y-2"><Label>Histórico médico</Label><Textarea name="historico_medico" rows={3} defaultValue={data?.historico_medico ?? ""} /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Alergias</Label><Textarea name="alergias" rows={3} defaultValue={data?.alergias ?? ""} /></div>
        <div className="space-y-2"><Label>Medicamentos em uso</Label><Textarea name="medicamentos" rows={3} defaultValue={data?.medicamentos ?? ""} /></div>
      </div>
      <Button type="submit" disabled={save.isPending}>Salvar anamnese</Button>
    </form>
  );
}
