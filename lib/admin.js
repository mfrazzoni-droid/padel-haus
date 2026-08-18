import { supabase } from "@/lib/supabaseClient";

async function contar(table, aplicar) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (aplicar) {
    query = aplicar(query);
  }
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

export async function fetchResumenAdmin() {
  const hoy = new Date().toISOString().slice(0, 10);

  const [ligasActivas, partidosProgramados, parejas, desafiosPendientes, mensajesNoLeidos] =
    await Promise.all([
      contar("ligas", (query) => query.eq("estado", "activa")),
      contar("partidos", (query) => query.gte("fecha", hoy)),
      contar("parejas"),
      contar("desafios", (query) =>
        query.or("estado.eq.pendiente,and(estado.is.null,resultado.is.null)"),
      ),
      contar("mensajes", (query) => query.eq("leido", false)),
    ]);

  return {
    ligasActivas,
    partidosProgramados,
    parejas,
    desafiosPendientes,
    mensajesNoLeidos,
  };
}
