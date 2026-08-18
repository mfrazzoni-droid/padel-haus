import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const looksLikePlaceholder =
  supabaseUrl.includes("TU_URL") ||
  supabaseUrl.includes("tu-proyecto") ||
  supabaseAnonKey === "TU_KEY" ||
  supabaseAnonKey === "tu-anon-key";

if (looksLikePlaceholder) {
  console.warn(
    "[Padel Haus] Cliente de Supabase creado, pero .env.local todavía tiene placeholders. Pega la URL y la anon key reales en Project Settings → API.",
  );
} else {
  console.log(
    `[Padel Haus] Cliente de Supabase inicializado correctamente (${supabaseUrl})`,
  );
}
