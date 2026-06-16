"use client";

import { useState } from "react";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { Plus } from "lucide-react";
import { ComplaintForm } from "./ComplaintForm";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

export function ComplaintsHeader({ clients }: { clients: Client[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <CRPageHeader
        title="Complaints"
        subtitle="28-day response target from date of receipt"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="cr-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus size={16} /> New Complaint
          </button>
        }
      />
      {showForm && <ComplaintForm clients={clients} onClose={() => setShowForm(false)} />}
    </>
  );
}
