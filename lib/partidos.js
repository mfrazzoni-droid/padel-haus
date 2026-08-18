import { supabase } from "@/lib/supabaseClient";

const PARTIDOS_SELECT = `
  id,
  fecha,
  resultado,
  liga_id,
  liga:ligas (id, nombre),
  jugadora1:usuarios!jugadora1_id (id, nombre),
  jugadora2:usuarios!jugadora2_id (id, nombre)
`;

export async function fetchPartidos() {
  const { data, error } = await supabase
    .from("partidos")
    .select(PARTIDOS_SELECT)
    .order("fecha", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchLigas() {
  const { data, error } = await supabase
    .from("ligas")
    .select("id, nombre")
    .order("nombre");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchJugadoras() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, email")
    .order("nombre");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function crearPartido({ ligaId, jugadora1Id, jugadora2Id, fecha }) {
  if (jugadora1Id === jugadora2Id) {
    throw new Error("Elige dos jugadoras distintas.");
  }

  const { data, error } = await supabase
    .from("partidos")
    .insert({
      liga_id: Number(ligaId),
      jugadora1_id: jugadora1Id,
      jugadora2_id: jugadora2Id,
      fecha,
      resultado: null,
    })
    .select(PARTIDOS_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function actualizarResultado(partidoId, resultado) {
  const valor = resultado.trim() || null;

  const { data, error } = await supabase
    .from("partidos")
    .update({ resultado: valor })
    .eq("id", partidoId)
    .select(PARTIDOS_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
