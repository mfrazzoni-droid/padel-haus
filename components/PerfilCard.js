"use client";

import { useEffect, useMemo, useState } from "react";
import {
  actualizarPerfil,
  fetchPerfilPorId,
  getPerfilActual,
  subirFotoPerfil,
} from "@/lib/perfil";
import { calcularEstadisticas } from "@/lib/estadisticas";

export default function PerfilCard({ usuarioId }) {
  const [perfil, setPerfil] = useState(null);
  const [stats, setStats] = useState({ jugados: 0, ganados: 0, perdidos: 0 });
  const [esPropia, setEsPropia] = useState(false);
  const [editando, setEditando] = useState(false);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const efectividad = useMemo(() => {
    if (!stats.jugados) return 0;
    return Math.round((stats.ganados / stats.jugados) * 100);
  }, [stats]);

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      setLoading(true);
      setError("");
      try {
        const [data, sesion, estadisticas] = await Promise.all([
          fetchPerfilPorId(usuarioId),
          getPerfilActual(),
          calcularEstadisticas(usuarioId),
        ]);
        if (cancelled) return;
        if (!data) {
          setError("No encontramos este perfil.");
          setPerfil(null);
          return;
        }
        setPerfil(data);
        setBio(data.bio || "");
        setStats(estadisticas);
        setEsPropia(sesion?.perfil?.id === usuarioId);
      } catch (err) {
        if (!cancelled) {
          const text = err?.message || "No se pudo cargar el perfil.";
          setError(
            text.includes("column") || text.includes("bio")
              ? "Faltan las columnas de perfil. Ejecuta supabase/perfil.sql en Supabase."
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
  }, [usuarioId]);

  async function onGuardarBio(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMensaje("");
    try {
      const actualizado = await actualizarPerfil(usuarioId, { bio });
      setPerfil(actualizado);
      setEditando(false);
      setMensaje("Bio actualizada.");
    } catch (err) {
      setError(err?.message || "No se pudo guardar la bio.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubirFoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError("");
    setMensaje("");
    try {
      const fotoUrl = await subirFotoPerfil(usuarioId, file);
      const actualizado = await actualizarPerfil(usuarioId, {
        bio: perfil?.bio || "",
        foto_url: fotoUrl,
      });
      setPerfil(actualizado);
      setMensaje("Foto actualizada.");
    } catch (err) {
      setError(
        err?.message?.includes("Bucket") || err?.message?.includes("not found")
          ? "Falta el bucket perfiles. Ejecuta supabase/perfil.sql en Supabase."
          : err?.message || "No se pudo subir la foto.",
      );
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  }

  if (loading) {
    return <p className="text-zinc-400">Cargando perfil…</p>;
  }

  if (!perfil) {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error || "Perfil no encontrado."}
      </p>
    );
  }

  const inicial = (perfil.nombre || perfil.email || "J").slice(0, 1).toUpperCase();

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5">
      <div className="h-28 bg-gradient-to-r from-emerald-500/40 via-emerald-400/20 to-transparent" />

      <div className="px-6 pb-8 sm:px-8">
        <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative">
              {perfil.foto_url ? (
                <img
                  src={perfil.foto_url}
                  alt={perfil.nombre || "Foto de perfil"}
                  className="h-28 w-28 rounded-2xl border-4 border-[#0f1a14] object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-[#0f1a14] bg-emerald-400 text-4xl font-semibold text-[#0f1a14]">
                  {inicial}
                </div>
              )}
              {esPropia ? (
                <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-semibold text-[#0f1a14]">
                  Sube foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onSubirFoto}
                  />
                </label>
              ) : null}
            </div>
            <div className="pb-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
                {perfil.rol === "admin" ? "Admin" : "Jugadora"}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {perfil.nombre || "Jugadora"}
              </h1>
            </div>
          </div>
        </div>

        {mensaje ? (
          <p className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {mensaje}
          </p>
        ) : null}
        {error ? (
          <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <dl className="mt-8 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-black/20 px-4 py-4 text-center">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">
              Jugados
            </dt>
            <dd className="mt-1 text-2xl font-semibold">{stats.jugados}</dd>
          </div>
          <div className="rounded-2xl bg-black/20 px-4 py-4 text-center">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">
              Ganados
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-emerald-300">
              {stats.ganados}
            </dd>
          </div>
          <div className="rounded-2xl bg-black/20 px-4 py-4 text-center">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">
              Perdidos
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-red-300">
              {stats.perdidos}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
            <span>Efectividad</span>
            <span>{efectividad}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${efectividad}%` }}
            />
          </div>
        </div>

        <section className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
              Bio
            </h2>
            {esPropia && !editando ? (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="text-sm text-emerald-300 hover:text-emerald-200"
              >
                Edita
              </button>
            ) : null}
          </div>

          {esPropia && editando ? (
            <form onSubmit={onGuardarBio} className="space-y-3">
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                placeholder="Cuenta tu juego, club o categoría…"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 rounded-full bg-emerald-400 px-4 text-sm font-semibold text-[#0f1a14] hover:bg-emerald-300 disabled:opacity-60"
                >
                  {saving ? "Guardando…" : "Guarda"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditando(false);
                    setBio(perfil.bio || "");
                  }}
                  className="h-10 rounded-full border border-white/10 px-4 text-sm hover:bg-white/10"
                >
                  Cancela
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm leading-6 text-zinc-300">
              {perfil.bio || "Todavía no cargó una bio."}
            </p>
          )}
        </section>
      </div>
    </article>
  );
}
