import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  createChallengeSchema,
  generateChallengeSchema,
} from "./challenge-schemas";

export const listChallenges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("challenges")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const [challengeRes, participantsRes, submissionsRes, meRes] = await Promise.all([
      context.supabase.from("challenges").select("*").eq("id", data.id).single(),
      context.supabase
        .from("challenge_participants")
        .select("id, user_id, progress, status, joined_at")
        .eq("challenge_id", data.id),
      context.supabase
        .from("submissions")
        .select("id, user_id, content, ai_feedback, ai_score, status, created_at")
        .eq("challenge_id", data.id)
        .order("created_at", { ascending: false })
        .limit(20),
      context.supabase
        .from("challenge_participants")
        .select("*")
        .eq("challenge_id", data.id)
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    if (challengeRes.error) throw new Error(challengeRes.error.message);

    // Enrich with author + submitter display names
    const userIds = new Set<string>([challengeRes.data.creator_id]);
    (participantsRes.data ?? []).forEach((p) => userIds.add(p.user_id));
    (submissionsRes.data ?? []).forEach((s) => userIds.add(s.user_id));
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", Array.from(userIds));
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    return {
      challenge: challengeRes.data,
      creator: profileMap.get(challengeRes.data.creator_id) ?? null,
      participants: (participantsRes.data ?? []).map((p) => ({
        ...p,
        profile: profileMap.get(p.user_id) ?? null,
      })),
      submissions: (submissionsRes.data ?? []).map((s) => ({
        ...s,
        profile: profileMap.get(s.user_id) ?? null,
      })),
      myParticipation: meRes.data ?? null,
    };
  });

export const createChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => createChallengeSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("challenges")
      .insert({ ...data, creator_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const joinChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ challenge_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("challenge_participants")
      .insert({ challenge_id: data.challenge_id, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const leaveChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ challenge_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("challenge_participants")
      .delete()
      .eq("challenge_id", data.challenge_id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      challenge_id: z.string().uuid(),
      progress: z.number().int().min(0).max(100),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { progress: data.progress };
    if (data.progress >= 100) {
      patch.status = "completed";
      patch.completed_at = new Date().toISOString();
    }
    const { data: row, error } = await context.supabase
      .from("challenge_participants")
      .update(patch as never)
      .eq("challenge_id", data.challenge_id)
      .eq("user_id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Award points on completion (idempotent-ish: only if newly reaching 100)
    if (data.progress >= 100) {
      const { data: ch } = await context.supabase
        .from("challenges").select("points_reward").eq("id", data.challenge_id).single();
      if (ch?.points_reward) {
        const { data: prof } = await context.supabase
          .from("profiles").select("total_points").eq("id", context.userId).single();
        const next = (prof?.total_points ?? 0) + ch.points_reward;
        await context.supabase
          .from("profiles").update({ total_points: next } as never).eq("id", context.userId);
      }
    }
    return row;
  });

// AI: generate a challenge draft from a topic
export const generateChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => generateChallengeSchema.parse(raw))
  .handler(async ({ data }) => {
    const { callLovableChat, extractJson } = await import("./ai.server");
    const raw = await callLovableChat(
      [
        {
          role: "system",
          content:
            "You design engaging community challenges. Reply with strict JSON only, matching: {\"title\":string,\"description\":string,\"duration_days\":number,\"points_reward\":number}. Description must be motivating, 2-4 sentences, include clear daily actions and how to prove completion. duration_days between 3 and 30. points_reward between 50 and 500.",
        },
        {
          role: "user",
          content: `Create a ${data.difficulty} ${data.category} challenge about: ${data.topic}`,
        },
      ],
      { temperature: 0.8, response_format: { type: "json_object" } },
    );
    const parsed = extractJson<{
      title: string;
      description: string;
      duration_days: number;
      points_reward: number;
    }>(raw);
    if (!parsed?.title || !parsed?.description) {
      throw new Error("AI returned an unexpected format. Try again.");
    }
    return {
      title: parsed.title.slice(0, 120),
      description: parsed.description.slice(0, 2000),
      duration_days: Math.max(1, Math.min(365, Math.round(parsed.duration_days || 7))),
      points_reward: Math.max(10, Math.min(2000, Math.round(parsed.points_reward || 100))),
      category: data.category,
      difficulty: data.difficulty,
    };
  });

export const myChallenges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("challenge_participants")
      .select("id, progress, status, joined_at, challenge:challenges(*)")
      .eq("user_id", context.userId)
      .order("joined_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
