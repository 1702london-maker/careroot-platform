"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, AlertCircle, XCircle, Clock, Filter } from "lucide-react";
import { CRCard } from "@/components/ui/CRCard";

type StaffMember = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  job_title?: string;
};

type TrainingRecord = {
  staff_id: string;
  training_key: string;
  training_name: string;
  status: string;
  completed_date?: string;
  expiry_date?: string;
  is_mandatory: boolean;
};

interface Props {
  staff: StaffMember[];
  training: TrainingRecord[];
}

const MANDATORY_MODULES = [
  { key: "induction_care_cert", name: "Care Certificate", short: "Care Cert" },
  { key: "health_safety", name: "Health & Safety", short: "H&S" },
  { key: "fire_safety", name: "Fire Safety", short: "Fire" },
  { key: "ipc", name: "Infection Prevention", short: "IPC" },
  { key: "manual_handling", name: "Manual Handling", short: "M&H" },
  { key: "safeguarding_adults", name: "Safeguarding Adults", short: "SGA" },
  { key: "information_governance", name: "Information Governance", short: "IG" },
  { key: "mca_dols", name: "MCA & DoLS", short: "MCA" },
  { key: "first_aid", name: "First Aid", short: "FA" },
  { key: "food_safety", name: "Food Safety", short: "Food" },
  { key: "equality_diversity", name: "Equality & Diversity", short: "E&D" },
  { key: "complaints_whistleblowing", name: "Complaints & Whistleblowing", short: "WB" },
];

function cellIcon(status: string) {
  if (status === "completed") return <CheckCircle size={16} className="text-green-500 mx-auto" />;
  if (status === "renewal_due") return <AlertCircle size={16} className="text-amber-500 mx-auto" />;
  if (status === "overdue") return <XCircle size={16} className="text-cr-red mx-auto" />;
  if (status === "in_progress") return <Clock size={16} className="text-blue-400 mx-auto" />;
  return <div className="w-4 h-4 rounded-full border-2 border-gray-200 mx-auto" />;
}

function cellBg(status: string) {
  if (status === "completed") return "bg-green-50";
  if (status === "renewal_due") return "bg-amber-50";
  if (status === "overdue") return "bg-red-50";
  if (status === "in_progress") return "bg-blue-50";
  return "";
}

export function StaffTrainingMatrix({ staff, training }: Props) {
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Build lookup: staff_id -> { training_key -> record }
  const lookup: Record<string, Record<string, TrainingRecord>> = {};
  training.forEach(t => {
    if (!lookup[t.staff_id]) lookup[t.staff_id] = {};
    lookup[t.staff_id][t.training_key] = t;
  });

  const roles = ["all", ...Array.from(new Set(staff.map(s => s.role)))];

  const filteredStaff = staff.filter(s => {
    if (filterRole !== "all" && s.role !== filterRole) return false;
    if (filterStatus === "incomplete") {
      const completed = MANDATORY_MODULES.filter(m => lookup[s.id]?.[m.key]?.status === "completed").length;
      if (completed === MANDATORY_MODULES.length) return false;
    }
    if (filterStatus === "overdue") {
      const hasOverdue = MANDATORY_MODULES.some(m => {
        const rec = lookup[s.id]?.[m.key];
        return !rec || rec.status === "overdue";
      });
      if (!hasOverdue) return false;
    }
    return true;
  });

  const getCompletionPct = (staffId: string) => {
    const done = MANDATORY_MODULES.filter(m => lookup[staffId]?.[m.key]?.status === "completed").length;
    return Math.round((done / MANDATORY_MODULES.length) * 100);
  };

  const orgOverall = staff.length > 0
    ? Math.round(staff.reduce((sum, s) => sum + getCompletionPct(s.id), 0) / staff.length)
    : 0;

  const fullyCompliant = staff.filter(s => getCompletionPct(s.id) === 100).length;
  const needsAttention = staff.filter(s => getCompletionPct(s.id) < 80).length;

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <CRCard>
          <p className="text-xs text-cr-slate mb-1">Org-wide compliance</p>
          <p className={`text-3xl font-bold ${orgOverall >= 80 ? "text-green-600" : orgOverall >= 60 ? "text-amber-600" : "text-cr-red"}`}>
            {orgOverall}%
          </p>
          <p className="text-xs text-cr-slate mt-1">mandatory training</p>
        </CRCard>
        <CRCard>
          <p className="text-xs text-cr-slate mb-1">Fully compliant</p>
          <p className="text-3xl font-bold text-green-600">{fullyCompliant}</p>
          <p className="text-xs text-cr-slate mt-1">of {staff.length} staff</p>
        </CRCard>
        <CRCard>
          <p className="text-xs text-cr-slate mb-1">Needs attention</p>
          <p className={`text-3xl font-bold ${needsAttention > 0 ? "text-cr-red" : "text-green-600"}`}>
            {needsAttention}
          </p>
          <p className="text-xs text-cr-slate mt-1">below 80%</p>
        </CRCard>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-cr-slate" />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-cr-charcoal focus:outline-none"
        >
          {roles.map(r => (
            <option key={r} value={r}>{r === "all" ? "All roles" : r.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-cr-charcoal focus:outline-none"
        >
          <option value="all">All staff</option>
          <option value="incomplete">Incomplete only</option>
          <option value="overdue">Overdue only</option>
        </select>
        <span className="text-xs text-cr-slate ml-auto">{filteredStaff.length} staff shown</span>
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto rounded-card border border-gray-200 bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-cr-slate sticky left-0 bg-gray-50 min-w-[180px]">
                Staff Member
              </th>
              <th className="px-2 py-3 text-xs font-semibold text-cr-slate text-center min-w-[52px]">%</th>
              {MANDATORY_MODULES.map(m => (
                <th key={m.key} title={m.name}
                  className="px-2 py-3 text-[10px] font-semibold text-cr-slate text-center min-w-[44px] whitespace-nowrap">
                  {m.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStaff.map(s => {
              const pct = getCompletionPct(s.id);
              return (
                <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-2.5 sticky left-0 bg-white">
                    <Link href={`/staff/${s.id}?tab=training`} className="hover:text-cr-forest transition-colors">
                      <p className="font-medium text-cr-charcoal text-sm">{s.first_name} {s.last_name}</p>
                      <p className="text-[10px] text-cr-slate capitalize">{s.role.replace(/_/g, " ")}</p>
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className={`text-xs font-bold ${pct === 100 ? "text-green-600" : pct >= 80 ? "text-amber-600" : "text-cr-red"}`}>
                      {pct}%
                    </span>
                  </td>
                  {MANDATORY_MODULES.map(m => {
                    const rec = lookup[s.id]?.[m.key];
                    const status = rec?.status ?? "not_started";
                    return (
                      <td key={m.key} className={`px-1 py-2.5 text-center ${cellBg(status)}`}
                        title={`${m.name}: ${status.replace(/_/g, " ")}${rec?.expiry_date ? ` · Expires ${new Date(rec.expiry_date).toLocaleDateString("en-GB")}` : ""}`}>
                        {cellIcon(status)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredStaff.length === 0 && (
          <div className="text-center py-10 text-cr-slate text-sm">No staff match these filters</div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-cr-slate">
        <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-500" /> Completed</span>
        <span className="flex items-center gap-1.5"><AlertCircle size={13} className="text-amber-500" /> Renewal due</span>
        <span className="flex items-center gap-1.5"><XCircle size={13} className="text-cr-red" /> Overdue</span>
        <span className="flex items-center gap-1.5"><Clock size={13} className="text-blue-400" /> In progress</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-gray-200" /> Not started</span>
      </div>
    </div>
  );
}
