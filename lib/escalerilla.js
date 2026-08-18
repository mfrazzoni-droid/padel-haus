import { supabase } from "@/lib/supabaseClient";

const PAREJA_SELECT = `
  id,
  categoria,
  ranking_posicion,
  jugadora1_id,
  jugadora2_id,
  jugadora1:usuarios!jugadora1_id (id, nombre, email),
  jugadora2:usuarios!jugadora2_id (id, nombre, email)
`;

const DESAFIO_SELECT = `
  id,
  fecha,
  resultado,
  estado,
  pareja_retadora_id,
  pareja_desafiada_id,
  retadora:parejas!pareja_retadora_id (
    id,
    categoria,
    ranking_posicion,
    jugadora1:usuarios!jugadora1_id (id, nombre),
    jugadora2:usuarios!jugadora2_id (id, nombre)
  ),
  desafiada:parejas!pareja_desafiada_id (
    id,
    categoria,
    ranking_posicion,
    jugadora1:usuarios!jugadora1_id (id, nombre),
    jugadora2:usuarios!jugadora2_id (id, nombre)
  )
`;

export function nombrePareja(pareja) {
  if (!pareja) return "Pareja";
  const a = pareja.jugadora1?.nombre || "Jugadora";
  const b = pareja.jugadora2?.nombre || "Jugadora";
  return `${a} / ${b}`;
}

export function nombreJugadora(jugadora) {
  return jugadora?.nombre || jugadora?.email || "Jugadora";
}

export async function fetchParejas() {
  const { data, error } = await supabase
    .from("parejas")
    .select(PAREJA_SELECT)
    .order("ranking_posicion", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchDesafios() {
  const { data, error } = await supabase
    .from("desafios")
    .select(DESAFIO_SELECT)
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function crearPareja({ jugadora1Id, jugadora2Id, categoria }) {
  if (jugadora1Id === jugadora2Id) {
    throw new Error("Elige dos jugadoras distintas.");
  }

  const { data: ultima, error: rankError } = await supabase
    .from("parejas")
    .select("ranking_posicion")
    .eq("categoria", categoria)
    .order("ranking_posicion", { ascending: false })
    .limit(1);

  if (rankError) throw rankError;

  const ranking_posicion = (ultima?.[0]?.ranking_posicion || 0) + 1;

  const { data, error } = await supabase
    .from("parejas")
    .insert({
      jugadora1_id: jugadora1Id,
      jugadora2_id: jugadora2Id,
      categoria,
      ranking_posicion,
    })
    .select(PAREJA_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function crearDesafio({ parejaRetadoraId, parejaDesafiadaId }) {
  if (Number(parejaRetadoraId) === Number(parejaDesafiadaId)) {
    throw new Error("El desafío tiene que ser entre dos parejas distintas.");
  }

  const hoy = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("desafios")
    .insert({
      pareja_retadora_id: Number(parejaRetadoraId),
      pareja_desafiada_id: Number(parejaDesafiadaId),
      fecha: hoy,
      estado: "pendiente",
      resultado: null,
    })
    .select(DESAFIO_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function registrarResultadoDesafio(desafioId, ganador) {
  const { data, error } = await supabase
    .from("desafios")
    .update({ resultado: ganador })
    .eq("id", desafioId)
    .select(DESAFIO_SELECT)
    .single();

  if (error) throw error;
  return data;
}
