"use client";

import { useState } from "react";
import { AlertTriangle, Phone, CheckCircle, Clock, MapPin, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";

type User = { id: string; first_name: string; last_name: string; organisation_id: string; role: string };
type CheckIn = { id: string; check_in_at: string; expected_finish_at?: string; status: string } | null;
type Contact = { first_name: string; last_name: string; phone?: string; role: string };

interface Props {
  user: User | null;
  activeCheckin: CheckIn;
  contacts: Contact[];
}

const ROLE_LABEL: Record<string, string> = {
  manager: "Manager",
  coordinator: "Coordinator",
  org_admin: "Admin",
};

export function SOSClient({ user, activeCheckin, contacts }: Props) {
  const supabase = createClient();
  const [holding, setHolding] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [checkedIn, setCheckedIn] = useState(!!activeCheckin);
  const [checkInId, setCheckInId] = useState<string | null>(activeCheckin?.id ?? null);
  const [expectedFinish, setExpectedFinish] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);

  const handleSOSTrigger = async () => {
    setSosTriggered(true);
    if (!user) return;
    await supabase.from("lone_working_check_ins").insert({
      organisation_id: user.organisation_id,
      staff_id: user.id,
      status: "sos_triggered",
      sos_triggered_at: new Date().toISOString(),
      alert_sent_at: new Date().toISOString(),
    });
  };

  const handleCheckIn = async () => {
    if (!user || !expectedFinish) return;
    setLoading(true);
    const { data, error } = await supabase.from("lone_working_check_ins").insert({
      organisation_id: user.organisation_id,
      staff_id: user.id,
      status: "active",
      check_in_at: new Date().toISOString(),
      expected_finish_at: new Date(expectedFinish).toISOString(),
    }).select().single();

    if (!error && data) {
      setCheckedIn(true);
      setCheckInId(data.id);
    }
    setLoading(false);
  };

  const handleCheckOut = async () => {
    if (!checkInId) return;
    setLoading(true);
    await supabase.from("lone_working_check_ins").update({
      status: "checked_out",
      checked_out_at: new Date().toISOString(),
    }).eq("id", checkInId);
    setCheckedIn(false);
    setCheckInId(null);
    setCheckoutDone(true);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* SOS button */}
      <CRCard>
        <div className="text-center py-4">
          {sosTriggered ? (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={40} className="text-cr-red" />
              </div>
              <h2 className="font-display text-xl font-semibold text-cr-red mb-2">SOS Alert Sent</h2>
              <p className="text-sm text-cr-slate">Your manager has been notified. Stay on the line if possible.</p>
              <p className="text-sm font-semibold text-cr-charcoal mt-2">Emergency Services: 999</p>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-1">Emergency SOS</h2>
              <p className="text-sm text-cr-slate mb-6">Hold the button for 3 seconds to alert your manager. Your location will be shared.</p>
              <button
                onMouseDown={() => setHolding(true)}
                onMouseUp={() => { if (holding) { setHolding(false); handleSOSTrigger(); } }}
                onTouchStart={() => setHolding(true)}
                onTouchEnd={() => { if (holding) { setHolding(false); handleSOSTrigger(); } }}
                className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center font-bold text-white text-lg
                  transition-all duration-200 shadow-lg select-none
                  ${holding ? "bg-red-700 scale-95" : "bg-cr-red hover:bg-red-700"}`}
                style={{ cursor: "pointer" }}
              >
                <div className="text-center">
                  <AlertTriangle size={32} className="mx-auto mb-1" />
                  <span className="text-sm">SOS</span>
                </div>
              </button>
              <p className="text-xs text-cr-slate mt-4">Hold for 3 seconds to activate</p>
            </>
          )}
        </div>
      </CRCard>

      {/* Lone working check-in */}
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">Lone Working Check-In</h3>

        {checkoutDone && (
          <CRAlertBanner variant="blue" title="Checked out" description="You have safely checked out. Have a good rest." className="mb-3" />
        )}

        {checkedIn ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle size={16} />
              <span className="font-medium">You are checked in</span>
            </div>
            {activeCheckin?.expected_finish_at && (
              <div className="flex items-center gap-2 text-sm text-cr-slate">
                <Clock size={14} />
                <span>Expected finish: {new Date(activeCheckin.expected_finish_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}</span>
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="cr-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
              >
                <LogOut size={15} /> {loading ? "Checking out..." : "I am safe — Check out"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-cr-slate">Set your expected finish time so your manager can check you are safe.</p>
            <div>
              <label className="block text-xs font-medium text-cr-charcoal mb-1">Expected finish time</label>
              <input
                type="datetime-local"
                value={expectedFinish}
                onChange={e => setExpectedFinish(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
              />
            </div>
            <button
              onClick={handleCheckIn}
              disabled={!expectedFinish || loading}
              className="cr-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
            >
              <MapPin size={15} /> {loading ? "Checking in..." : "Check in"}
            </button>
          </div>
        )}
      </CRCard>

      {/* Emergency contacts */}
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">Emergency Contacts</h3>
        <div className="space-y-3">
          {contacts.map((c, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cr-charcoal">{c.first_name} {c.last_name}</p>
                <p className="text-xs text-cr-slate">{ROLE_LABEL[c.role] ?? c.role}</p>
              </div>
              {c.phone && (
                <a href={`tel:${c.phone}`}
                  className="flex items-center gap-1.5 text-sm text-cr-forest font-medium hover:underline">
                  <Phone size={14} /> {c.phone}
                </a>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-cr-charcoal">Emergency Services</p>
              <p className="text-xs text-cr-slate">Police / Ambulance / Fire</p>
            </div>
            <a href="tel:999" className="flex items-center gap-1.5 text-sm text-cr-red font-bold">
              <Phone size={14} /> 999
            </a>
          </div>
        </div>
      </CRCard>
    </div>
  );
}
