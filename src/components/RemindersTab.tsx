import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Smartphone,
  Check,
  RotateCcw,
  CalendarCheck,
  MapPin,
  ExternalLink,
  Calendar,
  Download,
  AlarmClock,
  Laptop,
  Tablet,
} from 'lucide-react';
import { DoseSchedule, Medicine, Reminder, UserSettings } from '../types/mediflow';
import { formatTimeArabic, formatDateArabic } from '../utils/doseCalculator';
import { playReminderChime, playSuccessChime } from '../utils/audioAlert';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  triggerReminderNotification,
} from '../utils/notificationService';
import {
  getGoogleCalendarUrl,
  generateSingleDoseIcs,
  generateFullScheduleIcs,
  downloadIcsFile,
  detectDevice,
} from '../utils/calendarSync';

interface RemindersTabProps {
  medicines: Medicine[];
  doses: DoseSchedule[];
  reminders: Reminder[];
  settings: UserSettings;
  onTakeDose: (doseId: string) => void;
  onSnoozeReminder: (reminderId: string, minutes: number) => void;
  lang: 'ar' | 'en';
}

export const RemindersTab: React.FC<RemindersTabProps> = ({
  medicines,
  doses,
  reminders,
  settings,
  onTakeDose,
  onSnoozeReminder,
  lang,
}) => {
  const isAr = lang === 'ar';

  const [notificationPermission, setNotificationPermission] = useState<string>(() =>
    getNotificationPermission()
  );
  const [now, setNow] = useState(Date.now());
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [device] = useState(() => detectDevice());
  const [icsExportedNotice, setIcsExportedNotice] = useState(false);

  const handleExportAllToCalendar = () => {
    if (medicines.length === 0) {
      alert(isAr ? 'لا توجد أدوية مسجلة حالياً لتصديرها.' : 'No medications to export.');
      return;
    }
    const ics = generateFullScheduleIcs(medicines, doses, lang);
    downloadIcsFile('mediflow-alarms.ics', ics);
    setIcsExportedNotice(true);
    setTimeout(() => setIcsExportedNotice(false), 4000);
  };

  const handleExportSingleToCalendar = (med: Medicine, doseTime: string) => {
    const ics = generateSingleDoseIcs(med, doseTime, lang);
    downloadIcsFile(`${med.name}-alarm.ics`, ics);
  };

  // Update clock every 30 seconds for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Sync notification permission
  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      triggerReminderNotification({
        reminderId: 'welcome-test',
        medicineName: isAr ? 'Solafios Mediflow' : 'Solafios Mediflow',
        dose: isAr ? 'تم تفعيل التنبيهات بنجاح!' : 'Notifications enabled!',
        notes: isAr ? 'سننبهك بدقة عند حلول موعد أي جرعة علاجية.' : 'You will be alerted on exact dose times.',
        reminderTime: new Date().toISOString(),
        lang,
        playSound: settings.sound_enabled,
      });
    }
  };

  const handleTestNotification = async () => {
    let perm = getNotificationPermission();
    if (perm !== 'granted') {
      perm = await requestNotificationPermission();
      setNotificationPermission(perm);
      if (perm !== 'granted') return;
    }

    const sampleMed = medicines[0] || {
      name: isAr ? 'بانادول إكسترا' : 'Panadol Extra',
      dose: isAr ? 'قرص واحد' : '1 tablet',
      strength: '500mg',
      notes: isAr ? 'يؤخذ بعد الأكل مع كوب ماء' : 'Take with plenty of water',
    };

    triggerReminderNotification({
      reminderId: `test-${Date.now()}`,
      medicineName: sampleMed.name,
      dose: sampleMed.dose,
      strength: sampleMed.strength,
      notes: sampleMed.notes,
      reminderTime: new Date().toISOString(),
      lang,
      playSound: settings.sound_enabled,
    });

    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const medicineMap = useMemo(() => {
    const map = new Map<string, Medicine>();
    medicines.forEach((m) => map.set(m.id, m));
    return map;
  }, [medicines]);

  // Find next upcoming untaken dose
  const nextDoseInfo = useMemo(() => {
    const upcoming = doses
      .filter((d) => !d.taken && !d.skipped && new Date(d.dose_time).getTime() >= now - 1000 * 60 * 30) // within last 30m or future
      .sort((a, b) => new Date(a.dose_time).getTime() - new Date(b.dose_time).getTime())[0];

    if (!upcoming) return null;

    const med = medicineMap.get(upcoming.medicine_id);
    const diffMs = new Date(upcoming.dose_time).getTime() - now;
    const diffMins = Math.round(diffMs / 60000);

    return {
      dose: upcoming,
      medicine: med,
      diffMins,
      isImminent: diffMins <= 15 && diffMins >= -15,
      isPassed: diffMins < -15,
    };
  }, [doses, medicineMap, now]);

  // Today reminders list
  const todayReminders = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return reminders
      .filter((r) => r.reminder_time.slice(0, 10) === todayStr)
      .sort((a, b) => new Date(a.reminder_time).getTime() - new Date(b.reminder_time).getTime());
  }, [reminders]);

  // Upcoming doctor appointment follow-up
  const doctorVisitMed = useMemo(() => {
    return medicines.find(
      (m) => m.next_visit_time && new Date(m.next_visit_time).getTime() > now - 86400000
    );
  }, [medicines, now]);

  const handleTestChime = () => {
    playReminderChime();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-400 font-semibold mb-1">
              <span>{isAr ? 'نظام التنبيهات المباشر' : 'Live Alert Engine'}</span>
              <span aria-hidden="true">·</span>
              <span>{isAr ? 'مواعيد دقيقة' : 'Precision Timing'}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {isAr ? 'التذكيرات ومواعيد الجرعات' : 'Reminders & Dose Alerts'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isAr
                ? 'إشعارات وتنبيهات صوتية لضمان عدم تفويت أي جرعة دوائية على مدار اليوم.'
                : 'Audio chimes and notifications to guarantee you never miss a dose.'}
            </p>
          </div>

          {/* Top Actions: Test Sound & Test Browser Notification */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTestChime}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>{isAr ? 'نغمة التنبيه' : 'Test Sound'}</span>
            </button>

            <button
              onClick={handleTestNotification}
              className="px-3.5 py-2 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>
                {testNotificationSent
                  ? isAr ? 'تم إرسال الإشعار!' : 'Sent!'
                  : isAr ? 'تجربة إشعار المتصفح' : 'Test Browser Alert'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Doctor Review Appointment Banner */}
      {doctorVisitMed && doctorVisitMed.next_visit_time && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                <span>{isAr ? 'تنبيه موعد استشارة ومراجعة الطبيب القادمة' : 'Upcoming Doctor Follow-up Appointment'}</span>
                <span className="text-2xs bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-semibold">
                  {doctorVisitMed.doctor_name || (isAr ? 'الطبيب المعالج' : 'Physician')}
                </span>
              </div>
              <div className="text-slate-600 mt-0.5">
                <span>{formatDateArabic(doctorVisitMed.next_visit_time)} - {formatTimeArabic(doctorVisitMed.next_visit_time)}</span>
                {doctorVisitMed.clinic_name && (
                  <>
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span className="text-slate-700 font-medium">{doctorVisitMed.clinic_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {(doctorVisitMed.clinic_coordinates || doctorVisitMed.clinic_name) && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                doctorVisitMed.clinic_coordinates || doctorVisitMed.clinic_name || ''
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-2xs transition-colors self-end sm:self-center"
            >
              <MapPin className="w-3.5 h-3.5 text-white" />
              <span>{isAr ? 'اذهب إلى موقع المستشفى 🗺️' : 'Go to Location'}</span>
              <ExternalLink className="w-3 h-3 text-white" />
            </a>
          )}
        </div>
      )}

      {/* Next Dose Spotlight Card */}
      {nextDoseInfo && nextDoseInfo.medicine ? (
        <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <BellRing className="w-32 h-32 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-800/80 text-teal-200 text-xs font-medium border border-teal-700">
                <Clock className="w-3.5 h-3.5 text-teal-300" />
                <span>
                  {nextDoseInfo.diffMins > 0
                    ? isAr
                      ? `الجرعة القادمة بعد ${Math.floor(nextDoseInfo.diffMins / 60) > 0 ? `${Math.floor(nextDoseInfo.diffMins / 60)} ساعة و ` : ''}${nextDoseInfo.diffMins % 60} دقيقة`
                      : `Next dose in ${nextDoseInfo.diffMins} minutes`
                    : isAr
                    ? 'حان موعد هذه الجرعة الآن!'
                    : 'This dose is due now!'}
                </span>
              </div>

              <h3 className="text-2xl font-black text-white">
                {nextDoseInfo.medicine.name}
                {nextDoseInfo.medicine.strength && (
                  <span className="text-base text-teal-200 mr-2 font-mono">
                    ({nextDoseInfo.medicine.strength})
                  </span>
                )}
              </h3>

              <div className="text-sm text-teal-100 flex flex-wrap items-center gap-3">
                <span className="font-semibold text-white">
                  {nextDoseInfo.medicine.dose} ({nextDoseInfo.medicine.pills_per_dose} {isAr ? 'حبة' : 'pills'})
                </span>
                <span aria-hidden="true" className="text-teal-400">·</span>
                <span>الموعد: {formatTimeArabic(nextDoseInfo.dose.dose_time)}</span>
                <span aria-hidden="true" className="text-teal-400">·</span>
                <span className="text-teal-200 text-xs">{nextDoseInfo.medicine.notes || (isAr ? 'مع الوجبة' : 'With meal')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  if (settings.sound_enabled) playSuccessChime();
                  onTakeDose(nextDoseInfo.dose.id);
                }}
                className="px-6 py-3 bg-white hover:bg-teal-50 text-teal-950 font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center gap-2 text-sm"
              >
                <Check className="w-4 h-4 text-teal-700" />
                <span>{isAr ? 'أخذ الجرعة الآن' : 'Take Dose Now'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-4 text-emerald-900">
          <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-base">
              {isAr ? 'رائع! لا توجد جرعات متبقية الآن' : 'All caught up! No upcoming doses'}
            </h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              {isAr
                ? 'لقد تناولت جميع جرعاتك المجدولة حتى اللحظة. حافظ على هذا الالتزام الممتاز.'
                : 'You have taken all scheduled doses for now. Keep up the great adherence!'}
            </p>
          </div>
        </div>
      )}

      {/* Universal Device & Alarm Sync Card */}
      <div className="bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-cyan-500/10 border-2 border-teal-500/30 rounded-2xl p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-xs">
              <AlarmClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'منبه وتقويم الهاتف لكافة الأجهزة' : 'Phone Alarms & Calendar Sync'}
                </h4>
                <span className="px-2 py-0.5 text-3xs font-bold rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-700">
                  {device.isDesktop
                    ? (isAr ? '🖥️ لابتوب / كمبيوتر' : '🖥️ Laptop / PC')
                    : device.isTablet
                    ? (isAr ? '📟 تابلت / جهاز لوحي' : '📟 Tablet')
                    : (isAr ? '📱 هاتف ذكي' : '📱 Mobile Phone')}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'رنين وتنبيهات صوتية تعمل حتى عند إغلاق المتصفح عبر مزامنة مواعيد الأدوية مع منبه وتقويم هاتفك.'
                  : 'Get audible alarms even when browser is closed by syncing with your native calendar app.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportAllToCalendar}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{isAr ? 'مزامنة كافة المواعيد مع منبه الهاتف (.ics)' : 'Sync All Alarms (.ics)'}</span>
          </button>
        </div>

        {icsExportedNotice && (
          <div className="p-3 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isAr
                ? '✅ تم إنشاء وتحميل ملف المنبه والتقويم! افتح الملف ليتم تسجيل مواعيد أدويتك كمنبهات وتذكيرات مباشرة في تقويم جهازك.'
                : '✅ Calendar alarms exported! Open the downloaded file to add all medication alarms to your device calendar.'}
            </span>
          </div>
        )}
      </div>

      {/* Browser Notification Permission Banner */}
      {notificationPermission !== 'granted' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'تفعيل تنبيهات المتصفح لضمان وصول التذكير' : 'Enable Browser Push Alerts'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'يسمح للمتصفح بإرسال إشعار فوري عند حلول موعد أي جرعة علاجية بدقة.'
                  : 'Allows instant pop-up notifications when it is time for your medication.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPermission}
            className="px-4 py-2 bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            {isAr ? 'تفعيل الإشعارات' : 'Allow Notifications'}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {isAr
                ? 'إشعارات المتصفح مفعلة بنجاح، وستصلك فور حلول مواعيد الجرعات.'
                : 'Browser notifications are active and scheduled for upcoming doses.'}
            </span>
          </div>
          <button
            onClick={handleTestNotification}
            className="text-xs text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 font-semibold underline shrink-0 cursor-pointer"
          >
            {isAr ? 'إرسال إشعار تجريبي' : 'Send test alert'}
          </button>
        </div>
      )}

      {/* Today's Reminders List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isAr ? 'تذكيرات اليوم المحسوبة' : "Today's Calculated Reminders"}
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {todayReminders.length} {isAr ? 'تنبيه مجدول' : 'scheduled'}
          </span>
        </div>

        {todayReminders.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
            {isAr ? 'لا توجد تذكيرات مسجلة لهذا اليوم.' : 'No reminders for today.'}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todayReminders.map((rem) => {
              const med = medicineMap.get(rem.medicine_id);
              if (!med) return null;

              // Find matching dose
              const matchedDose = doses.find(
                (d) => d.medicine_id === rem.medicine_id && d.dose_time === rem.reminder_time
              );
              const isTaken = matchedDose?.taken;

              return (
                <div
                  key={rem.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
                        isTaken
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                          : 'bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800'
                      }`}
                    >
                      {formatTimeArabic(rem.reminder_time)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{med.name}</span>
                        {med.strength && <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">({med.strength})</span>}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {med.dose} · {med.notes || (isAr ? 'حسب الوصفة' : 'Prescribed')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Quick Add to Calendar / Phone Alarm */}
                    <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-2 mr-1">
                      <a
                        href={getGoogleCalendarUrl(med, rem.reminder_time, lang)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={isAr ? 'إضافة إلى تقويم Google' : 'Add to Google Calendar'}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleExportSingleToCalendar(med, rem.reminder_time)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={isAr ? 'إضافة لمنبه وتقويم الهاتف (.ics)' : 'Add to Phone Alarm (.ics)'}
                      >
                        <AlarmClock className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isTaken ? (
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                        <Check className="w-3.5 h-3.5" />
                        {isAr ? 'تم أخذها' : 'Taken'}
                      </span>
                    ) : matchedDose ? (
                      <>
                        <button
                          onClick={() => {
                            if (settings.sound_enabled) playSuccessChime();
                            onTakeDose(matchedDose.id);
                          }}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {isAr ? 'أخذ الآن' : 'Take Now'}
                        </button>
                        <button
                          onClick={() => onSnoozeReminder(rem.id, 15)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                          title={isAr ? 'تأجيل 15 دقيقة' : 'Snooze 15 mins'}
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{isAr ? '15 د' : '15m'}</span>
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
