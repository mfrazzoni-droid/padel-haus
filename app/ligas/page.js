import LigasList from "@/components/LigasList";

export const metadata = {
  title: "Ligas | Padel Haus",
};

export default function LigasPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#0f1a14] text-zinc-50">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-24 pt-4">
        <p className="text-xs font-medium tracking-[0.25em] uppercase text-emerald-400">
          Competencia
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Ligas
        </h1>
        <p className="mt-3 mb-8 max-w-xl text-zinc-400">
          Inscríbete a una liga. Las administradoras pueden crear, editar y
          eliminar competencias.
        </p>
        <LigasList />
      </main>
    </div>
  );
}
