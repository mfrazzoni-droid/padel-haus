import EscalerillaBoard from "@/components/EscalerillaBoard";

export const metadata = {
  title: "Escalerilla | Padel Haus",
};

export default function EscalerillaPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#0f1a14] text-zinc-50">
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-24 pt-4">
        <p className="text-xs font-medium tracking-[0.25em] uppercase text-emerald-400">
          Ranking
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Escalerilla
        </h1>
        <p className="mt-3 mb-8 max-w-2xl text-zinc-400">
          Ranking de parejas. Desafía a un puesto y, si una administradora
          carga el resultado, el trigger de Supabase mueve las posiciones.
        </p>
        <EscalerillaBoard />
      </main>
    </div>
  );
}
