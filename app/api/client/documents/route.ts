import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/session-user";
import { createServiceClient } from "@/lib/supabase/server";
import { buildStoragePath, safeStorageFileName } from "@/lib/storage-paths";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { user, error } = await requireSessionUser(["org_admin", "manager", "coordinator"]);
  if (error || !user) return error;

  const formData = await req.formData();
  const clientId = String(formData.get("client_id") ?? "");
  const category = String(formData.get("category") ?? "assessment");
  const file = formData.get("file");

  if (!clientId || !(file instanceof File)) {
    return NextResponse.json({ error: "client_id and file are required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large. Maximum size is 50MB." }, { status: 400 });
  }

  const service = await createServiceClient();
  const { data: client } = await service
    .from("clients")
    .select("id, organisation_id")
    .eq("id", clientId)
    .eq("organisation_id", user.organisation_id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found for your organisation" }, { status: 404 });
  }

  const fileName = safeStorageFileName(file.name || "client-document");
  const filePath = buildStoragePath(user.organisation_id, clientId, `${crypto.randomUUID()}-${fileName}`);
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await service.storage
    .from("client-documents")
    .upload(filePath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    console.error("client document upload error:", uploadError);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }

  const { data: signed } = await service.storage
    .from("client-documents")
    .createSignedUrl(filePath, 60 * 60);

  const { data: document, error: insertError } = await service
    .from("client_documents")
    .insert({
      organisation_id: user.organisation_id,
      client_id: clientId,
      file_name: fileName,
      file_url: signed?.signedUrl ?? filePath,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream",
      category,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error("client document insert error:", insertError);
    await service.storage.from("client-documents").remove([filePath]);
    return NextResponse.json({ error: "Failed to save document record" }, { status: 500 });
  }

  return NextResponse.json({ document }, { status: 201 });
}
