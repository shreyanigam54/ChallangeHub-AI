import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { myChallenges, listChallenges } from "@/lib/challenges.functions";
import { getLeaderboard } from "@/lib/leaderboard.functions";
import { ArrowRight, Compass, Flame, Sparkles, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const mineOpts = queryOptions({ queryKey: ["myChallenges"], queryFn: () => myChallenges() });
const feedOpts = queryOptions({ queryKey: ["challenges"], queryFn: () => listChallenges() });
const boardOpts = queryOptions({ queryKey: ["leaderboard"], queryFn: () => getLeaderboard() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Hub — ChallengeHub AI" },
      { name: "description", content: "Track your active challenges, streaks and AI coach nudges." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(mineOpts),
  component: Dashboard,
});

function Dashboard() {
  useServerFn(myChallenges); // ensure bearer attached for query
  const { data: mine } = useSuspenseQuery(mineOpts);
  const { data: feed } = useQuery(feedOpts);
  const { data: board } = useQuery(boardOpts);

  const active = mine.filter((m) => m.status === "active");
  const completed = mine.filter((m) => m.status === "completed").length;

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="font-display text-4xl md:text-5xl">Your challenge hub</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatCard icon={Flame} label="Active" value={active.length} />
          <StatCard icon={Trophy} label="Completed" value={completed} />
          <StatCard icon={Sparkles} label="Points" value={board?.me?.total_points ?? 0} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Active challenges</h2>
          <Link to="/challenges" className="text-sm text-primary hover:underline">
            Browse all →
          </Link>
        </div>
        {active.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {active.map((p) => (
              <Link
                key={p.id}
                to="/challenges/$id"
                params={{ id: p.challenge?.id ?? "" }}
                className="paper-card p-5 transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-xl leading-tight">{p.challenge?.title}</h3>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wide text-accent-foreground">
                    {p.challenge?.category}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.challenge?.description}</p>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{p.progress}% done</span>
                    <span>{p.challenge?.points_reward} pts</span>
                  </div>
                  <Progress value={p.progress} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">New from the community</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {(feed ?? []).slice(0, 6).map((c) => (
            <Link
              key={c.id}
              to="/challenges/$id"
              params={{ id: c.id }}
              className="paper-card p-4 transition hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {c.is_ai_generated && <Sparkles className="h-3 w-3 text-primary" />}
                <span className="uppercase tracking-wide">{c.difficulty}</span>
                <span>·</span>
                <span>{c.duration_days}d</span>
              </div>
              <h3 className="mt-2 font-display text-lg leading-tight">{c.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="paper-card flex items-center gap-4 p-5">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="font-display text-3xl">{value}</div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="paper-card flex flex-col items-center gap-3 p-10 text-center">
      <Compass className="h-8 w-8 text-primary" />
      <p className="font-display text-xl">No active challenges yet</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Join something from the community or use AI to generate one that matches your goals.
      </p>
      <div className="mt-2 flex gap-2">
        <Link to="/challenges" className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Browse challenges <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/create" className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
          <Sparkles className="h-4 w-4" /> Create with AI
        </Link>
      </div>
    </div>
  );
}
