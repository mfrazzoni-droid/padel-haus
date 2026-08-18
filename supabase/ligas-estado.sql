-- Estado de ligas: activa | borrador | finalizada
-- Lectura pública: activas e historial (finalizadas). Borrador solo admin.
ALTER TABLE ligas ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activa';

UPDATE ligas SET estado = 'activa' WHERE estado IS NULL OR estado = '';

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
