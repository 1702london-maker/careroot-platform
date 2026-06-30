-- Seed Ofsted (Children's Services) and Local Authority (Support Outreach)
-- compliance packs + standards, completing BUILD_SPEC B2.
-- CQC pack was seeded in 031. Idempotent via NOT EXISTS guards.

-- ── Ofsted pack (Social Care Common Inspection Framework) ──
INSERT INTO compliance_packs (service_line_id, name, version, effective_date)
SELECT sl.id, 'Ofsted Social Care Common Inspection Framework', '2023', '2023-01-01'
FROM service_lines sl
WHERE sl.code = 'OFSTED_CHILDREN'
  AND NOT EXISTS (
    SELECT 1 FROM compliance_packs cp WHERE cp.name = 'Ofsted Social Care Common Inspection Framework'
  );

INSERT INTO compliance_standards (pack_id, code, name, display_order)
SELECT cp.id, s.code, s.name, s.display_order
FROM compliance_packs cp,
(VALUES
  ('QUALITY_SUPPORT', 'Quality of Support', 1),
  ('BEHAVIOUR_ATTITUDES', 'Behaviour and Attitudes', 2),
  ('PERSONAL_DEVELOPMENT', 'Personal Development', 3),
  ('LEADERSHIP_MGMT', 'Leadership and Management', 4),
  ('POSITIVE_BEHAVIOUR_SUPPORT', 'Positive Behaviour Support', 5)
) AS s(code, name, display_order)
WHERE cp.name = 'Ofsted Social Care Common Inspection Framework'
  AND NOT EXISTS (
    SELECT 1 FROM compliance_standards cs WHERE cs.pack_id = cp.id AND cs.code = s.code
  );

-- ── Local Authority pack (Support Outreach 14–17) ──
INSERT INTO compliance_packs (service_line_id, name, version, effective_date)
SELECT sl.id, 'Working Together to Safeguard Children', '2023', '2023-12-01'
FROM service_lines sl
WHERE sl.code = 'SUPPORT_OUTREACH'
  AND NOT EXISTS (
    SELECT 1 FROM compliance_packs cp WHERE cp.name = 'Working Together to Safeguard Children'
  );

INSERT INTO compliance_standards (pack_id, code, name, display_order)
SELECT cp.id, s.code, s.name, s.display_order
FROM compliance_packs cp,
(VALUES
  ('SAFEGUARDING', 'Safeguarding and Escalation', 1),
  ('CONTEXTUAL_SAFEGUARDING', 'Contextual Safeguarding', 2),
  ('PMVA', 'PMVA and Physical Intervention', 3),
  ('COUNTY_LINES', 'County Lines Awareness', 4),
  ('WEEKLY_REPORTING', 'Weekly Local Authority Reporting', 5)
) AS s(code, name, display_order)
WHERE cp.name = 'Working Together to Safeguard Children'
  AND NOT EXISTS (
    SELECT 1 FROM compliance_standards cs WHERE cs.pack_id = cp.id AND cs.code = s.code
  );
