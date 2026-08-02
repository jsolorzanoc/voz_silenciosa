/**
 * Tipos de dominio del frontend.
 *
 * Espejo de los tipos de `supabase/functions/_shared/scoring.ts`.
 * El navegador solo consume el resultado que devuelve la Edge Function:
 * nunca calcula puntajes (DoD HU-04).
 */

export type Instrument = 'phq9' | 'gad7';

export type RiskLevel =
  'minimo' | 'leve' | 'moderado' | 'moderadamente_severo' | 'severo';

export type Resource = 'autoayuda' | 'consejeria' | 'crisis';

export interface ScoreResponse {
  assessmentId: string;
  instrument: Instrument;
  total: number;
  level: RiskLevel;
  crisis: boolean;
  resource: Resource;
}

export type Modality = 'presencial' | 'virtual' | 'mixta';
export type Schedule = 'diurno' | 'vespertino' | 'nocturno' | '24h';

export interface Service {
  id: string;
  university_id: string | null;
  name: string;
  description: string | null;
  specialty: string | null;
  modality: Modality;
  schedule: Schedule;
  contact: string | null;
}

export interface University {
  id: string;
  name: string;
  email_domain: string;
}

export interface EmergencyLine {
  id: string;
  name: string;
  phone: string;
  description: string | null;
  is_backup: boolean;
  verified: boolean;
  active: boolean;
  priority: number;
}

export interface Profile {
  id: string;
  pseudonym: string;
  university_id: string;
  role: 'student' | 'admin';
}

export interface SupportGroup {
  id: string;
  university_id: string | null;
  name: string;
  topic: string;
  description: string | null;
  active: boolean;
}

export interface GroupSession {
  id: string;
  group_id: string;
  title: string;
  starts_at: string;
  modality: 'presencial' | 'virtual';
  location: string | null;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  author_pseudonym: string;
  content: string;
  flagged: boolean;
  hidden: boolean;
  created_at: string;
}

export interface AdminOverview {
  students: number;
  admins: number;
  groups_active: number;
  assessments_total: number;
  crisis_total: number;
  flagged_pending: number;
}

export interface AssessmentStat {
  instrument: Instrument;
  level: RiskLevel;
  total: number;
}

export interface ReferralStat {
  resource: Resource;
  total: number;
}

export interface HelpStat {
  day: string;
  channel: 'principal' | 'respaldo';
  total: number;
}
