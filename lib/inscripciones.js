import { supabase } from "@/lib/supabaseClient";

export async function getUsuarioPerfil(user) {
  const { data: existing, error: lookupError } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existing?.id) {
    return existing.id;
  }

  const nombre =
    user.user_metadata?.nombre || user.email?.split("@")[0] || "Jugadora";

  const { data: created, error: insertError } = await supabase
    .from("usuarios")
    .insert({
      id: user.id,
      email: user.email,
      nombre,
      rol: "user",
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return created.id;
}

export async function inscribirEnLiga(ligaId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, requiereLogin: true };
  }

  const usuarioId = await getUsuarioPerfil(user);

  const { error } = await supabase.from("inscripciones").insert({
    liga_id: ligaId,
    usuario_id: usuarioId,
    fecha_inscripcion: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, yaInscripta: true };
    }
    throw error;
  }

  return { ok: true, usuarioId };
}
