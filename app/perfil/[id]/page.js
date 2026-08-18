import PerfilCard from "@/components/PerfilCard";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: "Perfil | Padel Haus",
    description: `Perfil de jugadora ${id}`,
  };
}

export default async function PerfilPage({ params }) {
  const { id } = await params;

  return (
    <div className="flex min-h-full flex-col bg-[#0f1a14] text-zinc-50">
      <main className="mx-auto w-full max-w-xl flex-1 px-6 pb-24 pt-4">
        <p className="mb-6 text-xs font-medium tracking-[0.25em] uppercase text-emerald-400">
          Jugadora
        </p>
        <PerfilCard usuarioId={id} />
      </main>
    </div>
  );
}
