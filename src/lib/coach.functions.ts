import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { coachMessageSchema } from "./challenge-schemas";

export const listCoachMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("coach_messages")
      .select("id, role, content, created_at, challenge_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const sendCoachMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => coachMessageSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { callLovableChat } = await import("./ai.server");

    // Persist user message
    const { error: userInsErr } = await context.supabase
      .from("coach_messages")
      .insert({
        user_id: context.userId,
        challenge_id: data.challenge_id ?? null,
        role: "user",
        content: data.content,
      });
    if (userInsErr) throw new Error(userInsErr.message);

    // Load recent history for context
    const { data: history } = await context.supabase
      .from("coach_messages")
      .select("role, content")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages = [
      {
        role: "system" as const,
        content:
          "You are Coach Nova, a warm, focused accountability coach for ChallengeHub AI. Keep replies concise (2-4 sentences), specific, and action-oriented. Celebrate wins, name one next step, and ask one gentle question when useful. Never lecture.",
      },
      ...(history ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const reply = await callLovableChat(messages, { temperature: 0.7 });
    const trimmed = reply.trim() || "I'm here — tell me more about what you're working on.";

    const { data: saved, error: aiErr } = await context.supabase
      .from("coach_messages")
      .insert({
        user_id: context.userId,
        challenge_id: data.challenge_id ?? null,
        role: "assistant",
        content: trimmed,
      })
      .select()
      .single();
    if (aiErr) throw new Error(aiErr.message);
    return saved;
  });

export const clearCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("coach_messages")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
