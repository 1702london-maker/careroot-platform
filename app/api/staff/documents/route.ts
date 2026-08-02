import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/session-user";
import { createServiceClient } from "@/lib/supabase/server";
import { buildStoragePath, safeStorageFileName, sanitizeStoragePath } from "@/lib/storage-paths";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { user, error } = await requireSessionUser(["org_admin", "manager", "coordinator"]);
  if (error || !user) return error;

  const formData = await req.formData();
  const staffId = String(formData.get("staff_id") ?? "");
  const documentKey = String(formData.get("document_key") ?? "uploaded_document");
  const documentLabel = String(formData.get("document_label") ?? "Uploaded document");
  const documentCategory = String(formData.get("document_category") ?? "compliance");
  const expiryDate = String(formData.get("expiry_date") ?? "") || null;
  const issueDate = String(formData.get("issue_date") ?? "") || null;
  const file = formData.get("file");

  if (!staffId || !(file instanceof File)) {
    return NextResponse.json({ error: "staff_id and file are required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large. Maximum size is 50MB." }, { status: 400 });
  }

  const service = await createServiceClient();
  const { data: staff } = await service
    .from("users")
    .select("id, organisation_id")
    .eq("id", staffId)
    .eq("organisation_id", user.organisation_id)
    .single();

  if (!staff) {
    return NextResponse.json({ error: "Staff member not found for your organisation" }, { status: 404 });
  }

  const fileName = safeStorageFileName(file.name || "staff-document");
  const filePath = sanitizeStoragePath(
    buildStoragePath(user.organisation_id, staffId, `${crypto.randomUUID()}-${fileName}`),
    user.organisation_id,
    staffId,
  );
  const bytes = Buffer.from(await file.arrayBuffer());

  const { data: existingDocument } = await service
    .from("staff_documents")
    .select("file_path")
    .eq("staff_id", staffId)
    .eq("document_key", documentKey)
    .maybeSingle();

  const { error: uploadError } = await service.storage
    .from("staff-documents")
    .upload(filePath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    console.error("staff document upload error:", uploadError);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }

  const { data: signed } = await service.storage
    .from("staff-documents")
    .createSignedUrl(filePath, 60 * 60);

  const { data: document, error: upsertError } = await service
    .from("staff_documents")
    .upsert({
      organisation_id: user.organisation_id,
      staff_id: staffId,
      document_category: documentCategory,
      document_key: documentKey,
      document_label: documentLabel,
      file_name: fileName,
      file_url: signed?.signedUrl ?? filePath,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream",
      issue_date: issueDate,
      expiry_date: expiryDate,
      status: "uploaded",
      updated_at: new Date().toISOString(),
    }, { onConflict: "staff_id,document_key" })
    .select()
    .single();

  if (upsertError) {
    console.error("staff document upsert error:", upsertError);
    await service.storage.from("staff-documents").remove([
      sanitizeStoragePath(filePath, user.organisation_id, staffId),
    ]);
    return NextResponse.json({ error: "Failed to save document record" }, { status: 500 });
  }

  const oldFilePath = existingDocument?.file_path;
  if (oldFilePath && oldFilePath !== filePath) {
    try {
      await service.storage.from("staff-documents").remove([
        sanitizeStoragePath(oldFilePath, user.organisation_id, staffId),
      ]);
    } catch (pathError) {
      console.error("unsafe old staff document path skipped:", pathError);
    }
  }

  return NextResponse.json({ document }, { status: 201 });
}
