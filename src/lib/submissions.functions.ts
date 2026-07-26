import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { submitSchema } from "./challenge-schemas";

export const submitProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => submitSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { callLovableChat, extractJson } = await import("./ai.server");

    const { data: challenge, error: chErr } = await context.supabase
      .from("challenges")
      .select("title, description, difficulty, category")
      .eq("id", data.challenge_id)
      .single();
    if (chErr) throw new Error(chErr.message);

    // Insert pending row first so the user sees it immediately
    const { data: pending, error: insErr } = await context.supabase
      .from("submissions")
      .insert({
        challenge_id: data.challenge_id,
        user_id: context.userId,
        content: data.content,
        status: "pending",
      })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);

    // AI grade
    let feedback = "Auto-review unavailable. Your submission has been recorded.";
    let score = 70;
    try {
      const raw = await callLovableChat(
        [
          {
            role: "system",
            content:
              'You grade user submissions for community challenges. Reply with JSON only: {"score": number 0-100, "feedback": string}. Feedback should be 2-3 sentences, warm, specific, and mention one concrete way to improve. Score reflects how well the submission demonstrates the challenge goal.',
          },
          {
            role: "user",
            content: `Challenge: ${challenge.title}\nDifficulty: ${challenge.difficulty}\nGoal: ${challenge.description}\n\nUser submission:\n${data.content}`,
          },
        ],
        { temperature: 0.4, response_format: { type: "json_object" } },
      );
      const parsed = extractJson<{ score: number; feedback: string }>(raw);
      if (parsed && typeof parsed.score === "number" && parsed.feedback) {
        score = Math.max(0, Math.min(100, Math.round(parsed.score)));
        feedback = parsed.feedback.slice(0, 1200);
      }
    } catch (err) {
      feedback = `AI grading skipped: ${(err as Error).message}`;
      score = 0;
    }

    const { data: graded, error: updErr } = await context.supabase
      .from("submissions")
      .update({ ai_feedback: feedback, ai_score: score, status: "graded" } as never)
      .eq("id", pending.id)
      .select()
      .single();
    if (updErr) throw new Error(updErr.message);
    return graded;
  });
