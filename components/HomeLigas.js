"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getPerfilActual } from "@/lib/perfil";
import { getUsuarioPerfil, inscribirEnLiga } from "@/lib/inscripciones";
import {
  crearLiga,
  cambiarEstadoLiga,
  fetchLigasHome,
  ordenarLigasHome,
} from "@/lib/ligas";

function formatFecha(value) {
  if (!value) return "A confirmar";
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function estiloEstado(estado) {
  if (estado === "borrador") {
    return {
      texto: "En preparación",
      badge: "bg-yellow-300 text-[#10210f]",
      barra: "bg-yellow-300",
      borde: "border-yellow-300/25",
    };
  }
  if (estado === "finalizada") {
    return {
      texto: "Terminada",
      badge: "bg-red-500 text-white",
      barra: "bg-red-500",
      borde: "border-red-500/25",
    };
  }
  return {
    texto: "Activa",
    badge: "bg-white/15 text-lime-200",
    barra: "bg-lime-300",
    borde: "border-lime-300/20",
  };
}

const FORM_INICIAL = {
  nombre: "",
  club: "",
  categoria: "",
  fechaInicio: "",
  fechaFin: "",
  estado: "borrador",
};

function AccionesEstado({ liga, onCambiarEstado }) {
  const estado = liga.estado || "activa";
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={estado === "activa"}
        onClick={() => onCambiarEstado(liga.id, "activa")}
        className="h-10 rounded-full bg-emerald-400 px-4 text-xs font-extrabold uppercase tracking-wide text-[#10210f] hover:bg-emerald-300 disabled:opacity-40"
      >
        Publicar
      </button>
      <button
        type="button"
        disabled={estado === "finalizada"}
        onClick={() => onCambiarEstado(liga.id, "finalizada")}
        className="h-10 rounded-full bg-red-500 px-4 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-red-400 disabled:opacity-40"
      >
        Terminar
      </button>
      <button
        type="button"
        disabled={estado === "borrador"}
        onClick={() => onCambiarEstado(liga.id, "borrador")}
        className="h-10 rounded-full bg-yellow-300 px-4 text-xs font-extrabold uppercase tracking-wide text-[#10210f] hover:bg-yellow-200 disabled:opacity-40"
      >
        En preparación
      </button>
    </div>
  );
}

