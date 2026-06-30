"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { ClientPicker } from "./ClientPicker";

interface Props {
  shift: Record<string, unknown>;
  clients: Record<string, unknown>[];
  carePlans: Record<string, unknown>[];
  staffId: string;
  onBack: () => void;
}

export function TaskCompletionForm({ shift, clients, carePlans, onBack }: Props) {
  const [clientId, setClientId] = useState(clients[0]?.id as string || "");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [violation, setViolation] = useState<{ task: string; requestedBy: string; response: string } | null>(null);
  const [reportingViolation, setReportingViolation] = useState(false);

  const plan = carePlans.find(p => p.client_id === clientId);
  const authorisedTasks: string[] = (plan?.authorised_tasks as string[]) || [];
  const excludedTasks: string[] = (plan?.excluded_tasks as string[]) || [];

  async function markTask(taskName: string, isAuthorised: boolean) {
    setSubmitting(true);
    await fetch("/api/task-completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift_id: shift.id, client_id: clientId, task_name: taskName, is_authorised: isAuthorised }),
    });
    setSaved(s => [...s, taskName]);
    setSubmitting(false);
  }

  async function submitViolation(e: React.FormEvent) {
    e.preventDefault();
    if (!violation) return;
    setReportingViolation(true);
    await fetch("/api/role-boundary-violations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shift.id,
        client_id: clientId,
        requested_task: violation.task,
        requested_by: violation.requestedBy,
        worker_response: violation.response,
      }),
    });
    setViolation(null);
    setReportingViolation(false);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-bold text-cr-charcoal text-lg">Tasks</h2>
      </div>

      <ClientPicker clients={clients} value={clientId} onChange={setClientId} />

      {authorisedTasks.length === 0 && excludedTasks.length === 0 ? (
        <div className="mt-6 text-center text-sm text-cr-slate py-10">No care plan tasks defined for this client.</div>
      ) : (
        <div className="mt-4 space-y-4">
          {authorisedTasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-cr-slate mb-2">AUTHORISED TASKS</p>
              <div className="space-y-2">
                {authorisedTasks.map(task => (
                  <div key={task} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
                    <span className="text-sm text-cr-charcoal capitalize">{task}</span>
                    {saved.includes(task)
                      ? <CheckCircle size={20} className="text-green-500" />
                      : <button onClick={() => markTask(task, true)} disabled={submitting}
                          className="text-xs font-semibold text-cr-forest border border-cr-forest px-3 py-1 rounded-lg">
                          Done
                        </button>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {excludedTasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 mb-2">EXCLUDED TASKS — DO NOT PERFORM</p>
              <div className="space-y-2">
                {excludedTasks.map(task => (
                  <div key={task} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700 capitalize">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Role boundary violation report */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-amber-800 mb-2">Report a Role Boundary Issue</p>
        <p className="text-xs text-amber-700 mb-3">Was you asked to do something outside your role or care plan?</p>

        {!violation ? (
          <button onClick={() => setViolation({ task: "", requestedBy: "", response: "" })}
            className="text-xs font-semibold text-amber-800 border border-amber-300 px-3 py-2 rounded-xl">
            Report Boundary Violation
          </button>
        ) : (
          <form onSubmit={submitViolation} className="space-y-3">
            <input required placeholder="What were you asked to do?" value={violation.task}
              onChange={e => setViolation(v => v ? { ...v, task: e.target.value } : v)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 bg-white focus:outline-none" />
            <input required placeholder="Who asked you?" value={violation.requestedBy}
              onChange={e => setViolation(v => v ? { ...v, requestedBy: e.target.value } : v)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 bg-white focus:outline-none" />
            <textarea required placeholder="What did you say/do in response?" value={violation.response}
              onChange={e => setViolation(v => v ? { ...v, response: e.target.value } : v)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 bg-white focus:outline-none resize-none" />
            <button type="submit" disabled={reportingViolation}
              className="w-full py-2.5 bg-amber-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
              {reportingViolation ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Report"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
