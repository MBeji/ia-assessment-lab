import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = (url && anon) ? createClient(url, anon, {
  auth: { persistSession: false }
}) : undefined;

export function ensureSupabase() {
  if(!supabase) throw new Error('Supabase non configuré (variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes).');
  return supabase;
}
