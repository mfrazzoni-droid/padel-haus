-- Mensajes entre jugadoras
-- Pegá este script en SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS mensajes (
  id SERIAL PRIMARY KEY,
  remitente_id UUID REFERENCES usuarios(id),
  destinatario_id UUID REFERENCES usuarios(id),
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensajes_select_own" ON mensajes;
CREATE POLICY "mensajes_select_own"
  ON mensajes FOR SELECT
  TO authenticated
  USING (
    remitente_id IN (SELECT id FROM usuarios WHERE email = auth.email())
    OR destinatario_id IN (SELECT id FROM usuarios WHERE email = auth.email())
  );

DROP POLICY IF EXISTS "mensajes_insert_own" ON mensajes;
CREATE POLICY "mensajes_insert_own"
  ON mensajes FOR INSERT
  TO authenticated
  WITH CHECK (
    remitente_id IN (SELECT id FROM usuarios WHERE email = auth.email())
  );

DROP POLICY IF EXISTS "mensajes_update_leido" ON mensajes;
CREATE POLICY "mensajes_update_leido"
  ON mensajes FOR UPDATE
  TO authenticated
  USING (
    destinatario_id IN (SELECT id FROM usuarios WHERE email = auth.email())
  )
  WITH CHECK (
    destinatario_id IN (SELECT id FROM usuarios WHERE email = auth.email())
  );

GRANT SELECT, INSERT, UPDATE ON TABLE mensajes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE mensajes_id_seq TO authenticated;
