"use client";

import { useState } from "react";
import { ShiftLoginScreen } from "./ShiftLoginScreen";
import { ShiftActiveHub } from "./ShiftActiveHub";

interface Props {
  shift: Record<string, unknown>;
  clients: Record<string, unknown>[];
  credential: Record<string, unknown> | null;
  carePlans: Record<string, unknown>[];
  staffId: string;
}

export function ShiftHub({ shift, clients, credential, carePlans, staffId }: Props) {
  const [shiftStarted, setShiftStarted] = useState(shift.status === "active");

  if (!shiftStarted) {
    return (
      <ShiftLoginScreen
        shift={shift}
        credential={credential}
        onSuccess={() => setShiftStarted(true)}
      />
    );
  }

  return (
    <ShiftActiveHub
      shift={shift}
      clients={clients}
      carePlans={carePlans}
      staffId={staffId}
    />
  );
}
