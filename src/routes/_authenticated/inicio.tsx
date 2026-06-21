import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, ImageOff, MessageCircle, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/inicio")({
  component: InicioPage,
});

const SHORTCUTS = [
  {
    label: "Agendamento Fácil",
    icon: CalendarDays,
    to: "/agenda" as const,
    disabled: false,
  },
  {
    label: "Fale Conosco",
    icon: MessageCircle,
    to: "/inicio" as const,
    disabled: true,
  },
  {
    label: "Seu Prontuário",
    icon: User,
    to: "/pacientes" as const,
    disabled: false,
  },
];

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
        <div className="flex min-h-[70vh] items-center justify-center overflow-hidden rounded-xl border bg-card shadow-sm p-4">
          <img
            src={empresa.banner_url}
            alt={empresa.nome_fantasia || empresa.nome || "Banner da clínica"}
            className="h-auto max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
          />
        </div>
      ) : (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card text-center">
          <ImageOff className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhum banner cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Adicione um banner na página de Configurações para exibi-lo aqui.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SHORTCUTS.map(({ label, icon: Icon, to, disabled }) => {
          const base =
            "flex items-center justify-center gap-3 rounded-xl border bg-card p-5 shadow-sm transition";
          if (disabled) {
            return (
              <div
                key={label}
                className={`${base} cursor-not-allowed opacity-60`}
                title="Em breve"
              >
                <Icon className="h-6 w-6 text-primary" />
                <span className="font-medium">{label}</span>
              </div>
            );
          }
          return (
            <Link
              key={label}
              to={to}
              className={`${base} hover:border-primary hover:shadow-md`}
            >
              <Icon className="h-6 w-6 text-primary" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
