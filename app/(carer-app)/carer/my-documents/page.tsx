import { createClient } from "@/lib/supabase/server";
import { CarerMyDocumentsClient } from "@/components/carer/CarerMyDocumentsClient";

export default async function CarerMyDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: documents }, { data: training }, { data: policies }] = await Promise.all([
    supabase.from("staff_documents").select("*").eq("staff_id", user!.id).order("document_category"),
    supabase.from("staff_training").select("*").eq("staff_id", user!.id).order("training_category"),
    supabase.from("policy_acknowledgements").select("*").eq("staff_id", user!.id).order("created_at"),
  ]);

  return (
    <CarerMyDocumentsClient
      documents={documents ?? []}
      training={training ?? []}
      policies={policies ?? []}
    />
  );
}
