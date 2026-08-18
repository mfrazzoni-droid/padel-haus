"use client";

import { useEffect, useMemo, useState } from "react";
import { getPerfilActual } from "@/lib/perfil";
import {
  actualizarResultado,
  crearPartido,
  fetchJugadoras,
  fetchLigas,
  fetchPartidos,
} from "@/lib/partidos";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function toFechaKey(value) {
  if (!value) return null;
  return value.slice(0, 10);
}

function formatMes(year, month) {
  return new Date(year, month, 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });
}

function celdasDelMes(year, month) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const dias = new Date(year, month + 1, 0).getDate();
  const celdas = Array.from({ length: offset }, () => null);

  for (let dia = 1; dia <= dias; dia += 1) {
    celdas.push(dia);
  }

  while (celdas.length % 7 !== 0) {
    celdas.push(null);
  }

  return celdas;
}

function nombreJugadora(jugador) {
  return jugador?.nombre || jugador?.email || "Jugadora";
}

export default function CalendarioPartidos() {
  const hoy = new Date();
  const [vista, setVista] = useState({
    year: hoy.getFullYear(),
    month: hoy.getMonth(),
  });
  const [partidos, setPartidos] = useState([]);
  const [ligas, setLigas] = useState([]);
  const [jugadoras, setJugadoras] = useState([]);
  const [esAdmin, setEsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ligaId: "",
    jugadora1Id: "",
    jugadora2Id: "",
    fecha: "",
  });
  const [resultado, setResultado] = useState("");

  const partidosPorDia = useMemo(() => {
    const map = new Map();
    for (const partido of partidos) {
      const key = toFechaKey(partido.fecha);
      if (!key) continue;
      const lista = map.get(key) ?? [];
      lista.push(partido);
      map.set(key, lista);
    }
    return map;
  }, [partidos]);

  const sinFecha = partidos.filter((partido) => !partido.fecha);
  const celdas = celdasDelMes(vista.year, vista.month);

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      setLoading(true);
      setError("");

      try {
        const [lista, perfil] = await Promise.all([
          fetchPartidos(),
          getPerfilActual(),
        ]);

        if (cancelled) return;

        setPartidos(lista);
        setEsAdmin(Boolean(perfil?.esAdmin));

        if (perfil?.esAdmin) {
          const [listaLigas, listaJugadoras] = await Promise.all([
            fetchLigas(),
            fetchJugadoras(),
          ]);
          if (!cancelled) {
            setLigas(listaLigas);
            setJugadoras(listaJugadoras);
          }
        }
      } catch (err) {
        if (!cancelled) {
          const text = err?.message || "No se pudieron cargar los partidos.";
          setError(
            text.includes("Could not find the table")
              ? "Falta la tabla partidos. Ejecuta supabase/schema.sql en el SQL Editor de Supabase."
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

  function mesAnterior() {
    setVista((prev) =>
      prev.month === 0
        ? { year: prev.year - 1, month: 11 }
        : { year: prev.year, month: prev.month - 1 },
    );
  }

  function mesSiguiente() {
    setVista((prev) =>
      prev.month === 11
        ? { year: prev.year + 1, month: 0 }
        : { year: prev.year, month: prev.month + 1 },
    );
  }

  async function onCrear(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMensaje("");

    try {
      const creado = await crearPartido(form);
      setPartidos((prev) =>
        [...prev, creado].sort((a, b) =>
          String(a.fecha || "").localeCompare(String(b.fecha || "")),
        ),
      );
      setMostrarForm(false);
      setForm({ ligaId: "", jugadora1Id: "", jugadora2Id: "", fecha: "" });
      setMensaje("Partido creado.");
    } catch (err) {
      setError(err?.message || "No se pudo crear el partido.");
    } finally {
      setSaving(false);
    }
  }

  async function onGuardarResultado(event) {
    event.preventDefault();
    if (!editando) return;
    setSaving(true);
    setError("");
    setMensaje("");

    try {
      const actualizado = await actualizarResultado(editando.id, resultado);
      setPartidos((prev) =>
        prev.map((partido) =>
          partido.id === actualizado.id ? actualizado : partido,
        ),
      );
      setEditando(null);
      setResultado("");
      setMensaje("Resultado actualizado.");
    } catch (err) {
      setError(err?.message || "No se pudo guardar el resultado.");
    } finally {
      setSaving(false);
    }
  }

  function abrirEdicion(partido) {
    if (!esAdmin) return;
    setEditando(partido);
    setResultado(partido.resultado || "");
    setMostrarForm(false);
  }

  if (loading) {
    return <p className="text-zinc-400">Cargando calendario…</p>;
  }

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={mesAnterior}
            className="h-10 w-10 rounded-full border border-white/10 text-lg hover:bg-white/10"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <h2 className="min-w-[12rem] text-center text-xl font-semibold capitalize">
            {formatMes(vista.year, vista.month)}
          </h2>
          <button
            type="button"
            onClick={mesSiguiente}
            className="h-10 w-10 rounded-full border border-white/10 text-lg hover:bg-white/10"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>

        {esAdmin ? (
          <button
            type="button"
            onClick={() => {
              setMostrarForm((prev) => !prev);
              setEditando(null);
            }}
            className="h-11 rounded-full bg-emerald-400 px-5 text-sm font-semibold text-[#0f1a14] hover:bg-emerald-300"
          >
            {mostrarForm ? "Cierra" : "Crea un partido"}
          </button>
        ) : null}
      </div>

      {esAdmin && mostrarForm ? (
        <form
          onSubmit={onCrear}
          className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2"
        >
          <label className="block text-sm">
            Liga
            <select
              required
              value={form.ligaId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, ligaId: event.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
            >
              <option value="">Elige una liga</option>
              {ligas.map((liga) => (
                <option key={liga.id} value={liga.id}>
                  {liga.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Fecha
            <input
              required
              type="date"
              value={form.fecha}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, fecha: event.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
            />
          </label>

          <label className="block text-sm">
            Jugadora 1
            <select
              required
              value={form.jugadora1Id}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  jugadora1Id: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
            >
                <option value="">Elige jugadora</option>
              {jugadoras.map((jugadora) => (
                <option key={jugadora.id} value={jugadora.id}>
                  {nombreJugadora(jugadora)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Jugadora 2
            <select
              required
              value={form.jugadora2Id}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  jugadora2Id: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
            >
                <option value="">Elige jugadora</option>
              {jugadoras.map((jugadora) => (
                <option key={jugadora.id} value={jugadora.id}>
                  {nombreJugadora(jugadora)}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-full bg-emerald-400 px-5 text-sm font-semibold text-[#0f1a14] hover:bg-emerald-300 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Crea el partido"}
            </button>
          </div>
        </form>
      ) : null}

      {esAdmin && editando ? (
        <form
          onSubmit={onGuardarResultado}
          className="rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <p className="text-sm text-zinc-400">Edita el resultado</p>
          <p className="mt-1 font-medium">
            {nombreJugadora(editando.jugadora1)} vs{" "}
            {nombreJugadora(editando.jugadora2)}
          </p>
          <label className="mt-4 block text-sm">
            Resultado
            <input
              value={resultado}
              maxLength={20}
              placeholder="6-4 6-3"
              onChange={(event) => setResultado(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
            />
          </label>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-full bg-emerald-400 px-5 text-sm font-semibold text-[#0f1a14] hover:bg-emerald-300 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guarda el resultado"}
            </button>
            <button
              type="button"
              onClick={() => setEditando(null)}
              className="h-11 rounded-full border border-white/10 px-5 text-sm hover:bg-white/10"
            >
              Cancela
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-7 bg-white/5 text-center text-xs font-medium uppercase tracking-wide text-zinc-400">
          {DIAS.map((dia) => (
            <div key={dia} className="px-1 py-3">
              {dia}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-t border-white/10">
          {celdas.map((dia, index) => {
            const fechaKey = dia
              ? `${vista.year}-${String(vista.month + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
              : null;
            const delDia = fechaKey ? (partidosPorDia.get(fechaKey) ?? []) : [];
            const esHoy =
              dia &&
              hoy.getFullYear() === vista.year &&
              hoy.getMonth() === vista.month &&
              hoy.getDate() === dia;

            return (
              <div
                key={`${fechaKey || "empty"}-${index}`}
                className="min-h-[7.5rem] border-r border-b border-white/10 p-2 last:border-r-0 [&:nth-child(7n)]:border-r-0"
              >
                {dia ? (
                  <>
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                        esHoy
                          ? "bg-emerald-400 font-semibold text-[#0f1a14]"
                          : "text-zinc-300"
                      }`}
                    >
                      {dia}
                    </span>
                    <ul className="mt-2 space-y-1.5">
                      {delDia.map((partido) => {
                        const contenido = (
                          <>
                            <p className="text-[11px] leading-4 text-zinc-200">
                              {nombreJugadora(partido.jugadora1)} vs{" "}
                              {nombreJugadora(partido.jugadora2)}
                            </p>
                            {partido.resultado ? (
                              <p className="text-[11px] font-medium text-emerald-300">
                                {partido.resultado}
                              </p>
                            ) : (
                              <p className="text-[11px] text-zinc-500">
                                Pendiente
                              </p>
                            )}
                          </>
                        );

                        return (
                          <li key={partido.id}>
                            {esAdmin ? (
                              <button
                                type="button"
                                onClick={() => abrirEdicion(partido)}
                                className="w-full rounded-lg bg-white/10 px-2 py-1.5 text-left hover:bg-white/15"
                              >
                                {contenido}
                              </button>
                            ) : (
                              <div className="rounded-lg bg-white/10 px-2 py-1.5">
                                {contenido}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {sinFecha.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-medium text-zinc-400">
            Partidos sin fecha
          </h3>
          <ul className="space-y-2">
            {sinFecha.map((partido) => (
              <li
                key={partido.id}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                {nombreJugadora(partido.jugadora1)} vs{" "}
                {nombreJugadora(partido.jugadora2)}
                {partido.resultado ? ` · ${partido.resultado}` : " · Pendiente"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
