import React, { useState, useMemo } from 'react';
import {
  History,
  CheckCircle2,
  Calendar,
  Pill,
  Clock,
  RotateCcw,
  Sparkles,
  Award,
  AlertCircle,
  FileText,
  Filter,
} from 'lucide-react';
import { DoseSchedule, Medicine, UserSettings } from '../types/mediflow';
import { formatTimeArabic, formatDateArabic, calculateAdherence } from '../utils/doseCalculator';

interface HistoryTabProps {
  medicines: Medicine[];
  doses: DoseSchedule[];
  settings: UserSettings;
  onRestartMedicine: (medicine: Medicine) => void;
  lang: 'ar' | 'en';
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  medicines,
  doses,
  settings,
  onRestartMedicine,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<'courses' | 'log'>('courses');

  const medicineMap = useMemo(() => {
    const map = new Map<string, Medicine>();
    medicines.forEach((m) => map.set(m.id, m));
    return map;
  }, [medicines]);

  // Global adherence
  const adherence = useMemo(() => calculateAdherence(doses), [doses]);

  // Categorize medicines into Active vs Completed
  const { activeMeds, completedMeds } = useMemo(() => {
    const now = Date.now();
    const active: Medicine[] = [];
    const completed: Medicine[] = [];

    medicines.forEach((m) => {
      const startDate = new Date(m.first_dose_time).getTime();
      const endDate = startDate + m.duration * 86400000;
      if (now > endDate) {
        completed.push(m);
      } else {
        active.push(m);
      }
    });

    return { activeMeds: active, completedMeds: completed };
  }, [medicines]);

  // Log of taken doses
  const takenLog = useMemo(() => {
    return doses
      .filter((d) => d.taken)
      .sort((a, b) => new Date(b.taken_at || b.dose_time).getTime() - new Date(a.taken_at || a.dose_time).getTime())
      .slice(0, 50); // last 50
  }, [doses]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold mb-1">
              <span>{isAr ? 'السجل الدوائي والالتزام' : 'Medication History & Adherence'}</span>
              <span aria-hidden="true">·</span>
              <span>{isAr ? 'متابعة شاملة' : 'Complete Audit'}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              {isAr ? 'سجل الأدوية والكورسات السابقة' : 'Medication History & Adherence'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isAr
                ? 'استعراض الأدوية المنتهية، نسبة التزامك بالجرعات، وسجل تاريخي بكل جرعة تم أخذها.'
                : 'Review past medications, overall adherence rate, and chronological intake records.'}
            </p>
          </div>

          {/* Adherence Rate Box */}
          <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-2xl p-4">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-lg">
              {adherence.percentage}%
            </div>
            <div>
              <div className="text-xs font-bold text-teal-900">
                {isAr ? 'معدل الالتزام الكلي' : 'Overall Adherence'}
              </div>
              <div className="text-2xs text-teal-700 mt-0.5">
                {isAr
                  ? `أُخذت ${adherence.taken} من أصل ${adherence.total} جرعة`
                  : `${adherence.taken} of ${adherence.total} doses taken`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-2xs text-slate-500 font-medium">
            {isAr ? 'الأدوية النشطة حالياً' : 'Active Medications'}
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{activeMeds.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-2xs text-slate-500 font-medium">
            {isAr ? 'الكورسات المنتهية' : 'Completed Courses'}
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{completedMeds.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-2xs text-slate-500 font-medium">
            {isAr ? 'الجرعات المسجلة كـ مأخوذة' : 'Total Doses Taken'}
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{adherence.taken}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-2xs text-slate-500 font-medium">
            {isAr ? 'الجرعات المتخطاة' : 'Skipped Doses'}
          </div>
          <div className="text-xl font-bold text-slate-600 mt-1">{adherence.skipped}</div>
        </div>
      </div>

      {/* Sub tabs: Completed Courses vs Intake Log */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveSubTab('courses')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'courses'
                ? 'bg-teal-50 text-teal-900 border border-teal-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'الكورسات السابقة والمنتهية' : 'Completed Medications'} ({completedMeds.length})
          </button>
          <button
            onClick={() => setActiveSubTab('log')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'log'
                ? 'bg-teal-50 text-teal-900 border border-teal-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'سجل الجرعات المأخوذة' : 'Intake Audit Log'} ({takenLog.length})
          </button>
        </div>

        {activeSubTab === 'courses' ? (
          <div>
            {completedMeds.length === 0 ? (
              <div className="text-center py-10">
                <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">
                  {isAr ? 'لا توجد كورسات علاجية منتهية حتى الآن' : 'No completed medication courses yet'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr
                    ? 'عندما تنتهي فترة علاج أي دواء نشط، سيظهر هنا تلقائياً مع خيار تجديد الكورس.'
                    : 'When a medication duration passes, it moves to this completed archive.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedMeds.map((med) => {
                  const medDoses = doses.filter((d) => d.medicine_id === med.id);
                  const medAdherence = calculateAdherence(medDoses);

                  return (
                    <div
                      key={med.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{med.name}</h4>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {med.strength} · {med.dose} · {med.duration} {isAr ? 'أيام' : 'days'}
                          </div>
                        </div>
                        <span className="text-2xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                          {isAr ? 'كورس منتهي' : 'Completed'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span>{isAr ? 'نسبة الالتزام:' : 'Adherence:'}</span>
                        <span className="font-bold text-teal-800">{medAdherence.percentage}%</span>
                      </div>

                      {med.notes && (
                        <p className="text-2xs text-slate-500 italic">
                          "{med.notes}"
                        </p>
                      )}

                      <div className="pt-1 flex items-center justify-end">
                        <button
                          onClick={() => onRestartMedicine(med)}
                          className="px-3 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-teal-900 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                          <span>{isAr ? 'تجديد / إعادة الكورس' : 'Restart Course'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {takenLog.length === 0 ? (
              <div className="text-center py-10">
                <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">
                  {isAr ? 'لا توجد جرعات مسجلة بعد' : 'No intake logs recorded yet'}
                </h4>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {takenLog.map((log) => {
                  const med = medicineMap.get(log.medicine_id);
                  if (!med) return null;

                  return (
                    <div
                      key={log.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900">{med.name}</span>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <span className="text-slate-600">{med.dose}</span>
                        </div>
                      </div>

                      <div className="text-right text-slate-500 font-mono text-2xs">
                        {log.taken_at
                          ? `${formatDateArabic(log.taken_at)} - ${formatTimeArabic(log.taken_at)}`
                          : formatTimeArabic(log.dose_time)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
