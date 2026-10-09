import React from 'react';
import {
  Printer,
  X,
  User,
  Stethoscope,
  MapPin,
  CalendarCheck,
  Calendar,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { Medicine, DoseSchedule, UserSettings } from '../types/mediflow';
import { formatTimeArabic, formatDateArabic } from '../utils/doseCalculator';

interface PrintPrescriptionModalProps {
  medicines: Medicine[];
  doses: DoseSchedule[];
  settings: UserSettings;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export const PrintPrescriptionModal: React.FC<PrintPrescriptionModalProps> = ({
  medicines,
  doses,
  settings,
  onClose,
  lang,
}) => {
  const isAr = lang === 'ar';

  // Extract patient and doctor details from the medicines
  const doctorMed = medicines.find((m) => m.prescription_source === 'doctor' || m.doctor_name);
  const patientMed = medicines.find((m) => m.patient_name);
  const isPersonalOnly = medicines.length > 0 && medicines.every((m) => m.prescription_source === 'personal');

  const patientName = patientMed?.patient_name || (isAr ? 'المريض' : 'Patient');
  const patientAge = patientMed?.patient_age || '-';
  const visitDate = patientMed?.visit_date || new Date().toISOString().slice(0, 10);

  const doctorName = doctorMed?.doctor_name || (isPersonalOnly ? (isAr ? 'علاج شخصي (بدون وصفة طبيب)' : 'Self-Medication / OTC') : '');
  const clinicName = doctorMed?.clinic_name || (isPersonalOnly ? (isAr ? 'استخدام منزلي ذاتي' : 'Personal Home Care') : '');
  const coordinates = doctorMed?.clinic_coordinates || '';
  const nextVisitTime = doctorMed?.next_visit_time;

  const handlePrint = () => {
    window.print();
  };

  const getScheduleLabel = (schedule: string) => {
    switch (schedule) {
      case 'before_breakfast': return isAr ? 'قبل الإفطار (نصف ساعة)' : 'Before Breakfast';
      case 'after_breakfast': return isAr ? 'بعد الإفطار' : 'After Breakfast';
      case 'before_lunch': return isAr ? 'قبل الغداء' : 'Before Lunch';
      case 'after_lunch': return isAr ? 'بعد الغداء' : 'After Lunch';
      case 'before_dinner': return isAr ? 'قبل العشاء' : 'Before Dinner';
      case 'after_dinner': return isAr ? 'بعد العشاء' : 'After Dinner';
      case 'before_sleep': return isAr ? 'قبل النوم' : 'Before Bedtime';
      case 'after_wake': return isAr ? 'بعد الاستيقاظ' : 'After Wake-up';
      case 'custom_interval': return isAr ? 'أوقات متساوية ومتباعدة' : 'Spaced Intervals';
      default: return schedule;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print-modal-container">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0 print-modal-container">
        {/* Modal Controls (Hidden in print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-lg">
              {isAr ? 'طباعة التقرير الطبي وجدول الأدوية' : 'Printable Medication Report'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة الآن (Print)' : 'Print Now'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 md:p-8 border border-slate-300 rounded-xl space-y-6 text-slate-900 bg-white print-card-content">
          {/* Main Hospital / App Header */}
          <div className="flex items-start justify-between border-b-2 border-teal-700 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-teal-900 tracking-tight">
                  Solafios Mediflow
                </span>
                <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-sm print:border print:border-teal-400">
                  Clinical Rx
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {isAr ? 'تقرير جدول المواعيد والجرعات العلاجية المعتمدة' : 'Official Patient Medication & Dose Schedule'}
              </p>
            </div>

            <div className="text-left text-xs text-slate-600 space-y-0.5 font-mono">
              <div className="font-bold text-slate-900">{formatDateArabic(new Date().toISOString())}</div>
              <div className="text-2xs text-teal-800 font-bold">Dr. Eslam Elbialy</div>
              <div className="text-2xs text-slate-400">Ref: RX-{Date.now().toString(36).toUpperCase().slice(-6)}</div>
            </div>
          </div>

          {/* Patient & Doctor Clinical Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
            {/* Patient Info */}
            <div className="space-y-1.5 border-b sm:border-b-0 sm:border-l sm:pl-4 border-slate-200">
              <div className="font-bold text-teal-900 flex items-center gap-1.5 mb-2">
                <User className="w-4 h-4 text-teal-600" />
                <span>{isAr ? 'بيانات المريض (Patient Information)' : 'Patient Details'}</span>
              </div>
              <div className="flex items-center justify-between pr-2">
                <span className="text-slate-500">{isAr ? 'اسم المريض:' : 'Name:'}</span>
                <span className="font-bold text-slate-900">{patientName}</span>
              </div>
              <div className="flex items-center justify-between pr-2">
                <span className="text-slate-500">{isAr ? 'العمر:' : 'Age:'}</span>
                <span className="font-semibold text-slate-800">{patientAge} {isAr ? 'سنة' : 'years'}</span>
              </div>
              <div className="flex items-center justify-between pr-2">
                <span className="text-slate-500">{isAr ? 'تاريخ الفحص والزيارة:' : 'Visit Date:'}</span>
                <span className="font-mono text-slate-700">{visitDate}</span>
              </div>
            </div>

            {/* Doctor & Location Info */}
            <div className="space-y-1.5 pr-0 sm:pr-2">
              <div className="font-bold text-teal-900 flex items-center gap-1.5 mb-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>{isAr ? 'بيانات الطبيب والمجمع الطبي (Clinic / Doctor)' : 'Clinical Provider'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isAr ? 'الطبيب المعالج:' : 'Doctor:'}</span>
                <span className="font-bold text-slate-900">{doctorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isAr ? 'المركز / المستشفى:' : 'Clinic:'}</span>
                <span className="font-semibold text-slate-800">{clinicName}</span>
              </div>
              {coordinates && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{isAr ? 'إحداثيات الموقع (GPS):' : 'Coordinates:'}</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-teal-800 font-semibold underline flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3 text-teal-600" />
                    <span>{coordinates}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-teal-600 no-print" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Next Follow-Up Review Visit Alert Box */}
          {nextVisitTime && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-center justify-between print:border-slate-300">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <span className="font-bold">{isAr ? 'موعد استشارة ومراجعة الطبيب القادمة:' : 'Next Doctor Follow-up Appointment:'} </span>
                  <span className="font-semibold font-mono text-slate-900">
                    {formatDateArabic(nextVisitTime)} - {formatTimeArabic(nextVisitTime)}
                  </span>
                </div>
              </div>
              <span className="text-2xs bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                {isAr ? 'مراجعة دورية' : 'Follow-up'}
              </span>
            </div>
          )}

          {/* Meal Times Reference */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 print:bg-white print:border-slate-300">
            <span className="font-bold text-slate-700">{isAr ? 'أوقات الوجبات المعتمدة لحساب الجرعات:' : 'Scheduled Meal Routine:'}</span>
            <span>{isAr ? 'الإفطار:' : 'Breakfast:'} <strong>{settings.breakfast_time}</strong></span>
            <span>{isAr ? 'الغداء:' : 'Lunch:'} <strong>{settings.lunch_time}</strong></span>
            <span>{isAr ? 'العشاء:' : 'Dinner:'} <strong>{settings.dinner_time}</strong></span>
            <span>{isAr ? 'النوم:' : 'Bedtime:'} <strong>{settings.sleep_time}</strong></span>
          </div>

          {/* Prescribed Medications Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-teal-50/70 text-teal-950 font-bold print:bg-slate-100">
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">{isAr ? 'اسم الدواء (Medication)' : 'Medication'}</th>
                  <th className="p-2.5">{isAr ? 'التركيز' : 'Strength'}</th>
                  <th className="p-2.5">{isAr ? 'الجرعة' : 'Dose'}</th>
                  <th className="p-2.5">{isAr ? 'التكرار' : 'Times'}</th>
                  <th className="p-2.5">{isAr ? 'النظام وتوقيت الأكل' : 'Schedule Routine'}</th>
                  <th className="p-2.5">{isAr ? 'المدة' : 'Duration'}</th>
                  <th className="p-2.5">{isAr ? 'تعليمات وإرشادات الطبيب' : 'Clinical Instructions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {medicines.map((med, idx) => (
                  <tr key={med.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                    <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2.5">
                      <div className="font-bold text-slate-900">{med.name}</div>
                      <div className="text-2xs text-slate-400 capitalize">{med.type}</div>
                    </td>
                    <td className="p-2.5 text-slate-700 font-mono">{med.strength || '-'}</td>
                    <td className="p-2.5 text-teal-800 font-semibold">{med.dose}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{med.times_per_day}x {isAr ? 'يومياً' : '/day'}</td>
                    <td className="p-2.5 text-slate-700">{getScheduleLabel(med.schedule)}</td>
                    <td className="p-2.5 text-slate-600 font-medium">{med.duration} {isAr ? 'أيام' : 'days'}</td>
                    <td className="p-2.5 text-slate-600 italic">{med.notes || (isAr ? 'حسب الإرشادات الموصوفة' : 'As directed')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Warning & Clinical Signature */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-2xs text-slate-500">
            <div className="space-y-1 text-right">
              <div className="font-semibold text-slate-700">
                {isAr
                  ? 'تنبيه: التزم بإنهاء فترة العلاج كاملة ولا تقم بتغيير الجرعات دون مراجعة الطبيب المعالج.'
                  : 'Important: Complete the full course and do not modify doses without physician consultation.'}
              </div>
              <div>{isAr ? 'تم إنشاء التقرير الطبي إلكترونياً عبر Solafios Mediflow' : 'Generated via Solafios Mediflow Clinical Engine'}</div>
            </div>

            <div className="text-center sm:text-left border-t sm:border-t-0 pt-2 sm:pt-0">
              <div className="text-slate-400 mb-6">{isAr ? 'توقيع وختم الطبيب المعالج:' : 'Doctor Signature & Stamp:'}</div>
              <div className="border-b border-dashed border-slate-400 w-36 mx-auto sm:mx-0"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
