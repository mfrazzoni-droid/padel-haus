import HomeLigas from "@/components/HomeLigas";

export const metadata = {
  title: "Padel Haus",
  description: "Ligas, partidos y ranking de pádel",
};

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden px-6 pb-14 pt-12 sm:pb-20 sm:pt-20">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-lime-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full bg-lime-400 px-3 py-1 text-xs font-bold tracking-[0.2em] uppercase text-[#10210f]">
            Padel Haus
          </p>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Entra a la cancha.
            <span className="block text-lime-300">Juega las ligas.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-zinc-200">
            Inscríbete a las ligas activas, sigue el fixture y sube en la
            escalerilla.
          </p>
        </div>
      </section>
      <HomeLigas />
    </main>
  );
}
