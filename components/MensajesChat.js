"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPerfilActual } from "@/lib/perfil";
import { fetchJugadoras } from "@/lib/partidos";
import {
  enviarMensaje,
  fetchMensajes,
  marcarConversacionLeida,
  nombreUsuario,
} from "@/lib/mensajes";

function formatHora(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MensajesChat() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [jugadoras, setJugadoras] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [activaId, setActivaId] = useState(null);
  const [contenido, setContenido] = useState("");
  const [destinatarioNuevo, setDestinatarioNuevo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const usuarioId = perfil?.id;

  const bandeja = useMemo(() => {
    if (!usuarioId) return [];
    const porRemitente = new Map();

    for (const mensaje of mensajes) {
      if (mensaje.destinatario_id !== usuarioId) continue;
      const actual = porRemitente.get(mensaje.remitente_id);
      if (!actual || actual.created_at < mensaje.created_at) {
        porRemitente.set(mensaje.remitente_id, mensaje);
      }
    }

    return [...porRemitente.values()].sort((a, b) =>
      String(b.created_at).localeCompare(String(a.created_at)),
    );
  }, [mensajes, usuarioId]);

  const noLeidosPorRemitente = useMemo(() => {
    const counts = new Map();
    if (!usuarioId) return counts;
    for (const mensaje of mensajes) {
      if (mensaje.destinatario_id !== usuarioId || mensaje.leido) continue;
      counts.set(
        mensaje.remitente_id,
        (counts.get(mensaje.remitente_id) || 0) + 1,
      );
    }
    return counts;
  }, [mensajes, usuarioId]);

  const hilo = useMemo(() => {
    if (!usuarioId || !activaId) return [];
    return mensajes.filter(
      (mensaje) =>
        (mensaje.remitente_id === usuarioId &&
          mensaje.destinatario_id === activaId) ||
        (mensaje.remitente_id === activaId &&
          mensaje.destinatario_id === usuarioId),
    );
  }, [mensajes, usuarioId, activaId]);

  const destinatarias = useMemo(
    () => jugadoras.filter((j) => j.id !== usuarioId),
    [jugadoras, usuarioId],
  );

  const contactoActivo = destinatarias.find((j) => j.id === activaId);

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      setLoading(true);
      setError("");
      try {
        const sesion = await getPerfilActual();
        if (!sesion) {
          router.push("/login?next=/mensajes");
          return;
        }
        const [listaMensajes, listaJugadoras] = await Promise.all([
          fetchMensajes(sesion.perfil.id),
          fetchJugadoras(),
        ]);
        if (cancelled) return;
        setPerfil(sesion.perfil);
        setMensajes(listaMensajes);
        setJugadoras(listaJugadoras);
      } catch (err) {
        if (!cancelled) {
          const text = err?.message || "No se pudieron cargar los mensajes.";
          setError(
            text.includes("Could not find the table")
              ? "Falta la tabla mensajes. Ejecuta supabase/mensajes.sql en Supabase."
              : text,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    cargar();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function abrirConversacion(remitenteId) {
    setActivaId(remitenteId);
    setError("");
    if (!usuarioId) return;
    try {
      await marcarConversacionLeida(usuarioId, remitenteId);
      setMensajes((prev) =>
        prev.map((mensaje) =>
          mensaje.destinatario_id === usuarioId &&
          mensaje.remitente_id === remitenteId
            ? { ...mensaje, leido: true }
            : mensaje,
        ),
      );
    } catch (err) {
      setError(err?.message || "No se pudieron marcar como leídos.");
    }
  }

  async function onEnviar(event) {
    event.preventDefault();
    const destinatarioId = activaId || destinatarioNuevo;
    if (!usuarioId || !destinatarioId) return;
    setSaving(true);
    setError("");
    try {
      const creado = await enviarMensaje({
        remitenteId: usuarioId,
        destinatarioId,
        contenido,
      });
      setMensajes((prev) => [...prev, creado]);
      setContenido("");
      setActivaId(destinatarioId);
      setDestinatarioNuevo("");
    } catch (err) {
      setError(err?.message || "No se pudo enviar el mensaje.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-zinc-400">Cargando mensajes…</p>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid min-h-[32rem] overflow-hidden rounded-2xl border border-white/10 lg:grid-cols-[18rem_1fr]">
        <aside className="border-b border-white/10 bg-white/5 lg:border-b-0 lg:border-r">
          <div className="border-b border-white/10 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Recibidos
          </div>
          {bandeja.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500">
              Todavía no tienes mensajes recibidos.
            </p>
          ) : (
            <ul>
              {bandeja.map((mensaje) => {
                const noLeidos = noLeidosPorRemitente.get(mensaje.remitente_id) || 0;
                const activa = activaId === mensaje.remitente_id;
                return (
                  <li key={mensaje.remitente_id}>
                    <button
                      type="button"
                      onClick={() => abrirConversacion(mensaje.remitente_id)}
                      className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-white/10 ${
                        activa ? "bg-white/10" : ""
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-medium">
                          {nombreUsuario(mensaje.remitente)}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-xs text-zinc-400">
                          {mensaje.contenido}
                        </span>
                      </span>
                      {noLeidos > 0 ? (
                        <span className="mt-0.5 rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-semibold text-[#0f1a14]">
                          {noLeidos}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="flex min-h-[24rem] flex-col bg-[#0c1511]">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-medium">
              {contactoActivo
                ? nombreUsuario(contactoActivo)
                : "Nuevo mensaje"}
            </p>
            <p className="text-xs text-zinc-500">
              {contactoActivo
                ? "Conversación"
                : "Elige destinataria y escribe el contenido"}
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {activaId && hilo.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No hay mensajes todavía. Escribe el primero.
              </p>
            ) : null}
            {hilo.map((mensaje) => {
              const propio = mensaje.remitente_id === usuarioId;
              return (
                <div
                  key={mensaje.id}
                  className={`flex ${propio ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      propio
                        ? "bg-emerald-400 text-[#0f1a14]"
                        : "bg-white/10 text-zinc-100"
                    }`}
                  >
                    <p>{mensaje.contenido}</p>
                    <p
                      className={`mt-1 text-[11px] ${
                        propio ? "text-[#0f1a14]/70" : "text-zinc-500"
                      }`}
                    >
                      {formatHora(mensaje.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={onEnviar}
            className="space-y-3 border-t border-white/10 p-4"
          >
            {!activaId ? (
              <label className="block text-sm">
                Destinataria
                <select
                  required
                  value={destinatarioNuevo}
                  onChange={(event) => setDestinatarioNuevo(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
                >
                  <option value="">Elige una jugadora</option>
                  {destinatarias.map((j) => (
                    <option key={j.id} value={j.id}>
                      {nombreUsuario(j)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="flex gap-2">
              <input
                required
                value={contenido}
                onChange={(event) => setContenido(event.target.value)}
                placeholder="Escribe un mensaje…"
                className="h-11 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                disabled={saving}
                className="h-11 rounded-full bg-emerald-400 px-5 text-sm font-semibold text-[#0f1a14] hover:bg-emerald-300 disabled:opacity-60"
              >
                Manda
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
