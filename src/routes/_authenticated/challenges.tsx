import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listChallenges } from "@/lib/challenges.functions";
import { useState } from "react";
import { Sparkles, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

const opts = queryOptions({ queryKey: ["challenges"], queryFn: () => listChallenges() });

export const Route = createFileRoute("/_authenticated/challenges")({
  head: () => ({
    meta: [
      { title: "Browse challenges — ChallengeHub AI" },
      { name: "description", content: "Discover community and AI-generated challenges to join." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: Browse,
});

const CATEGORIES = ["all", "fitness", "coding", "creative", "learning", "wellness", "productivity", "other"] as const;

function Browse() {
  const { data } = useSuspenseQuery(opts);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("all");

  const filtered = data.filter((c) => {
    if (cat !== "all" && c.category !== cat) return false;
    if (q && !`${c.title} ${c.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Challenges</h1>
        <p className="mt-1 text-muted-foreground">Pick one to join, or generate a new one with AI.</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="Search challenges…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="md:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={
                "rounded-full border px-3 py-1 text-xs capitalize transition " +
                (cat === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="paper-card p-10 text-center text-muted-foreground">
          No challenges match. Try a different filter or <Link to="/create" className="text-primary hover:underline">create one</Link>.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to="/challenges/$id"
              params={{ id: c.id }}
              className="paper-card flex flex-col p-5 transition hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-accent px-2 py-0.5 uppercase tracking-wide text-accent-foreground">
                  {c.category}
                </span>
                <span className="text-muted-foreground">· {c.difficulty} · {c.duration_days}d</span>
                {c.is_ai_generated && (
                  <span className="ml-auto inline-flex items-center gap-1 text-primary">
                    <Sparkles className="h-3 w-3" /> AI
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-display text-xl leading-tight">{c.title}</h3>
              <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{c.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> Join now</span>
                <span className="font-medium text-primary">+{c.points_reward} pts</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
