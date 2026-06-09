import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cardMeta, type CardRecord, type CardType } from "@/components/GameCard";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Karten verwalten – Recruiting BIAS" }] }),
  component: Admin,
});

const empty = (type: CardType): Partial<CardRecord> => ({
  type, title: "", content: "", example: "", explanation: "", category: "",
  correct_answer: type === "truefalse" ? true : null,
});

function Admin() {
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [editing, setEditing] = useState<Partial<CardRecord> | null>(null);
  const [tab, setTab] = useState<CardType>("knowledge");

  async function load() {
    const { data } = await supabase.from("cards").select("*").order("type").order("created_at");
    setCards((data ?? []) as CardRecord[]);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.title?.trim() || !editing.content?.trim()) {
      return toast.error("Titel und Inhalt sind Pflicht.");
    }
    const payload = {
      type: editing.type as CardType,
      title: editing.title.trim(),
      content: editing.content.trim(),
      example: editing.example?.trim() || null,
      explanation: editing.explanation?.trim() || null,
      category: editing.category?.trim() || null,
      correct_answer: editing.type === "truefalse" ? !!editing.correct_answer : null,
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("cards").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("cards").insert(payload));
    }
    if (error) { toast.error("Speichern fehlgeschlagen."); return; }
    toast.success("Gespeichert");
    setEditing(null);
    load();
  }

  async function del(id: string) {
    if (!confirm("Karte wirklich löschen?")) return;
    const { error } = await supabase.from("cards").delete().eq("id", id);
    if (error) return toast.error("Löschen fehlgeschlagen.");
    load();
  }

  const filtered = cards.filter((c) => c.type === tab);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Startseite
          </Link>
          <h1 className="font-display text-3xl">Kartenstapel</h1>
          <Button onClick={() => setEditing(empty(tab))}>
            <Plus className="h-4 w-4 mr-1" /> Neue Karte
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as CardType)}>
          <TabsList className="grid grid-cols-3 w-full mb-4">
            {(["knowledge", "truefalse", "action"] as const).map((t) => (
              <TabsTrigger key={t} value={t}>
                {cardMeta[t].label}
              </TabsTrigger>
            ))}
          </TabsList>

          {(["knowledge", "truefalse", "action"] as const).map((t) => (
            <TabsContent key={t} value={t} className="space-y-2">
              {filtered.length === 0 && (
                <div className="text-sm text-muted-foreground p-6 text-center">Noch keine Karten.</div>
              )}
              {filtered.map((c) => (
                <Card key={c.id} className="p-4 flex items-start gap-3">
                  <div className={`w-1.5 self-stretch rounded-full ${c.type === "knowledge" ? "bg-knowledge" : c.type === "truefalse" ? "bg-truefalse" : "bg-action"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {c.category && <span>{c.category}</span>}
                      {c.type === "truefalse" && (
                        <span className="font-mono">→ {c.correct_answer ? "Wahr" : "Falsch"}</span>
                      )}
                    </div>
                    <div className="font-display text-lg truncate">{c.title}</div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.content}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => del(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>

        {editing && (
          <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={() => setEditing(null)}>
            <Card className="w-full max-w-xl p-6 rounded-3xl space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">{editing.id ? "Karte bearbeiten" : "Neue Karte"}</h2>
                <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as CardType })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["knowledge", "truefalse", "action"] as const).map((t) => (
                      <SelectItem key={t} value={t}>{cardMeta[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Titel" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              <Textarea placeholder="Inhalt / Frage / Szenario" rows={4} value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
              {editing.type === "knowledge" && (
                <Textarea placeholder="Beispiel (optional)" rows={2} value={editing.example ?? ""} onChange={(e) => setEditing({ ...editing, example: e.target.value })} />
              )}
              {editing.type === "truefalse" && (
                <>
                  <Select value={String(editing.correct_answer)} onValueChange={(v) => setEditing({ ...editing, correct_answer: v === "true" })}>
                    <SelectTrigger><SelectValue placeholder="Korrekte Antwort" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Wahr</SelectItem>
                      <SelectItem value="false">Falsch</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Erklärung der Auflösung" rows={3} value={editing.explanation ?? ""} onChange={(e) => setEditing({ ...editing, explanation: e.target.value })} />
                </>
              )}
              {editing.type !== "truefalse" && (
                <Textarea placeholder="Zusatz-Erklärung (optional, erscheint bei Auflösung)" rows={2} value={editing.explanation ?? ""} onChange={(e) => setEditing({ ...editing, explanation: e.target.value })} />
              )}
              <Input placeholder="Kategorie (z.B. Bias, Diskriminierung)" value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>Abbrechen</Button>
                <Button onClick={save}>Speichern</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
