import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  AlertTriangle,
  Pill,
  Filter,
  Check,
  Undo2,
  CalendarDays,
  Search,
  Sparkles,
  Info,
  MapPin,
  ExternalLink,
  CalendarCheck,
  Stethoscope,
  Printer,
  AlarmClock,
} from 'lucide-react';
import { DoseSchedule, Medicine, UserSettings } from '../types/mediflow';
import { formatTimeArabic, formatDateArabic } from '../utils/doseCalculator';
import { playSuccessChime } from '../utils/audioAlert';
import {
  getGoogleCalendarUrl,
  generateSingleDoseIcs,
  downloadIcsFile,
} from '../utils/calendarSync';

interface ScheduleTabProps {
  medicines: Medicine[];
  doses: DoseSchedule[];
  settings: UserSettings;
  onToggleDose: (doseId: string, taken: boolean) => void;
  onSkipDose: (doseId: string) => void;
  onPrintPrescription?: () => void;
  lang: 'ar' | 'en';
}

type DayFilter = 'today' | 'tomorrow' | 'all';
type StatusFilter = 'all' | 'pending' | 'taken';

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  medicines,
  doses,
  settings,
  onToggleDose,
  onSkipDose,
  onPrintPrescription,
  lang,
}) => {
  const isAr = lang === 'ar';

  const [dayFilter, setDayFilter] = useState<DayFilter>('today');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Map medicine by ID for fast lookup
  const medicineMap = useMemo(() => {
    const map = new Map<string, Medicine>();
    medicines.forEach((m) => map.set(m.id, m));
    return map;
  }, [medicines]);

  // Today and Tomorrow boundaries
  const { todayStr, tomorrowStr } = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return {
      todayStr: today.toISOString().slice(0, 10),
      tomorrowStr: tomorrow.toISOString().slice(0, 10),
    };
  }, []);

  // Filter doses
  const filteredDoses = useMemo(() => {
    return doses
      .filter((d) => {
        const med = medicineMap.get(d.medicine_id);
        if (!med) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = med.name.toLowerCase().includes(q);
          const matchStrength = (med.strength || '').toLowerCase().includes(q);
          if (!matchName && !matchStrength) return false;
        }

        // Day filter
        const doseDateStr = d.dose_time.slice(0, 10);
        if (dayFilter === 'today' && doseDateStr !== todayStr) return false;
        if (dayFilter === 'tomorrow' && doseDateStr !== tomorrowStr) return false;

        // Status filter
        if (statusFilter === 'pending' && (d.taken || d.skipped)) return false;
        if (statusFilter === 'taken' && !d.taken) return false;

        return true;
      })
      .sort((a, b) => new Date(a.dose_time).getTime() - new Date(b.dose_time).getTime());
  }, [doses, medicineMap, searchQuery, dayFilter, statusFilter, todayStr, tomorrowStr]);

  // Today statistics
  const todayStats = useMemo(() => {
    const todayDoses = doses.filter((d) => d.dose_time.slice(0, 10) === todayStr);
    const taken = todayDoses.filter((d) => d.taken).length;
    const total = todayDoses.length;
    const percent = total > 0 ? Math.round((taken / total) * 100) : 100;
    return { taken, total, percent };
  }, [doses, todayStr]);

  // Find upcoming doctor visit follow-up appointment
  const doctorVisitMed = useMemo(() => {
    return medicines.find(
      (m) => m.next_visit_time && new Date(m.next_visit_time).getTime() > Date.now() - 86400000
    );
  }, [medicines]);

  const handleTake = (doseId: string, currentTaken: boolean) => {
    if (!currentTaken && settings.sound_enabled) {
      playSuccessChime();
    }
    onToggleDose(doseId, !currentTaken);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Daily Progress */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-400 font-semibold mb-1">
              <span>{isAr ? 'الجدول العلاجي الذكي' : 'Smart Treatment Schedule'}</span>
              <span aria-hidden="true">·</span>
              <span>{new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {isAr ? 'جدول الجرعات اليومية' : 'Daily Dose Schedule'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isAr
                ? 'استعرض الجرعات المجدولة تلقائياً، وسجل تناولك للدواء بضغطة زر لمتابعة التزامك العلاجي.'
                : 'View automated schedules and mark doses as taken to track your adherence.'}
            </p>

            {onPrintPrescription && (
              <button
                type="button"
                onClick={onPrintPrescription}
                className="mt-3 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-teal-900 dark:hover:text-teal-300 border border-slate-300 dark:border-slate-700 hover:border-teal-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{isAr ? 'طباعة التقرير الطبي وجدول الجرعات' : 'Print Medical Schedule Report'}</span>
              </button>
            )}
          </div>

          {/* Today Adherence Meter */}
          <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 rounded-xl p-4 min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-semibold text-teal-900 dark:text-teal-200 mb-1.5">
              <span>{isAr ? 'إنجاز جرعات اليوم:' : 'Today Adherence:'}</span>
              <span className="font-bold">{todayStats.percent}%</span>
            </div>
            <div className="w-full bg-teal-200/60 dark:bg-teal-900/60 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-teal-600 dark:bg-teal-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${todayStats.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-2xs text-teal-800 dark:text-teal-300 mt-2">
              <span>
                {isAr
                  ? `${todayStats.taken} من أصل ${todayStats.total} جرعات تم أخذها`
                  : `${todayStats.taken} of ${todayStats.total} taken`}
              </span>
              {todayStats.total > 0 && todayStats.taken === todayStats.total && (
                <span className="flex items-center gap-1 font-bold text-teal-900 dark:text-teal-200">
                  <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  {isAr ? 'مكتمل اليوم!' : 'Done!'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Doctor Visit Alert Banner */}
      {doctorVisitMed && doctorVisitMed.next_visit_time && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-amber-950 dark:text-amber-200 text-sm flex items-center gap-1.5">
                <span>{isAr ? 'تنبيه موعد استشارة ومراجعة الطبيب القادمة' : 'Upcoming Doctor Follow-up Visit'}</span>
                <span className="text-2xs bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-md font-semibold">
                  {doctorVisitMed.doctor_name || (isAr ? 'الطبيب المعالج' : 'Physician')}
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                <span>{formatDateArabic(doctorVisitMed.next_visit_time)} - {formatTimeArabic(doctorVisitMed.next_visit_time)}</span>
                {doctorVisitMed.clinic_name && (
                  <>
                    <span className="mx-1.5 text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{doctorVisitMed.clinic_name}</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Day segmented tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setDayFilter('today')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              dayFilter === 'today'
                ? 'bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {isAr ? 'اليوم' : 'Today'}
          </button>
          <button
            onClick={() => setDayFilter('tomorrow')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              dayFilter === 'tomorrow'
                ? 'bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {isAr ? 'غداً' : 'Tomorrow'}
          </button>
          <button
            onClick={() => setDayFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              dayFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {isAr ? 'جميع الأيام' : 'All Days'}
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'pending' ? 'bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isAr ? 'قيد الانتظار' : 'Pending'}
            </button>
            <button
              onClick={() => setStatusFilter('taken')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'taken' ? 'bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isAr ? 'تم أخذها' : 'Taken'}
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder={isAr ? 'بحث عن دواء...' : 'Search medicine...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900"
          />
        </div>
      </div>

      {/* Doses List */}
      {filteredDoses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            {isAr ? 'لا توجد جرعات مجدولة مطابقة لهذا الفلتر' : 'No scheduled doses match this filter'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {isAr
              ? 'جرّب تغيير التاريخ أو الفلتر، أو أضف دواءً جديداً من تبويب "إضافة دواء".'
              : 'Try changing the filter or add a new medication from the "Add Medicine" tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDoses.map((dose) => {
            const med = medicineMap.get(dose.medicine_id);
            if (!med) return null;

            const doseDate = new Date(dose.dose_time);
            const isToday = dose.dose_time.slice(0, 10) === todayStr;
            const isPast = doseDate.getTime() < Date.now() && !dose.taken && !dose.skipped;

            return (
              <div
                key={dose.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 md:p-5 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  dose.taken
                    ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : dose.skipped
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 opacity-60'
                    : isPast
                    ? 'border-amber-200 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/30 ring-1 ring-amber-300/40 dark:ring-amber-700/40'
                    : 'border-slate-200 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-700'
                }`}
              >
                {/* Left side: Time, Medicine Info */}
                <div className="flex items-start gap-4">
                  {/* Time Badge */}
                  <div
                    className={`flex flex-col items-center justify-center min-w-[76px] px-3 py-2.5 rounded-xl border text-center ${
                      dose.taken
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                        : isPast
                        ? 'border-amber-300 dark:border-amber-800 bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4 mb-1 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-bold leading-none">
                      {formatTimeArabic(dose.dose_time)}
                    </span>
                    {!isToday && (
                      <span className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                        {formatDateArabic(dose.dose_time)}
                      </span>
                    )}
                  </div>

                  {/* Medicine Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{med.name}</h4>
                      {med.strength && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">({med.strength})</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-teal-800 dark:text-teal-300">
                        {med.dose} ({med.pills_per_dose} {isAr ? 'حبة' : 'pills'})
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-slate-500 dark:text-slate-400">{med.notes || (isAr ? 'حسب الوصفة الطبية' : 'As prescribed')}</span>
                    </div>

                    {med.doctor_name && (
                      <div className="flex items-center gap-2 text-2xs text-slate-500 dark:text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Stethoscope className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span>{med.doctor_name}</span>
                        </span>
                        {med.clinic_coordinates && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(med.clinic_coordinates)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-700 dark:text-teal-400 hover:text-teal-900 underline flex items-center gap-0.5"
                          >
                            <MapPin className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" />
                            <span>{isAr ? 'الموقع على الخريطة' : 'Map'}</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Status note */}
                    {dose.taken && dose.taken_at && (
                      <div className="text-2xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {isAr
                            ? `تم أخذ الجرعة في ${formatTimeArabic(dose.taken_at)}`
                            : `Taken at ${formatTimeArabic(dose.taken_at)}`}
                        </span>
                      </div>
                    )}
                    {isPast && !dose.taken && !dose.skipped && (
                      <div className="text-2xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>{isAr ? 'فات موعد هذه الجرعة' : 'Overdue dose'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {/* Calendar & Alarm shortcut */}
                  <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-2 mr-0.5">
                    <a
                      href={getGoogleCalendarUrl(med, dose.dose_time, lang)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={isAr ? 'إضافة إلى تقويم Google' : 'Add to Google Calendar'}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const ics = generateSingleDoseIcs(med, dose.dose_time, lang);
                        downloadIcsFile(`${med.name}-dose.ics`, ics);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={isAr ? 'إضافة لمنبه وتقويم الهاتف (.ics)' : 'Add to Phone Alarm (.ics)'}
                    >
                      <AlarmClock className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {dose.taken ? (
                    <button
                      onClick={() => handleTake(dose.id, true)}
                      className="px-3.5 py-2 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={isAr ? 'إلغاء التحديد' : 'Undo taken'}
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{isAr ? 'تم أخذها' : 'Taken'}</span>
                      <Undo2 className="w-3.5 h-3.5 text-emerald-600/70 dark:text-emerald-400/70 mr-1" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleTake(dose.id, false)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all hover:shadow-sm cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isAr ? 'أخذت الجرعة' : 'Mark as Taken'}</span>
                      </button>

                      <button
                        onClick={() => onSkipDose(dose.id)}
                        className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                        title={isAr ? 'تخطي هذه الجرعة' : 'Skip dose'}
                      >
                        {isAr ? 'تخطي' : 'Skip'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
