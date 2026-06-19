import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, ImageOff, Upload, Loader2, X } from "lucide-react";

const BUCKET = "empresa-assets";

async function uploadToBucket(file: File, folder: "logo" | "banner") {
  const ext = file.name.split(".").pop() || "png";
  const path = `${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: ConfiguracoesPage,
});

type EmpresaForm = {
  id?: string;
  nome: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  logo_url: string;
  banner_url: string;
  cor_primaria: string;
  cor_secundaria: string;
  ativo: boolean;
};

const EMPTY: EmpresaForm = {
  nome: "", nome_fantasia: "", cnpj: "", telefone: "", email: "",
  endereco: "", logo_url: "", banner_url: "", cor_primaria: "#0d9488",
  cor_secundaria: "#0f172a", ativo: true,
};

function ConfiguracoesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<EmpresaForm>(EMPTY);

  const { data: empresa, isLoading } = useQuery({
    queryKey: ["empresa-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("empresas")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (empresa) setForm({ ...EMPTY, ...empresa } as EmpresaForm);
  }, [empresa]);

  const save = useMutation({
    mutationFn: async (payload: EmpresaForm) => {
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await supabase.from("empresas").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("empresas").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresa-config"] });
      qc.invalidateQueries({ queryKey: ["empresa-banner"] });
      toast.success("Configurações salvas");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof EmpresaForm>(k: K, v: EmpresaForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados da clínica exibidos no sistema</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Dados da empresa</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Razão social" required>
              <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required />
            </Field>
            <Field label="Nome fantasia">
              <Input value={form.nome_fantasia} onChange={(e) => set("nome_fantasia", e.target.value)} />
            </Field>
            <Field label="CNPJ">
              <Input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} />
            </Field>
            <Field label="Telefone">
              <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
            </Field>
            <Field label="E-mail">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} id="ativo" />
              <Label htmlFor="ativo">Empresa ativa</Label>
            </div>
            <Field label="Endereço" className="sm:col-span-2">
              <Textarea rows={2} value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Identidade visual</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <ImageUploadField
              label="Logo da clínica"
              folder="logo"
              value={form.logo_url}
              onChange={(v) => set("logo_url", v)}
              previewClassName="h-24 w-24 object-contain bg-white"
            />
            <ImageUploadField
              label="Banner da página inicial"
              folder="banner"
              value={form.banner_url}
              onChange={(v) => set("banner_url", v)}
              previewClassName="w-full h-32 object-cover"
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cor primária">
                <Input type="color" value={form.cor_primaria} onChange={(e) => set("cor_primaria", e.target.value)} />
              </Field>
              <Field label="Cor secundária">
                <Input type="color" value={form.cor_secundaria} onChange={(e) => set("cor_secundaria", e.target.value)} />
              </Field>
            </div>
          </CardContent>
        </Card>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cor primária">
                <Input type="color" value={form.cor_primaria} onChange={(e) => set("cor_primaria", e.target.value)} />
              </Field>
              <Field label="Cor secundária">
                <Input type="color" value={form.cor_secundaria} onChange={(e) => set("cor_secundaria", e.target.value)} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 flex justify-end">
          <Button type="submit" disabled={save.isPending || isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {save.isPending ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, required, className }: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium">{label}{required && <span className="text-destructive"> *</span>}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
