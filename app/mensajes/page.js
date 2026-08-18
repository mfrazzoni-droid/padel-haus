import MensajesChat from "@/components/MensajesChat";

export const metadata = {
  title: "Mensajes | Padel Haus",
};

export default function MensajesPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#0f1a14] text-zinc-50">
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-4">
        <p className="text-xs font-medium tracking-[0.25em] uppercase text-emerald-400">
          Chat
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Mensajes
        </h1>
        <p className="mt-3 mb-8 max-w-2xl text-zinc-400">
          Revisa tu bandeja y manda mensajes entre jugadoras. Al abrir una
          conversación, los mensajes se marcan como leídos.
        </p>
        <MensajesChat />
      </main>
    </div>
  );
}
