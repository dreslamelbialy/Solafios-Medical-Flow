import React, { useState, useEffect, useMemo } from 'react';
import {
  Pill,
  Calendar,
  Bell,
  History,
  Settings,
  Camera,
  Plus,
  CheckCircle2,
  Clock,
  HeartPulse,
  Share2,
  Download,
  Languages,
  Sparkles,
  Printer,
  Users,
  Cloud,
  LogOut,
  ExternalLink,
  Home,
  Check,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import {
  Medicine,
  DoseSchedule,
  Reminder,
  UserSettings,
  FamilyProfile,
  GoogleAuthUser,
} from './types/mediflow';
import {
  loadSettings,
  saveSettings,
  loadMedicines,
  saveMedicines,
  loadDoses,
  saveDoses,
  loadReminders,
  saveReminders,
  loadProfiles,
  saveProfiles,
  loadActiveProfileId,
  saveActiveProfileId,
  loadGoogleUser,
  saveGoogleUser,
  resetAllData,
  wipeAccountAndAllData,
  getInitialSampleMedicines,
  DEFAULT_PROFILES,
} from './utils/storage';
import { calculateDosesAndReminders, calculateAdherence } from './utils/doseCalculator';
import { getSupabaseClient, syncMedicineToSupabase } from './lib/supabaseClient';
import { globalReminderScheduler } from './utils/notificationService';
import {
  googleSignIn,
  googleSignOut,
  initAuth,
  getAccessToken,
} from './lib/googleAuth';
import { syncRelativeMedicinesToSheet } from './lib/googleDriveSync';

import { LandingPage } from './components/LandingPage';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileSwitcher } from './components/ProfileSwitcher';
import { AddMedicineTab } from './components/AddMedicineTab';
import { ScheduleTab } from './components/ScheduleTab';
import { RemindersTab } from './components/RemindersTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsTab } from './components/SettingsTab';
import { ScanPrescriptionTab } from './components/ScanPrescriptionTab';
import { PrintPrescriptionModal } from './components/PrintPrescriptionModal';
import { AuthErrorModal } from './components/AuthErrorModal';

type ActiveTab = 'add' | 'schedule' | 'reminders' | 'history' | 'settings' | 'scan';
type ViewMode = 'landing' | 'app';

