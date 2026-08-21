-- Lectura pública para la home, historial y escalerilla.
-- Pegá este script en SQL Editor de Supabase (Dashboard → SQL Editor).

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON TABLE ligas TO anon, authenticated;
GRANT SELECT ON TABLE partidos TO anon, authenticated;
GRANT SELECT ON TABLE usuarios TO anon, authenticated;
GRANT SELECT ON TABLE parejas TO anon, authenticated;
GRANT SELECT ON TABLE desafios TO anon, authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'ligas_ordenadas'
  ) THEN
    EXECUTE 'GRANT SELECT ON ligas_ordenadas TO anon, authenticated';
  END IF;
END $$;
