import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Trophy, Sparkles, MessageCircle, Users, Zap, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChallengeHub AI — Community challenges with an AI coach" },
      {
        name: "description",
        content:
          "Join community challenges, get instant AI feedback on your submissions, and chat with an AI coach that keeps you accountable.",
      },
      { property: "og:title", content: "ChallengeHub AI — Community challenges with an AI coach" },
      {
        property: "og:description",
        content: "Join challenges, get AI feedback, and climb the leaderboard.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="h-5 w-5" strokeWidth={2} />
          </span>
          <span>ChallengeHub<span className="text-primary"> AI</span></span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/auth" className="rounded-md px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground">
            Sign in
          </Link>
          <Link to="/auth" search={{ mode: "signup" }} className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> AI-powered challenges
            </span>
            <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">
              Pick a challenge.
              <br />
              <em className="text-primary">Grow</em> with AI.
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Join community challenges, submit your progress, and get instant AI feedback. Coach Nova keeps you accountable — every single day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-accent">
                I have an account
              </Link>
            </div>
          </div>

          <div className="paper-card p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-xl">Coach Nova</h3>
              <span className="inline-flex items-center gap-1 text-xs text-primary">
                <Sparkles className="h-3 w-3" /> AI
              </span>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground ml-auto">
                I ran 3km today but felt slow.
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-accent/60 px-3 py-2">
                That's day three in a row — momentum matters more than speed. Try one strider on tomorrow's run; how did your breathing feel?
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground ml-auto">
                Better than last week actually.
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-accent/60 px-3 py-2">
                Love that. Log it as progress and mark 40% done — you're on pace to finish early. 🎯
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 py-16 md:grid-cols-4">
          {[
            { icon: Users, title: "Join challenges", body: "Fitness, coding, creative, learning — jump into anything." },
            { icon: Sparkles, title: "AI-generated", body: "Describe your goal, get a ready-to-run challenge in seconds." },
            { icon: CheckCircle2, title: "Auto-graded", body: "Submit proof, get a warm AI review and a score." },
            { icon: Trophy, title: "Climb the board", body: "Earn points and race friends up the leaderboard." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="paper-card p-6">
              <Icon className="h-6 w-6 text-primary" strokeWidth={1.8} />
              <h3 className="mt-4 font-display text-xl">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <section className="grid items-center gap-8 py-16 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl md:text-5xl">Accountability, delivered daily.</h2>
            <p className="mt-4 text-muted-foreground">
              Every submission gets specific feedback. Coach Nova remembers your goals and nudges you when it counts.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              {[
                "Community + AI-generated challenges",
                "Instant AI grading with feedback",
                "Persistent AI chat coach",
                "Points, streaks, and leaderboard",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="paper-card p-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" /> LIVE PREVIEW
            </div>
            <h3 className="mt-2 font-display text-2xl">30-Day Morning Pages</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Write 3 pages by hand every morning. Prove it with a photo and one sentence about the day.
            </p>
            <div className="mt-4 rounded-md border border-border bg-accent/40 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" /> AI review · 88/100
              </div>
              Beautiful consistency — your last three entries show sharper reflection. Try a single-word intention tomorrow to focus the pages.
            </div>
          </div>
        </section>

        <section className="my-16 rounded-2xl border border-border bg-card p-10 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-3 font-display text-3xl md:text-4xl">Ready when you are.</h2>
          <p className="mt-2 text-muted-foreground">Free to start. No credit card. Just challenges.</p>
          <Link to="/auth" search={{ mode: "signup" }} className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
            Create an account <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl border-t border-border px-6 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2 font-display text-lg">
            <Trophy className="h-4 w-4 text-primary" /> ChallengeHub AI
          </div>
          <p>© {new Date().getFullYear()} ChallengeHub AI. Grow together.</p>
        </div>
      </footer>
    </div>
  );
}
