-- Solo las administradoras pueden crear, editar y borrar ligas
DROP POLICY IF EXISTS "ligas_insert_admin" ON ligas;
CREATE POLICY "ligas_insert_admin"
  ON ligas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE email = auth.email() AND rol = 'admin'
    )
  );

DROP POLICY IF EXISTS "ligas_update_admin" ON ligas;
CREATE POLICY "ligas_update_admin"
  ON ligas FOR UPDATE
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

DROP POLICY IF EXISTS "ligas_delete_admin" ON ligas;
CREATE POLICY "ligas_delete_admin"
  ON ligas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE email = auth.email() AND rol = 'admin'
    )
  );

GRANT INSERT, UPDATE, DELETE ON TABLE ligas TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ligas_id_seq TO authenticated;
