import { supabase } from "@/lib/supabaseClient";

const MENSAJE_SELECT = `
  id,
  remitente_id,
  destinatario_id,
  contenido,
  leido,
  created_at,
  remitente:usuarios!remitente_id (id, nombre, email),
  destinatario:usuarios!destinatario_id (id, nombre, email)
`;

export function nombreUsuario(usuario) {
  return usuario?.nombre || usuario?.email || "Jugadora";
}

export async function fetchMensajes(usuarioId) {
  const { data, error } = await supabase
    .from("mensajes")
    .select(MENSAJE_SELECT)
    .or(`remitente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function enviarMensaje({ remitenteId, destinatarioId, contenido }) {
  const texto = contenido.trim();
  if (!texto) {
    throw new Error("Escribe un mensaje.");
  }
  if (remitenteId === destinatarioId) {
    throw new Error("Elige otra destinataria.");
  }

  const { data, error } = await supabase
    .from("mensajes")
    .insert({
      remitente_id: remitenteId,
      destinatario_id: destinatarioId,
      contenido: texto,
      leido: false,
    })
    .select(MENSAJE_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function marcarConversacionLeida(usuarioId, remitenteId) {
  const { error } = await supabase
    .from("mensajes")
    .update({ leido: true })
    .eq("destinatario_id", usuarioId)
    .eq("remitente_id", remitenteId)
    .eq("leido", false);

  if (error) throw error;
}
