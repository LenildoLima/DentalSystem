import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { brl, STATUS_FINANCEIRO, STATUS_TRATAMENTO } from "@/lib/dental";
import { Badge } from "@/components/ui/badge";
import { Odontograma } from "@/components/dental/Odontograma";
import { Evolucao } from "@/components/dental/Evolucao";
import { AnamneseForm } from "@/components/dental/AnamneseForm";

export const Route = createFileRoute("/_authenticated/pacientes/$id")({
  component: PacienteDetalhe,
});

function PacienteDetalhe() {
  const { id } = Route.useParams();

  const { data: p } = useQuery({
    queryKey: ["paciente", id],
    queryFn: async () => (await supabase.from("pacientes").select("*, convenios(nome)").eq("id", id).single()).data,
  });

  const { data: tratamentos = [] } = useQuery({
    queryKey: ["tratamentos", id],
    queryFn: async () => (await supabase.from("tratamentos").select("*, dentistas(nome)").eq("paciente_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: financeiro = [] } = useQuery({
    queryKey: ["financeiro", id],
    queryFn: async () => (await supabase.from("financeiro").select("*").eq("paciente_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  if (!p) return <div className="text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/pacientes"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-semibold">{p.nome}</h1>
          <p className="text-sm text-muted-foreground">{p.cpf || "Sem CPF"} · {p.telefone || "—"} · {p.convenios?.nome || "Particular"}</p>
        </div>
      </div>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="prontuario">Prontuário</TabsTrigger>
          <TabsTrigger value="tratamentos">Tratamentos</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card><CardContent className="p-6 grid sm:grid-cols-2 gap-4 text-sm">
            <Info label="Nome" value={p.nome} />
            <Info label="CPF" value={p.cpf} />
            <Info label="Data de nascimento" value={p.data_nascimento ? format(new Date(p.data_nascimento), "dd/MM/yyyy") : "—"} />
            <Info label="Telefone" value={p.telefone} />
            <Info label="E-mail" value={p.email} />
            <Info label="Endereço" value={p.endereco} />
            <Info label="Convênio" value={p.convenios?.nome || "Particular"} />
            <Info label="Cadastrado em" value={p.created_at ? format(new Date(p.created_at), "dd/MM/yyyy") : "—"} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="prontuario" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Odontograma</CardTitle></CardHeader>
            <CardContent><Odontograma pacienteId={id} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Anamnese</CardTitle></CardHeader>
            <CardContent><AnamneseForm pacienteId={id} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Evolução clínica</CardTitle></CardHeader>
            <CardContent><Evolucao pacienteId={id} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tratamentos">
          <Card><CardContent className="p-6 space-y-3">
            {tratamentos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum tratamento cadastrado.</p>}
            {tratamentos.map((t) => {
              const st = STATUS_TRATAMENTO[(t.status as keyof typeof STATUS_TRATAMENTO) ?? "pendente"];
              return (
                <div key={t.id} className="flex justify-between items-center border-b last:border-0 pb-3 last:pb-0">
                  <div>
                    <div className="font-medium">{t.procedimento}</div>
                    <div className="text-xs text-muted-foreground">Dente {t.dente_numero ?? "—"} · {t.dentistas?.nome}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={st.className}>{st.label}</Badge>
                    <span className="font-medium">{brl(Number(t.valor))}</span>
                  </div>
                </div>
              );
            })}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <Card><CardContent className="p-6 space-y-3">
            {financeiro.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma cobrança.</p>}
            {financeiro.map((f) => {
              const st = STATUS_FINANCEIRO[(f.status as keyof typeof STATUS_FINANCEIRO) ?? "pendente"];
              return (
                <div key={f.id} className="flex justify-between items-center border-b last:border-0 pb-3 last:pb-0">
                  <div>
                    <div className="font-medium">{brl(Number(f.valor))}</div>
                    <div className="text-xs text-muted-foreground">{f.forma_pagamento ?? "—"} · {f.parcelas ?? 1}x</div>
                  </div>
                  <Badge className={st.className}>{st.label}</Badge>
                </div>
              );
            })}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Em breve: anexo de documentos via Supabase Storage.</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="mt-1">{value || "—"}</div>
    </div>
  );
}
