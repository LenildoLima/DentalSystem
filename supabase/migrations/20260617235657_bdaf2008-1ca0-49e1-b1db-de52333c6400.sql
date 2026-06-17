-- Disable RLS for now (per user request) and grant access to authenticated role
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'pacientes','dentistas','agendamentos','prontuario_evolucao','anamnese',
    'odontograma','tratamentos','financeiro','convenios','estoque',
    'estoque_movimentacoes','usuarios'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;