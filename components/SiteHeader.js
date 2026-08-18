"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getPerfilActual } from "@/lib/perfil";

export default function SiteHeader() {
  const [email, setEmail] = useState(null);
  const [perfilId, setPerfilId] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const sesion = await getPerfilActual();
        setEmail(sesion?.user?.email ?? null);
        setPerfilId(sesion?.perfil?.id ?? null);
        setEsAdmin(Boolean(sesion?.esAdmin));
      } catch {
        setEmail(null);
        setPerfilId(null);
        setEsAdmin(false);
      }
    }

    cargar();

    const { data } = supabase.auth.onAuthStateChange(() => {
      cargar();
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setEmail(null);
    setPerfilId(null);
    setEsAdmin(false);
  }

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-8">
      <Link
        href="/"
        className="text-sm font-semibold tracking-[0.2em] uppercase"
      >
        Padel Haus
      </Link>
      <nav className="flex items-center gap-5 text-sm text-zinc-400">
        <Link href="/ligas" className="hover:text-zinc-50">
          Ligas
        </Link>
        <Link href="/calendario" className="hover:text-zinc-50">
          Calendario
        </Link>
        <Link href="/escalerilla" className="hover:text-zinc-50">
          Escalerilla
        </Link>
        <Link href="/mensajes" className="hover:text-zinc-50">
          Mensajes
        </Link>
        {email ? (
          <>
            {esAdmin ? (
              <Link href="/admin" className="hover:text-zinc-50">
                Admin
              </Link>
            ) : null}
            {perfilId ? (
              <Link href={`/perfil/${perfilId}`} className="hover:text-zinc-50">
                Perfil
              </Link>
            ) : null}
            <button
              type="button"
              onClick={cerrarSesion}
              className="hover:text-zinc-50"
            >
              Cierra sesión
            </button>
          </>
        ) : (
          <Link href="/login" className="hover:text-zinc-50">
            Ingresa
          </Link>
        )}
      </nav>
    </header>
  );
}
