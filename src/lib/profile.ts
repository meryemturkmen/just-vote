import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/categories";

export async function fetchInterests(userId: string): Promise<string[]> {
  const { data } = await supabase.from("profiles").select("interests").eq("id", userId).maybeSingle();
  return data?.interests?.length ? data.interests : [...CATEGORIES];
}

export async function saveInterests(userId: string, interests: string[], onboarded = true) {
  if (interests.length < 1) throw new Error("Pick at least one category");
  const { error } = await supabase.from("profiles").update({ interests, onboarded }).eq("id", userId);
  if (error) throw error;
}
