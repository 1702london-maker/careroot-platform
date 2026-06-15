"use client";

import { useState, useEffect, use } from "react";
import { AlertTriangle, Phone, CheckCircle, Clock } from "lucide-react";
import { formatDateUK } from "@/lib/utils";

interface PatientData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nhs_number: string;
  dnr_status: boolean;
  address: Record<string, string>;
  gp_details: Record<string, string>;
  emergency_contact: Array<Record<string, string>>;
  medications: Array<{ name: string; dosage: string; frequency: string; route: string; is_active: boolean }>;
  care_agency_name: string;
  care_agency_phone: string;
  last_updated: string;
}

export default function EmergencyAccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [accessTime, setAccessTime] = useState<Date | null>(null);

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) setPin((p) => p + digit);
  };

  const handleSubmit = async () => {
    if (pin.length !== 6) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/emergency/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAttempts((a) => a + 1);
        setPin("");
        setError(attempts >= 2
          ? "Too many incorrect attempts. Contact the care agency directly."
          : "Incorrect PIN. Please try again.");
        setLoading(false);
        return;
      }

      setPatient(data.patient);
      setAccessTime(new Date());
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pin.length === 6) handleSubmit();
  }, [pin]);

  // Access expiry countdown (4 hours)
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!accessTime) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - accessTime.getTime();
      const remaining = 4 * 60 * 60 * 1000 - elapsed;
      if (remaining <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m remaining`);
    }, 60000);
    setTimeLeft("4h 0m remaining");
    return () => clearInterval(interval);
  }, [accessTime]);

  const addressStr = patient?.address
    ? Object.values(patient.address).filter(Boolean).join(", ")
    : "";

  if (patient) {
    return (
      <div className="min-h-screen bg-white font-body">
        {/* Header */}
        <div className="bg-cr-forest text-white px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wide">Emergency Medical Access</p>
              <h1 className="text-xl font-display font-semibold">Careroot</h1>
            </div>
            {timeLeft && (
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <Clock size={14} />
                {timeLeft}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {/* DNR — ALWAYS FIRST */}
          {Boolean(patient.dnr_status) && (
            <div className="bg-cr-red text-white p-5 rounded-xl border-2 border-red-800">
              <div className="flex items-center gap-3">
                <AlertTriangle size={28} strokeWidth={2.5} />
                <div>
                  <p className="text-xl font-body font-bold uppercase tracking-wide">
                    DO NOT RESUSCITATE
                  </p>
                  <p className="text-sm text-white/80">DNR ORDER IN PLACE — Do Not Resuscitate</p>
                </div>
              </div>
            </div>
          )}

          {/* Patient identity */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h2 className="text-2xl font-display font-semibold text-cr-charcoal">
              {patient.first_name} {patient.last_name}
            </h2>
            <div className="mt-3 space-y-1 text-sm font-body text-cr-charcoal">
              <p><span className="text-cr-slate">Date of birth:</span> <strong>{formatDateUK(patient.date_of_birth)}</strong></p>
              {patient.nhs_number && (
                <p><span className="text-cr-slate">NHS Number:</span> <strong>{patient.nhs_number}</strong></p>
              )}
              {addressStr && (
                <p><span className="text-cr-slate">Address:</span> <strong>{addressStr}</strong></p>
              )}
            </div>
          </div>

          {/* Allergies — before medications */}
          {/* Medications */}
          {patient.medications?.filter(m => m.is_active).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">Active Medications</h3>
              <div className="space-y-2">
                {patient.medications.filter(m => m.is_active).map((med, i) => (
                  <div key={i} className="flex flex-wrap gap-2 py-2 border-b border-gray-100 last:border-0">
                    <span className="font-body font-semibold text-cr-charcoal">{med.name}</span>
                    <span className="text-cr-slate font-body text-sm">
                      {med.dosage} · {med.frequency} · {med.route}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GP details */}
          {patient.gp_details && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">GP Details</h3>
              <div className="space-y-1 text-sm font-body">
                {patient.gp_details.name && <p><span className="text-cr-slate">Dr:</span> <strong>{patient.gp_details.name}</strong></p>}
                {patient.gp_details.surgery && <p><span className="text-cr-slate">Surgery:</span> {patient.gp_details.surgery}</p>}
                {patient.gp_details.phone && (
                  <a href={`tel:${patient.gp_details.phone}`} className="flex items-center gap-1.5 text-cr-forest font-medium mt-2">
                    <Phone size={14} />
                    {patient.gp_details.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Emergency contacts */}
          {patient.emergency_contact && patient.emergency_contact.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">Emergency Contacts</h3>
              <div className="space-y-3">
                {(patient.emergency_contact as Array<Record<string, string>>).map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-body font-medium text-cr-charcoal">{c.name}</p>
                      <p className="text-xs font-body text-cr-slate">{c.relationship}</p>
                    </div>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-cr-forest text-sm font-medium">
                        <Phone size={14} />
                        {c.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Care agency */}
          <div className="bg-cr-mint rounded-xl p-5">
            <h3 className="font-display text-base font-semibold text-cr-forest mb-1">Care Provider</h3>
            <p className="text-sm font-body text-cr-charcoal font-medium">{patient.care_agency_name}</p>
            {patient.care_agency_phone && (
              <a href={`tel:${patient.care_agency_phone}`} className="flex items-center gap-1.5 text-cr-forest text-sm font-medium mt-2">
                <Phone size={14} />
                {patient.care_agency_phone}
              </a>
            )}
          </div>

          <p className="text-xs font-body text-cr-slate text-center">
            Record last updated: {formatDateUK(patient.last_updated)} · Powered by Careroot
          </p>
        </div>
      </div>
    );
  }

  // PIN entry screen
  return (
    <div className="min-h-screen bg-cr-forest flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-white mb-2">
            Emergency Medical Access
          </h1>
          <p className="text-sm font-body text-white/70">
            Enter the 6-digit PIN to view patient information
          </p>
        </div>

        {/* PIN display */}
        <div className="flex justify-center gap-3 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-bold transition-all
                ${i < pin.length ? "bg-white text-cr-forest border-white" : "bg-white/10 border-white/30 text-transparent"}`}
            >
              {i < pin.length ? "•" : "0"}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 mb-4 text-center">
            <p className="text-sm font-body text-white">{error}</p>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d) => (
            <button
              key={d}
              onClick={() => {
                if (d === "⌫") setPin((p) => p.slice(0, -1));
                else if (d !== "") handlePinInput(d);
              }}
              disabled={d === "" || loading || attempts >= 3}
              className={`h-16 rounded-xl text-xl font-body font-semibold transition-all
                ${d === "" ? "invisible" : ""}
                ${d === "⌫" ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/15 text-white hover:bg-white/25 active:scale-95"}
                disabled:opacity-40`}
            >
              {d}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-center text-sm font-body text-white/70 mt-4">Verifying...</p>
        )}
      </div>
    </div>
  );
}
