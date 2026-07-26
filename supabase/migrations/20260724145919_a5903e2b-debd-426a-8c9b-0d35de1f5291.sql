
-- Drop old task manager
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TYPE IF EXISTS public.task_status CASCADE;
DROP TYPE IF EXISTS public.task_priority CASCADE;

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS total_points integer NOT NULL DEFAULT 0;

-- Make profiles readable to any signed-in user (for leaderboard / author info)
DROP POLICY IF EXISTS "Profiles readable by authenticated" ON public.profiles;
CREATE POLICY "Profiles readable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Enums
CREATE TYPE public.challenge_category AS ENUM ('fitness','coding','creative','learning','wellness','productivity','other');
CREATE TYPE public.challenge_difficulty AS ENUM ('easy','medium','hard');
CREATE TYPE public.participant_status AS ENUM ('active','completed','abandoned');
CREATE TYPE public.submission_status AS ENUM ('pending','graded');

-- Challenges
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category public.challenge_category NOT NULL DEFAULT 'other',
  difficulty public.challenge_difficulty NOT NULL DEFAULT 'medium',
  duration_days integer NOT NULL DEFAULT 7 CHECK (duration_days BETWEEN 1 AND 365),
  points_reward integer NOT NULL DEFAULT 100 CHECK (points_reward >= 0),
  is_ai_generated boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in reads published challenges"
  ON public.challenges FOR SELECT TO authenticated
  USING (is_published = true OR creator_id = auth.uid());
CREATE POLICY "Users insert own challenges"
  ON public.challenges FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Users update own challenges"
  ON public.challenges FOR UPDATE TO authenticated
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Users delete own challenges"
  ON public.challenges FOR DELETE TO authenticated
  USING (creator_id = auth.uid());
CREATE TRIGGER challenges_updated_at BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Participants
CREATE TABLE public.challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.participant_status NOT NULL DEFAULT 'active',
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  joined_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (challenge_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_participants TO authenticated;
GRANT ALL ON public.challenge_participants TO service_role;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in read participants"
  ON public.challenge_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users join for themselves"
  ON public.challenge_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own participation"
  ON public.challenge_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users leave own participation"
  ON public.challenge_participants FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Submissions
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  ai_feedback text,
  ai_score integer CHECK (ai_score BETWEEN 0 AND 100),
  status public.submission_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in read submissions"
  ON public.submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own submissions"
  ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own submissions"
  ON public.submissions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own submissions"
  ON public.submissions FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE TRIGGER submissions_updated_at BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Coach messages
CREATE TABLE public.coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES public.challenges(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.coach_messages TO authenticated;
GRANT ALL ON public.coach_messages TO service_role;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own coach messages"
  ON public.coach_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users insert own coach messages"
  ON public.coach_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own coach messages"
  ON public.coach_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_challenges_category ON public.challenges(category);
CREATE INDEX idx_challenges_created_at ON public.challenges(created_at DESC);
CREATE INDEX idx_participants_user ON public.challenge_participants(user_id);
CREATE INDEX idx_submissions_challenge ON public.submissions(challenge_id);
CREATE INDEX idx_coach_user_created ON public.coach_messages(user_id, created_at);
