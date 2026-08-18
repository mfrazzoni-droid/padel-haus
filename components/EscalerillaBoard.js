"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPerfilActual } from "@/lib/perfil";
import { fetchJugadoras } from "@/lib/partidos";
import {
  crearDesafio,
  crearPareja,
  fetchDesafios,
  fetchParejas,
  nombreJugadora,
  nombrePareja,
  registrarResultadoDesafio,
} from "@/lib/escalerilla";

function formatFecha(value) {
  if (!value) return "A confirmar";
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function EscalerillaBoard() {
  const router = useRouter();
  const [parejas, setParejas] = useState([]);
  const [desafios, setDesafios] = useState([]);
  const [jugadoras, setJugadoras] = useState([]);
  const [logueada, setLogueada] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [saving, setSaving] = useState(false);
  const [desafiada, setDesafiada] = useState(null);
  const [retadoraId, setRetadoraId] = useState("");
  const [formPareja, setFormPareja] = useState({
    jugadora1Id: "",
    jugadora2Id: "",
    categoria: "Damas A",
  });
  const [formResultado, setFormResultado] = useState({
    desafioId: "",
    ganador: "retadora",
  });

  const pendientes = useMemo(
    () =>
      desafios.filter(
        (desafio) =>
          (desafio.estado || "pendiente") === "pendiente" && !desafio.resultado,
      ),
    [desafios],
  );

  const retadorasPosibles = useMemo(() => {
    if (!desafiada) return [];
    return parejas.filter(
      (pareja) =>
        pareja.id !== desafiada.id &&
        (pareja.categoria || "") === (desafiada.categoria || ""),
    );
  }, [parejas, desafiada]);

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      setLoading(true);
      setError("");
      try {
        const [listaParejas, listaDesafios, perfil] = await Promise.all([
          fetchParejas(),
          fetchDesafios(),
          getPerfilActual(),
        ]);
        if (cancelled) return;
        setParejas(listaParejas);
        setDesafios(listaDesafios);
        setLogueada(Boolean(perfil));
        setEsAdmin(Boolean(perfil?.esAdmin));
        if (perfil) {
          setJugadoras(await fetchJugadoras());
        }
      } catch (err) {
        if (!cancelled) {
          const text = err?.message || "No se pudo cargar la escalerilla.";
          setError(
            text.includes("Could not find the table")
              ? "Faltan las tablas parejas/desafios. Ejecuta supabase/escalerilla.sql en Supabase."
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

  function exigirSesion() {
    if (logueada) return true;
    router.push("/login?next=/escalerilla");
    return false;
  }

  function onDesafiar(pareja) {
    if (!exigirSesion()) return;
    setDesafiada(pareja);
    setRetadoraId("");
    setMensaje("");
    setError("");
  }

  async function onConfirmarDesafio(event) {
    event.preventDefault();
    if (!desafiada) return;
    setSaving(true);
    setError("");
    setMensaje("");
    try {
      const creado = await crearDesafio({
        parejaRetadoraId: retadoraId,
        parejaDesafiadaId: desafiada.id,
      });
      setDesafios((prev) => [creado, ...prev]);
      setDesafiada(null);
      setRetadoraId("");
      setMensaje("Desafío creado con estado pendiente.");
    } catch (err) {
      setError(err?.message || "No se pudo crear el desafío.");
    } finally {
      setSaving(false);
    }
  }

  async function onCrearPareja(event) {
    event.preventDefault();
    if (!exigirSesion()) return;
    setSaving(true);
    setError("");
    setMensaje("");
    try {
      const creada = await crearPareja(formPareja);
      setParejas((prev) =>
        [...prev, creada].sort(
          (a, b) => (a.ranking_posicion || 99) - (b.ranking_posicion || 99),
        ),
      );
      setFormPareja({
        jugadora1Id: "",
        jugadora2Id: "",
        categoria: formPareja.categoria,
      });
      setMensaje("Pareja agregada al ranking.");
    } catch (err) {
      setError(err?.message || "No se pudo crear la pareja.");
    } finally {
      setSaving(false);
    }
  }

  async function onRegistrarResultado(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMensaje("");
    try {
      const actualizado = await registrarResultadoDesafio(
        Number(formResultado.desafioId),
        formResultado.ganador,
      );
      setDesafios((prev) =>
        prev.map((desafio) =>
          desafio.id === actualizado.id ? actualizado : desafio,
        ),
      );
      setParejas(await fetchParejas());
      setFormResultado({ desafioId: "", ganador: "retadora" });
      setMensaje(
        "Resultado guardado. El ranking se actualizó con el trigger de Supabase.",
      );
    } catch (err) {
      setError(err?.message || "No se pudo guardar el resultado.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-zinc-400">Cargando escalerilla…</p>;
  }

  return (
    <div className="space-y-10">
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

      {parejas.length === 0 ? (
        <p className="text-zinc-400">
          Todavía no hay parejas en el ranking. Una administradora puede cargar
          la primera pareja.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Jugadora 1</th>
                <th className="px-4 py-3 font-medium">Jugadora 2</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {parejas.map((pareja, index) => (
                <tr
                  key={pareja.id}
                  className="border-t border-white/10 bg-white/5"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-xs font-semibold text-[#0f1a14]">
                      {pareja.ranking_posicion ?? index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {nombreJugadora(pareja.jugadora1)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {nombreJugadora(pareja.jugadora2)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {pareja.categoria || "Sin categoría"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onDesafiar(pareja)}
                      className="h-9 rounded-full bg-emerald-400 px-4 text-xs font-semibold text-[#0f1a14] hover:bg-emerald-300"
                    >
                      Desafía
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {desafiada ? (
        <form
          onSubmit={onConfirmarDesafio}
          className="space-y-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-5"
        >
          <h2 className="text-lg font-semibold">Confirma el desafío</h2>
          <p className="text-sm text-zinc-400">
            Pareja desafiada:{" "}
            <span className="text-zinc-100">{nombrePareja(desafiada)}</span>
            {desafiada.categoria ? ` · ${desafiada.categoria}` : ""}
          </p>
          <label className="block text-sm">
            Pareja retadora
            <select
              required
              value={retadoraId}
              onChange={(event) => setRetadoraId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
            >
              <option value="">Elige la pareja que desafía</option>
              {retadorasPosibles.map((pareja) => (
                <option key={pareja.id} value={pareja.id}>
                  #{pareja.ranking_posicion} {nombrePareja(pareja)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-full bg-emerald-400 px-5 text-sm font-semibold text-[#0f1a14] hover:bg-emerald-300 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Confirma el desafío"}
            </button>
            <button
              type="button"
              onClick={() => setDesafiada(null)}
              className="h-11 rounded-full border border-white/10 px-5 text-sm hover:bg-white/10"
            >
              Cancela
            </button>
          </div>
        </form>
      ) : null}

      {esAdmin ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={onRegistrarResultado}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <h2 className="text-lg font-semibold">Registra el resultado</h2>
            {pendientes.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No hay desafíos pendientes.
              </p>
            ) : (
              <>
                <label className="block text-sm">
                  Desafío pendiente
                  <select
                    required
                    value={formResultado.desafioId}
                    onChange={(event) =>
                      setFormResultado((prev) => ({
                        ...prev,
                        desafioId: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
                  >
                    <option value="">Elige un desafío</option>
                    {pendientes.map((desafio) => (
                      <option key={desafio.id} value={desafio.id}>
                        {nombrePareja(desafio.retadora)} vs{" "}
                        {nombrePareja(desafio.desafiada)} (
                        {formatFecha(desafio.fecha)})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Ganadora
                  <select
                    value={formResultado.ganador}
                    onChange={(event) =>
                      setFormResultado((prev) => ({
                        ...prev,
                        ganador: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
                  >
                    <option value="retadora">Pareja retadora</option>
                    <option value="desafiada">Pareja desafiada</option>
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-full bg-emerald-400 px-5 text-sm font-semibold text-[#0f1a14] hover:bg-emerald-300 disabled:opacity-60"
                >
                  {saving ? "Guardando…" : "Guarda el resultado"}
                </button>
              </>
            )}
          </form>

          <form
            onSubmit={onCrearPareja}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <h2 className="text-lg font-semibold">Nueva pareja</h2>
            <label className="block text-sm">
              Jugadora 1
              <select
                required
                value={formPareja.jugadora1Id}
                onChange={(event) =>
                  setFormPareja((prev) => ({
                    ...prev,
                    jugadora1Id: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
              >
                <option value="">Elige jugadora</option>
                {jugadoras.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nombre || j.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Jugadora 2
              <select
                required
                value={formPareja.jugadora2Id}
                onChange={(event) =>
                  setFormPareja((prev) => ({
                    ...prev,
                    jugadora2Id: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
              >
                <option value="">Elige jugadora</option>
                {jugadoras.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nombre || j.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Categoría
              <input
                required
                value={formPareja.categoria}
                onChange={(event) =>
                  setFormPareja((prev) => ({
                    ...prev,
                    categoria: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 outline-none focus:border-emerald-400"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-full bg-emerald-400 px-5 text-sm font-semibold text-[#0f1a14] hover:bg-emerald-300 disabled:opacity-60"
            >
              Agrega pareja
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
