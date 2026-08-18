import { supabase } from "@/lib/supabaseClient";
import { getUsuarioPerfil } from "@/lib/inscripciones";

export async function getPerfilActual() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil, error } = await supabase
    .from("usuarios")
    .select("id, nombre, email, rol")
    .eq("email", user.email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (perfil) {
    return { user, perfil, esAdmin: perfil.rol === "admin" };
  }

  const id = await getUsuarioPerfil(user);
  return {
    user,
    perfil: {
      id,
      nombre: user.user_metadata?.nombre || user.email?.split("@")[0],
      email: user.email,
      rol: "jugadora",
      bio: "",
      foto_url: "",
    },
    esAdmin: false,
  };
}

export async function fetchPerfilPorId(id) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, email, rol, bio, foto_url")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function actualizarPerfil(id, { bio, foto_url }) {
  const payload = { bio };
  if (foto_url !== undefined) {
    payload.foto_url = foto_url;
  }

  const { data, error } = await supabase
    .from("usuarios")
    .update(payload)
    .eq("id", id)
    .select("id, nombre, email, rol, bio, foto_url")
    .single();

  if (error) throw error;
  return data;
}

export async function subirFotoPerfil(usuarioId, file) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${usuarioId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("perfiles")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("perfiles").getPublicUrl(path);
  return data.publicUrl;
}
