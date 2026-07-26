import { createFileRoute, Link, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Trophy, Compass, Sparkles, MessageCircle, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const nav = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/challenges", label: "Challenges", icon: Compass },
  { to: "/create", label: "Create", icon: Sparkles },
  { to: "/coach", label: "Coach", icon: MessageCircle },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

function AuthedLayout() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [router.state.location.pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-xl">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Trophy className="h-4 w-4" strokeWidth={2} />
            </span>
            <span>ChallengeHub<span className="text-primary"> AI</span></span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
                activeProps={{ className: "text-foreground bg-accent" }}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:block">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-border md:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {nav.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  activeProps={{ className: "text-foreground bg-accent" }}
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="mt-1 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <Outlet />
      </main>
    </div>
  );
}