function LigaCard({
  liga,
  esAdmin,
  yaInscripta,
  ocupada,
  mostrarInscripcion,
  mostrarEstado,
  onInscribirse,
  onCambiarEstado,
}) {
  const estado = liga.estado || "activa";
  const estilo = estiloEstado(estado);

  return (
    <li
      className={`flex flex-col overflow-hidden rounded-3xl border bg-[#16351a] shadow-[0_12px_40px_rgba(0,0,0,0.25)] ${estilo.borde}`}
    >
      <div className={`h-2 ${estilo.barra}`} />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="w-fit rounded-full bg-lime-300 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#10210f]">
            {liga.categoria || "Sin categoría"}
          </p>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${estilo.badge}`}
          >
            {estilo.texto}
          </span>
        </div>
        <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
          {liga.nombre || "Liga sin nombre"}
        </h3>
        <p className="mt-2 text-sm font-medium text-lime-100">
          {liga.club || "Club a confirmar"}
        </p>
        <p className="mt-4 text-sm text-zinc-200">
          {formatFecha(liga.fecha_inicio)} — {formatFecha(liga.fecha_fin)}
        </p>
        {mostrarInscripcion && estado === "activa" ? (
          <button
            type="button"
            disabled={yaInscripta || ocupada}
            onClick={() => onInscribirse(liga.id)}
            className="mt-6 h-12 rounded-full bg-lime-300 text-sm font-extrabold text-[#10210f] hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-zinc-300"
          >
            {yaInscripta
              ? "Inscrita"
              : ocupada
                ? "Inscribiendo…"
                : "Inscríbete"}
          </button>
        ) : null}
        {esAdmin && mostrarEstado ? (
          <AccionesEstado liga={liga} onCambiarEstado={onCambiarEstado} />
        ) : null}
      </div>
    </li>
  );
}

function GridLigas({
  ligas,
  esAdmin,
  inscriptas,
  pendingId,
  mostrarInscripcion = false,
  mostrarEstado = false,
  vacio,
  onInscribirse,
  onCambiarEstado,
}) {
  if (ligas.length === 0) {
    return <p className="mt-8 text-zinc-400">{vacio}</p>;
  }

  return (
    <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {ligas.map((liga) => (
        <LigaCard
          key={liga.id}
          liga={liga}
          esAdmin={esAdmin}
          yaInscripta={inscriptas.has(liga.id)}
          ocupada={pendingId === liga.id}
          mostrarInscripcion={mostrarInscripcion}
          mostrarEstado={mostrarEstado}
          onInscribirse={onInscribirse}
          onCambiarEstado={onCambiarEstado}
        />
      ))}
    </ul>
  );
}

export default function HomeLigas() {
  const router = useRouter();
  const [ligas, setLigas] = useState([]);
  const [inscriptas, setInscriptas] = useState(new Set());
  const [esAdmin, setEsAdmin] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const activas = useMemo(
    () =>
      ligas
        .filter((liga) => (liga.estado || "activa") === "activa")
        .sort((a, b) =>
          String(b.fecha_inicio || "").localeCompare(String(a.fecha_inicio || "")),
        ),
    [ligas],
  );
  const preparacion = useMemo(
    () =>
      esAdmin
        ? ligas
            .filter((liga) => liga.estado === "borrador")
            .sort((a, b) =>
              String(b.fecha_inicio || "").localeCompare(
                String(a.fecha_inicio || ""),
              ),
            )
        : [],
    [ligas, esAdmin],
  );
  const historial = useMemo(
    () =>
      ligas
        .filter((liga) => liga.estado === "finalizada")
        .sort((a, b) =>
          String(b.fecha_fin || b.fecha_inicio || "").localeCompare(
            String(a.fecha_fin || a.fecha_inicio || ""),
          ),
        ),
    [ligas],
  );

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      setLoading(true);
      setError("");
      try {
        const sesion = await getPerfilActual();
        const admin = Boolean(sesion?.esAdmin);
        const lista = await fetchLigasHome(admin);
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
          const text = err?.message || "No se pudieron cargar las ligas.";
          setError(
            text.includes("ligas_ordenadas") ||
              text.includes("Could not find the table")
              ? "Falta la vista ligas_ordenadas. Ejecuta supabase/ligas-ordenadas.sql en Supabase."
              : text.includes("estado") || text.includes("column")
                ? "Falta la columna estado. Ejecuta supabase/ligas-estado.sql en Supabase."
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
  }, []);

  async function onInscribirse(ligaId) {
    setMensaje("");
    setError("");
    setPendingId(ligaId);
    try {
      const result = await inscribirEnLiga(ligaId);
      if (result.requiereLogin) {
        router.push(`/login?next=/&inscribir=${ligaId}`);
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

  async function onCrearLiga(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMensaje("");
    try {
      const creada = await crearLiga(form);
      setLigas((prev) => ordenarLigasHome([...prev, creada]));
      setForm(FORM_INICIAL);
      setMostrarForm(false);
      setMensaje("Liga creada.");
    } catch (err) {
      setError(
        err?.message ||
          "No se pudo crear la liga. Confirma que tu usuario tiene rol admin.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onCambiarEstado(ligaId, estado) {
    setError("");
    setMensaje("");
    try {
      const actualizada = await cambiarEstadoLiga(ligaId, estado);
      setLigas((prev) =>
        ordenarLigasHome(
          prev.map((liga) => (liga.id === actualizada.id ? actualizada : liga)),
        ),
      );
      setMensaje(`Estado actualizado a ${estado}.`);
    } catch (err) {
      setError(err?.message || "No se pudo cambiar el estado.");
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-lime-300">
            En juego
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ligas activas
          </h2>
        </div>
        {esAdmin ? (
          <button
            type="button"
            onClick={() => setMostrarForm((prev) => !prev)}
            className="h-12 rounded-full bg-yellow-300 px-6 text-sm font-extrabold text-[#10210f] hover:bg-yellow-200"
          >
            {mostrarForm ? "Cierra" : "Crea una liga"}
          </button>
        ) : null}
      </div>

      {mensaje ? (
        <p className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {mensaje}
        </p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {esAdmin && mostrarForm ? (
        <form
          onSubmit={onCrearLiga}
          className="mt-6 grid gap-4 rounded-3xl border border-lime-300/30 bg-lime-300/10 p-5 sm:grid-cols-2"
        >
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
                  setForm((prev) => ({
                    ...prev,
                    fechaInicio: event.target.value,
                  }))
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
          <label className="block text-sm">
            Estado
            <select
              value={form.estado}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, estado: event.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
            >
              <option value="borrador">En preparación</option>
              <option value="activa">Activa</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="h-12 rounded-full bg-lime-300 px-6 text-sm font-extrabold text-[#10210f] hover:bg-lime-200 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Crea la liga"}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="mt-10 text-zinc-400">Cargando ligas…</p>
      ) : (
        <>
          <GridLigas
            ligas={activas}
            esAdmin={esAdmin}
            inscriptas={inscriptas}
            pendingId={pendingId}
            mostrarInscripcion
            vacio="No hay ligas activas por ahora."
            onInscribirse={onInscribirse}
            onCambiarEstado={onCambiarEstado}
          />

          {esAdmin ? (
            <div className="mt-16">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-300">
                Admin
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                En preparación
              </h2>
              <GridLigas
                ligas={preparacion}
                esAdmin={esAdmin}
                inscriptas={inscriptas}
                pendingId={pendingId}
                mostrarEstado
                vacio="No hay ligas en preparación."
                onInscribirse={onInscribirse}
                onCambiarEstado={onCambiarEstado}
              />
            </div>
          ) : null}

          <div className="mt-16">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">
              Archivo
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Historial de ligas
            </h2>
            <GridLigas
              ligas={historial}
              esAdmin={esAdmin}
              inscriptas={inscriptas}
              pendingId={pendingId}
              vacio="Todavía no hay ligas terminadas."
              onInscribirse={onInscribirse}
              onCambiarEstado={onCambiarEstado}
            />
          </div>
        </>
      )}
    </section>
  );
}
