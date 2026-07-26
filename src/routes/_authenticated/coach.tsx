import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { listCoachMessages, sendCoachMessage, clearCoach } from "@/lib/coach.functions";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const opts = queryOptions({ queryKey: ["coachMessages"], queryFn: () => listCoachMessages() });

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({
    meta: [
      { title: "AI Coach — ChallengeHub AI" },
      { name: "description", content: "Chat with Coach Nova, your accountability partner." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: Coach,
});

function Coach() {
  const { data: messages } = useSuspenseQuery(opts);
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    // Optimistic user message
    qc.setQueryData(["coachMessages"], (prev: typeof messages | undefined) => [
      ...(prev ?? []),
      { id: `tmp-${Date.now()}`, role: "user", content, created_at: new Date().toISOString(), challenge_id: null },
    ]);
    try {
      await sendCoachMessage({ data: { content } });
      await qc.invalidateQueries({ queryKey: ["coachMessages"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleClear() {
    if (!confirm("Clear the conversation?")) return;
    await clearCoach();
    await qc.invalidateQueries({ queryKey: ["coachMessages"] });
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-3xl flex-col">
      <header className="flex items-center justify-between pb-4">
        <div>
          <h1 className="font-display text-3xl">Coach Nova</h1>
          <p className="text-sm text-muted-foreground">Your AI accountability partner.</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 className="mr-1 h-4 w-4" /> Clear
          </Button>
        )}
      </header>

      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-4">
        {messages.length === 0 && !sending && (
          <div className="grid h-full place-items-center text-center">
            <div className="max-w-sm">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="mt-3 font-display text-xl">Say hi to Coach Nova</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask for a plan, share a struggle, or celebrate a win. Nova replies with short, useful nudges.
              </p>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground"
                  : "max-w-[80%] rounded-2xl rounded-bl-sm bg-accent/60 px-4 py-2 text-sm text-foreground"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm bg-accent/60 px-4 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Nova is thinking…
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <Textarea
          ref={inputRef}
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          placeholder="How's your challenge going today?"
          className="resize-none"
          disabled={sending}
        />
        <Button onClick={handleSend} disabled={sending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
