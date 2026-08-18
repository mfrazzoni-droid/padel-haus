import CalendarioPartidos from "@/components/CalendarioPartidos";

export const metadata = {
  title: "Calendario | Padel Haus",
};

export default function CalendarioPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#0f1a14] text-zinc-50">
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-4">
        <p className="text-xs font-medium tracking-[0.25em] uppercase text-emerald-400">
          Fixture
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Calendario
        </h1>
        <p className="mt-3 mb-8 max-w-2xl text-zinc-400">
          Fechas, jugadoras y resultados de cada partido. Las administradoras
          pueden crear cruces y editar el marcador.
        </p>
        <CalendarioPartidos />
      </main>
    </div>
  );
}
