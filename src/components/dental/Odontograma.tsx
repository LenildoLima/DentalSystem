import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FDI_TEETH, ODONTO_STATUS, FACES, type Face, type OdontoStatus } from "@/lib/dental";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function Odontograma({ pacienteId }: { pacienteId: string }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<{ dente: number; face: Face } | null>(null);

  const { data: registros = [] } = useQuery({
    queryKey: ["odontograma", pacienteId],
    queryFn: async () => (await supabase.from("odontograma").select("*").eq("paciente_id", pacienteId)).data ?? [],
  });

  const { data: dentistas = [] } = useQuery({
    queryKey: ["dentistas"],
    queryFn: async () => (await supabase.from("dentistas").select("id, nome").order("nome")).data ?? [],
  });

  const map = useMemo(() => {
    const m = new Map<string, any>();
    registros.forEach((r) => m.set(`${r.dente_numero}-${r.face}`, r));
    return m;
  }, [registros]);

  const upsert = useMutation({
    mutationFn: async (payload: any) => {
      const existing = map.get(`${payload.dente_numero}-${payload.face}`);
      if (existing) {
        const { error } = await supabase.from("odontograma").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("odontograma").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["odontograma", pacienteId] }); toast.success("Registro salvo"); setSelected(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const Tooth = ({ n }: { n: number }) => {
    const faceColor = (f: Face) => ODONTO_STATUS[(map.get(`${n}-${f}`)?.status as OdontoStatus) ?? "higido"]?.color ?? "#e5e7eb";
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-[10px] text-muted-foreground">{n}</div>
        <svg viewBox="0 0 40 40" className="w-9 h-9 cursor-pointer">
          {/* simple cross-quadrant + center for occlusal */}
          <polygon points="0,0 40,0 30,10 10,10" fill={faceColor("vestibular")} stroke="#9ca3af" onClick={() => setSelected({ dente: n, face: "vestibular" })} />
          <polygon points="40,0 40,40 30,30 30,10" fill={faceColor("mesial")} stroke="#9ca3af" onClick={() => setSelected({ dente: n, face: "mesial" })} />
          <polygon points="40,40 0,40 10,30 30,30" fill={faceColor("lingual")} stroke="#9ca3af" onClick={() => setSelected({ dente: n, face: "lingual" })} />
          <polygon points="0,40 0,0 10,10 10,30" fill={faceColor("distal")} stroke="#9ca3af" onClick={() => setSelected({ dente: n, face: "distal" })} />
          <rect x="10" y="10" width="20" height="20" fill={faceColor("oclusal")} stroke="#9ca3af" onClick={() => setSelected({ dente: n, face: "oclusal" })} />
        </svg>
      </div>
    );
  };

  const current = selected ? map.get(`${selected.dente}-${selected.face}`) : null;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex justify-between gap-1">
          {FDI_TEETH.topRight.map((n) => <Tooth key={n} n={n} />)}
          <div className="w-1 bg-border" />
          {FDI_TEETH.topLeft.map((n) => <Tooth key={n} n={n} />)}
        </div>
        <div className="border-t" />
        <div className="flex justify-between gap-1">
          {FDI_TEETH.bottomRight.reverse().map((n) => <Tooth key={n} n={n} />)}
          <div className="w-1 bg-border" />
          {FDI_TEETH.bottomLeft.reverse().map((n) => <Tooth key={n} n={n} />)}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(ODONTO_STATUS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded" style={{ background: v.color }} />{v.label}</div>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Dente {selected?.dente} · Face {selected?.face}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            upsert.mutate({
              paciente_id: pacienteId,
              dente_numero: selected!.dente,
              face: selected!.face,
              status: fd.get("status"),
              observacao: fd.get("observacao") || null,
              dentista_id: fd.get("dentista_id") || null,
            });
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue={current?.status ?? "higido"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(ODONTO_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dentista</Label>
              <Select name="dentista_id" defaultValue={current?.dentista_id ?? ""}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{dentistas.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Observação</Label><Textarea name="observacao" defaultValue={current?.observacao ?? ""} /></div>
            <DialogFooter><Button type="submit" disabled={upsert.isPending}>Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
