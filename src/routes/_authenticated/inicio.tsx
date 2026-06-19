import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImageOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/inicio")({
  component: InicioPage,
});

function InicioPage() {
  const { data: empresa } = useQuery({
    queryKey: ["empresa-banner"],
    queryFn: async () => {
      const { data } = await supabase
        .from("empresas")
        .select("nome, nome_fantasia, banner_url")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  return (
    <div className="space-y-6">
      {empresa?.banner_url ? (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <img
            src={empresa.banner_url}
            alt={empresa.nome_fantasia || empresa.nome || "Banner da clínica"}
            className="w-full h-auto max-h-[520px] object-cover"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card py-24 text-center">
          <ImageOff className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhum banner cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Adicione um banner na página de Configurações para exibi-lo aqui.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
