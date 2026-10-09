import React, { useState, useMemo } from 'react';
import {
  Pill,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FlaskConical,
  Syringe,
  Droplet,
  HeartPulse,
  Info,
  MapPin,
  ExternalLink,
  User,
  Stethoscope,
  HelpCircle,
  Copy,
  CalendarCheck,
  Check,
} from 'lucide-react';
import {
  Medicine,
  MedicineType,
  ScheduleTiming,
  PrescriptionSource,
  UserSettings,
} from '../types/mediflow';
import { calculateDosesAndReminders, formatTimeArabic } from '../utils/doseCalculator';

interface AddMedicineTabProps {
  settings: UserSettings;
  onSaveMedicine: (medicine: Medicine) => void;
  lang: 'ar' | 'en';
}

const MEDICINE_TYPES: { id: MedicineType; labelAr: string; labelEn: string; icon: React.ElementType }[] = [
  { id: 'tablet', labelAr: 'أقراص / كبسولات', labelEn: 'Tablet / Capsule', icon: Pill },
  { id: 'syrup', labelAr: 'شراب (سائل)', labelEn: 'Syrup (Liquid)', icon: FlaskConical },
  { id: 'injection', labelAr: 'حقن', labelEn: 'Injection', icon: Syringe },
  { id: 'drops', labelAr: 'قطرات', labelEn: 'Drops', icon: Droplet },
  { id: 'cream', labelAr: 'مرهم / كريم', labelEn: 'Cream / Ointment', icon: HeartPulse },
  { id: 'inhaler', labelAr: 'بخاخ / استنشاق', labelEn: 'Inhaler', icon: HeartPulse },
];

const SCHEDULE_OPTIONS: { id: ScheduleTiming; labelAr: string; labelEn: string; descAr: string }[] = [
  { id: 'custom_interval', labelAr: 'أوقات متساوية ومتباعدة (كل N ساعة)', labelEn: 'Evenly spaced intervals', descAr: 'يحسب المواعيد بناءً على أول جرعة' },
  { id: 'before_breakfast', labelAr: 'قبل وجبة الإفطار (نصف ساعة)', labelEn: 'Before Breakfast', descAr: 'مرتبط بوقت الفطار' },
  { id: 'after_breakfast', labelAr: 'بعد وجبة الإفطار', labelEn: 'After Breakfast', descAr: 'مرتبط بوقت الفطار' },
  { id: 'before_lunch', labelAr: 'قبل وجبة الغداء', labelEn: 'Before Lunch', descAr: 'مرتبط بوقت الغداء' },
  { id: 'after_lunch', labelAr: 'بعد وجبة الغداء', labelEn: 'After Lunch', descAr: 'مرتبط بوقت الغداء' },
  { id: 'before_dinner', labelAr: 'قبل وجبة العشاء', labelEn: 'Before Dinner', descAr: 'مرتبط بوقت العشاء' },
  { id: 'after_dinner', labelAr: 'بعد وجبة العشاء', labelEn: 'After Dinner', descAr: 'مرتبط بوقت العشاء' },
  { id: 'before_sleep', labelAr: 'قبل النوم مباشرة', labelEn: 'Before Bedtime', descAr: 'مرتبط بوقت النوم' },
  { id: 'after_wake', labelAr: 'بعد الاستيقاظ فوراً', labelEn: 'After Waking Up', descAr: 'مرتبط بوقت الاستيقاظ' },
];

const PRESETS = [
  {
    name: 'بانادول إكسترا (Panadol Extra)',
    strength: '500mg',
    dose: 'قرص واحد',
    pills_per_dose: 1,
    times_per_day: 3,
    schedule: 'after_lunch' as ScheduleTiming,
    duration: 5,
    notes: 'يؤخذ بعد الأكل عند اللزوم للصداع والحرارة',
    type: 'tablet' as MedicineType,
  },
  {
    name: 'أوجمنتين (Augmentin)',
    strength: '1g',
    dose: 'قرص واحد',
    pills_per_dose: 1,
    times_per_day: 2,
    schedule: 'custom_interval' as ScheduleTiming,
    duration: 7,
    notes: 'مضاد حيوي كل 12 ساعة بانتظام لإكمال الكورس',
    type: 'tablet' as MedicineType,
  },
  {
    name: 'أوميبرازول (Omeprazole)',
    strength: '20mg',
    dose: 'كبسولة واحدة',
    pills_per_dose: 1,
    times_per_day: 1,
    schedule: 'before_breakfast' as ScheduleTiming,
    duration: 14,
    notes: 'صباحاً على الريق قبل الإفطار بنصف ساعة',
    type: 'tablet' as MedicineType,
  },
  {
    name: 'قطرة مرطبة للعين (Lubricant Drops)',
    strength: '15ml',
    dose: 'قطرة بالعين',
    pills_per_dose: 1,
    times_per_day: 3,
    schedule: 'custom_interval' as ScheduleTiming,
    duration: 14,
    notes: 'قطرة 3 مرات يومياً لترطيب العين ومنع الجفاف',
    type: 'drops' as MedicineType,
  },
];

