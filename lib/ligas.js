import { supabase } from "@/lib/supabaseClient";

const LIGA_SELECT = "id, nombre, club, categoria, fecha_inicio, fecha_fin, estado";

export function ligaActiva(liga) {
  return (liga.estado || "activa") === "activa";
}

const ORDEN_HOME = { activa: 0, borrador: 1, finalizada: 2 };

function fechaOrdenHome(liga) {
  if ((liga.estado || "activa") === "finalizada") {
    return liga.fecha_fin || liga.fecha_inicio || liga.fecha_orden || "";
  }
  return liga.fecha_inicio || liga.fecha_orden || "";
}

export function ordenarLigasHome(lista) {
  return [...lista].sort((a, b) => {
    const ea = ORDEN_HOME[a.estado || "activa"] ?? 9;
    const eb = ORDEN_HOME[b.estado || "activa"] ?? 9;
    if (ea !== eb) return ea - eb;
    return String(fechaOrdenHome(b)).localeCompare(String(fechaOrdenHome(a)));
  });
}

export async function fetchLigasHome(esAdmin = false) {
  const estados = esAdmin
    ? ["activa", "borrador", "finalizada"]
    : ["activa", "finalizada"];

  const { data, error } = await supabase
    .from("ligas_ordenadas")
    .select(LIGA_SELECT)
    .in("estado", estados)
    .order("orden_grupo", { ascending: true })
    .order("fecha_orden", { ascending: false });

  if (error) throw error;
  return ordenarLigasHome(data ?? []);
}

export async function fetchLigasActivas() {
  const { data, error } = await supabase
    .from("ligas")
    .select(LIGA_SELECT)
    .eq("estado", "activa")
    .order("fecha_inicio", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTodasLasLigas() {
  const { data, error } = await supabase
    .from("ligas")
    .select(LIGA_SELECT)
    .order("fecha_inicio", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function crearLiga({
  nombre,
  club,
  categoria,
  fechaInicio,
  fechaFin,
  estado = "borrador",
}) {
  const { data, error } = await supabase
    .from("ligas")
    .insert({
      nombre: nombre.trim(),
      club: club.trim(),
      categoria: categoria.trim(),
      fecha_inicio: fechaInicio || null,
      fecha_fin: fechaFin || null,
      estado,
    })
    .select(LIGA_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function actualizarLiga(id, { nombre, club, categoria, fechaInicio, fechaFin, estado }) {
  const payload = {
    nombre: nombre.trim(),
    club: club.trim(),
    categoria: categoria.trim(),
    fecha_inicio: fechaInicio || null,
    fecha_fin: fechaFin || null,
  };
  if (estado) payload.estado = estado;

  const { data, error } = await supabase
    .from("ligas")
    .update(payload)
    .eq("id", id)
    .select(LIGA_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function cambiarEstadoLiga(id, estado) {
  const { data, error } = await supabase
    .from("ligas")
    .update({ estado })
    .eq("id", id)
    .select(LIGA_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function borrarLiga(id) {
  const { error } = await supabase.from("ligas").delete().eq("id", id);
  if (error) throw error;
}
