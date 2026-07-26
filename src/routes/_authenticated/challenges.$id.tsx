import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { getChallenge, joinChallenge, leaveChallenge, updateProgress } from "@/lib/challenges.functions";
import { submitProof } from "@/lib/submissions.functions";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Users, ArrowLeft, Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/_authenticated/challenges/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Challenge — ChallengeHub AI` },
      { name: "description", content: `Join and submit progress for challenge ${params.id}.` },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(challengeOpts(params.id)),
  component: ChallengeDetail,
});

const challengeOpts = (id: string) =>
  queryOptions({
    queryKey: ["challenge", id],
    queryFn: () => getChallenge({ data: { id } }),
  });

function ChallengeDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(challengeOpts(id));
  const qc = useQueryClient();
  const [joining, setJoining] = useState(false);
  const [progress, setProgress] = useState<number>(data.myParticipation?.progress ?? 0);
  const [submission, setSubmission] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { challenge, creator, participants, submissions, myParticipation } = data;
  const joined = !!myParticipation;

  async function refetch() {
    await qc.invalidateQueries({ queryKey: ["challenge", id] });
    await qc.invalidateQueries({ queryKey: ["myChallenges"] });
  }

  async function handleJoin() {
    setJoining(true);
    try {
      await joinChallenge({ data: { challenge_id: id } });
      toast.success("You're in! Post your first update below.");
      await refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    if (!confirm("Leave this challenge? Progress will be reset.")) return;
    try {
      await leaveChallenge({ data: { challenge_id: id } });
      toast.success("Left the challenge");
      setProgress(0);
      await refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleProgressCommit(val: number) {
    setProgress(val);
    try {
      await updateProgress({ data: { challenge_id: id, progress: val } });
      if (val >= 100) toast.success(`Challenge complete! +${challenge.points_reward} pts 🎉`);
      await refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleSubmit() {
    if (submission.trim().length < 5) {
      toast.error("Add a few sentences describing what you did.");
      return;
    }
    setSubmitting(true);
    try {
      await submitProof({ data: { challenge_id: id, content: submission } });
      toast.success("Submitted — AI is reviewing.");
      setSubmission("");
      await refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <Link to="/challenges" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to challenges
      </Link>

      <header className="paper-card p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-accent px-2 py-0.5 uppercase tracking-wide text-accent-foreground">
            {challenge.category}
          </span>
          <span className="text-muted-foreground">{challenge.difficulty} · {challenge.duration_days} days</span>
          {challenge.is_ai_generated && (
            <span className="inline-flex items-center gap-1 text-primary">
              <Sparkles className="h-3 w-3" /> AI-crafted
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
            <Award className="h-4 w-4" /> +{challenge.points_reward} pts
          </span>
        </div>
        <h1 className="mt-3 font-display text-3xl md:text-4xl">{challenge.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{challenge.description}</p>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {participants.length} joined
            {creator && <span> · by {creator.display_name || creator.username || "a challenger"}</span>}
          </div>
          {joined ? (
            <Button variant="ghost" size="sm" onClick={handleLeave}>Leave</Button>
          ) : (
            <Button onClick={handleJoin} disabled={joining}>
              {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join challenge
            </Button>
          )}
        </div>
      </header>

      {joined && (
        <section className="paper-card p-6">
          <h2 className="font-display text-2xl">Your progress</h2>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Move the slider as you make progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Slider
              value={[progress]}
              max={100}
              step={5}
              onValueChange={(v) => setProgress(v[0])}
              onValueCommit={(v) => handleProgressCommit(v[0])}
            />
            <div className="mt-3">
              <Progress value={progress} />
            </div>
          </div>
        </section>
      )}

      {joined && (
        <section className="paper-card p-6">
          <h2 className="font-display text-2xl">Submit your work</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share what you did today. AI will give you a warm review and a score.
          </p>
          <Textarea
            className="mt-4"
            rows={5}
            placeholder="Today I ran 3km, breathing was steady the whole way…"
            value={submission}
            onChange={(e) => setSubmission(e.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for AI review
            </Button>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-2xl">Recent submissions</h2>
        {submissions.length === 0 ? (
          <div className="paper-card p-6 text-sm text-muted-foreground">
            No submissions yet — be the first.
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div key={s.id} className="paper-card p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{s.profile?.display_name || s.profile?.username || "Anonymous"}</span>
                  <span>{new Date(s.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{s.content}</p>
                {s.status === "graded" && s.ai_feedback && (
                  <div className="mt-3 rounded-md border border-border bg-accent/40 p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-primary">
                      <Sparkles className="h-3 w-3" /> AI review
                      {typeof s.ai_score === "number" && (
                        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                          {s.ai_score}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/90">{s.ai_feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
