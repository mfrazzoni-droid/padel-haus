-- Escalerilla: tablas, estado pendiente y trigger de ranking
-- Pegá este script en SQL Editor de Supabase

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

UPDATE desafios
SET estado = 'pendiente'
WHERE estado IS NULL;

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

-- Si la retadora gana a una pareja mejor rankeada, intercambian el puesto.
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
