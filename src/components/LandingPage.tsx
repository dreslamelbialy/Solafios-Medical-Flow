import React, { useState, useEffect } from 'react';
import {
  Pill,
  ShieldCheck,
  Sparkles,
  Users,
  Cloud,
  FileSpreadsheet,
  Camera,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Languages,
  Activity,
  Heart,
  Volume2,
  FolderPlus,
  FileText,
  Zap,
  Check,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { playReminderChime } from '../utils/audioAlert';

interface LandingPageProps {
  onLoginWithGoogle: () => void;
  onEnterGuestDemo: () => void;
  isLoggingIn: boolean;
  lang: 'ar' | 'en';
  onToggleLang: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginWithGoogle,
  onEnterGuestDemo,
  isLoggingIn,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  // State for interactive features
  const [selectedDemoProfile, setSelectedDemoProfile] = useState<'father' | 'mother' | 'self'>('father');
  const [isAudioTesting, setIsAudioTesting] = useState(false);

  // Interactive Live Folder Simulator State
  const [customRelativeName, setCustomRelativeName] = useState(isAr ? 'والدي العزيز' : 'Beloved Father');
  const [simulatedFolders, setSimulatedFolders] = useState<string[]>([
    isAr ? 'سجل أدوية (والدي)' : 'Father Meds Folder',
    isAr ? 'سجل أدوية (والدتي)' : 'Mother Meds Folder',
    isAr ? 'سجل أدوية (ملفي الشخصي)' : 'My Meds Folder',
  ]);

  // Realtime ECG pulse animation tick
  const [ecgBpm, setEcgBpm] = useState(72);
  useEffect(() => {
    const timer = setInterval(() => {
      setEcgBpm(Math.floor(70 + Math.random() * 5));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleTestChime = () => {
    setIsAudioTesting(true);
    playReminderChime();
    setTimeout(() => setIsAudioTesting(false), 2000);
  };

  const handleAddSimulatedFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRelativeName.trim()) return;
    const folderLabel = isAr
      ? `سجل أدوية (${customRelativeName.trim()})`
      : `${customRelativeName.trim()} Meds Folder`;
    if (!simulatedFolders.includes(folderLabel)) {
      setSimulatedFolders([...simulatedFolders, folderLabel]);
    }
    setCustomRelativeName('');
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-hidden ${
        isDark
          ? 'bg-[#090d16] text-slate-100 selection:bg-teal-500 selection:text-white'
          : 'bg-[#f8fafc] text-slate-900 selection:bg-teal-600 selection:text-white'
      }`}
    >
      {/* Dynamic Future Clinic Ambient Holographic Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[650px] pointer-events-none rounded-full blur-[120px] opacity-40 bg-gradient-to-b from-teal-500/30 via-emerald-500/20 to-transparent" />
      <div className="absolute top-1/4 -right-40 w-96 h-96 pointer-events-none rounded-full blur-[100px] opacity-30 bg-cyan-500/25" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 pointer-events-none rounded-full blur-[100px] opacity-25 bg-teal-600/30" />

      {/* Subtle Apple HIG Grid Mesh Background */}
      <div
        className={`absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${
          isDark
            ? 'from-teal-950/20 via-transparent to-transparent'
            : 'from-teal-100/40 via-transparent to-transparent'
        }`}
      />

      {/* Top Navbar with Apple HIG Layer Glass Effect */}
      <header
        className={`relative z-30 border-b sticky top-0 backdrop-blur-xl transition-all ${
          isDark
            ? 'border-slate-800/80 bg-[#090d16]/80 shadow-lg shadow-black/30'
            : 'border-slate-300 bg-white/95 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
          {/* Brand with Apple Layered 3D Icon */}
          <div className="flex items-center gap-3.5">
            <div className="relative group cursor-pointer">
              {/* Apple HIG Multi-Layer Specular Effect */}
              <div className="w-12 h-12 rounded-[16px] bg-gradient-to-b from-teal-300 via-teal-600 to-emerald-900 p-[1.5px] shadow-xl shadow-teal-500/30 ring-1 ring-white/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-teal-400/50">
                <div className="w-full h-full rounded-[14px] bg-gradient-to-tr from-teal-950 via-teal-700 to-emerald-500 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                  <Pill className="w-6 h-6 text-white transform -rotate-45 drop-shadow-lg" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  Solafios Mediflow
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs ${
                  isDark
                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                    : 'bg-teal-50 border-teal-300 text-teal-800'
                }`}>
                  {isAr ? 'العيادة الذكية' : 'Smart Clinic'}
                </span>
              </div>
              <p className={`text-xs font-semibold hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                {isAr
                  ? 'منظومة الرعاية السريرية العائلية والمزامنة السحابية المباشرة'
                  : 'Family Clinical Management & Automated Cloud Sync'}
              </p>
            </div>
          </div>

          {/* Navigation Controls: Theme, Lang, Guest Demo, Sign-in */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className={`p-2.5 rounded-xl transition-all border cursor-pointer font-bold ${
                isDark
                  ? 'bg-slate-900 text-amber-300 border-slate-800 hover:bg-slate-800'
                  : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100 shadow-2xs'
              }`}
              title={isDark ? (isAr ? 'تبديل للوضع الفاتح (Light)' : 'Light Mode') : (isAr ? 'تبديل للوضع الليلي (Dark)' : 'Dark Mode')}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-800" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLang}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800'
                  : 'bg-slate-50 text-slate-900 border-slate-300 hover:bg-slate-100 shadow-2xs'
              }`}
              title={isAr ? 'Switch to English' : 'التحويل للغة العربية'}
            >
              <Languages className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'English' : 'عربي'}</span>
            </button>

            {/* Enter Guest Demo Button - Prominent for Visitors */}
            <button
              onClick={onEnterGuestDemo}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                isDark
                  ? 'bg-slate-900/90 text-teal-300 border-teal-500/40 hover:bg-teal-950/50 hover:border-teal-300'
                  : 'bg-white text-teal-950 border-teal-400 hover:bg-teal-50 hover:border-teal-500'
              }`}
            >
              <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'دخول فوري كزائر' : 'Guest Demo'}</span>
            </button>

            {/* Primary Google Login Button */}
            <button
              onClick={onLoginWithGoogle}
              disabled={isLoggingIn}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-600/25 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
            >
              <Cloud className="w-4 h-4 text-white" />
              <span>
                {isLoggingIn
                  ? isAr ? 'جارٍ الربط...' : 'Connecting...'
                  : isAr ? 'تسجيل الدخول' : 'Sign In'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: Future Clinic 3D & Telemedicine Layout */}
      <section className="relative z-10 pt-10 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
        {/* Top Telemetry Live Ribbon */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-md backdrop-blur-md ${
              isDark
                ? 'bg-teal-950/80 border border-teal-500/40 text-teal-300 ring-1 ring-teal-500/20'
                : 'bg-teal-50 border border-teal-300 text-teal-950 font-bold'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-spin" />
            <span>{isAr ? 'المنظومة السريرية الذكية لإدارة أدوية العائلة' : 'Clinical Medical Innovation & Family Care'}</span>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold shadow-2xs border ${
              isDark
                ? 'bg-slate-900/80 border-slate-800 text-emerald-400'
                : 'bg-white border-slate-300 text-emerald-800 font-bold'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{isAr ? 'العيادة الافتراضية نشطة 24/7' : 'Smart Clinic Live'}</span>
          </div>
        </div>

        {/* Hero Main Headline */}
        <div className="space-y-6 max-w-5xl mx-auto text-center">
          <h1
            className={`text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.15] sm:leading-[1.1] ${
              isDark ? 'text-white' : 'text-slate-950'
            }`}
          >
            {isAr ? (
              <>
                إدارة أدوية عائلتك في{' '}
                <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent underline decoration-teal-500/40 decoration-wavy">
                  Google Drive
                </span>{' '}
                بتقنيات الرعاية الذكية
              </>
            ) : (
              <>
                Manage All Family Medications in{' '}
                <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Google Drive
                </span>{' '}
                with Smart Clinical Care
              </>
            )}
          </h1>

          <p
            className={`text-base sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {isAr
              ? 'سجّل بحساب Gmail واحد، وأنشئ ملفات مستقلة لوالدك ووالدتك وأفراد عائلتك. ينشئ Mediflow مجلداً رئيسياً موحداً في Google Drive مع مجلدات فرعية وجداول إكسل محدثة لكل فرد تلقائياً وبدون تعقيد.'
              : 'Sign in with your Gmail to create dedicated subfolders and live Excel schedules on Google Drive for your parents and children automatically.'}
          </p>
        </div>

        {/* Hero Action CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {/* Sign in with Google */}
          <button
            onClick={onLoginWithGoogle}
            disabled={isLoggingIn}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black rounded-2xl text-base flex items-center justify-center gap-3 shadow-xl shadow-teal-500/30 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>
              {isLoggingIn
                ? isAr ? 'جارٍ تسجيل الدخول...' : 'Connecting...'
                : isAr ? 'ابدأ بحساب Google (Gmail)' : 'Sign In with Google'}
            </span>
          </button>

          {/* Guest Demo */}
          <button
            onClick={onEnterGuestDemo}
            className={`w-full sm:w-auto px-7 py-4 font-bold rounded-2xl text-base border flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg ${
              isDark
                ? 'bg-slate-900/90 hover:bg-slate-800 text-teal-300 border-teal-500/40 hover:border-teal-300'
                : 'bg-white hover:bg-slate-50 text-teal-950 border-teal-300 shadow-teal-500/10'
            }`}
          >
            <span>{isAr ? 'تجربة المنصة كزائر فوراً' : 'Explore Guest Platform'}</span>
            {isAr ? <ChevronLeft className="w-5 h-5 text-teal-500" /> : <ChevronRight className="w-5 h-5 text-teal-500" />}
          </button>

          {/* Test Audio Chime */}
          <button
            onClick={handleTestChime}
            disabled={isAudioTesting}
            className={`w-full sm:w-auto px-5 py-4 font-bold rounded-2xl text-sm border flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title={isAr ? 'تجربة صوت المنبه السريري' : 'Test Audio Chime'}
          >
            <Volume2 className={`w-4 h-4 ${isAudioTesting ? 'text-teal-400 animate-bounce' : 'text-slate-400'}`} />
            <span>{isAudioTesting ? (isAr ? 'يتم تشغيل الرنين 🔔' : 'Chime Playing...') : (isAr ? 'سماع نغمة الجرعة' : 'Preview Chime')}</span>
          </button>
        </div>

        {/* 3D Future Clinic Interactive Showcase & Apple Layered Card (Centerpiece) */}
        <div className="pt-4 max-w-6xl mx-auto">
          {/* Apple HIG Multi-Layer Specular Glass Shell */}
          <div
            className={`rounded-3xl p-6 sm:p-10 relative overflow-hidden backdrop-blur-2xl transition-all shadow-2xl border ${
              isDark
                ? 'bg-gradient-to-b from-slate-900/90 via-[#0d1322]/95 to-[#090d16]/95 border-teal-500/30 shadow-teal-950/60 ring-1 ring-white/10'
                : 'bg-white/95 border-teal-200 shadow-slate-200/80 ring-1 ring-slate-900/5'
            }`}
          >
            {/* Top Specular Edge Highlight */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent pointer-events-none" />

            {/* Doctor Consultation & Telemetry Header Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-teal-500/20">
              {/* Doctor Status Badge */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/30 flex items-center justify-center">
                    <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-2xl">
                      👨‍⚕️
                    </div>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-3 ring-slate-950 animate-pulse" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      {isAr ? 'د. إسلام البيلي' : 'Dr. Eslam Elbialy'}
                    </span>
                    <span className="text-2xs font-bold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                      {isAr ? 'استشاري الرعاية السريرية' : 'Senior Clinical Consultant'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? 'العيادة متصلة • مزامنة حية مع Google Drive وجداول المرضى'
                      : 'Smart Clinic Live • Real-time Drive & Patient Sync'}
                  </p>
                </div>
              </div>

              {/* Real-time Bio-telemetry & ECG Waveform */}
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                {/* ECG Heart Rate Box */}
                <div
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl border shadow-inner ${
                    isDark ? 'bg-slate-950/80 border-teal-500/30' : 'bg-slate-100/90 border-slate-300'
                  }`}
                >
                  <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <div>
                    <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">{ecgBpm}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-2xs ml-1">BPM</span>
                  </div>
                </div>

                {/* Adherence Rate */}
                <div
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border shadow-inner ${
                    isDark ? 'bg-slate-950/80 border-teal-500/30' : 'bg-slate-100/90 border-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <div>
                    <span className="font-black text-sm text-teal-700 dark:text-teal-400">98.4%</span>
                    <span className="text-slate-500 dark:text-slate-400 text-2xs ml-1">{isAr ? 'التزام علاجي' : 'Adherence'}</span>
                  </div>
                </div>

                {/* Drive Status */}
                <div
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border shadow-inner ${
                    isDark ? 'bg-slate-950/80 border-teal-500/30' : 'bg-slate-100/90 border-slate-300'
                  }`}
                >
                  <Cloud className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-cyan-700 dark:text-cyan-400 font-bold text-2xs">Drive 100% OK</span>
                </div>
              </div>
            </div>

            {/* Master Google Drive Folder Banner (User Requirement) */}
            <div className={`my-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md ${
              isDark
                ? 'bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/15 border-teal-500/40'
                : 'bg-teal-50/90 border-teal-300 shadow-xs'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shrink-0 ${
                  isDark ? 'bg-teal-500/20 border-teal-500/30' : 'bg-white border-teal-300 shadow-2xs'
                }`}>
                  📁
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isDark ? 'text-teal-400' : 'text-teal-900'}`}>
                      {isAr ? 'المجلد الرئيسي الموحد في حسابك:' : 'Unified Root Folder in Google Drive:'}
                    </span>
                    <span className="text-[10px] bg-teal-600 text-white font-black px-2 py-0.5 rounded-md">
                      {isAr ? 'مجلد رئيسي يجمع الكل' : 'Master Root'}
                    </span>
                  </div>
                  <div className={`font-mono font-black text-sm sm:text-base mt-0.5 tracking-tight ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    Solafios Mediflow - السجلات الطبية والعائلية
                  </div>
                </div>
              </div>

              <div className={`flex items-center gap-2 text-2xs font-semibold ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'تنشأ داخله مجلدات وجداول كل فرد تلقائياً' : 'Auto-provisions subfolders & sheets'}</span>
              </div>
            </div>

            {/* Family Profile Switcher Pills */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-teal-400' : 'text-teal-800'
                }`}>
                  {isAr ? 'معاينة تفاعلية لملفات العائلة والمجلدات الفرعية:' : 'Interactive Relative Profile Preview:'}
                </span>

                <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-300'
                }`}>
                  <button
                    onClick={() => setSelectedDemoProfile('father')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDemoProfile === 'father'
                        ? 'bg-teal-600 text-white shadow-md'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    👴 {isAr ? 'والدي' : 'Father'}
                  </button>
                  <button
                    onClick={() => setSelectedDemoProfile('mother')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDemoProfile === 'mother'
                        ? 'bg-teal-600 text-white shadow-md'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    👵 {isAr ? 'والدتي' : 'Mother'}
                  </button>
                  <button
                    onClick={() => setSelectedDemoProfile('self')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDemoProfile === 'self'
                        ? 'bg-teal-600 text-white shadow-md'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    👤 {isAr ? 'أنا' : 'Self'}
                  </button>
                </div>
              </div>

              {/* 3 Apple HIG Interactive Cards for Selected Profile */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Dedicated Google Drive Subfolder & Sheet */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isDark
                      ? 'bg-slate-950/70 border-teal-500/30 hover:border-teal-400/60 shadow-lg'
                      : 'bg-white border-teal-200 hover:border-teal-400 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between text-2xs mb-2">
                    <span className="font-bold text-teal-400 flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مجلد فرعي متصل' : 'Subfolder'}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/30 font-bold">
                      {isAr ? 'متزامن تلقائياً' : 'Synced'}
                    </span>
                  </div>
                  <div className={`font-mono font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    📂 سجل أدوية ({selectedDemoProfile === 'father' ? 'والدي' : selectedDemoProfile === 'mother' ? 'والدتي' : 'أنا'})
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>جدول_أدوية_{selectedDemoProfile === 'father' ? 'والدي' : selectedDemoProfile === 'mother' ? 'والدتي' : 'أنا'}.xlsx</span>
                  </div>
                  <p className="text-2xs text-slate-400 mt-2">
                    {isAr
                      ? 'يتم تسجيل كل جرعة وتوقيتها تلقائياً في الشيت بدون أي تدخل يدوي'
                      : 'Every dose schedule is recorded automatically in the spreadsheet.'}
                  </p>
                </div>

                {/* Card 2: Clinical Dose Reminder with 3D Pill Preview */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isDark
                      ? 'bg-slate-950/70 border-amber-500/30 hover:border-amber-400/60 shadow-lg'
                      : 'bg-white border-amber-200 hover:border-amber-400 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between text-2xs mb-2">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isAr ? 'الجرعة القادمة' : 'Next Dose'}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                      {isAr ? 'بعد 35 دقيقة' : 'in 35m'}
                    </span>
                  </div>
                  <div className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    {selectedDemoProfile === 'father'
                      ? 'أوميبرازول (Omeprazole 20mg)'
                      : selectedDemoProfile === 'mother'
                      ? 'قطرة مرطبة للعين (Eye Drops)'
                      : 'بانادول إكسترا (Panadol 500mg)'}
                  </div>
                  <div className="text-2xs text-slate-400">
                    {selectedDemoProfile === 'father'
                      ? 'كبسولة واحدة على الريق قبل الإفطار بنصف ساعة'
                      : selectedDemoProfile === 'mother'
                      ? 'قطرة مرتين يومياً صباحاً ومساءً'
                      : 'قرص واحد بعد الغداء'}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={handleTestChime}
                      className="text-2xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'اختبر تنبيه الرنين' : 'Test Sound Alert'}</span>
                    </button>
                  </div>
                </div>

                {/* Card 3: Clinic GPS & Follow-up Appointment */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isDark
                      ? 'bg-slate-950/70 border-cyan-500/30 hover:border-cyan-400/60 shadow-lg'
                      : 'bg-white border-cyan-200 hover:border-cyan-400 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between text-2xs mb-2">
                    <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>{isAr ? 'استشارة الطبيب والموقع' : 'Consultation'}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                      2026-10-14
                    </span>
                  </div>
                  <div className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    {selectedDemoProfile === 'father'
                      ? 'د. مجدي يعقوب (استشاري القلب)'
                      : selectedDemoProfile === 'mother'
                      ? 'د. معاذ عطيتو (جراحة العيون)'
                      : 'د. حسام حسني (صدرية)'}
                  </div>
                  <div className="flex items-center gap-1.5 text-2xs text-teal-400 font-semibold mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إحداثيات GPS متصلة بـ Google Maps' : 'GPS Linked to Maps'}</span>
                  </div>
                  <p className="text-2xs text-slate-400 mt-2">
                    {isAr
                      ? 'توجيه فوري لموقع المستشفى بنقرة واحدة عبر خرائط جوجل'
                      : 'One-click navigation directly to clinic coordinates.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Live Family Folder Generator Widget (Direct Fulfillment of User Request) */}
            <div className="mt-8 pt-6 border-t border-teal-500/20">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2 text-teal-400">
                    <FolderPlus className="w-4 h-4" />
                    <span>{isAr ? 'جرب الآن: اكتب اسم أي فرد في عائلتك وشاهد المجلد يُنشأ فوراً' : 'Interactive Live Folder Creator'}</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'اكتب اسم والدك أو والدتك أو طفلك لاختبار كيفية تنظيم الملفات السحابية'
                      : 'Type any relative name to preview instant Google Drive folder generation'}
                  </p>
                </div>

                {/* Relative Name Input Form */}
                <form onSubmit={handleAddSimulatedFolder} className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    value={customRelativeName}
                    onChange={(e) => setCustomRelativeName(e.target.value)}
                    placeholder={isAr ? 'مثال: والدي، أختي سارة، ابني...' : 'e.g. My Father, Sarah...'}
                    className={`px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-teal-400 w-full sm:w-60 ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all shadow-md"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إنشاء المجلد' : 'Create'}</span>
                  </button>
                </form>
              </div>

              {/* Dynamic Badges of Created Folders */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xs text-slate-400 font-bold">{isAr ? 'المجلدات الجاهزة:' : 'Active Folders:'}</span>
                {simulatedFolders.map((fName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-teal-500/10 border border-teal-500/30 text-teal-300 shadow-2xs"
                  >
                    <Cloud className="w-3 h-3 text-cyan-400" />
                    <span>{fName}</span>
                    <Check className="w-3 h-3 text-emerald-400" />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Deep Innovation Architecture Cards */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
            {isAr ? 'معايير الرعاية السريرية المتقدمة' : 'Advanced Clinical Standards'}
          </span>
          <h2 className={`text-3xl sm:text-5xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {isAr ? 'أركان المنظومة السريرية الذكية' : 'The Four Pillars of Clinical Adherence'}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            {isAr
              ? 'صُممت المنظومة لتلائم العائلات ومقدمي الرعاية الصحية لمتابعة التزام المرضى بدقة وسهولة'
              : 'Built for families and caregivers to maintain strict patient medication adherence'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Google Drive Sync */}
          <div
            className={`p-8 rounded-3xl space-y-4 border transition-all group ${
              isDark
                ? 'bg-gradient-to-b from-slate-900/80 to-slate-950/80 border-slate-800 hover:border-teal-500/50 shadow-xl'
                : 'bg-white border-slate-200 hover:border-teal-400 shadow-md'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Cloud className="w-7 h-7" />
            </div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'مجلد رئيسي في Google Drive وجداول إكسل لكل قريب' : 'Automated Google Drive & Sheets Engine'}
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              {isAr
                ? 'لا تحتاج إلى قواعد بيانات خارجية معقدة. يتم ربط حسابك في Gmail، وإنشاء مجلد رئيسي موحد، ثم مجلدات فرعية لكل فرد من عائلتك مع جدول إكسل متزامن لحظياً.'
                : 'Zero database hassle. Link your Gmail, and the app automatically establishes a master folder and dedicated subfolders with live spreadsheets for each family member.'}
            </p>
          </div>

          {/* Pillar 2: AI Prescription OCR */}
          <div
            className={`p-8 rounded-3xl space-y-4 border transition-all group ${
              isDark
                ? 'bg-gradient-to-b from-slate-900/80 to-slate-950/80 border-slate-800 hover:border-teal-500/50 shadow-xl'
                : 'bg-white border-slate-200 hover:border-teal-400 shadow-md'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'مسح وقراءة الروشتات بالذكاء الاصطناعي (AI OCR Vision)' : 'AI Vision Prescription Scanner'}
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              {isAr
                ? 'التقط صورة لروشتة الطبيب بخط اليد أو المطبوعة، وسيقوم الذكاء الاصطناعي باستخراج أسماء الأدوية، التراكيز، الجرعات، ومواعيد الوجبات بدقة عالية مع إمكانية التعديل السريع.'
                : 'Snap a handwritten prescription photo. Advanced vision intelligence deciphers medication names, dosages, frequencies, and meal relations.'}
            </p>
          </div>

          {/* Pillar 3: GPS Clinic Routing */}
          <div
            className={`p-8 rounded-3xl space-y-4 border transition-all group ${
              isDark
                ? 'bg-gradient-to-b from-slate-900/80 to-slate-950/80 border-slate-800 hover:border-teal-500/50 shadow-xl'
                : 'bg-white border-slate-200 hover:border-teal-400 shadow-md'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'إحداثيات العيادة والمستشفى وخرائط جوجل (GPS Coordinates)' : 'Hospital GPS & Appointment Routing'}
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              {isAr
                ? 'سجل إحداثيات خطوط الطول والعرض لعيادة طبيبك المعالج أو المستشفى، مع زر توجيه فوري على خرائط Google وتنبيه بالعد التنازلي لموعد الاستشارة والمراجعة القادمة.'
                : 'Save precise latitude & longitude coordinates for your doctor or hospital, with instant Google Maps navigation and appointment countdowns.'}
            </p>
          </div>

          {/* Pillar 4: A4 Report Print & Audio Chimes */}
          <div
            className={`p-8 rounded-3xl space-y-4 border transition-all group ${
              isDark
                ? 'bg-gradient-to-b from-slate-900/80 to-slate-950/80 border-slate-800 hover:border-teal-500/50 shadow-xl'
                : 'bg-white border-slate-200 hover:border-teal-400 shadow-md'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'طباعة تقرير سريري قياسي A4 وتنبيهات صوتية' : 'A4 Clinical Reports & Audio Reminders'}
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              {isAr
                ? 'زر طباعة فوري لإنتاج تقرير A4 رسمي لجدول الجرعات والأدوية ومواعيد الاستشارة لتقديمه للطبيب، مع رنين صوتي وإشعارات متصفح دقيقة لكل موعد جرعة.'
                : 'Instant one-click printing of official A4 clinical medication sheets for doctor visits, backed by high-precision sound alerts and browser notifications.'}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`relative z-10 border-t py-10 transition-colors ${
          isDark
            ? 'border-slate-800/80 bg-[#060910] text-slate-500'
            : 'border-slate-300 bg-white text-slate-700'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-950'}`}>Solafios Mediflow</span>
            <span className="mx-2">•</span>
            <span className="font-semibold">{isAr ? 'منظومة الرعاية السريرية العائلية والمزامنة السحابية الذكية' : 'Family Medication Management'}</span>
          </div>

          <div className="flex items-center gap-4 text-2xs font-semibold text-slate-500">
            <span>Dr. Eslam Elbialy</span>
            <span>•</span>
            <span>Google Drive API v3</span>
            <span>•</span>
            <span>{isAr ? 'المنظومة السريرية الذكية' : 'Smart Clinical System'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
