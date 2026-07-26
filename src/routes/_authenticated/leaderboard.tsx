import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/lib/leaderboard.functions";
import { Trophy, Medal, Award } from "lucide-react";

const opts = queryOptions({ queryKey: ["leaderboard"], queryFn: () => getLeaderboard() });

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — ChallengeHub AI" },
      { name: "description", content: "See who's crushing challenges this season." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: Leaderboard,
});

function rankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-primary" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
  if (rank === 3) return <Award className="h-5 w-5 text-muted-foreground" />;
  return <span className="w-5 text-center text-sm text-muted-foreground">{rank}</span>;
}

function Leaderboard() {
  const { data } = useSuspenseQuery(opts);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Leaderboard</h1>
        <p className="mt-1 text-muted-foreground">Top challengers ranked by points earned.</p>
      </div>

      {data.me && (
        <div className="paper-card flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary font-display text-lg">
              {data.me.rank ?? "—"}
            </span>
            <div>
              <div className="font-medium">You</div>
              <div className="text-xs text-muted-foreground">{data.me.completed_count} completed</div>
            </div>
          </div>
          <div className="font-display text-2xl text-primary">{data.me.total_points} pts</div>
        </div>
      )}

      <div className="paper-card overflow-hidden">
        {data.board.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No points yet. Complete a challenge to appear here.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.board.map((row) => (
              <li key={row.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center">{rankIcon(row.rank)}</span>
                  <div>
                    <div className="font-medium">
                      {row.display_name || row.username || "Anonymous challenger"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.completed_count} completed
                    </div>
                  </div>
                </div>
                <div className="font-display text-lg">{row.total_points} <span className="text-xs text-muted-foreground">pts</span></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
