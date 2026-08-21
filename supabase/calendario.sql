-- Políticas para el calendario (si ya corriste el schema inicial)
-- Pegá este bloque en SQL Editor de Supabase

ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partidos_select_public" ON partidos;
CREATE POLICY "partidos_select_public"
  ON partidos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "partidos_insert_admin" ON partidos;
CREATE POLICY "partidos_insert_admin"
  ON partidos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE email = auth.email() AND rol = 'admin'
    )
  );

DROP POLICY IF EXISTS "partidos_update_admin" ON partidos;
CREATE POLICY "partidos_update_admin"
  ON partidos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE email = auth.email() AND rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE email = auth.email() AND rol = 'admin'
    )
  );

DROP POLICY IF EXISTS "usuarios_select_nombres" ON usuarios;
CREATE POLICY "usuarios_select_nombres"
  ON usuarios FOR SELECT
  USING (true);

GRANT SELECT ON TABLE partidos TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE partidos TO authenticated;
GRANT SELECT ON TABLE usuarios TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE partidos_id_seq TO authenticated;

-- Marcá tu usuario como administradora:
-- UPDATE usuarios SET rol = 'admin' WHERE email = 'mfrazzoni@gmail.com';
