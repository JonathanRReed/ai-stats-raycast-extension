import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPreferenceValues, showToast, Toast } from "@raycast/api";

export type Prefs = { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string };

let client: SupabaseClient | null = null;

export function sb(): SupabaseClient {
  if (client) return client;
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getPreferenceValues<Prefs>();
  // Default to your shared public project so users don't need to configure anything
  const DEFAULT_URL = "https://bgbqdzmgxkwstjihgeef.supabase.co";
  const DEFAULT_ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYnFkem1neGt3c3RqaWhnZWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjMxOTUsImV4cCI6MjA2OTQ5OTE5NX0.Cp53ebjgdzSFBIKgB7UgMiSuu9dmrjBTWbrKbnKr8Sk";

  const url = SUPABASE_URL && SUPABASE_URL.trim().length > 0 ? SUPABASE_URL : DEFAULT_URL;
  const key = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.trim().length > 0 ? SUPABASE_ANON_KEY : DEFAULT_ANON;

  if (!url || !key) {
    void showToast({
      style: Toast.Style.Failure,
      title: "Missing Supabase configuration",
      message: "Provide Preferences or set baked-in defaults.",
    });
    throw new Error("Missing Supabase configuration");
  }
  client = createClient(url, key);
  return client;
}
