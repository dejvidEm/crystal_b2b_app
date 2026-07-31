import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Chýbajú NEXT_PUBLIC_SUPABASE_URL alebo NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Nastav ich vo Vercel Environment Variables a sprav Redeploy.",
    );
  }

  return createBrowserClient(url, key);
}
