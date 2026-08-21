"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getPerfilActual } from "@/lib/perfil";
import { getUsuarioPerfil, inscribirEnLiga } from "@/lib/inscripciones";
import {
  actualizarLiga,
  borrarLiga,
  cambiarEstadoLiga,
  crearLiga,
  fetchLigasActivas,
  fetchTodasLasLigas,
} from "@/lib/ligas";

function estadoBadge(estado) {
  const valor = estado || "activa";
  if (valor === "borrador") {
    return {
      texto: "Borrador",
      clase: "bg-yellow-300 text-[#10210f]",
    };
  }
  if (valor === "finalizada") {
    return {
      texto: "Finalizada",
      clase: "bg-red-500 text-white",
    };
  }
  return {
    texto: "Activa",
    clase: "bg-emerald-400 text-[#10210f]",
  };
}

function formatFecha(value) {
  if (!value) return "A confirmar";
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formDesdeLiga(liga) {
  return {
    nombre: liga?.nombre || "",
    club: liga?.club || "",
    categoria: liga?.categoria || "",
    fechaInicio: liga?.fecha_inicio || "",
    fechaFin: liga?.fecha_fin || "",
  };
}

function LigaForm({ titulo, form, setForm, onSubmit, onCancel, saving, submitLabel }) {
  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2"
    >
      <h2 className="text-lg font-semibold sm:col-span-2">{titulo}</h2>
      <label className="block text-sm">
        Nombre
        <input
          required
          value={form.nombre}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, nombre: event.target.value }))
          }
          className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
        />
      </label>
      <label className="block text-sm">
        Club
        <input
          required
          value={form.club}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, club: event.target.value }))
          }
          className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
        />
      </label>
      <label className="block text-sm">
        Categoría
        <input
          required
          value={form.categoria}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, categoria: event.target.value }))
          }
          className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Inicio
          <input
            type="date"
            value={form.fechaInicio}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, fechaInicio: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
          />
        </label>
        <label className="block text-sm">
          Fin
          <input
            type="date"
            value={form.fechaFin}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, fechaFin: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="h-11 rounded-full bg-emerald-400 px-5 text-sm font-semibold text-[#0f1a14] hover:bg-emerald-300 disabled:opacity-60"
        >
          {saving ? "Guardando…" : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-full border border-white/10 px-5 text-sm hover:bg-white/10"
          >
            Cancela
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default function LigasList() {
  const router = useRouter();
  const [ligas, setLigas] = useState([]);
  const [inscriptas, setInscriptas] = useState(new Set());
  const [esAdmin, setEsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formNueva, setFormNueva] = useState(formDesdeLiga());
  const [formEditar, setFormEditar] = useState(formDesdeLiga());

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      setLoading(true);
      setError("");
      try {
        const sesion = await getPerfilActual();
        const admin = Boolean(sesion?.esAdmin);
        const lista = admin
          ? await fetchTodasLasLigas()
          : await fetchLigasActivas();
        if (cancelled) return;
        setLigas(lista);
        setEsAdmin(admin);

        if (sesion) {
          const usuarioId = await getUsuarioPerfil(sesion.user);
          const { data: rows } = await supabase
            .from("inscripciones")
            .select("liga_id")
            .eq("usuario_id", usuarioId);
          if (!cancelled && rows) {
            setInscriptas(new Set(rows.map((row) => row.liga_id)));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message?.includes("permission denied") ||
              err?.message?.includes("42501")
              ? "Faltan permisos de lectura pública. Ejecuta supabase/grants-public.sql en Supabase."
              : err?.message?.includes("Could not find the table")
                ? "La tabla ligas todavía no existe. Ejecuta supabase/schema.sql en Supabase."
                : err?.message?.includes("estado") || err?.message?.includes("column")
                  ? "Falta la columna estado. Ejecuta supabase/ligas-estado.sql en Supabase."
                  : err?.message || "No se pudieron cargar las ligas.",
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
  }, []);

  async function onInscribirse(ligaId) {
    setMensaje("");
    setError("");
    setPendingId(ligaId);
    try {
      const result = await inscribirEnLiga(ligaId);
      if (result.requiereLogin) {
        router.push(`/login?next=/ligas&inscribir=${ligaId}`);
        return;
      }
      setInscriptas((prev) => new Set(prev).add(ligaId));
      setMensaje(
        result.yaInscripta
          ? "Ya estás inscrita en esta liga."
          : "Inscripción confirmada.",
      );
    } catch (err) {
      setError(err?.message || "No se pudo completar la inscripción.");
    } finally {
      setPendingId(null);
    }
  }

  async function onCrear(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMensaje("");
    try {
      const creada = await crearLiga(formNueva);
      setLigas((prev) => [...prev, creada]);
      setFormNueva(formDesdeLiga());
      setMostrarNueva(false);
      setMensaje("Liga creada.");
    } catch (err) {
      setError(err?.message || "No se pudo crear la liga.");
    } finally {
      setSaving(false);
    }
  }

  async function onActualizar(event) {
    event.preventDefault();
    if (!editandoId) return;
    setSaving(true);
    setError("");
    setMensaje("");
    try {
      const actualizada = await actualizarLiga(editandoId, formEditar);
      setLigas((prev) =>
        prev.map((liga) => (liga.id === actualizada.id ? actualizada : liga)),
      );
      setEditandoId(null);
      setMensaje("Liga actualizada.");
    } catch (err) {
      setError(err?.message || "No se pudo actualizar la liga.");
    } finally {
      setSaving(false);
    }
  }

  async function onBorrar(liga) {
    const ok = window.confirm(`¿Eliminas la liga "${liga.nombre}"?`);
    if (!ok) return;
    setError("");
    setMensaje("");
    try {
      await borrarLiga(liga.id);
      setLigas((prev) => prev.filter((item) => item.id !== liga.id));
      if (editandoId === liga.id) setEditandoId(null);
      setMensaje("Liga eliminada.");
    } catch (err) {
      setError(
        err?.message?.includes("foreign key")
          ? "No se puede borrar: la liga tiene partidos o inscripciones asociadas."
          : err?.message || "No se pudo borrar la liga.",
      );
    }
  }

  async function onCambiarEstado(liga, estado) {
    setError("");
    setMensaje("");
    try {
      const actualizada = await cambiarEstadoLiga(liga.id, estado);
      setLigas((prev) =>
        prev.map((item) => (item.id === actualizada.id ? actualizada : item)),
      );
      setMensaje(`Estado de "${liga.nombre}" → ${estado}.`);
    } catch (err) {
      setError(err?.message || "No se pudo cambiar el estado.");
    }
  }

  if (loading) {
    return <p className="text-zinc-400">Cargando ligas…</p>;
  }

  return (
    <div className="space-y-6">
      {esAdmin ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setMostrarNueva((prev) => !prev);
              setEditandoId(null);
            }}
            className="h-11 rounded-full bg-emerald-400 px-5 text-sm font-semibold text-[#0f1a14] hover:bg-emerald-300"
          >
            {mostrarNueva ? "Cierra" : "Crea una liga"}
          </button>
        </div>
      ) : null}

      {mensaje ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {mensaje}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {esAdmin && mostrarNueva ? (
        <LigaForm
          titulo="Crea una liga"
          form={formNueva}
          setForm={setFormNueva}
          onSubmit={onCrear}
          onCancel={() => setMostrarNueva(false)}
          saving={saving}
          submitLabel="Crea la liga"
        />
      ) : null}

      {ligas.length === 0 ? (
        <p className="text-zinc-400">Todavía no hay ligas cargadas.</p>
      ) : (
        <ul className="grid gap-4">
          {ligas.map((liga) => {
            const yaInscripta = inscriptas.has(liga.id);
            const ocupada = pendingId === liga.id;
            const editando = editandoId === liga.id;

            return (
              <li
                key={liga.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight">
                        {liga.nombre || "Liga sin nombre"}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${
                          estadoBadge(liga.estado).clase
                        }`}
                      >
                        {estadoBadge(liga.estado).texto}
                      </span>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-zinc-500">Club</dt>
                        <dd className="text-zinc-200">
                          {liga.club || "A confirmar"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500">Categoría</dt>
                        <dd className="text-zinc-200">
                          {liga.categoria || "Sin categoría"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500">Fechas</dt>
                        <dd className="text-zinc-200">
                          {formatFecha(liga.fecha_inicio)} —{" "}
                          {formatFecha(liga.fecha_fin)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {esAdmin ? (
                    <div className="flex shrink-0 flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={(liga.estado || "activa") === "activa"}
                          onClick={() => onCambiarEstado(liga, "activa")}
                          className="h-10 rounded-full bg-emerald-400 px-4 text-xs font-extrabold uppercase tracking-wide text-[#10210f] hover:bg-emerald-300 disabled:opacity-40"
                        >
                          Publica
                        </button>
                        <button
                          type="button"
                          disabled={liga.estado === "finalizada"}
                          onClick={() => onCambiarEstado(liga, "finalizada")}
                          className="h-10 rounded-full bg-red-500 px-4 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-red-400 disabled:opacity-40"
                        >
                          Finaliza
                        </button>
                        <button
                          type="button"
                          disabled={liga.estado === "borrador"}
                          onClick={() => onCambiarEstado(liga, "borrador")}
                          className="h-10 rounded-full bg-yellow-300 px-4 text-xs font-extrabold uppercase tracking-wide text-[#10210f] hover:bg-yellow-200 disabled:opacity-40"
                        >
                          Borrador
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMostrarNueva(false);
                            setEditandoId(liga.id);
                            setFormEditar(formDesdeLiga(liga));
                          }}
                          className="h-10 rounded-full bg-sky-500 px-4 text-xs font-semibold text-white hover:bg-sky-400"
                        >
                          Edita
                        </button>
                        <button
                          type="button"
                          onClick={() => onBorrar(liga)}
                          className="h-10 rounded-full border border-red-400/60 px-4 text-xs font-semibold text-red-300 hover:bg-red-500/15"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={yaInscripta || ocupada}
                      onClick={() => onInscribirse(liga.id)}
                      className="h-11 shrink-0 rounded-full bg-emerald-400 px-5 text-sm font-semibold text-[#0f1a14] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-zinc-400"
                    >
                      {yaInscripta
                        ? "Inscrita"
                        : ocupada
                          ? "Inscribiendo…"
                          : "Inscríbete"}
                    </button>
                  )}
                </div>

                {esAdmin && editando ? (
                  <div className="mt-5">
                    <LigaForm
                      titulo="Edita la liga"
                      form={formEditar}
                      setForm={setFormEditar}
                      onSubmit={onActualizar}
                      onCancel={() => setEditandoId(null)}
                      saving={saving}
                      submitLabel="Guarda los cambios"
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
