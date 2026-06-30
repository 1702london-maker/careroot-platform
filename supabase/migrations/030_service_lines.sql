-- Migration 30: Service Lines
-- Three regulated service lines sharing one platform

CREATE TABLE IF NOT EXISTS service_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  regulatory_body text,
  compliance_framework text,
  is_active boolean DEFAULT true
);

INSERT INTO service_lines (code, name, regulatory_body, compliance_framework)
VALUES
  ('DOM_CARE', 'Domiciliary Care', 'CQC', 'CQC Single Assessment Framework'),
  ('SUPPORT_OUTREACH', 'Support Outreach 14-17', 'LOCAL_AUTHORITY', 'Working Together to Safeguard Children 2023'),
  ('OFSTED_CHILDREN', 'Children Regulated Services', 'OFSTED', 'Ofsted Social Care Common Inspection Framework')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE service_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_lines_read ON service_lines FOR SELECT USING (true);
