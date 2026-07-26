import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [boardRes, meRes, completionsRes] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, total_points")
        .order("total_points", { ascending: false })
        .limit(50),
      context.supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, total_points")
        .eq("id", context.userId)
        .single(),
      context.supabase
        .from("challenge_participants")
        .select("user_id, status"),
    ]);
    if (boardRes.error) throw new Error(boardRes.error.message);
    const completions = new Map<string, number>();
    (completionsRes.data ?? []).forEach((p) => {
      if (p.status === "completed") {
        completions.set(p.user_id, (completions.get(p.user_id) ?? 0) + 1);
      }
    });
    const enriched = (boardRes.data ?? []).map((p, idx) => ({
      ...p,
      rank: idx + 1,
      completed_count: completions.get(p.id) ?? 0,
    }));
    return {
      board: enriched,
      me: meRes.data
        ? {
            ...meRes.data,
            rank: enriched.findIndex((r) => r.id === context.userId) + 1 || null,
            completed_count: completions.get(context.userId) ?? 0,
          }
        : null,
    };
  });
