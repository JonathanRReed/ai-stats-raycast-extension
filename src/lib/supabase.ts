import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPreferenceValues, showToast, Toast } from "@raycast/api";

export type Prefs = { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string };

let client: SupabaseClient | null = null;

export function sb(): SupabaseClient {
  if (client) return client;
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getPreferenceValues<Prefs>();
  const url = SUPABASE_URL?.trim();
  const key = SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    void showToast({
      style: Toast.Style.Failure,
      title: "Missing Supabase configuration",
      message: "Open Raycast Preferences for this extension and set SUPABASE_URL and SUPABASE_ANON_KEY.",
    });
    throw new Error("Missing Supabase configuration");
  }
  client = createClient(url, key);
  return client;
}
