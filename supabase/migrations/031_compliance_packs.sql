-- Migration 31: Compliance Packs, Standards, Rules

CREATE TABLE IF NOT EXISTS compliance_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid REFERENCES service_lines(id),
  name text NOT NULL,
  version text NOT NULL,
  effective_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid REFERENCES compliance_packs(id),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  display_order integer
);

CREATE TABLE IF NOT EXISTS compliance_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id uuid REFERENCES compliance_standards(id),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  rule_type text NOT NULL,
  -- 'document_required' | 'expiry_check' | 'training_required'
  -- | 'log_frequency' | 'medication_check' | 'safeguarding_process'
  is_mandatory boolean DEFAULT true,
  applies_to text,
  -- 'staff' | 'client' | 'organisation' | 'shift'
  applies_to_role text[]
);

ALTER TABLE compliance_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY compliance_packs_read ON compliance_packs FOR SELECT USING (true);
CREATE POLICY compliance_standards_read ON compliance_standards FOR SELECT USING (true);
CREATE POLICY compliance_rules_read ON compliance_rules FOR SELECT USING (true);

-- Seed CQC pack
INSERT INTO compliance_packs (service_line_id, name, version, effective_date)
SELECT id, 'CQC Single Assessment Framework', '2023', '2023-11-01'
FROM service_lines WHERE code = 'DOM_CARE'
ON CONFLICT DO NOTHING;

-- Seed CQC standards
INSERT INTO compliance_standards (pack_id, code, name, display_order)
SELECT cp.id, s.code, s.name, s.display_order
FROM compliance_packs cp,
(VALUES
  ('SAFE', 'Safe', 1),
  ('EFFECTIVE', 'Effective', 2),
  ('CARING', 'Caring', 3),
  ('RESPONSIVE', 'Responsive', 4),
  ('WELL_LED', 'Well-Led', 5)
) AS s(code, name, display_order)
WHERE cp.name = 'CQC Single Assessment Framework'
ON CONFLICT DO NOTHING;
