-- Permiso para que una admin vea todos los mensajes (contador del dashboard)
DROP POLICY IF EXISTS "mensajes_select_admin" ON mensajes;
CREATE POLICY "mensajes_select_admin"
  ON mensajes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE email = auth.email() AND rol = 'admin'
    )
  );
