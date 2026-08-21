-- Padel Haus — schema inicial
-- Copia y pega este script en el SQL Editor de Supabase (Dashboard → SQL Editor → New query)

-- Usuarios (jugadoras y administradoras)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  rol VARCHAR(20) DEFAULT 'jugadora', -- jugadora o admin
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Ligas
CREATE TABLE IF NOT EXISTS ligas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  club VARCHAR(100),
  categoria VARCHAR(50),
  fecha_inicio DATE,
  fecha_fin DATE,
  estado VARCHAR(20) DEFAULT 'activa'
);

ALTER TABLE ligas ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activa';

-- Partidos
CREATE TABLE IF NOT EXISTS partidos (
  id SERIAL PRIMARY KEY,
  liga_id INT REFERENCES ligas(id),
  fecha DATE,
  jugadora1_id UUID REFERENCES usuarios(id),
  jugadora2_id UUID REFERENCES usuarios(id),
  resultado VARCHAR(20)
);

-- Inscripciones a ligas
CREATE TABLE IF NOT EXISTS inscripciones (
  id SERIAL PRIMARY KEY,
  liga_id INT REFERENCES ligas(id),
  usuario_id UUID REFERENCES usuarios(id),
  fecha_inscripcion TIMESTAMP DEFAULT NOW(),
  UNIQUE (liga_id, usuario_id)
);

-- Lectura pública de ligas e inscripción autenticada
ALTER TABLE ligas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "usuarios_select_own" ON usuarios;
CREATE POLICY "usuarios_select_own"
  ON usuarios FOR SELECT
  TO authenticated
  USING (email = auth.email());

DROP POLICY IF EXISTS "usuarios_insert_own" ON usuarios;
CREATE POLICY "usuarios_insert_own"
  ON usuarios FOR INSERT
  TO authenticated
  WITH CHECK (email = auth.email());

DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;
CREATE POLICY "usuarios_update_own"
  ON usuarios FOR UPDATE
  TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

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

GRANT SELECT ON TABLE ligas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE ligas TO authenticated;
GRANT SELECT ON TABLE usuarios TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE usuarios TO authenticated;
GRANT SELECT, INSERT ON TABLE inscripciones TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE ligas_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE inscripciones_id_seq TO authenticated;

DROP VIEW IF EXISTS ligas_ordenadas;
CREATE VIEW ligas_ordenadas
WITH (security_invoker = true) AS
SELECT
  id,
  nombre,
  club,
  categoria,
  fecha_inicio,
  fecha_fin,
  estado,
  CASE estado
    WHEN 'activa' THEN 1
    WHEN 'borrador' THEN 2
    WHEN 'finalizada' THEN 3
    ELSE 4
  END AS orden_grupo,
  CASE
    WHEN estado = 'finalizada' THEN COALESCE(fecha_fin, fecha_inicio)
    ELSE fecha_inicio
  END AS fecha_orden
FROM ligas;

GRANT SELECT ON ligas_ordenadas TO anon, authenticated;

-- Calendario: lectura pública de partidos y nombres
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

-- Escalerilla (ranking dinámico)
CREATE TABLE IF NOT EXISTS parejas (
  id SERIAL PRIMARY KEY,
  jugadora1_id UUID REFERENCES usuarios(id),
  jugadora2_id UUID REFERENCES usuarios(id),
  categoria VARCHAR(50),
  ranking_posicion INT
);

CREATE TABLE IF NOT EXISTS desafios (
  id SERIAL PRIMARY KEY,
  pareja_retadora_id INT REFERENCES parejas(id),
  pareja_desafiada_id INT REFERENCES parejas(id),
  fecha DATE,
  resultado VARCHAR(20)
);

ALTER TABLE desafios
  ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente';

ALTER TABLE parejas ENABLE ROW LEVEL SECURITY;
ALTER TABLE desafios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parejas_select_public" ON parejas;
CREATE POLICY "parejas_select_public"
  ON parejas FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "parejas_insert_auth" ON parejas;
CREATE POLICY "parejas_insert_auth"
  ON parejas FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "parejas_update_auth" ON parejas;
CREATE POLICY "parejas_update_auth"
  ON parejas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "desafios_select_public" ON desafios;
CREATE POLICY "desafios_select_public"
  ON desafios FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "desafios_insert_auth" ON desafios;
CREATE POLICY "desafios_insert_auth"
  ON desafios FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "desafios_update_auth" ON desafios;
DROP POLICY IF EXISTS "desafios_update_admin" ON desafios;
CREATE POLICY "desafios_update_admin"
  ON desafios FOR UPDATE
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

GRANT SELECT ON TABLE parejas TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE parejas TO authenticated;
GRANT SELECT ON TABLE desafios TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE desafios TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE parejas_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE desafios_id_seq TO authenticated;

CREATE OR REPLACE FUNCTION ajustar_ranking_por_desafio()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pos_retadora INT;
  pos_desafiada INT;
BEGIN
  IF NEW.resultado IS NULL OR NEW.resultado IS NOT DISTINCT FROM OLD.resultado THEN
    RETURN NEW;
  END IF;

  NEW.estado := 'finalizado';

  IF NEW.resultado = 'retadora' THEN
    SELECT ranking_posicion INTO pos_retadora
    FROM parejas
    WHERE id = NEW.pareja_retadora_id;

    SELECT ranking_posicion INTO pos_desafiada
    FROM parejas
    WHERE id = NEW.pareja_desafiada_id;

    IF pos_retadora IS NOT NULL
       AND pos_desafiada IS NOT NULL
       AND pos_retadora > pos_desafiada THEN
      UPDATE parejas
      SET ranking_posicion = pos_desafiada
      WHERE id = NEW.pareja_retadora_id;

      UPDATE parejas
      SET ranking_posicion = pos_retadora
      WHERE id = NEW.pareja_desafiada_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_desafios_ajustar_ranking ON desafios;
CREATE TRIGGER trg_desafios_ajustar_ranking
BEFORE UPDATE ON desafios
FOR EACH ROW
EXECUTE FUNCTION ajustar_ranking_por_desafio();

-- Mensajes
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

GRANT SELECT, INSERT, UPDATE ON TABLE mensajes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE mensajes_id_seq TO authenticated;

-- Para gestionar el calendario, marcá un usuario como admin:
-- UPDATE usuarios SET rol = 'admin' WHERE email = 'tu@email.com';

INSERT INTO ligas (nombre, club, categoria, fecha_inicio, fecha_fin)
SELECT * FROM (
  VALUES
    ('Liga Primavera', 'Padel Haus', 'Damas A', DATE '2026-09-07', DATE '2026-11-30'),
    ('Liga Nocturna', 'Club Central', 'Damas B', DATE '2026-09-14', DATE '2026-12-15'),
    ('Copa Apertura', 'Padel Haus', 'Damas C', DATE '2026-10-01', DATE '2026-12-20')
) AS v(nombre, club, categoria, fecha_inicio, fecha_fin)
WHERE NOT EXISTS (SELECT 1 FROM ligas LIMIT 1);
