import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createChallenge, generateChallenge } from "@/lib/challenges.functions";
import type { ChallengeCategory, ChallengeDifficulty } from "@/lib/challenge-schemas";

export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({
    meta: [
      { title: "Create a challenge — ChallengeHub AI" },
      { name: "description", content: "Design a community challenge, or let AI draft one for you." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Create,
});

const CATEGORIES: ChallengeCategory[] = ["fitness", "coding", "creative", "learning", "wellness", "productivity", "other"];
const DIFFS: ChallengeDifficulty[] = ["easy", "medium", "hard"];

function Create() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ChallengeCategory>("wellness");
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty>("medium");
  const [days, setDays] = useState(7);
  const [points, setPoints] = useState(100);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    if (topic.trim().length < 3) {
      toast.error("Give the AI a topic to work with.");
      return;
    }
    setGenerating(true);
    try {
      const draft = await generateChallenge({
        data: { topic, category, difficulty },
      });
      setTitle(draft.title);
      setDescription(draft.description);
      setDays(draft.duration_days);
      setPoints(draft.points_reward);
      setAiGenerated(true);
      toast.success("Draft ready — tweak and publish.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (title.trim().length < 3 || description.trim().length < 10) {
      toast.error("Add a title and a longer description.");
      return;
    }
    setSaving(true);
    try {
      const row = await createChallenge({
        data: {
          title, description, category, difficulty,
          duration_days: days, points_reward: points,
          is_ai_generated: aiGenerated,
        },
      });
      toast.success("Challenge published!");
      navigate({ to: "/challenges/$id", params: { id: row.id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-4xl">Create a challenge</h1>
        <p className="mt-1 text-muted-foreground">
          Design your own, or start from an AI-generated draft.
        </p>
      </div>

      <section className="paper-card p-6">
        <div className="mb-3 flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <h2 className="font-display text-xl text-foreground">Ask AI for a draft</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            placeholder="e.g. Learn to cook 5 new dinners"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate
          </Button>
        </div>
      </section>

      <section className="paper-card space-y-4 p-6">
        <div>
          <Label htmlFor="t">Title</Label>
          <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="d">Description</Label>
          <Textarea id="d" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ChallengeCategory)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as ChallengeDifficulty)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIFFS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="days">Days</Label>
            <Input id="days" type="number" min={1} max={365} value={days}
              onChange={(e) => setDays(parseInt(e.target.value || "7", 10))} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="pts">Points reward</Label>
            <Input id="pts" type="number" min={10} max={2000} value={points}
              onChange={(e) => setPoints(parseInt(e.target.value || "100", 10))} className="mt-1" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish challenge
          </Button>
        </div>
      </section>
    </div>
  );
}
