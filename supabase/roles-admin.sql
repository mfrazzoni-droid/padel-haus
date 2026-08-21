-- Roles admin | user, promoción de la cuenta dueña y políticas de ligas.
-- Pegá este script en SQL Editor de Supabase.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(20);

UPDATE usuarios SET rol = 'user' WHERE rol IS NULL OR rol = '' OR rol = 'jugadora';

ALTER TABLE usuarios ALTER COLUMN rol SET DEFAULT 'user';

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('admin', 'user'));

-- Cuenta de registro del proyecto
INSERT INTO usuarios (id, email, nombre, rol)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'nombre', split_part(email, '@', 1)),
  'admin'
FROM auth.users
WHERE lower(email) = lower('mfrazzoni@gmail.com')
ON CONFLICT (email) DO UPDATE
SET rol = 'admin';

UPDATE usuarios
SET rol = 'admin'
WHERE lower(email) = lower('mfrazzoni@gmail.com');

-- Un usuario no puede autoasignarse admin
REVOKE UPDATE ON TABLE usuarios FROM authenticated;
GRANT SELECT ON TABLE usuarios TO anon, authenticated;
GRANT INSERT ON TABLE usuarios TO authenticated;
GRANT UPDATE (nombre, bio, foto_url) ON TABLE usuarios TO authenticated;

DROP POLICY IF EXISTS "usuarios_insert_own" ON usuarios;
CREATE POLICY "usuarios_insert_own"
  ON usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    email = auth.email()
    AND rol = 'user'
  );

DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;
CREATE POLICY "usuarios_update_own"
  ON usuarios FOR UPDATE
  TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- Ligas: ver (público activas/finalizadas). Crear/editar/borrar solo admin.
ALTER TABLE ligas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ligas_select_public" ON ligas;
CREATE POLICY "ligas_select_public"
  ON ligas FOR SELECT
  USING (estado IN ('activa', 'finalizada'));

DROP POLICY IF EXISTS "ligas_select_admin" ON ligas;
CREATE POLICY "ligas_select_admin"
  ON ligas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE email = auth.email() AND rol = 'admin'
    )
  );

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

GRANT SELECT ON TABLE ligas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE ligas TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ligas_id_seq TO authenticated;

-- Inscripciones: cualquier cuenta autenticada (admin o user) puede inscribirse
ALTER TABLE inscripciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inscripciones_select_own" ON inscripciones;
CREATE POLICY "inscripciones_select_own"
  ON inscripciones FOR SELECT
  TO authenticated
  USING (
    usuario_id IN (SELECT id FROM usuarios WHERE email = auth.email())
  );

DROP POLICY IF EXISTS "inscripciones_insert_own" ON inscripciones;
CREATE POLICY "inscripciones_insert_own"
  ON inscripciones FOR INSERT
  TO authenticated
  WITH CHECK (
    usuario_id IN (SELECT id FROM usuarios WHERE email = auth.email())
  );

GRANT SELECT, INSERT ON TABLE inscripciones TO authenticated;
