
-- Enable RLS and grant authenticated access on all clinic tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'agendamentos','anamnese','convenios','dentistas','estoque',
    'estoque_movimentacoes','financeiro','odontograma','pacientes',
    'prontuario_evolucao','tratamentos','usuarios'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format($p$CREATE POLICY "Authenticated full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)$p$, t);
  END LOOP;
END $$;

-- empresas already has RLS on; ensure same access pattern
REVOKE ALL ON public.empresas FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;
DROP POLICY IF EXISTS "Authenticated full access" ON public.empresas;
CREATE POLICY "Authenticated full access" ON public.empresas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Lock down the SECURITY DEFINER helper (event trigger function, not for API use)
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
