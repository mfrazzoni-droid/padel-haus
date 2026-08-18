import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Ingresa | Padel Haus",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#0f1a14] text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-24">
        <p className="text-xs font-medium tracking-[0.25em] uppercase text-emerald-400">
          Cuenta
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Ingresa a Padel Haus
        </h1>
        <p className="mt-3 mb-8 text-zinc-400">
          Usa tu email y contraseña para inscribirte en las ligas.
        </p>
        <Suspense fallback={<p className="text-zinc-400">Cargando…</p>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
