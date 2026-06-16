export type OrgType = "domiciliary" | "supported_living" | "residential" | "internal";
export type OrgPlan = "seed" | "grow" | "scale" | "enterprise";
export type OrgPlanStatus = "trial" | "active" | "suspended" | "cancelled";

export interface Organisation {
  id: string;
  name: string;
  type: OrgType;
  cqc_provider_id?: string;
  ofsted_id?: string;
  address?: Record<string, string>;
  phone?: string;
  on_call_phone?: string;
  email?: string;
  logo_url?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan: OrgPlan;
  plan_status: OrgPlanStatus;
  trial_ends_at?: string;
  max_staff: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type UserRole = "superadmin" | "org_admin" | "manager" | "coordinator" | "carer" | "family" | "gp";

export interface User {
  id: string;
  organisation_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  avatar_url?: string;
  is_active: boolean;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

export type ClientStatus = "active" | "inactive" | "hospital" | "deceased";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Client {
  id: string;
  organisation_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  nhs_number?: string;
  address?: Record<string, string>;
  phone?: string;
  email?: string;
  emergency_contact?: Record<string, unknown>[];
  gp_details?: Record<string, string>;
  status: ClientStatus;
  risk_level: RiskLevel;
  avatar_url?: string;
  cultural_background?: string;
  language_preferences?: string;
  communication_needs?: string;
  dnr_status: boolean;
  notes?: string;
  onboarding_complete: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export type CarePlanCategory =
  | "personal_care" | "dementia" | "learning_disability"
  | "physical_disability" | "end_of_life" | "mental_health"
  | "children_young_people" | "acquired_brain_injury" | "other";

export interface CarePlanTemplate {
  id: string;
  organisation_id: string;
  name: string;
  category?: CarePlanCategory;
  content?: Record<string, unknown>;
  is_system: boolean;
  created_by?: string;
  created_at: string;
}

export type CarePlanStatus = "draft" | "active" | "review" | "archived";

export interface CarePlan {
  id: string;
  client_id: string;
  organisation_id: string;
  title: string;
  summary?: string;
  ai_summary?: string;
  status: CarePlanStatus;
  review_date?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  content: Record<string, unknown>;
  template_id?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CarePlanView {
  id: string;
  care_plan_id: string;
  client_id: string;
  carer_id: string;
  visit_id?: string;
  viewed_at: string;
}

export type VisitStatus = "scheduled" | "in_progress" | "completed" | "missed" | "cancelled";

export interface Visit {
  id: string;
  organisation_id: string;
  client_id: string;
  carer_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  status: VisitStatus;
  check_in_lat?: number;
  check_in_lng?: number;
  check_out_lat?: number;
  check_out_lng?: number;
  notes?: string;
  ai_summary?: string;
  tasks_completed: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export type NoteSentiment = "positive" | "neutral" | "concerning" | "urgent";

export interface VisitNote {
  id: string;
  visit_id: string;
  client_id: string;
  author_id: string;
  organisation_id: string;
  content?: string;
  voice_transcript?: string;
  ai_structured?: {
    observations?: string;
    mood?: string;
    physical_condition?: string;
    concerns?: string;
    actions_taken?: string;
    sentiment?: NoteSentiment;
  };
  risk_flags: Record<string, unknown>[];
  sentiment?: NoteSentiment;
  is_family_visible: boolean;
  is_internal: boolean;
  created_at: string;
}

export interface Medication {
  id: string;
  client_id: string;
  organisation_id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  prescriber?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export type MedRecordStatus = "given" | "refused" | "unavailable" | "not_required";

export interface MedicationRecord {
  id: string;
  medication_id: string;
  client_id: string;
  visit_id?: string;
  administered_by?: string;
  scheduled_time?: string;
  administered_at?: string;
  status: MedRecordStatus;
  notes?: string;
  created_at: string;
}

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "investigating" | "resolved" | "closed";

export interface Incident {
  id: string;
  organisation_id: string;
  client_id: string;
  reported_by?: string;
  visit_id?: string;
  title: string;
  description?: string;
  severity?: IncidentSeverity;
  category?: string;
  status: IncidentStatus;
  is_family_visible: boolean;
  actions_taken?: string;
  reported_at: string;
  resolved_at?: string;
  created_at: string;
}

export interface RiskAssessment {
  id: string;
  client_id: string;
  organisation_id: string;
  type: string;
  score?: number;
  risk_level?: RiskLevel;
  findings?: Record<string, unknown>;
  ai_analysis?: string;
  reviewed_by?: string;
  review_date?: string;
  next_review_date?: string;
  created_at: string;
}

export type ContractType = "full_time" | "part_time" | "zero_hours" | "bank";
export type BurnoutRisk = "low" | "medium" | "high";

export interface StaffRecord {
  id: string;
  user_id: string;
  organisation_id: string;
  job_title?: string;
  contract_type?: ContractType;
  start_date?: string;
  dbs_number?: string;
  dbs_expiry?: string;
  right_to_work_verified: boolean;
  qualifications: Record<string, unknown>[];
  training_records: Record<string, unknown>[];
  wellbeing_score?: number;
  burnout_risk?: BurnoutRisk;
  created_at: string;
  updated_at: string;
}

export type RotaRecurrence = "once" | "weekly" | "fortnightly" | "monthly";

export interface Rota {
  id: string;
  organisation_id: string;
  carer_id: string;
  client_id?: string;
  visit_id?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  recurrence?: RotaRecurrence;
  effective_from?: string;
  effective_to?: string;
  created_at: string;
}

export type ComplianceFramework = "cqc" | "ofsted";
export type ComplianceStatus = "compliant" | "partial" | "non_compliant" | "not_applicable";

export interface ComplianceEvidence {
  id: string;
  organisation_id: string;
  framework?: ComplianceFramework;
  category?: string;
  subcategory?: string;
  evidence_type?: string;
  title?: string;
  description?: string;
  file_url?: string;
  status?: ComplianceStatus;
  score?: number;
  ai_assessment?: string;
  last_reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
}

export type AIFlagSeverity = "low" | "medium" | "high" | "critical";
export type AIFlagStatus = "open" | "acknowledged" | "resolved" | "false_positive";

export interface AIRiskFlag {
  id: string;
  organisation_id: string;
  client_id: string;
  flag_type?: string;
  severity?: AIFlagSeverity;
  description?: string;
  evidence?: Record<string, unknown>;
  status: AIFlagStatus;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface FamilyBriefing {
  id: string;
  client_id: string;
  organisation_id: string;
  content?: string;
  ai_generated: boolean;
  sent_at?: string;
  sent_to?: Record<string, unknown>[];
  period_start?: string;
  period_end?: string;
  created_at: string;
}

export type ComplaintCategory =
  | "care_quality" | "staff_conduct" | "missed_visit"
  | "communication" | "medication" | "food" | "other";

export type ComplaintStatus = "open" | "investigating" | "resolved" | "escalated" | "withdrawn";

export interface Complaint {
  id: string;
  organisation_id: string;
  client_id?: string;
  submitted_by?: string;
  reference_number?: string;
  category?: ComplaintCategory;
  description: string;
  desired_outcome?: string;
  incident_date?: string;
  is_anonymous: boolean;
  wants_cqc_escalation: boolean;
  status: ComplaintStatus;
  manager_response?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export type EmergencyTriggerSource = "carer" | "client" | "family" | "manager";
export type EmergencyStatus = "active" | "resolved" | "false_alarm";

export interface EmergencyEvent {
  id: string;
  organisation_id: string;
  client_id: string;
  triggered_by?: string;
  trigger_source?: EmergencyTriggerSource;
  visit_id?: string;
  lat?: number;
  lng?: number;
  address?: string;
  description?: string;
  notifications_sent: Record<string, unknown>[];
  status: EmergencyStatus;
  resolved_at?: string;
  resolved_by?: string;
  triggered_at: string;
}

export interface EmergencyAccessToken {
  id: string;
  client_id: string;
  organisation_id: string;
  token: string;
  pin: string;
  qr_code_url?: string;
  accessed_at?: string;
  accessed_by_role?: string;
  access_count: number;
  last_access_ip?: string;
  created_at: string;
  updated_at: string;
}

export type FamilyAccessLevel = "limited" | "standard" | "full";

export interface FamilyAccess {
  id: string;
  client_id: string;
  organisation_id: string;
  user_id: string;
  relationship?: string;
  access_level: FamilyAccessLevel;
  can_message_manager: boolean;
  can_submit_complaints: boolean;
  can_suggest_meals: boolean;
  invited_by?: string;
  invite_accepted_at?: string;
  is_active: boolean;
  created_at: string;
}

export type TextureRequirement = "normal" | "soft" | "minced" | "pureed" | "liquidised";

export interface NutritionProfile {
  id: string;
  client_id: string;
  organisation_id: string;
  diet_type?: string;
  allergies: { name: string; severity: string }[];
  intolerances: { name: string; reaction: string }[];
  liked_foods: string[];
  disliked_foods: string[];
  texture_requirement?: TextureRequirement;
  fluid_requirement_ml?: number;
  thickened_fluids: boolean;
  thickened_fluid_level?: string;
  supplements: { name: string; dosage: string; frequency: string }[];
  eating_assistance: Record<string, unknown>;
  cultural_notes?: string;
  special_occasions?: string;
  created_at: string;
  updated_at: string;
}

export type MealTime =
  | "breakfast" | "morning_snack" | "lunch"
  | "afternoon_snack" | "dinner" | "evening_snack";

export type MealFrequency = "daily" | "weekly" | "occasionally" | "special_occasion";

export interface MealPreference {
  id: string;
  client_id: string;
  organisation_id: string;
  meal_time?: MealTime;
  name: string;
  description?: string;
  steps: { step: number; instruction: string }[];
  notes?: string;
  warnings?: string;
  is_favourite: boolean;
  frequency?: MealFrequency;
  day_of_week?: number[];
  suggested_by?: "client" | "family" | "manager" | "carer";
  approved_by?: string;
  is_active: boolean;
  created_at: string;
}

export type ConsumptionLevel = "all" | "most" | "half" | "little" | "refused";

export interface MealRecord {
  id: string;
  visit_id?: string;
  client_id: string;
  carer_id?: string;
  meal_preference_id?: string;
  meal_time?: string;
  meal_name?: string;
  consumption_level?: ConsumptionLevel;
  fluid_intake_ml?: number;
  assistance_provided?: string;
  notes?: string;
  ai_flag: boolean;
  recorded_at: string;
}

export interface MealSuggestion {
  id: string;
  client_id: string;
  organisation_id: string;
  suggested_by?: string;
  meal_name?: string;
  description?: string;
  steps: { step: number; instruction: string }[];
  cultural_context?: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

// ── Invoicing ──────────────────────────────────────────────────────────────
export interface RateCard {
  id: string; organisation_id: string; name: string;
  funder_type: 'local_authority' | 'nhs' | 'private' | 'mixed';
  hourly_rate: number; visit_rate: number; overnight_rate: number;
  travel_rate_per_mile: number; currency: string; is_default: boolean;
  created_at: string; updated_at: string;
}
export interface ClientBilling {
  id: string; client_id: string; organisation_id: string; rate_card_id: string;
  funder_type: string; local_authority_name: string; local_authority_ref: string;
  private_rate_override: number; split_billing: boolean; la_percentage: number;
  private_percentage: number; billing_email: string;
  billing_address: Record<string, unknown>; payment_terms_days: number;
}
export interface Invoice {
  id: string; organisation_id: string; client_id: string; invoice_number: string;
  funder_type: string; status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'void';
  issue_date: string; due_date: string; period_start: string; period_end: string;
  subtotal: number; vat_rate: number; vat_amount: number; total: number;
  amount_paid: number; amount_outstanding: number; notes: string;
  payment_reference: string; paid_at: string; sent_at: string; pdf_url: string;
  line_items?: InvoiceLineItem[];
  clients?: { first_name: string; last_name: string };
}
export interface InvoiceLineItem {
  id: string; invoice_id: string; visit_id: string; description: string;
  date: string; quantity: number; unit: string; unit_price: number; total: number;
}
// ── Payroll ────────────────────────────────────────────────────────────────
export interface CarerPayRate {
  id: string; user_id: string; organisation_id: string; hourly_rate: number;
  overtime_rate: number; weekend_rate: number; bank_holiday_rate: number;
  travel_rate_per_mile: number; effective_from: string; effective_to: string;
}
export interface PayrollRun {
  id: string; organisation_id: string; period_start: string; period_end: string;
  status: 'draft' | 'processing' | 'approved' | 'exported' | 'paid';
  total_gross: number; total_carers: number; total_hours: number; total_visits: number;
  approved_by: string; approved_at: string; notes: string;
  carer_summaries?: PayrollCarerSummary[];
}
export interface PayrollCarerSummary {
  id: string; payroll_run_id: string; carer_id: string; organisation_id: string;
  total_visits: number; total_hours: number; total_miles: number;
  regular_pay: number; overtime_pay: number; travel_pay: number; gross_pay: number;
  visit_breakdown: unknown[]; carer?: User;
}
