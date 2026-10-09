export type MedicineType =
  | 'tablet'
  | 'syrup'
  | 'injection'
  | 'drops'
  | 'cream'
  | 'inhaler';

export type ScheduleTiming =
  | 'custom_interval'
  | 'before_breakfast'
  | 'after_breakfast'
  | 'before_lunch'
  | 'after_lunch'
  | 'before_dinner'
  | 'after_dinner'
  | 'before_sleep'
  | 'after_wake';

export type PrescriptionSource = 'doctor' | 'personal';

export interface FamilyProfile {
  id: string;
  name: string;
  relation: string; // e.g. "self" | "father" | "mother" | "child" | "spouse" | "other"
  age?: string;
  notes?: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
  driveSheetId?: string;
  driveSheetUrl?: string;
  created_at: string;
}

export interface GoogleAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  mainDriveFolderId?: string;
  mainDriveFolderUrl?: string;
}

export interface Medicine {
  id: string;
  user_id?: string;
  profile_id?: string; // Links medicine to a specific family member profile
  name: string;
  strength: string;
  dose: string;
  pills_per_dose: number;
  times_per_day: number;
  schedule: ScheduleTiming;
  first_dose_time: string; // ISO string
  duration: number; // in days
  notes: string;
  type: MedicineType;
  created_at: string;

  // New Clinical & Prescription Source Details
  prescription_source?: PrescriptionSource;
  doctor_name?: string;
  clinic_name?: string;
  clinic_coordinates?: string; // e.g. "25.6872, 32.6396"
  next_visit_time?: string; // ISO string for doctor follow-up visit
  next_visit_reminder?: boolean;

  // Patient Profile Details
  patient_name?: string;
  patient_age?: string;
  visit_date?: string;
}

export interface DoseSchedule {
  id: string;
  medicine_id: string;
  dose_time: string; // ISO string
  taken: boolean;
  taken_at?: string; // ISO string
  skipped?: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  medicine_id: string;
  reminder_time: string; // ISO string
  status: 'pending' | 'sent' | 'acknowledged' | 'dismissed';
  created_at: string;
}

export interface UserSettings {
  breakfast_time: string; // e.g. "08:00"
  lunch_time: string; // e.g. "14:00"
  dinner_time: string; // e.g. "20:00"
  sleep_time: string; // e.g. "23:00"
  wake_time: string; // e.g. "07:00"
  sound_enabled: boolean;
  vibration_enabled: boolean;
  language: 'ar' | 'en';
  theme?: 'light' | 'dark';
  supabase_url?: string;
  supabase_anon_key?: string;
}

export interface DoseWithMedicine extends DoseSchedule {
  medicine: Medicine;
}
