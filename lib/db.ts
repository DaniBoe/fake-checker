import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const supabase = createSupabaseClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL || "",
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Export createClient for the enhanced usage system
export const createClient = () => createSupabaseClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL || "",
	process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export type HistoryItem = {
	id: string;
	user_id?: string | null;
	image_url: string;
	label: "Likely Authentic" | "Suspicious" | "Fake";
	reason: string;
	confidence: number;
	created_at: string;
};
