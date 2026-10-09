import {
  Medicine,
  DoseSchedule,
  Reminder,
  UserSettings,
  FamilyProfile,
  GoogleAuthUser,
} from '../types/mediflow';
import { calculateDosesAndReminders } from './doseCalculator';

export const DEFAULT_SETTINGS: UserSettings = {
  breakfast_time: '08:00',
  lunch_time: '14:00',
  dinner_time: '20:00',
  sleep_time: '23:00',
  wake_time: '07:00',
  sound_enabled: true,
  vibration_enabled: true,
  language: 'ar',
  theme: 'light',
  supabase_url: '',
  supabase_anon_key: '',
};

const STORAGE_KEYS = {
  MEDICINES: 'mediflow_medicines_v1',
  DOSES: 'mediflow_doses_v1',
  REMINDERS: 'mediflow_reminders_v1',
  SETTINGS: 'mediflow_settings_v1',
  PROFILES: 'mediflow_family_profiles_v1',
  ACTIVE_PROFILE: 'mediflow_active_profile_v1',
  GOOGLE_USER: 'mediflow_google_user_v1',
};

export const DEFAULT_PROFILES: FamilyProfile[] = [
  {
    id: 'profile-self',
    name: 'أنا (الملف الشخصي)',
    relation: 'self',
    created_at: new Date().toISOString(),
  },
  {
    id: 'profile-father',
    name: 'والدي',
    relation: 'father',
    age: '68',
    created_at: new Date().toISOString(),
  },
  {
    id: 'profile-mother',
    name: 'والدتي',
    relation: 'mother',
    age: '63',
    created_at: new Date().toISOString(),
  },
];

export function loadProfiles(): FamilyProfile[] {
  if (typeof window === 'undefined') return DEFAULT_PROFILES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!raw) return DEFAULT_PROFILES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROFILES;
  } catch {
    return DEFAULT_PROFILES;
  }
}

export function saveProfiles(profiles: FamilyProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save profiles:', e);
  }
}

export function loadActiveProfileId(): string {
  if (typeof window === 'undefined') return 'profile-self';
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE) || 'profile-self';
  } catch {
    return 'profile-self';
  }
}

export function saveActiveProfileId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, id);
  } catch (e) {
    console.error('Failed to save active profile id:', e);
  }
}

export function loadGoogleUser(): GoogleAuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GOOGLE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGoogleUser(user: GoogleAuthUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.GOOGLE_USER);
    }
  } catch (e) {
    console.error('Failed to save google user:', e);
  }
}

export function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadMedicines(): Medicine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEDICINES);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    // If a Google user is authenticated, start with a pristine empty list
    const user = loadGoogleUser();
    if (user) {
      saveMedicines([]);
      return [];
    }
    // Otherwise in guest demo mode, return sample medicines
    return getInitialSampleMedicines();
  } catch {
    return [];
  }
}

export function saveMedicines(medicines: Medicine[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
  } catch (e) {
    console.error('Failed to save medicines:', e);
  }
}

export function loadDoses(): DoseSchedule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOSES);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    const user = loadGoogleUser();
    if (user) {
      saveDoses([]);
      return [];
    }
    const initialMeds = getInitialSampleMedicines();
    const settings = loadSettings();
    let allDoses: DoseSchedule[] = [];
    initialMeds.forEach((m) => {
      const { doses } = calculateDosesAndReminders(m, settings);
      allDoses = [...allDoses, ...doses];
    });
    // Mark some past doses as taken for realistic initial adherence
    const now = Date.now();
    allDoses.forEach((d) => {
      if (new Date(d.dose_time).getTime() < now) {
        d.taken = true;
        d.taken_at = d.dose_time;
      }
    });
    saveDoses(allDoses);
    return allDoses;
  } catch {
    return [];
  }
}

export function saveDoses(doses: DoseSchedule[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.DOSES, JSON.stringify(doses));
  } catch (e) {
    console.error('Failed to save doses:', e);
  }
}

export function loadReminders(): Reminder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveReminders(reminders: Reminder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  } catch (e) {
    console.error('Failed to save reminders:', e);
  }
}

export function getInitialSampleMedicines(): Medicine[] {
  const today = new Date();
  today.setHours(8, 0, 0, 0);

  const nextVisit = new Date();
  nextVisit.setDate(today.getDate() + 7);
  nextVisit.setHours(11, 0, 0, 0);

  return [
    {
      id: 'med-sample-1',
      name: 'قطرة مرطبة للعين (Lubricant Eye Drops)',
      strength: '15ml',
      dose: 'قطرة بالعين',
      pills_per_dose: 1,
      times_per_day: 3,
      schedule: 'custom_interval',
      first_dose_time: today.toISOString(),
      duration: 14,
      notes: 'قطرة 3 مرات يومياً لمدة أسبوعين لترطيب العين ومنع الجفاف',
      type: 'drops',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      prescription_source: 'doctor',
      doctor_name: 'د. معاذ عطيتو (طبيب وجراح العيون)',
      clinic_name: 'مستشفى الأقصر الدولي - عيادة جراحة العيون',
      clinic_coordinates: '25.6872, 32.6396',
      next_visit_time: nextVisit.toISOString(),
      next_visit_reminder: true,
      patient_name: 'أحمد سيف',
      patient_age: '16',
      visit_date: '2024-11-24',
    },
    {
      id: 'med-sample-2',
      name: 'مسكن ومضاد للالتهاب (Analgesic Drug TAB)',
      strength: '500mg',
      dose: 'قرص واحد',
      pills_per_dose: 1,
      times_per_day: 2,
      schedule: 'after_lunch',
      first_dose_time: new Date(today.getTime() + 30 * 60000).toISOString(),
      duration: 7,
      notes: 'قرص بعد الأكل مرتين يومياً لمدة أسبوع "ولا يكرر"',
      type: 'tablet',
      created_at: new Date(Date.now() - 43200000).toISOString(),
      prescription_source: 'doctor',
      doctor_name: 'د. معاذ عطيتو (طبيب وجراح العيون)',
      clinic_name: 'مستشفى الأقصر الدولي - عيادة جراحة العيون',
      clinic_coordinates: '25.6872, 32.6396',
      patient_name: 'أحمد سيف',
      patient_age: '16',
      visit_date: '2024-11-24',
    },
    {
      id: 'med-sample-3',
      name: 'مرهم مضاد حيوي للعين (Antibiotic Eye Ointment)',
      strength: '5g',
      dose: 'مرهم داخل الجفن',
      pills_per_dose: 1,
      times_per_day: 1,
      schedule: 'before_sleep',
      first_dose_time: today.toISOString(),
      duration: 7,
      notes: 'يوضع داخل جفن العين مساءً قبل النوم لمدة أسبوع',
      type: 'cream',
      created_at: new Date().toISOString(),
      prescription_source: 'doctor',
      doctor_name: 'د. معاذ عطيتو (طبيب وجراح العيون)',
      clinic_name: 'مستشفى الأقصر الدولي - عيادة جراحة العيون',
      clinic_coordinates: '25.6872, 32.6396',
      patient_name: 'أحمد سيف',
      patient_age: '16',
      visit_date: '2024-11-24',
    },
  ];
}

export function resetAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DOSES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
}

export function wipeAccountAndAllData(): void {
  if (typeof window === 'undefined') return;
  // Clear all application keys completely
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
  sessionStorage.removeItem('mediflow_view_mode');
}
