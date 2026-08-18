"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { inscribirEnLiga } from "@/lib/inscripciones";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const credentials = { email: email.trim(), password };
      const { data, error: authError } =
        modo === "login"
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp({
              ...credentials,
              options: { data: { nombre: nombre.trim() } },
            });

      if (authError) {
        throw authError;
      }

      if (!data.session) {
        setInfo(
          "Revisa tu email para confirmar la cuenta antes de inscribirte.",
        );
        return;
      }

      const next = searchParams.get("next") || "/ligas";
      const ligaId = Number(searchParams.get("inscribir"));

      if (ligaId) {
        await inscribirEnLiga(ligaId);
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex rounded-full bg-white/10 p-1 text-sm">
        <button
          type="button"
          onClick={() => setModo("login")}
          className={`flex-1 rounded-full py-2 ${
            modo === "login" ? "bg-emerald-400 font-semibold text-[#0f1a14]" : ""
          }`}
        >
          Inicia sesión
        </button>
        <button
          type="button"
          onClick={() => setModo("registro")}
          className={`flex-1 rounded-full py-2 ${
            modo === "registro"
              ? "bg-emerald-400 font-semibold text-[#0f1a14]"
              : ""
          }`}
        >
          Crea una cuenta
        </button>
      </div>

      {modo === "registro" ? (
        <label className="block text-sm">
          Nombre
          <input
            required
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
          />
        </label>
      ) : null}

      <label className="block text-sm">
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
        />
      </label>

      <label className="block text-sm">
        Contraseña
        <input
          required
          minLength={6}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
        />
      </label>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {info}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-full bg-emerald-400 text-sm font-semibold text-[#0f1a14] hover:bg-emerald-300 disabled:opacity-60"
      >
        {loading
          ? "Ingresando…"
          : modo === "login"
            ? "Ingresa"
            : "Crea la cuenta"}
      </button>
    </form>
  );
}
