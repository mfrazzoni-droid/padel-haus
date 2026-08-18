-- Perfil: bio, foto y permisos de edición
-- Pegá este script en SQL Editor de Supabase

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT;

DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;
CREATE POLICY "usuarios_update_own"
  ON usuarios FOR UPDATE
  TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

GRANT UPDATE ON TABLE usuarios TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('perfiles', 'perfiles', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "perfiles_public_read" ON storage.objects;
CREATE POLICY "perfiles_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'perfiles');

DROP POLICY IF EXISTS "perfiles_auth_insert" ON storage.objects;
CREATE POLICY "perfiles_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'perfiles');

DROP POLICY IF EXISTS "perfiles_auth_update" ON storage.objects;
CREATE POLICY "perfiles_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'perfiles')
  WITH CHECK (bucket_id = 'perfiles');
