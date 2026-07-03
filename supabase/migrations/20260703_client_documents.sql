-- Client documents table
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'assessment',
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage client documents"
  ON client_documents FOR ALL
  USING (
    organisation_id IN (
      SELECT organisation_id FROM users WHERE id = auth.uid()
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS client_documents_client_id_idx ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS client_documents_org_id_idx ON client_documents(organisation_id);
