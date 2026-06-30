"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { ClientPicker } from "./ClientPicker";

interface Props {
  shift: Record<string, unknown>;
  clients: Record<string, unknown>[];
  carePlans: Record<string, unknown>[];
  staffId: string;
  onBack: () => void;
}

const DEFAULT_MOODS = [
  { term: "happy", category: "positive", emoji: "😊" },
  { term: "calm", category: "positive", emoji: "😌" },
  { term: "engaged", category: "positive", emoji: "🙂" },
  { term: "anxious", category: "negative", emoji: "😰" },
  { term: "agitated", category: "negative", emoji: "😤" },
  { term: "distressed", category: "negative", emoji: "😢" },
  { term: "confused", category: "negative", emoji: "😕" },
  { term: "withdrawn", category: "neutral", emoji: "😶" },
  { term: "tired", category: "neutral", emoji: "😴" },
];

export function MoodForm({ shift, clients, carePlans, onBack }: Props) {
  const [clientId, setClientId] = useState(clients[0]?.id as string || "");
  const [selectedMood, setSelectedMood] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [triggersActivated, setTriggersActivated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const plan = carePlans.find(p => p.client_id === clientId);
  const customMoods: string[] = (plan?.mood_vocabulary as string[]) || [];
  const triggers: string[] = (plan?.trigger_vocabulary as string[]) || [];

  const allMoods = [
    ...DEFAULT_MOODS,
    ...customMoods.filter(m => !DEFAULT_MOODS.find(d => d.term === m)).map(m => ({ term: m, category: "custom", emoji: "💬" })),
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMood) return;
    setSubmitting(true);
    const mood = allMoods.find(m => m.term === selectedMood);
    await fetch("/api/mood-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shift.id, client_id: clientId, mood_term: selectedMood,
        mood_category: mood?.category || "custom", context_notes: contextNotes, triggers_activated: triggersActivated,
      }),
    });
    setSubmitting(false);
    setDone(true);
    setTimeout(() => { setSelectedMood(""); setContextNotes(""); setTriggersActivated(false); setDone(false); }, 1500);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><ArrowLeft size={18} /></button>
        <h2 className="font-bold text-cr-charcoal text-lg">Mood Record</h2>
      </div>

      {done ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckCircle size={48} className="text-green-500" />
          <p className="font-semibold text-cr-charcoal">Mood recorded</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <ClientPicker clients={clients} value={clientId} onChange={setClientId} />

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-2">How is the client feeling?</label>
            <div className="grid grid-cols-3 gap-2">
              {allMoods.map(m => (
                <button key={m.term} type="button" onClick={() => setSelectedMood(m.term)}
                  className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1 transition-colors
                    ${selectedMood === m.term ? "bg-cr-forest text-white border-cr-forest" : "bg-white border-gray-200"}`}>
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[10px] font-semibold capitalize">{m.term}</span>
                </button>
              ))}
            </div>
          </div>

          {triggers.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-2">Known Triggers</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {triggers.map(t => (
                  <span key={t} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-lg capitalize">{t}</span>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={triggersActivated} onChange={e => setTriggersActivated(e.target.checked)}
                  className="rounded" />
                <span className="text-xs font-semibold text-amber-800">One or more triggers observed this shift</span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-cr-slate mb-1.5">Context / notes</label>
            <textarea value={contextNotes} onChange={e => setContextNotes(e.target.value)} rows={3}
              placeholder="What prompted this mood? Any relevant context..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest resize-none" />
          </div>

          <button type="submit" disabled={submitting || !selectedMood}
            className="w-full py-4 bg-cr-forest text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Mood Record"}
          </button>
        </form>
      )}
    </div>
  );
}