export const AddMedicineTab: React.FC<AddMedicineTabProps> = ({
  settings,
  onSaveMedicine,
  lang,
}) => {
  const isAr = lang === 'ar';

  // Patient Info States
  const [patientName, setPatientName] = useState('أحمد سيف');
  const [patientAge, setPatientAge] = useState('16');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Prescription Source & Clinical Location States
  const [prescriptionSource, setPrescriptionSource] = useState<PrescriptionSource>('doctor');
  const [doctorName, setDoctorName] = useState('د. معاذ عطيتو');
  const [clinicName, setClinicName] = useState('مستشفى الأقصر الدولي - عيادة جراحة العيون');
  const [clinicCoordinates, setClinicCoordinates] = useState('25.6872, 32.6396');
  const [nextVisitTime, setNextVisitTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(11, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [nextVisitReminder, setNextVisitReminder] = useState(true);
  const [showMapsHelp, setShowMapsHelp] = useState(false);

  // Medicine Details Form states
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [dose, setDose] = useState('قرص واحد');
  const [pillsPerDose, setPillsPerDose] = useState(1);
  const [timesPerDay, setTimesPerDay] = useState(2);
  const [schedule, setSchedule] = useState<ScheduleTiming>('custom_interval');
  const [firstDoseTime, setFirstDoseTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 10);
    return d.toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState(7);
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<MedicineType>('tablet');

  const [errorMsg, setErrorMsg] = useState('');
  const [successSaved, setSuccessSaved] = useState(false);

  // Live calculation preview
  const previewDoses = useMemo(() => {
    if (!name) return [];
    const tempMed: Medicine = {
      id: 'preview-temp',
      name,
      strength,
      dose,
      pills_per_dose: pillsPerDose,
      times_per_day: timesPerDay,
      schedule,
      first_dose_time: new Date(firstDoseTime).toISOString(),
      duration: Math.min(duration, 2),
      notes,
      type,
      created_at: new Date().toISOString(),
    };
    const { doses } = calculateDosesAndReminders(tempMed, settings);
    return doses.slice(0, timesPerDay);
  }, [name, strength, dose, pillsPerDose, timesPerDay, schedule, firstDoseTime, duration, notes, type, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال اسم الدواء أولاً' : 'Please enter the medicine name');
      return;
    }

    if (!dose.trim()) {
      setErrorMsg(isAr ? 'يرجى تحديد الجرعة (قرص، مل، كبسولة...)' : 'Please specify the dose');
      return;
    }

    if (pillsPerDose <= 0) {
      setErrorMsg(isAr ? 'عدد الحبات في الجرعة يجب أن يكون 1 على الأقل' : 'Pills per dose must be at least 1');
      return;
    }

    if (timesPerDay <= 0) {
      setErrorMsg(isAr ? 'عدد مرات الاستخدام يومياً يجب أن يكون 1 على الأقل' : 'Times per day must be at least 1');
      return;
    }

    if (duration <= 0) {
      setErrorMsg(isAr ? 'مدة العلاج بالأيام يجب أن تكون يوماً واحداً على الأقل' : 'Treatment duration must be at least 1 day');
      return;
    }

    const newMed: Medicine = {
      id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      strength: strength.trim(),
      dose: dose.trim(),
      pills_per_dose: Number(pillsPerDose),
      times_per_day: Number(timesPerDay),
      schedule,
      first_dose_time: new Date(firstDoseTime).toISOString(),
      duration: Number(duration),
      notes: notes.trim(),
      type,
      created_at: new Date().toISOString(),

      // Patient metadata
      patient_name: patientName.trim(),
      patient_age: patientAge.trim(),
      visit_date: visitDate,

      // Clinical source metadata
      prescription_source: prescriptionSource,
      doctor_name: prescriptionSource === 'doctor' ? doctorName.trim() : undefined,
      clinic_name: prescriptionSource === 'doctor' ? clinicName.trim() : undefined,
      clinic_coordinates: prescriptionSource === 'doctor' ? clinicCoordinates.trim() : undefined,
      next_visit_time: prescriptionSource === 'doctor' ? new Date(nextVisitTime).toISOString() : undefined,
      next_visit_reminder: prescriptionSource === 'doctor' ? nextVisitReminder : false,
    };

    onSaveMedicine(newMed);
    setSuccessSaved(true);

    // Reset form fields after save
    setTimeout(() => {
      setName('');
      setStrength('');
      setNotes('');
      setSuccessSaved(false);
    }, 2000);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setStrength(preset.strength);
    setDose(preset.dose);
    setPillsPerDose(preset.pills_per_dose);
    setTimesPerDay(preset.times_per_day);
    setSchedule(preset.schedule);
    setDuration(preset.duration);
    setNotes(preset.notes);
    setType(preset.type);
    setErrorMsg('');
  };

  const getGoogleMapsUrl = () => {
    if (clinicCoordinates.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicCoordinates.trim())}`;
    }
    if (clinicName.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicName.trim())}`;
    }
    return 'https://maps.google.com';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold mb-1">
              <span>{isAr ? 'نموذج الإدخال الطبي السريري' : 'Clinical Entry Form'}</span>
              <span aria-hidden="true">·</span>
              <span>{isAr ? 'بيانات المريض، الطبيب والموقع' : 'Patient, Doctor & Map Location'}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              {isAr ? 'إضافة دواء وجدول علاجي جديد' : 'Add Medication & Treatment Plan'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isAr
                ? 'أدخل بيانات المريض، مصدر الروشتة (طبيب أو استخدام شخصي)، موقع العيادة وموعد المراجعة، وتفاصيل الجرعات.'
                : 'Enter patient information, prescription origin, clinic location coordinates, follow-up visit, and medicine doses.'}
            </p>
          </div>

          {/* Quick Presets Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              {isAr ? 'أمثلة سريعة:' : 'Quick Presets:'}
            </span>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 rounded-lg transition-colors font-medium border border-slate-200 cursor-pointer"
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Patient Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {isAr ? 'بيانات المريض (Patient Information)' : 'Patient Information'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAr ? 'اسم المريض (Patient Name)' : 'Patient Name'}
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder={isAr ? 'مثال: أحمد سيف' : 'e.g. John Doe'}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAr ? 'سن / عمر المريض (Age)' : 'Patient Age'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder={isAr ? 'مثال: 16' : 'e.g. 16'}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <span className="absolute left-3 top-2 text-xs text-slate-400 pointer-events-none">
                  {isAr ? 'سنة' : 'yrs'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAr ? 'تاريخ الزيارة والفحص (Visit Date)' : 'Visit Date'}
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Prescription Origin & Clinic/Location */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-base">
                {isAr ? 'مصدر الروشتة وموقع المركز الطبي' : 'Prescription Source & Clinic Location'}
              </h3>
            </div>
          </div>

          {/* Toggle between Doctor Prescription and Personal OTC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPrescriptionSource('doctor')}
              className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                prescriptionSource === 'doctor'
                  ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/20 text-teal-950 font-bold'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <Stethoscope className={`w-5 h-5 shrink-0 mt-0.5 ${prescriptionSource === 'doctor' ? 'text-teal-600' : 'text-slate-400'}`} />
              <div>
                <div className="text-sm font-bold">
                  {isAr ? 'وصفة طبية من طبيب / مستشفى' : 'Doctor / Hospital Prescription'}
                </div>
                <div className="text-2xs text-slate-500 mt-0.5 font-normal">
                  {isAr ? 'تتضمن اسم الطبيب، موقع المجمع، وتاريخ المراجعة القادمة' : 'Includes doctor name, location, and follow-up appointment'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPrescriptionSource('personal')}
              className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                prescriptionSource === 'personal'
                  ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/20 text-teal-950 font-bold'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <User className={`w-5 h-5 shrink-0 mt-0.5 ${prescriptionSource === 'personal' ? 'text-teal-600' : 'text-slate-400'}`} />
              <div>
                <div className="text-sm font-bold">
                  {isAr ? 'استخدام شخصي / ذاتي (OTC)' : 'Personal / Self-medication'}
                </div>
                <div className="text-2xs text-slate-500 mt-0.5 font-normal">
                  {isAr ? 'دواء شخصي بدون وصفة طبية ولا يتطلب موقع أو طبيب' : 'Over-the-counter medicine without clinic location'}
                </div>
              </div>
            </button>
          </div>

          {/* Conditional Clinical Fields if Doctor is selected */}
          {prescriptionSource === 'doctor' ? (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isAr ? 'اسم الطبيب المعالج (Doctor Name)' : 'Doctor Name'}
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder={isAr ? 'مثال: د. معاذ عطيتو' : 'e.g. Dr. Moaz Ateto'}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isAr ? 'اسم المستشفى أو المجمع الطبي (Clinic / Hospital)' : 'Clinic / Hospital Name'}
                  </label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder={isAr ? 'مثال: مستشفى الأقصر الدولي' : 'e.g. Luxor International Hospital'}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Coordinates and Google Maps Integration */}
              <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-700" />
                    <label className="text-xs font-bold text-teal-950">
                      {isAr ? 'خطوط الطول والعرض لموقع المجمع أو العيادة (Coordinates)' : 'Hospital GPS Coordinates (Lat, Long)'}
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMapsHelp(!showMapsHelp)}
                    className="text-2xs text-teal-800 hover:text-teal-950 font-semibold flex items-center gap-1 underline cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{isAr ? 'كيف أنسخ خطوط الطول والعرض من Google Maps؟' : 'How to copy coordinates from Google Maps?'}</span>
                  </button>
                </div>

                {/* Google Maps How-To Instructions Box */}
                {showMapsHelp && (
                  <div className="bg-white border border-teal-300/80 rounded-xl p-3.5 text-xs text-slate-700 space-y-2 shadow-2xs">
                    <div className="font-bold text-teal-900 flex items-center gap-1">
                      <Info className="w-4 h-4 text-teal-600" />
                      <span>{isAr ? 'طريقة نسخ الإحداثيات من Google Maps بسهولة:' : 'How to copy coordinates from Google Maps:'}</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-2xs text-slate-600 pr-1">
                      <li>{isAr ? 'افتح تطبيق أو موقع Google Maps وابحث عن موقع المستشفى أو العيادة.' : 'Open Google Maps and find the clinic.'}</li>
                      <li>{isAr ? 'انقر بالزر الأيمن بالفأرة على موقع المستشفى (أو اضغط مطولاً على الدبوس الأحمر على الموبايل).' : 'Right-click on the hospital pin (or long-press on mobile).'}</li>
                      <li>{isAr ? 'ستظهر لك أرقام الإحداثيات في القائمة (مثال: 25.6872, 32.6396). انقر عليها لنسخها والصقها هنا.' : 'Click the coordinates shown at the top to copy and paste here.'}</li>
                    </ol>
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setClinicCoordinates('25.6872, 32.6396')}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-2xs font-semibold border border-teal-200 cursor-pointer"
                      >
                        {isAr ? '📌 تجربة مثال إحداثيات (مستشفى الأقصر الدولي)' : 'Try Luxor Hospital Coordinates'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={clinicCoordinates}
                      onChange={(e) => setClinicCoordinates(e.target.value)}
                      placeholder="e.g. 25.6872, 32.6396"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Open in Google Maps Button */}
                  <a
                    href={getGoogleMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors shrink-0"
                  >
                    <MapPin className="w-4 h-4 text-teal-200" />
                    <span>{isAr ? 'اذهب إلى الموقع على الخريطة 🗺️' : 'Open in Google Maps'}</span>
                    <ExternalLink className="w-3 h-3 text-teal-200" />
                  </a>
                </div>
              </div>

              {/* Next Follow-Up Visit Appointment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                    <CalendarCheck className="w-4 h-4 text-teal-600" />
                    <span>{isAr ? 'موعد استشارة ومراجعة الطبيب القادمة (Next Visit)' : 'Next Follow-up Visit Date & Time'}</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={nextVisitTime}
                    onChange={(e) => setNextVisitTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center justify-between p-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {isAr ? 'تنبيه بموعد زيارة الطبيب' : 'Doctor Appointment Alert'}
                    </span>
                    <span className="text-2xs text-slate-500">
                      {isAr ? 'تنبيهك قبل موعد المراجعة بيوم وفي نفس اليوم' : 'Remind you before the appointment'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={nextVisitReminder}
                    onChange={(e) => setNextVisitReminder(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {isAr
                  ? 'تم تحديد الاستخدام الشخصي (OTC). لا حاجة لإدخال بيانات العيادة أو إحداثيات الخريطة.'
                  : 'Personal OTC mode selected. No clinic location or doctor fields needed.'}
              </span>
            </div>
          )}
        </div>

        {/* Section 3: Medicine Form & Type */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <label className="block text-sm font-semibold text-slate-800 mb-3">
            {isAr ? 'نوع الدواء وشكل الجرعة (Medicine Type):' : 'Medicine Form & Type:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {MEDICINE_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = type === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-600/20 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-teal-600' : 'text-slate-500'}`} />
                  <span className="text-xs">{isAr ? t.labelAr : t.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Core Medicine Fields */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                {isAr ? 'اسم الدواء (Medicine Name) *' : 'Medicine Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={isAr ? 'مثال: Panadol Extra, Concor, Augmentin...' : 'e.g. Paracetamol, Augmentin'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm"
              />
            </div>

            {/* Strength */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                {isAr ? 'التركيز (Strength)' : 'Strength'}
              </label>
              <input
                type="text"
                placeholder={isAr ? 'مثال: 500mg, 1g, 10mg...' : 'e.g. 500mg, 20mg'}
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {/* Dose description */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                {isAr ? 'الجرعة (Dose Unit) *' : 'Dose Unit *'}
              </label>
              <input
                type="text"
                required
                placeholder={isAr ? 'قرص / قطرة / 5 مل' : '1 tablet / 5ml'}
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm"
              />
            </div>

            {/* Pills per dose */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                {isAr ? 'عدد الوحدات في الجرعة' : 'Units per dose'}
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={pillsPerDose}
                onChange={(e) => setPillsPerDose(parseFloat(e.target.value) || 1)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm"
              />
            </div>

            {/* Times per day */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                {isAr ? 'مرات الاستخدام يومياً' : 'Times per day'}
              </label>
              <select
                value={timesPerDay}
                onChange={(e) => setTimesPerDay(parseInt(e.target.value, 10))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm"
              >
                <option value={1}>{isAr ? 'مرة واحدة يومياً (1 time)' : 'Once daily (1x)'}</option>
                <option value={2}>{isAr ? 'مرتان يومياً (كل 12 ساعة)' : 'Twice daily (2x)'}</option>
                <option value={3}>{isAr ? '3 مرات يومياً (كل 8 ساعات)' : 'Three times daily (3x)'}</option>
                <option value={4}>{isAr ? '4 مرات يومياً (كل 6 ساعات)' : 'Four times daily (4x)'}</option>
              </select>
            </div>

            {/* Duration in days */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                {isAr ? 'مدة العلاج بالأيام' : 'Duration (Days)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="365"
                  required
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                  {isAr ? 'يوم' : 'days'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Schedule */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                {isAr ? 'طريقة ونظام المواعيد *' : 'Schedule Routine *'}
              </label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value as ScheduleTiming)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm"
              >
                {SCHEDULE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {isAr ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* First dose date & time */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                {isAr ? 'تاريخ ووقت أول جرعة *' : 'First Dose Time *'}
              </label>
              <input
                type="datetime-local"
                required
                value={firstDoseTime}
                onChange={(e) => setFirstDoseTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              {isAr ? 'ملاحظات الطبيب وإرشادات الاستخدام (Notes)' : 'Doctor Notes & Instructions'}
            </label>
            <textarea
              rows={2}
              placeholder={isAr ? 'مثال: يؤخذ بعد الأكل، يحفظ في الثلاجة، يرجى عدم تفويت أي جرعة...' : 'Special instructions, meal advice, warnings...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm"
            />
          </div>
        </div>

        {/* Live Calculation Preview Box */}
        {previewDoses.length > 0 && (
          <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-teal-900">
                {isAr ? 'معاينة المواعيد المحسوبة لليوم الأول (Calculated Schedule Preview):' : 'Calculated Times for Day 1:'}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {previewDoses.map((d, i) => (
                <div
                  key={i}
                  className="bg-white border border-teal-200 rounded-xl p-2.5 text-center shadow-2xs"
                >
                  <div className="text-2xs text-teal-700 font-medium">
                    {isAr ? `الجرعة ${i + 1}` : `Dose ${i + 1}`}
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatTimeArabic(d.dose_time)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error / Success Messages */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successSaved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              {isAr ? 'تم حفظ الدواء وتوليد جدول الجرعات وموعد مراجعة الطبيب بنجاح!' : 'Medication and follow-up appointment saved successfully!'}
            </span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm transition-all hover:shadow-md flex items-center gap-2 text-sm cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'حفظ الدواء وتوليد الجدول' : 'Save & Generate Schedule'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
