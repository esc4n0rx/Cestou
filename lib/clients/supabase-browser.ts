import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabaseClient: SupabaseClient | null = null

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
  }

  return { url, anonKey }
}

export function getSupabaseBrowserClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const { url, anonKey } = getSupabaseEnv()

  supabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "cestou-auth",
    },
  })

  return supabaseClient
}
