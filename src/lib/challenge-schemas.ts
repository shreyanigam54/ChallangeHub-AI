import { z } from "zod";

export const challengeCategory = z.enum([
  "fitness",
  "coding",
  "creative",
  "learning",
  "wellness",
  "productivity",
  "other",
]);
export const challengeDifficulty = z.enum(["easy", "medium", "hard"]);

export const createChallengeSchema = z.object({
  title: z.string().trim().min(3, "Title too short").max(120),
  description: z.string().trim().min(10, "Add a longer description").max(2000),
  category: challengeCategory.default("other"),
  difficulty: challengeDifficulty.default("medium"),
  duration_days: z.number().int().min(1).max(365).default(7),
  points_reward: z.number().int().min(10).max(2000).default(100),
  is_ai_generated: z.boolean().default(false),
});

export const generateChallengeSchema = z.object({
  topic: z.string().trim().min(3).max(200),
  category: challengeCategory.default("other"),
  difficulty: challengeDifficulty.default("medium"),
});

export const submitSchema = z.object({
  challenge_id: z.string().uuid(),
  content: z.string().trim().min(5, "Submission too short").max(4000),
});

export const coachMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  challenge_id: z.string().uuid().optional().nullable(),
});

export type ChallengeCategory = z.infer<typeof challengeCategory>;
export type ChallengeDifficulty = z.infer<typeof challengeDifficulty>;
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