export default function App() {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('mediflow_view_mode') as ViewMode | null;
      if (saved === 'app' || saved === 'landing') return saved;
    }
    return 'landing';
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mediflow_view_mode', mode);
    }
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const [settings, setSettingsState] = useState<UserSettings>(loadSettings);
  const [medicines, setMedicines] = useState<Medicine[]>(loadMedicines);
  const [doses, setDoses] = useState<DoseSchedule[]>(loadDoses);
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);

  // Multi-profile family management state
  const [profiles, setProfiles] = useState<FamilyProfile[]>(loadProfiles);
  const [activeProfileId, setActiveProfileIdState] = useState<string>(loadActiveProfileId);
  const [googleUser, setGoogleUserState] = useState<GoogleAuthUser | null>(loadGoogleUser);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Auth notice modal for Vercel / domain authorization issues
  const [authErrorModal, setAuthErrorModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    isDomainIssue: boolean;
  }>({ show: false, title: '', message: '', isDomainIssue: false });

  // Modals state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showAllFamilyFilter, setShowAllFamilyFilter] = useState(false);

  const lang = settings.language || 'ar';
  const isAr = lang === 'ar';
  const isDark = (settings.theme || 'light') === 'dark';

  // Synchronize document dir and title based on lang
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isAr ? 'rtl' : 'ltr';
      document.documentElement.lang = isAr ? 'ar' : 'en';
    }
  }, [isAr]);

  // Synchronize dark theme class on document element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    const newTheme: 'light' | 'dark' = isDark ? 'light' : 'dark';
    const updated: UserSettings = { ...settings, theme: newTheme };
    setSettingsState(updated);
    saveSettings(updated);
  };

  const handleToggleLang = () => {
    const newLang: 'ar' | 'en' = isAr ? 'en' : 'ar';
    const updated: UserSettings = { ...settings, language: newLang };
    setSettingsState(updated);
    saveSettings(updated);
  };

  // Initialize Google Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        const authUser: GoogleAuthUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        setGoogleUserState(authUser);
        saveGoogleUser(authUser);
      },
      () => {
        // user signed out or token expired
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Synchronize reminders with browser Notification scheduler
  useEffect(() => {
    globalReminderScheduler.syncReminders(
      reminders,
      medicines,
      settings,
      (triggeredReminderId) => {
        setReminders((prev) => {
          const updated = prev.map((r) =>
            r.id === triggeredReminderId ? { ...r, status: 'sent' as const } : r
          );
          saveReminders(updated);
          return updated;
        });
      }
    );

    return () => {
      globalReminderScheduler.clearAll();
    };
  }, [reminders, medicines, settings]);

  // Clean initial demo medicines if this is a real logged-in Google account with only default samples
  useEffect(() => {
    if (googleUser && medicines.length > 0 && medicines.every((m) => m.id.startsWith('med-sample-'))) {
      setMedicines([]);
      saveMedicines([]);
      setDoses([]);
      saveDoses([]);
      setReminders([]);
      saveReminders([]);
    }
  }, [googleUser]);

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || {
      id: 'profile-self',
      name: 'أنا',
      relation: 'self',
      created_at: new Date().toISOString(),
    };
  }, [profiles, activeProfileId]);

  // Filter medicines by active profile (or all family members if toggled)
  const filteredMedicines = useMemo(() => {
    if (showAllFamilyFilter) return medicines;
    return medicines.filter((m) => {
      if (!m.profile_id) return true; // Legacy medicines visible
      return m.profile_id === activeProfileId;
    });
  }, [medicines, activeProfileId, showAllFamilyFilter]);

  const filteredDoses = useMemo(() => {
    const medIds = new Set(filteredMedicines.map((m) => m.id));
    return doses.filter((d) => medIds.has(d.medicine_id));
  }, [doses, filteredMedicines]);

  const filteredReminders = useMemo(() => {
    const medIds = new Set(filteredMedicines.map((m) => m.id));
    return reminders.filter((r) => medIds.has(r.medicine_id));
  }, [reminders, filteredMedicines]);

  // Persist state changes
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  const handleSelectActiveProfile = (profileId: string) => {
    setActiveProfileIdState(profileId);
    saveActiveProfileId(profileId);
  };

  const handleProfilesUpdated = (updatedProfiles: FamilyProfile[]) => {
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);
    if (updatedProfiles.length > 0 && !updatedProfiles.some((p) => p.id === activeProfileId)) {
      handleSelectActiveProfile(updatedProfiles[0].id);
    }
  };

  // Google Sign-in Handler
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        const authUser: GoogleAuthUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        };
        setGoogleUserState(authUser);
        saveGoogleUser(authUser);

        // Open Onboarding wizard to easily name folders
        setShowOnboardingModal(true);
        setViewMode('app');
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'النطاق الحالي';
        setAuthErrorModal({
          show: true,
          title: isAr ? 'تنبيه لصاحب التطبيق: نطاق Vercel يحتاج تفعيل' : 'Notice for App Owner: Authorize Vercel Domain',
          message: isAr
            ? `أنت كصاحب للتطبيق تقوم بإضافة هذا النطاق (${currentHost}) مرة واحدة فقط في لوحة تحكم Firebase Console.\n\nبمجرد إضافتك له، سيتمكن جميع المستخدمين والزوار من تسجيل الدخول بحسابات Google الخاصة بهم تلقائياً بضغطة زر دون أي خطوات إضافية من جهتهم!`
            : `As the app owner, you only need to add this domain (${currentHost}) once in Firebase Console.\n\nOnce added, all visitors and users will be able to Sign in with Google with a single click without any setup on their end!`,
          isDomainIssue: true,
        });
      } else if (code === 'auth/popup-closed-by-user') {
        // User closed the popup intentionally
      } else if (code === 'auth/popup-blocked') {
        setAuthErrorModal({
          show: true,
          title: isAr ? 'المتصفح حظر النافذة المنبثقة' : 'Popup Blocked',
          message: isAr
            ? 'قام المتصفح بحظر نافذة تسجيل الدخول المنبثقة. يرجى السماح بالنوافذ المنبثقة (Popups) لهذا الموقع ثم المحاولة مجدداً.'
            : 'Your browser blocked the popup. Please enable popups and try again.',
          isDomainIssue: false,
        });
      } else {
        setAuthErrorModal({
          show: true,
          title: isAr ? 'تعذر إتمام الدخول' : 'Sign-in Incomplete',
          message: isAr
            ? `لم يكتمل تسجيل الدخول: ${err?.message || 'حدث خطأ غير متوقع'}. يمكنك تجربة الدخول كزائر فوراً.`
            : `Could not complete sign in: ${err?.message || 'Unknown error'}. You can continue as guest.`,
          isDomainIssue: false,
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleSignOut();
    setGoogleUserState(null);
    saveGoogleUser(null);
  };

  // Save medicine and sync to Google Drive & Sheets if connected
  const handleSaveMedicine = async (newMed: Medicine) => {
    const medWithProfile: Medicine = {
      ...newMed,
      profile_id: activeProfileId,
      patient_name: newMed.patient_name || activeProfile.name,
    };

    const updatedMeds = [medWithProfile, ...medicines];
    setMedicines(updatedMeds);
    saveMedicines(updatedMeds);

    // Calculate doses and reminders
    const { doses: newDoses, reminders: newRems } = calculateDosesAndReminders(medWithProfile, settings);
    const updatedDoses = [...doses, ...newDoses];
    const updatedRems = [...reminders, ...newRems];

    setDoses(updatedDoses);
    saveDoses(updatedDoses);

    setReminders(updatedRems);
    saveReminders(updatedRems);

    // Optional Supabase sync
    const client = getSupabaseClient(settings.supabase_url, settings.supabase_anon_key);
    if (client) {
      syncMedicineToSupabase(client, medWithProfile, newDoses, newRems);
    }

    // Automatic Google Drive & Sheets sync if relative has a drive folder
    try {
      const token = await getAccessToken();
      if (token && activeProfile.driveFolderId) {
        const relativeMeds = updatedMeds.filter((m) => m.profile_id === activeProfileId);
        await syncRelativeMedicinesToSheet(
          token,
          activeProfile.driveFolderId,
          activeProfile.name,
          relativeMeds
        );
      }
    } catch (driveErr) {
      console.warn('Auto drive sync warning:', driveErr);
    }

    // Switch to Schedule tab to view the generated plan
    setActiveTab('schedule');
  };

  const handleAddMultipleMedicines = async (newMeds: Medicine[]) => {
    const medsWithProfile = newMeds.map((m) => ({
      ...m,
      profile_id: activeProfileId,
      patient_name: m.patient_name || activeProfile.name,
    }));

    const updatedMeds = [...medsWithProfile, ...medicines];
    setMedicines(updatedMeds);
    saveMedicines(updatedMeds);

    let allNewDoses: DoseSchedule[] = [];
    let allNewRems: Reminder[] = [];

    medsWithProfile.forEach((m) => {
      const { doses: d, reminders: r } = calculateDosesAndReminders(m, settings);
      allNewDoses = [...allNewDoses, ...d];
      allNewRems = [...allNewRems, ...r];
    });

    const updatedDoses = [...doses, ...allNewDoses];
    const updatedRems = [...reminders, ...allNewRems];

    setDoses(updatedDoses);
    saveDoses(updatedDoses);

    setReminders(updatedRems);
    saveReminders(updatedRems);

    // Auto Google Drive Sheets sync
    try {
      const token = await getAccessToken();
      if (token && activeProfile.driveFolderId) {
        const relativeMeds = updatedMeds.filter((m) => m.profile_id === activeProfileId);
        await syncRelativeMedicinesToSheet(
          token,
          activeProfile.driveFolderId,
          activeProfile.name,
          relativeMeds
        );
      }
    } catch (driveErr) {
      console.warn('Drive sync warning:', driveErr);
    }

    setActiveTab('schedule');
  };

  const handleToggleDose = (doseId: string, taken: boolean) => {
    const nowIso = new Date().toISOString();
    const updatedDoses = doses.map((d) => {
      if (d.id === doseId) {
        return {
          ...d,
          taken,
          taken_at: taken ? nowIso : undefined,
          skipped: false,
        };
      }
      return d;
    });
    setDoses(updatedDoses);
    saveDoses(updatedDoses);

    const targetDose = doses.find((d) => d.id === doseId);
    if (targetDose) {
      const updatedRems = reminders.map((r) => {
        if (r.medicine_id === targetDose.medicine_id && r.reminder_time === targetDose.dose_time) {
          return {
            ...r,
            status: taken ? ('acknowledged' as const) : ('pending' as const),
          };
        }
        return r;
      });
      setReminders(updatedRems);
      saveReminders(updatedRems);
    }
  };

  const handleSkipDose = (doseId: string) => {
    const updatedDoses = doses.map((d) => {
      if (d.id === doseId) {
        return {
          ...d,
          skipped: true,
          taken: false,
        };
      }
      return d;
    });
    setDoses(updatedDoses);
    saveDoses(updatedDoses);
  };

  const handleSnoozeReminder = (reminderId: string, minutes: number) => {
    const updatedRems = reminders.map((r) => {
      if (r.id === reminderId) {
        const curr = new Date(r.reminder_time);
        curr.setMinutes(curr.getMinutes() + minutes);
        return {
          ...r,
          reminder_time: curr.toISOString(),
          status: 'pending' as const,
        };
      }
      return r;
    });
    setReminders(updatedRems);
    saveReminders(updatedRems);
  };

  const handleRestartMedicine = (oldMed: Medicine) => {
    const renewedMed: Medicine = {
      ...oldMed,
      id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      first_dose_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    handleSaveMedicine(renewedMed);
  };

  const handleResetData = () => {
    if (confirm(isAr ? 'هل أنت متأكد من مسح جميع الأدوية وسجل الجرعات؟' : 'Are you sure you want to clear all data?')) {
      resetAllData();
      setMedicines([]);
      setDoses([]);
      setReminders([]);
    }
  };

  const handleWipeAccount = async () => {
    const confirmMsg = isAr
      ? 'هل أنت متأكد تماماً من رغبتك في إغلاق الحساب ومسح كافة البيانات؟\n\nسيتم حذف جميع الأدوية، التذكيرات، وسجلات العائلة نهائياً من هذا الجهاز، وتسجيل الخروج من حساب Google.'
      : 'Are you sure you want to permanently close your account and wipe all data?';
    if (confirm(confirmMsg)) {
      try {
        await googleSignOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
      wipeAccountAndAllData();
      setGoogleUserState(null);
      setMedicines([]);
      setDoses([]);
      setReminders([]);
      setProfiles(DEFAULT_PROFILES);
      setActiveProfileIdState('profile-self');
      setViewMode('landing');
      setActiveTab('schedule');
    }
  };

  const handleRestoreSampleData = () => {
    const sample = getInitialSampleMedicines();
    setMedicines(sample);
    saveMedicines(sample);

    let allDoses: DoseSchedule[] = [];
    let allRems: Reminder[] = [];
    sample.forEach((m) => {
      const { doses: d, reminders: r } = calculateDosesAndReminders(m, settings);
      allDoses = [...allDoses, ...d];
      allRems = [...allRems, ...r];
    });

    setDoses(allDoses);
    saveDoses(allDoses);
    setReminders(allRems);
    saveReminders(allRems);
    setActiveTab('schedule');
  };

  const handleExportJson = () => {
    const exportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      profiles,
      activeProfile,
      settings,
      medicines,
      doses,
      reminders,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mediflow-Family-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Quick statistics for header
  const adherence = useMemo(() => calculateAdherence(filteredDoses), [filteredDoses]);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPendingCount = useMemo(() => {
    return filteredDoses.filter((d) => d.dose_time.slice(0, 10) === todayStr && !d.taken && !d.skipped).length;
  }, [filteredDoses, todayStr]);

  const tabs = [
    {
      id: 'schedule' as ActiveTab,
      labelAr: 'جدول الجرعات',
      labelEn: 'Schedule',
      icon: Calendar,
      badge: todayPendingCount > 0 ? todayPendingCount : undefined,
    },
    {
      id: 'add' as ActiveTab,
      labelAr: 'إضافة دواء',
      labelEn: 'Add Medicine',
      icon: Plus,
    },
    {
      id: 'reminders' as ActiveTab,
      labelAr: 'التذكيرات',
      labelEn: 'Reminders',
      icon: Bell,
    },
    {
      id: 'history' as ActiveTab,
      labelAr: 'سجل الأدوية',
      labelEn: 'History',
      icon: History,
    },
    {
      id: 'settings' as ActiveTab,
      labelAr: 'الإعدادات',
      labelEn: 'Settings',
      icon: Settings,
    },
    {
      id: 'scan' as ActiveTab,
      labelAr: 'مسح الروشتة (AI)',
      labelEn: 'Scan Prescription (AI)',
      icon: Camera,
      isAi: true,
    },
  ];

  // If in landing page view, show creative LandingPage
  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          onLoginWithGoogle={handleGoogleLogin}
          onEnterGuestDemo={() => setViewMode('app')}
          isLoggingIn={isLoggingIn}
          lang={lang}
          onToggleLang={handleToggleLang}
          theme={settings.theme || 'light'}
          onToggleTheme={handleToggleTheme}
        />
        <AuthErrorModal
          isOpen={authErrorModal.show}
          title={authErrorModal.title}
          message={authErrorModal.message}
          isDomainIssue={authErrorModal.isDomainIssue}
          onClose={() => setAuthErrorModal({ ...authErrorModal, show: false })}
          onContinueAsGuest={() => {
            setAuthErrorModal({ ...authErrorModal, show: false });
            setViewMode('app');
          }}
          lang={lang}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-2xs backdrop-blur-md">
        {/* Guest Mode Friendly Notice Banner */}
        {!googleUser && (
          <div className="bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/15 border-b border-teal-200 dark:border-teal-800/60 py-2 px-4 transition-colors">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-center sm:text-right">
                <span className="bg-teal-600 text-white font-bold text-2xs px-2 py-0.5 rounded-md shrink-0 shadow-2xs">
                  {isAr ? 'وضع الزائر التجريبي' : 'Guest Demo Mode'}
                </span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  {isAr
                    ? 'أنت تتصفح حالياً كزائر مع عينات بيانات سريرية. يمكنك العودة للصفحة الأولى (Landing Page) أو تسجيل حسابك في أي وقت.'
                    : 'You are browsing as a guest. You can return to the Landing Page or sign in anytime.'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('landing')}
                  className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 border border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title={isAr ? 'العودة فوراً للصفحة الأولى' : 'Return to Landing Page'}
                >
                  <Home className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{isAr ? 'العودة للصفحة الأولى (Landing)' : 'Back to Landing Page'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isLoggingIn ? (isAr ? 'جارٍ الربط...' : 'Connecting...') : (isAr ? 'تسجيل الدخول' : 'Sign In')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Brand Logo & Prominent Return to Landing Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setViewMode('landing')}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer group"
              title={isAr ? 'العودة للصفحة الأولى (Landing Page)' : 'Back to Landing Page'}
            >
              <img
                src="/logo.png"
                alt="Solafios Mediflow Logo"
                className="w-10 h-10 rounded-xl object-cover shadow-xs group-hover:scale-105 transition-transform border border-teal-500/20"
              />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-950 dark:text-white tracking-tight">
                  Solafios Mediflow
                </span>
                <span className="text-2xs bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold px-1.5 py-0.5 rounded-sm border border-teal-300 dark:border-teal-800">
                  v2.0
                </span>
              </div>
              <p className="text-2xs text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
                {isAr ? 'إدارة الأدوية العائلية وجداول الجرعات الذكية' : 'Family Medication Management'}
              </p>
            </div>

            {/* Clear, Prominent "الصفحة الأولى" (Landing Page) Return Button */}
            <button
              onClick={() => setViewMode('landing')}
              className="ml-2 mr-2 px-3 py-1.5 bg-teal-50 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-slate-700 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-700/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              title={isAr ? 'العودة للصفحة الأولى (Landing Page)' : 'Return to Landing Page'}
            >
              <Home className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'الصفحة الأولى' : 'Landing Page'}</span>
            </button>
          </div>

          {/* Center / Right: Family Profile Switcher & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Dark / Light Mode Switcher */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
              title={isDark ? (isAr ? 'التبديل للوضع الفاتح (Light Mode)' : 'Light Mode') : (isAr ? 'التبديل للوضع الداكن (Dark Mode)' : 'Dark Mode')}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Language Switcher (Arabic / English) */}
            <button
              type="button"
              onClick={handleToggleLang}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
              title={isAr ? 'Switch to English (LTR)' : 'التحويل للغة العربية (RTL)'}
            >
              <Languages className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {/* Family Profile Switcher */}
            <ProfileSwitcher
              profiles={profiles}
              activeProfileId={activeProfileId}
              onSelectProfile={handleSelectActiveProfile}
              onOpenAddProfileModal={() => setShowOnboardingModal(true)}
              lang={lang}
            />

            {/* Google Drive Status Link */}
            {activeProfile.driveFolderUrl ? (
              <a
                href={activeProfile.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-xl text-teal-700 dark:text-teal-300 transition-colors flex items-center gap-1 text-xs font-semibold border border-teal-200 dark:border-teal-800"
                title={isAr ? 'فتح مجلد Google Drive لهذا الشخص' : 'Open in Google Drive'}
              >
                <Cloud className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="hidden xl:inline">{isAr ? 'درايف' : 'Drive'}</span>
              </a>
            ) : (
              <button
                onClick={() => setShowOnboardingModal(true)}
                className="p-2 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-teal-900 transition-colors flex items-center gap-1 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                title={isAr ? 'ربط مجلدات Google Drive' : 'Sync to Google Drive'}
              >
                <Cloud className="w-4 h-4 text-slate-400" />
                <span className="hidden xl:inline">{isAr ? 'ربط درايف' : 'Link Drive'}</span>
              </button>
            )}

            {/* Print Report Direct CTA */}
            <button
              onClick={() => setShowPrintModal(true)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-teal-900 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 hover:border-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title={isAr ? 'طباعة التقرير الطبي وجدول الجرعات' : 'Print Medical Schedule Report'}
            >
              <Printer className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="hidden md:inline">{isAr ? 'طباعة التقرير' : 'Print'}</span>
            </button>

            {/* Quick Add Medicine CTA */}
            <button
              onClick={() => setActiveTab('add')}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all hover:shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{isAr ? 'إضافة دواء' : 'Add Medicine'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/70 overflow-x-auto scrollbar-none">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-1 py-1">
            <div className="flex items-center gap-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-teal-950 dark:text-teal-300 shadow-2xs border border-slate-200 dark:border-slate-700 ring-1 ring-teal-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{isAr ? t.labelAr : t.labelEn}</span>
                    {t.badge !== undefined && (
                      <span className="bg-amber-500 text-white text-2xs font-bold px-1.5 py-0.2 rounded-full">
                        {t.badge}
                      </span>
                    )}
                    {(t as any).isAi && (
                      <span className="text-2xs bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 border border-teal-300 dark:border-teal-800">
                        <Sparkles className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" />
                        AI
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Relative Filter Toggle (e.g. All Family vs Active Relative) */}
            <div className="hidden sm:flex items-center gap-1.5 text-2xs bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setShowAllFamilyFilter(false)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  !showAllFamilyFilter ? 'bg-white dark:bg-slate-900 text-teal-950 dark:text-teal-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {activeProfile.name}
              </button>
              <button
                type="button"
                onClick={() => setShowAllFamilyFilter(true)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  showAllFamilyFilter ? 'bg-white dark:bg-slate-900 text-teal-950 dark:text-teal-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isAr ? 'كل العائلة 👥' : 'All Family'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {activeTab === 'schedule' && (
          <ScheduleTab
            medicines={filteredMedicines}
            doses={filteredDoses}
            settings={settings}
            onToggleDose={handleToggleDose}
            onSkipDose={handleSkipDose}
            onPrintPrescription={() => setShowPrintModal(true)}
            lang={lang}
          />
        )}

        {activeTab === 'add' && (
          <AddMedicineTab
            settings={settings}
            onSaveMedicine={handleSaveMedicine}
            lang={lang}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersTab
            medicines={filteredMedicines}
            doses={filteredDoses}
            reminders={filteredReminders}
            settings={settings}
            onTakeDose={(doseId) => handleToggleDose(doseId, true)}
            onSnoozeReminder={handleSnoozeReminder}
            lang={lang}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            medicines={filteredMedicines}
            doses={filteredDoses}
            settings={settings}
            onRestartMedicine={handleRestartMedicine}
            lang={lang}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetData={handleResetData}
            onRestoreSampleData={handleRestoreSampleData}
            onPrintPrescription={() => setShowPrintModal(true)}
            onExportJson={handleExportJson}
            onWipeAccount={handleWipeAccount}
            lang={lang}
          />
        )}

        {activeTab === 'scan' && (
          <ScanPrescriptionTab
            onAddMedicines={handleAddMultipleMedicines}
            lang={lang}
          />
        )}
      </main>

      {/* Printable Schedule Modal */}
      {showPrintModal && (
        <PrintPrescriptionModal
          medicines={filteredMedicines}
          doses={filteredDoses}
          settings={settings}
          onClose={() => setShowPrintModal(false)}
          lang={lang}
        />
      )}

      {/* Onboarding & Drive Folder Setup Modal */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={handleProfilesUpdated}
        lang={lang}
        userEmail={googleUser?.email}
      />

      {/* Auth Error / Vercel Domain Guidance Modal */}
      <AuthErrorModal
        isOpen={authErrorModal.show}
        title={authErrorModal.title}
        message={authErrorModal.message}
        isDomainIssue={authErrorModal.isDomainIssue}
        onClose={() => setAuthErrorModal({ ...authErrorModal, show: false })}
        onContinueAsGuest={() => setAuthErrorModal({ ...authErrorModal, show: false })}
        lang={lang}
      />

      {/* Floating Quick Action Dock to Return to Landing Page */}
      <div className="fixed bottom-5 start-5 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setViewMode('landing')}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-xl border border-slate-300 dark:border-slate-700 transition-all hover:scale-105 cursor-pointer backdrop-blur-md"
          title={isAr ? 'العودة للصفحة الأولى' : 'Back to Landing Page'}
        >
          <Home className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>{isAr ? 'العودة للصفحة الأولى' : 'Back to Landing Page'}</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-12 text-slate-500 dark:text-slate-400 text-xs transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-200">Solafios Mediflow</span> —{' '}
            <span>{isAr ? `الملف النشط: ${activeProfile.name}` : `Active Profile: ${activeProfile.name}`}</span>
            {googleUser && (
              <span className="text-2xs text-teal-700 dark:text-teal-300 font-mono bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                ☁️ {googleUser.email}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-2xs text-slate-400 dark:text-slate-500">
            <button
              onClick={() => setViewMode('landing')}
              className="text-teal-600 dark:text-teal-400 hover:underline font-bold cursor-pointer flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{isAr ? 'الصفحة الأولى (Landing Page)' : 'Landing Page'}</span>
            </button>
            <span aria-hidden="true">·</span>
            <span>Dr. Eslam Elbialy</span>
            <span aria-hidden="true">·</span>
            <span>Google Drive Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
