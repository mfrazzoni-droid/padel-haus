import AdminDashboard from "@/components/AdminDashboard";

export const metadata = {
  title: "Admin | Padel Haus",
};

export default function AdminPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#0f1a14] text-zinc-50">
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-4">
        <p className="text-xs font-medium tracking-[0.25em] uppercase text-emerald-400">
          Panel
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Administración
        </h1>
        <p className="mt-3 mb-8 max-w-2xl text-zinc-400">
          Revisa el resumen de la plataforma y entra a ligas, calendario,
          escalerilla y mensajes.
        </p>
        <AdminDashboard />
      </main>
    </div>
  );
}
