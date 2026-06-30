-- Migration 46: Shift Financial Records and Commissioner Invoices

-- Financial record per shift: hours, travel, mileage
CREATE TABLE IF NOT EXISTS shift_financial_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id),
  client_id uuid REFERENCES clients(id),
  staff_id uuid REFERENCES users(id),
  commissioned_hours decimal NOT NULL,
  actual_hours decimal, -- derived from actual_start and actual_end
  travel_time_minutes integer,
  mileage_claimed_miles decimal,
  mileage_claimed_at timestamptz,
  invoice_id uuid, -- FK to commissioner_invoices added below
  billable_amount decimal,
  created_at timestamptz DEFAULT now()
);

-- Commissioner invoices: aggregate of shift financial records per period
CREATE TABLE IF NOT EXISTS commissioner_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  client_id uuid REFERENCES clients(id),
  service_line_id uuid REFERENCES service_lines(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  shift_ids uuid[],
  total_hours decimal NOT NULL,
  rate_per_hour decimal NOT NULL,
  total_amount decimal NOT NULL,
  evidence_pack_url text,
  status text DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'disputed')),
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add FK from shift_financial_records to commissioner_invoices now that it exists
ALTER TABLE shift_financial_records
  ADD CONSTRAINT IF NOT EXISTS fk_sfr_invoice
  FOREIGN KEY (invoice_id) REFERENCES commissioner_invoices(id);

CREATE INDEX IF NOT EXISTS idx_shift_financial_shift ON shift_financial_records(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_financial_staff ON shift_financial_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_commissioner_invoices_client ON commissioner_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_commissioner_invoices_status ON commissioner_invoices(status);
CREATE INDEX IF NOT EXISTS idx_commissioner_invoices_org ON commissioner_invoices(organisation_id);

ALTER TABLE shift_financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissioner_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY shift_financial_org ON shift_financial_records
  FOR ALL USING (
    staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY commissioner_invoices_org ON commissioner_invoices
  FOR ALL USING (
    organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
  );
