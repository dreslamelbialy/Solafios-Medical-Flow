import React, { useState } from 'react';
import {
  Settings,
  Clock,
  Utensils,
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle,
  Printer,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Check,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { UserSettings } from '../types/mediflow';

interface SettingsTabProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onResetData: () => void;
  onRestoreSampleData?: () => void;
  onPrintPrescription: () => void;
  onExportJson: () => void;
  onWipeAccount?: () => void;
  lang: 'ar' | 'en';
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
  onPrintPrescription,
  onExportJson,
  onWipeAccount,
  lang,
}) => {
  const isAr = lang === 'ar';

  const [form, setForm] = useState<UserSettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-400 font-semibold mb-1">
              <span>{isAr ? 'تخصيص النظام' : 'System Preferences'}</span>
              <span aria-hidden="true">·</span>
              <span>{isAr ? 'أوقات الوجبات والاتصال' : 'Meal Routine & Database'}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {isAr ? 'إعدادات المستخدم ومواعيد الوجبات' : 'Settings & Meal Routines'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isAr
                ? 'حدد أوقات وجباتك وروتينك اليومي لحساب مواعيد الأدوية المرتبطة بالأكل تلقائياً وبدقة.'
                : 'Define your meal and sleep schedule to calculate meal-related medication doses.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Meal Routine Times */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Utensils className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isAr ? 'أوقات الوجبات والروتين اليومي (Meal Schedule)' : 'Meal Routine Timings'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr
              ? 'تُستخدم هذه الأوقات تلقائياً عند إضافة دواء مجدول "قبل/بعد الفطار"، "قبل/بعد الغداء"، "قبل/بعد العشاء"، "قبل النوم"، أو "بعد الاستيقاظ".'
              : 'These times are used when scheduling medicines linked to meals or sleep routines.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {/* Breakfast */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'وقت الإفطار (Breakfast Time)' : 'Breakfast Time'}</span>
              </label>
              <input
                type="time"
                value={form.breakfast_time}
                onChange={(e) => setForm({ ...form, breakfast_time: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-2xs text-slate-400 dark:text-slate-500 block">
                {isAr ? 'الافتراضي: 08:00 صباحاً' : 'Default: 08:00 AM'}
              </span>
            </div>

            {/* Lunch */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Utensils className="w-4 h-4 text-orange-500" />
                <span>{isAr ? 'وقت الغداء (Lunch Time)' : 'Lunch Time'}</span>
              </label>
              <input
                type="time"
                value={form.lunch_time}
                onChange={(e) => setForm({ ...form, lunch_time: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-2xs text-slate-400 dark:text-slate-500 block">
                {isAr ? 'الافتراضي: 02:00 ظهراً' : 'Default: 02:00 PM'}
              </span>
            </div>

            {/* Dinner */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Utensils className="w-4 h-4 text-purple-500" />
                <span>{isAr ? 'وقت العشاء (Dinner Time)' : 'Dinner Time'}</span>
              </label>
              <input
                type="time"
                value={form.dinner_time}
                onChange={(e) => setForm({ ...form, dinner_time: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-2xs text-slate-400 dark:text-slate-500 block">
                {isAr ? 'الافتراضي: 08:00 مساءً' : 'Default: 08:00 PM'}
              </span>
            </div>

            {/* Wake time */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Sun className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{isAr ? 'وقت الاستيقاظ (Wake Time)' : 'Wake-up Time'}</span>
              </label>
              <input
                type="time"
                value={form.wake_time}
                onChange={(e) => setForm({ ...form, wake_time: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-2xs text-slate-400 dark:text-slate-500 block">
                {isAr ? 'الافتراضي: 07:00 صباحاً' : 'Default: 07:00 AM'}
              </span>
            </div>

            {/* Sleep time */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>{isAr ? 'وقت النوم (Sleep Time)' : 'Bedtime'}</span>
              </label>
              <input
                type="time"
                value={form.sleep_time}
                onChange={(e) => setForm({ ...form, sleep_time: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-2xs text-slate-400 dark:text-slate-500 block">
                {isAr ? 'الافتراضي: 11:00 مساءً' : 'Default: 11:00 PM'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Preferences & Sound */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Settings className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isAr ? 'التفضيلات والتنبيهات الصوتية' : 'Preferences & Alerts'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sound alert toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center gap-3">
                {form.sound_enabled ? (
                  <Volume2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'نغمات التنبيه الصوتية' : 'Audio Chime Alerts'}
                  </div>
                  <div className="text-2xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'تشغيل نغمة عند حلول موعد الجرعة' : 'Play chime when dose is due'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.sound_enabled}
                onChange={(e) => setForm({ ...form, sound_enabled: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {/* Language switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {isAr ? 'لغة واجهة التطبيق' : 'Application Language'}
                </div>
                <div className="text-2xs text-slate-500 dark:text-slate-400">
                  {isAr ? 'التبديل بين العربية والإنجليزية' : 'Switch Arabic / English'}
                </div>
              </div>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as 'ar' | 'en' })}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="ar">العربية (RTL)</option>
                <option value="en">English (LTR)</option>
              </select>
            </div>

            {/* Theme switch (Light / Dark) */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center gap-2.5">
                {form.theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {isAr ? 'مظهر النظام (المظهر الداكن / الفاتح)' : 'Theme (Light / Dark)'}
                  </div>
                  <div className="text-2xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'التبديل بين الوضع الليلي والوضع الفاتح' : 'Switch between dark and light appearance'}
                  </div>
                </div>
              </div>
              <select
                value={form.theme || 'light'}
                onChange={(e) => setForm({ ...form, theme: e.target.value as 'light' | 'dark' })}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="light">{isAr ? 'فاتح (Light)' : 'Light'}</option>
                <option value="dark">{isAr ? 'داكن (Dark)' : 'Dark'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Data Management & Export */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Download className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isAr ? 'إدارة البيانات والنسخ الاحتياطي والطباعة' : 'Data Management & Printing'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={onPrintPrescription}
              className="p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-teal-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-teal-300 rounded-xl text-right transition-all flex flex-col justify-between cursor-pointer"
            >
              <Printer className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-2" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {isAr ? 'طباعة جدول الأدوية' : 'Print Schedule'}
                </div>
                <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? 'بطاقة مطبوعة للمريض' : 'Patient card printable'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={onExportJson}
              className="p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-teal-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-teal-300 rounded-xl text-right transition-all flex flex-col justify-between cursor-pointer"
            >
              <Download className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-2" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تصدير JSON' : 'Export JSON Backup'}
                </div>
                <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? 'تنزيل نسخة للملفات/Drive' : 'Download for Drive'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={onResetData}
              className="p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-red-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-red-300 rounded-xl text-right transition-all flex flex-col justify-between cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 text-red-600 dark:text-red-400 mb-2" />
              <div>
                <div className="text-xs font-bold text-red-900 dark:text-red-300">
                  {isAr ? 'مسح كافة البيانات' : 'Reset All'}
                </div>
                <div className="text-2xs text-red-700 dark:text-red-400 mt-0.5">
                  {isAr ? 'تفريغ السجل بالكامل' : 'Clear all local data'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Section 4: Account Management & Data Deletion (Danger Zone) */}
        <div className="bg-red-50/50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900/60 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-red-200/60 dark:border-red-800/60 pb-3">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-bold text-red-950 dark:text-red-200 text-base">
                {isAr ? 'إدارة الحساب ومسح البيانات نهائياً' : 'Account Management & Data Deletion'}
              </h3>
              <p className="text-2xs text-red-700/80 dark:text-red-400 mt-0.5">
                {isAr
                  ? 'خيارات تصفير السجل للبدء من جديد، أو إغلاق الحساب وحذف كافة البيانات ومغادرة التطبيق'
                  : 'Options to clear medical records or permanently close account'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-800 space-y-2 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'تصفير كافة الأدوية والسجلات' : 'Wipe All Medical Data'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {isAr
                    ? 'يمسح جميع الأدوية، التذكيرات، والجرعات المسجلة مع البقاء مسجلاً بالحساب للبدء بسجل فارغ ونظيف تماماً.'
                    : 'Clears all medicines, doses, and reminders while keeping your account signed in.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onResetData}
                className="w-full mt-3 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-red-600" />
                <span>{isAr ? 'تصفير ومسح كافة الأدوية الآن' : 'Clear All Medicines'}</span>
              </button>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-800 space-y-2 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-red-900 dark:text-red-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>{isAr ? 'إغلاق الحساب ومسح البيانات نهائياً' : 'Delete Account & Wipe Everything'}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {isAr
                    ? 'حذف شامل: يمسح كل شيء من المتصفح، يسجل الخروج من Google فوراً، ويعيدك لصفحة البداية.'
                    : 'Permanently wipes all local data, signs out of Google, and resets to landing page.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onWipeAccount}
                className="w-full mt-3 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>{isAr ? 'إغلاق الحساب ومسح كافة البيانات' : 'Delete Account & Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>

        {savedNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              {isAr ? 'تم حفظ وتحديث الإعدادات بنجاح!' : 'Settings updated and saved successfully!'}
            </span>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm transition-all hover:shadow-md flex items-center gap-2 text-sm"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'حفظ كافة الإعدادات' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
