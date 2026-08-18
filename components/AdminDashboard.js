"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPerfilActual } from "@/lib/perfil";
import { fetchResumenAdmin } from "@/lib/admin";

const METRICAS = [
  { key: "ligasActivas", label: "Ligas activas" },
  { key: "partidosProgramados", label: "Partidos programados" },
  { key: "parejas", label: "Parejas en escalerilla" },
  { key: "desafiosPendientes", label: "Desafíos pendientes" },
  { key: "mensajesNoLeidos", label: "Mensajes no leídos" },
];

const ACCESOS = [
  {
    href: "/ligas",
    titulo: "Ligas",
    texto: "Revisa inscripciones y el listado de competencias.",
  },
  {
    href: "/calendario",
    titulo: "Calendario",
    texto: "Crea partidos y carga resultados.",
  },
  {
    href: "/escalerilla",
    titulo: "Escalerilla",
    texto: "Revisa el ranking, desafíos y marcadores.",
  },
  {
    href: "/mensajes",
    titulo: "Mensajes",
    texto: "Revisa la bandeja y las conversaciones.",
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [estado, setEstado] = useState("cargando");
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      try {
        const sesion = await getPerfilActual();
        if (!sesion) {
          router.push("/login?next=/admin");
          return;
        }
        if (!sesion.esAdmin) {
          if (!cancelled) setEstado("denegado");
          return;
        }

        const data = await fetchResumenAdmin();
        if (cancelled) return;
        setResumen(data);
        setEstado("ok");
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "No se pudo cargar el panel.");
          setEstado("error");
        }
      }
    }

    cargar();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (estado === "cargando") {
    return <p className="text-zinc-400">Verificando acceso…</p>;
  }

  if (estado === "denegado") {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-6">
        <h2 className="text-lg font-semibold">Acceso restringido</h2>
        <p className="mt-2 text-sm text-red-200">
          Esta sección es solo para administradoras. Si deberías entrar, pide
          que te marquen el rol <code>admin</code> en la tabla usuarios.
        </p>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-400">
          Resumen general
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {METRICAS.map((metrica) => (
            <article
              key={metrica.key}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5"
            >
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {metrica.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-emerald-300">
                {resumen?.[metrica.key] ?? 0}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-400">
          Acceso rápido
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {ACCESOS.map((acceso) => (
            <Link
              key={acceso.href}
              href={acceso.href}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-5 transition hover:border-emerald-400/40 hover:bg-white/10"
            >
              <span>
                <span className="block font-semibold">{acceso.titulo}</span>
                <span className="mt-1 block text-sm text-zinc-400">
                  {acceso.texto}
                </span>
              </span>
              <span className="h-10 shrink-0 rounded-full bg-emerald-400 px-4 text-sm font-semibold leading-10 text-[#0f1a14]">
                Gestiona
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
