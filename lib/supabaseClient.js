import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseEnv) {
  console.warn(
    "[Padel Haus] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. En Vercel agrégalas en Project Settings → Environment Variables.",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "public-anon-placeholder-key",
);

const looksLikePlaceholder =
  !hasSupabaseEnv ||
  supabaseUrl.includes("TU_URL") ||
  supabaseUrl.includes("tu-proyecto") ||
  supabaseAnonKey === "TU_KEY" ||
  supabaseAnonKey === "tu-anon-key";

if (looksLikePlaceholder) {
  console.warn(
    "[Padel Haus] Cliente de Supabase creado, pero las claves todavía son placeholders.",
  );
} else {
  console.log(
    `[Padel Haus] Cliente de Supabase inicializado correctamente (${supabaseUrl})`,
  );
}
