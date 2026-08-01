import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/session-user";
import { createServiceClient } from "@/lib/supabase/server";
import { isSafeStoragePath } from "@/lib/storage-paths";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireSessionUser(["org_admin", "manager", "coordinator"]);
  if (error || !user) return error;

  const { id } = await params;
  const service = await createServiceClient();
  const { data: document } = await service
    .from("client_documents")
    .select("id, organisation_id, client_id, file_path")
    .eq("id", id)
    .eq("organisation_id", user.organisation_id)
    .single();

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { error: deleteError } = await service
    .from("client_documents")
    .delete()
    .eq("id", id)
    .eq("organisation_id", user.organisation_id);

  if (deleteError) {
    console.error("client document delete error:", deleteError);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }

  if (document.file_path && isSafeStoragePath(document.file_path, user.organisation_id, document.client_id)) {
    await service.storage.from("client-documents").remove([document.file_path]);
  }

  return NextResponse.json({ ok: true });
}
