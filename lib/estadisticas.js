import { supabase } from "@/lib/supabaseClient";

function ganadoraDeMarcador(resultado) {
  if (!resultado) return null;
  const sets = String(resultado)
    .trim()
    .split(/\s+/)
    .map((set) => set.match(/^(\d+)\s*-\s*(\d+)$/))
    .filter(Boolean);

  if (sets.length === 0) return null;

  let setsJ1 = 0;
  let setsJ2 = 0;
  for (const match of sets) {
    const a = Number(match[1]);
    const b = Number(match[2]);
    if (a > b) setsJ1 += 1;
    if (b > a) setsJ2 += 1;
  }

  if (setsJ1 === setsJ2) return null;
  return setsJ1 > setsJ2 ? "jugadora1" : "jugadora2";
}

export async function calcularEstadisticas(usuarioId) {
  const stats = {
    jugados: 0,
    ganados: 0,
    perdidos: 0,
  };

  const { data: partidos, error: partidosError } = await supabase
    .from("partidos")
    .select("jugadora1_id, jugadora2_id, resultado")
    .or(`jugadora1_id.eq.${usuarioId},jugadora2_id.eq.${usuarioId}`);

  if (partidosError && !partidosError.message.includes("Could not find the table")) {
    throw partidosError;
  }

  for (const partido of partidos ?? []) {
    if (!partido.resultado) continue;
    stats.jugados += 1;
    const lado = ganadoraDeMarcador(partido.resultado);
    if (!lado) continue;
    const gano =
      (lado === "jugadora1" && partido.jugadora1_id === usuarioId) ||
      (lado === "jugadora2" && partido.jugadora2_id === usuarioId);
    if (gano) stats.ganados += 1;
    else stats.perdidos += 1;
  }

  const { data: parejas } = await supabase
    .from("parejas")
    .select("id")
    .or(`jugadora1_id.eq.${usuarioId},jugadora2_id.eq.${usuarioId}`);

  const parejaIds = (parejas ?? []).map((p) => p.id);
  if (parejaIds.length > 0) {
    const { data: desafios } = await supabase
      .from("desafios")
      .select("pareja_retadora_id, pareja_desafiada_id, resultado")
      .or(
        `pareja_retadora_id.in.(${parejaIds.join(",")}),pareja_desafiada_id.in.(${parejaIds.join(",")})`,
      )
      .not("resultado", "is", null);

    for (const desafio of desafios ?? []) {
      stats.jugados += 1;
      const esRetadora = parejaIds.includes(desafio.pareja_retadora_id);
      const gano =
        (esRetadora && desafio.resultado === "retadora") ||
        (!esRetadora && desafio.resultado === "desafiada");
      if (gano) stats.ganados += 1;
      else stats.perdidos += 1;
    }
  }

  return stats;
}
