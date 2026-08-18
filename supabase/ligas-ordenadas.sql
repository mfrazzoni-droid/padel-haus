-- Vista para la home: ligas agrupadas y con fecha reciente primero.
-- security_invoker: aplica las políticas RLS de la tabla ligas
-- (público: activa + finalizada; admin: también borrador).

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
