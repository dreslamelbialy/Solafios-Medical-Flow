import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Pill,
  Check,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  Info,
  Trash2,
  MapPin,
  ExternalLink,
  User,
  CalendarCheck,
  Plus,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { Medicine, MedicineType, ScheduleTiming } from '../types/mediflow';
import { playSuccessChime } from '../utils/audioAlert';

interface ExtractedMedicineItem {
  id: string;
  name: string;
  strength: string;
  dose: string;
  pills_per_dose: number;
  times_per_day: number;
  schedule: ScheduleTiming;
  duration: number;
  notes: string;
  type: MedicineType;
  selected: boolean;
}

interface ScanPrescriptionTabProps {
  onAddMedicines: (medicines: Medicine[]) => void;
  lang: 'ar' | 'en';
}

export const ScanPrescriptionTab: React.FC<ScanPrescriptionTabProps> = ({
  onAddMedicines,
  lang,
}) => {
  const isAr = lang === 'ar';

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState(false);
  const [showMapsHelp, setShowMapsHelp] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false);

  // Extracted Result State (Full editable control)
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicCoordinates, setClinicCoordinates] = useState('');
  const [clinicLocation, setClinicLocation] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [nextVisitReminder, setNextVisitReminder] = useState(true);
  const [diagnosis, setDiagnosis] = useState('');
  const [extractedMedicines, setExtractedMedicines] = useState<ExtractedMedicineItem[]>([]);
  const [hasScannedResult, setHasScannedResult] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload from file or camera
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(isAr ? 'يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)' : 'Please select a valid image file');
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setErrorMsg('');
      setHasScannedResult(false);
    };
    reader.readAsDataURL(file);
  };

  // Perform AI Scan
  const executeScan = async () => {
    setIsScanning(true);
    setErrorMsg('');

    setScanStepText(isAr ? 'جارٍ قراءة الصورة وفك شفرة خط الطبيب والرموز الطبية بالذكاء الاصطناعي...' : 'AI is reading prescription handwriting and deciphering medical notations...');
    setTimeout(() => {
      setScanStepText(isAr ? 'استخراج أسماء الأدوية الحقيقية، التراكيز، توقيت الوجبات، وبيانات المريض...' : 'Extracting real medications, dosages, meal relations, and patient data...');
    }, 1500);

    try {
      const payload: Record<string, unknown> = {
        mimeType,
        language: lang,
      };

      if (imagePreview) {
        payload.imageBase64 = imagePreview;
      } else {
        throw new Error(isAr ? 'يرجى اختيار أو رفع صورة للروشتة أولاً' : 'Please upload or select an image first');
      }

      const res = await fetch('/api/scan-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data && data.success && Array.isArray(data.medicines)) {
        // Use EXACT extracted data from user image (never override with static dummy names!)
        setDoctorName(data.doctorName || '');
        setClinicName(data.clinicName || '');
        setClinicCoordinates(data.clinicCoordinates || '');
        setClinicLocation(data.clinicLocation || '');
        setPatientName(data.patientName || '');
        setPatientAge(data.patientAge ? String(data.patientAge) : '');
        setVisitDate(data.visitDate || new Date().toISOString().slice(0, 10));
        setNextVisitDate(data.nextVisitDate || '');
        setDiagnosis(data.diagnosis || '');

        const formatted: ExtractedMedicineItem[] = data.medicines.map((m: any, idx: number) => ({
          id: `ext-${Date.now()}-${idx}`,
          name: m.name || (isAr ? `دواء ${idx + 1}` : `Medicine ${idx + 1}`),
          strength: m.strength || '',
          dose: m.dose || (isAr ? 'قرص واحد' : '1 tablet'),
          pills_per_dose: Number(m.pills_per_dose) || 1,
          times_per_day: Number(m.times_per_day) || 2,
          schedule: (m.schedule as ScheduleTiming) || 'custom_interval',
          duration: Number(m.duration) || 7,
          notes: m.notes || '',
          type: (m.type as MedicineType) || 'tablet',
          selected: true,
        }));

        setExtractedMedicines(formatted);
        setHasScannedResult(true);
        playSuccessChime();
      } else {
        throw new Error(data.error || (isAr ? 'لم نتمكن من قراءة أسماء الأدوية بوضوح من الصورة' : 'Failed to parse prescription image'));
      }
    } catch (err: any) {
      console.warn('Scan request error:', err);
      setErrorMsg(
        err.message ||
          (isAr
            ? 'تعذر قراءة الروشتة من الصورة المرفقة. يرجى التأكد من وضوح إضاءة الصورة وزاوية التصوير، أو يمكنك إدخال البيانات يدوياً.'
            : 'Could not extract medicines from the photo. Please ensure good lighting or enter details manually.')
      );
      setHasScannedResult(false);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSelectMedicine = (id: string) => {
    setExtractedMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const updateMedicineField = (id: string, field: keyof ExtractedMedicineItem, value: any) => {
    setExtractedMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const removeMedicine = (id: string) => {
    setExtractedMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const addNewMedicineItem = () => {
    const newItem: ExtractedMedicineItem = {
      id: `ext-new-${Date.now()}`,
      name: isAr ? 'دواء جديد' : 'New Medicine',
      strength: '500mg',
      dose: isAr ? 'قرص واحد' : '1 tablet',
      pills_per_dose: 1,
      times_per_day: 2,
      schedule: 'after_lunch',
      duration: 7,
      notes: isAr ? 'بعد الأكل' : 'After meal',
      type: 'tablet',
      selected: true,
    };
    setExtractedMedicines((prev) => [...prev, newItem]);
  };

  const handleApproveAndAdd = () => {
    const selected = extractedMedicines.filter((m) => m.selected);
    if (selected.length === 0) {
      setErrorMsg(isAr ? 'يرجى تحديد دواء واحد على الأقل لإضافته' : 'Please select at least one medicine to add');
      return;
    }

    const todayIso = new Date().toISOString();
    const nextVisitIso = nextVisitDate ? new Date(nextVisitDate).toISOString() : undefined;

    const converted: Medicine[] = selected.map((m) => ({
      id: `med-scan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: m.name.trim(),
      strength: m.strength.trim(),
      dose: m.dose.trim(),
      pills_per_dose: m.pills_per_dose,
      times_per_day: m.times_per_day,
      schedule: m.schedule,
      first_dose_time: todayIso,
      duration: m.duration,
      notes: m.notes.trim(),
      type: m.type,
      created_at: todayIso,

      // Propagate clinical and patient metadata
      prescription_source: 'doctor',
      doctor_name: doctorName.trim() || undefined,
      clinic_name: clinicName.trim() || undefined,
      clinic_coordinates: clinicCoordinates.trim() || undefined,
      next_visit_time: nextVisitIso,
      next_visit_reminder: nextVisitReminder,
      patient_name: patientName.trim() || undefined,
      patient_age: patientAge.trim() || undefined,
      visit_date: visitDate || todayIso.slice(0, 10),
    }));

    onAddMedicines(converted);
    playSuccessChime();
    setSuccessNotice(true);
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-400 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                {isAr ? 'محرك الرؤية الحاسوبية الطبية المباشر' : 'Medical Computer Vision Engine'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {isAr ? 'مسح وقراءة الروشتات الطبية الذكي (AI Prescription Scanner)' : 'Smart AI Prescription Scanner'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isAr
                ? 'ارفع صورة روشتة حقيقية أو التقطها بالكاميرا، وسيقوم الذكاء الاصطناعي باستخراج أسماء الأدوية الحقيقية، الجرعات، التوقيت، بيانات الطبيب، موقع العيادة وإحداثياتها بدقة.'
                : 'Upload or snap a prescription photo to extract real medications, clinic coordinates, follow-up date, and automatically schedule doses.'}
            </p>
          </div>
        </div>
      </div>

      {/* Upload & Camera Section */}
      {!hasScannedResult && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {imagePreview ? (
            /* Uploaded Image Preview */
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[460px] bg-slate-900 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Uploaded Prescription"
                  className="max-h-[460px] object-contain w-auto mx-auto"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFullImageModal(true)}
                    className="p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl text-xs transition-colors backdrop-blur-xs flex items-center gap-1 cursor-pointer"
                    title={isAr ? 'تكبير الصورة' : 'View full'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="p-2 bg-slate-900/80 hover:bg-red-600 text-white rounded-xl text-xs transition-colors backdrop-blur-xs flex items-center gap-1 cursor-pointer"
                    title={isAr ? 'حذف الصورة' : 'Remove'}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isAr ? 'إلغاء' : 'Remove'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-teal-50/70 dark:bg-teal-950/30 p-4 rounded-xl border border-teal-200 dark:border-teal-800">
                <div className="text-xs text-teal-900 dark:text-teal-200 flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>
                    {isAr
                      ? 'تم تحميل صورتك بنجاح. انقر على "بدء المسح والاستخراج" لتحليل الروشتة الحقيقية مباشرة.'
                      : 'Image loaded. Click start to extract real prescription data with AI.'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => executeScan()}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'بدء التحليل واستخراج الأدوية (Analyze)' : 'Start AI Extraction'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Upload Drop Area */
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 rounded-2xl p-8 md:p-12 text-center transition-colors bg-slate-50/50 dark:bg-slate-950/40">
              <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-100 dark:border-teal-800">
                <Upload className="w-8 h-8" />
              </div>

              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                {isAr ? 'ارفع صورة روشتك الحقيقية أو التقط صورة بالكاميرا' : 'Upload or snap prescription photo'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                {isAr
                  ? 'يدعم صور الموبايل والماسح الضوئي (JPG, PNG). سيتم إرسال الصورة لمحرك الذكاء الاصطناعي لقراءة الخط اليدوي والأدوية الفعلية دون أي بيانات مسبقة.'
                  : 'Supports phone photos and scans. AI extracts actual handwritten medications without placeholder overrides.'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>{isAr ? 'التقاط أو اختيار صورة الروشتة' : 'Take Photo / Select File'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Scanning Progress Banner */}
          {isScanning && (
            <div className="p-5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl text-center space-y-3 animate-pulse">
              <div className="flex items-center justify-center gap-2 text-teal-900 dark:text-teal-200 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-spin" />
                <span>{scanStepText}</span>
              </div>
              <div className="w-full bg-teal-200/60 dark:bg-teal-800/40 rounded-full h-2 overflow-hidden max-w-md mx-auto">
                <div className="bg-teal-600 dark:bg-teal-400 h-2 rounded-full w-2/3 animate-pulse" />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">{isAr ? 'تنبيه الفحص:' : 'Scan Notice:'}</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clinical Review & Verification Screen */}
      {hasScannedResult && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
          {/* Top Verification Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'تم استخراج بيانات الروشتة الحقيقية بنجاح — مرحلة المراجعة السريرية' : 'Real Prescription Extracted — Clinical Verification'}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'مراجعة وتعديل بيانات الروشتة المستخرجة' : 'Review & Edit Extracted Prescription'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'يمكنك فحص كل حقل، التعديل على أي اسم أو جرعة، إضافة إحداثيات العيادة، وموعد المراجعة قبل الحفظ النهائي.'
                  : 'You can verify and edit every field, clinic GPS coordinates, and follow-up appointment before final saving.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => setShowFullImageModal(true)}
                  className="px-3.5 py-2 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-teal-200 dark:border-teal-800"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isAr ? 'عرض صورة الروشتة' : 'View Rx Photo'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setHasScannedResult(false);
                  setImagePreview(null);
                  setErrorMsg('');
                }}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'مسح روشتة أخرى' : 'Scan Another'}</span>
              </button>
            </div>
          </div>

          {/* Patient Details Form Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
              <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'بيانات المريض المستخرجة (Patient Data)' : 'Patient Information'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-2xs text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  {isAr ? 'اسم المريض:' : 'Patient Name:'}
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={isAr ? 'اسم المريض...' : 'Patient name...'}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-2xs text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  {isAr ? 'عمر / سن المريض:' : 'Patient Age:'}
                </label>
                <input
                  type="text"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder={isAr ? 'العمر بالسنوات...' : 'Age...'}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-2xs text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  {isAr ? 'تاريخ الفحص / الزيارة:' : 'Visit Date:'}
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Doctor & Location Details Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
              <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'بيانات الطبيب والمجمع الطبي وموقع الخريطة' : 'Physician & Clinic Location'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-2xs text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  {isAr ? 'اسم الطبيب المعالج:' : 'Doctor Name:'}
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder={isAr ? 'اسم الطبيب والتخصص...' : 'Doctor name & specialty...'}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-2xs text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  {isAr ? 'اسم المستشفى أو المركز الطبي:' : 'Clinic / Hospital Name:'}
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder={isAr ? 'اسم المستشفى أو المجمع...' : 'Clinic or hospital name...'}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* GPS Coordinates and Google Maps Guide */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-2xs text-teal-950 dark:text-teal-300 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{isAr ? 'خطوط الطول والعرض للعيادة (GPS Coordinates):' : 'GPS Coordinates (Lat, Long):'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowMapsHelp(!showMapsHelp)}
                  className="text-2xs text-teal-700 dark:text-teal-400 hover:text-teal-950 dark:hover:text-teal-200 underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>{isAr ? 'كيف أنسخ خطوط الطول والعرض من Google Maps؟' : 'How to copy coordinates?'}</span>
                </button>
              </div>

              {showMapsHelp && (
                <div className="bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-lg p-2.5 text-2xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-teal-900 dark:text-teal-200">
                    {isAr ? 'طريقة نسخ الإحداثيات من Google Maps:' : 'How to copy from Google Maps:'}
                  </p>
                  <p>{isAr ? '1. افتح Google Maps وابحث عن موقع المستشفى أو العيادة.' : '1. Search for clinic on Google Maps.'}</p>
                  <p>{isAr ? '2. انقر بالزر الأيمن على النقطة (أو اضغط مطولاً على الموبايل).' : '2. Right-click the location pin (or long-press on mobile).'}</p>
                  <p>{isAr ? '3. انقر على أرقام الإحداثيات في القائمة لنسخها (مثال: 25.6872, 32.6396).' : '3. Click the numbers to copy (e.g. 25.6872, 32.6396).'}</p>
                  <button
                    type="button"
                    onClick={() => setClinicCoordinates('25.6872, 32.6396')}
                    className="mt-1 px-2 py-0.5 bg-teal-100 dark:bg-teal-900/60 hover:bg-teal-200 dark:hover:bg-teal-800 text-teal-900 dark:text-teal-200 rounded font-semibold text-2xs cursor-pointer"
                  >
                    {isAr ? '📌 تجربة إحداثيات مستشفى الأقصر الدولي' : 'Use Luxor Hospital Coords'}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={clinicCoordinates}
                  onChange={(e) => setClinicCoordinates(e.target.value)}
                  placeholder="e.g. 25.6872, 32.6396"
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-teal-200" />
                  <span>{isAr ? 'اذهب للموقع 🗺️' : 'Go to Location'}</span>
                  <ExternalLink className="w-3 h-3 text-teal-200" />
                </a>
              </div>
            </div>

            {/* Next Visit Appointment Review & Alert */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <label className="text-2xs text-slate-700 dark:text-slate-300 font-bold block mb-1 flex items-center gap-1">
                  <CalendarCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{isAr ? 'موعد استشارة ومراجعة الطبيب القادمة:' : 'Next Follow-up Visit:'}</span>
                </label>
                <input
                  type="datetime-local"
                  value={nextVisitDate}
                  onChange={(e) => setNextVisitDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-between p-1">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {isAr ? 'تنبيه موعد مراجعة الطبيب' : 'Doctor Review Alert'}
                  </span>
                  <span className="text-2xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'تنبيه في جدول الجرعات وقائمة التذكيرات' : 'Show in Schedule & Reminders'}
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

          {/* Extracted Medicines Editable Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  {isAr ? `الأدوية المكتشفة بالروشتة (${extractedMedicines.length})` : `Extracted Medications (${extractedMedicines.length})`}
                </h4>
              </div>
              <button
                type="button"
                onClick={addNewMedicineItem}
                className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold rounded-lg text-xs flex items-center gap-1 border border-teal-200 dark:border-teal-800 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة دواء إضافي' : 'Add Medication'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {extractedMedicines.map((med, idx) => (
                <div
                  key={med.id}
                  className={`border rounded-xl p-4 transition-all ${
                    med.selected
                      ? 'border-teal-300 dark:border-teal-700 bg-teal-50/20 dark:bg-teal-950/20 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={med.selected}
                        onChange={() => toggleSelectMedicine(med.id)}
                        className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500 cursor-pointer"
                        title={isAr ? 'تحديد هذا الدواء للإضافة' : 'Select for schedule'}
                      />
                      <span className="text-xs font-bold text-teal-900 dark:text-teal-200 bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-md">
                        #{idx + 1}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => updateMedicineField(med.id, 'name', e.target.value)}
                          className="font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-teal-500 focus:outline-none px-2 py-1 rounded-lg text-sm w-full"
                          placeholder={isAr ? 'اسم الدواء...' : 'Medicine name...'}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeMedicine(med.id)}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title={isAr ? 'حذف من القائمة' : 'Remove item'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 text-xs">
                    <div>
                      <span className="text-2xs text-slate-500 dark:text-slate-400 font-bold block mb-1">{isAr ? 'التركيز' : 'Strength'}</span>
                      <input
                        type="text"
                        value={med.strength}
                        onChange={(e) => updateMedicineField(med.id, 'strength', e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-mono"
                        placeholder="e.g. 500mg"
                      />
                    </div>

                    <div>
                      <span className="text-2xs text-slate-500 dark:text-slate-400 font-bold block mb-1">{isAr ? 'الجرعة' : 'Dose'}</span>
                      <input
                        type="text"
                        value={med.dose}
                        onChange={(e) => updateMedicineField(med.id, 'dose', e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs"
                        placeholder={isAr ? 'قرص واحد' : '1 pill'}
                      />
                    </div>

                    <div>
                      <span className="text-2xs text-slate-500 dark:text-slate-400 font-bold block mb-1">{isAr ? 'التكرار يومياً' : 'Times/Day'}</span>
                      <select
                        value={med.times_per_day}
                        onChange={(e) => updateMedicineField(med.id, 'times_per_day', parseInt(e.target.value, 10))}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-semibold"
                      >
                        <option value={1}>1x (مرة يومياً)</option>
                        <option value={2}>2x (مرتان يومياً)</option>
                        <option value={3}>3x (3 مرات يومياً)</option>
                        <option value={4}>4x (4 مرات يومياً)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-2xs text-slate-500 dark:text-slate-400 font-bold block mb-1">{isAr ? 'النظام وتوقيت الأكل' : 'Schedule'}</span>
                      <select
                        value={med.schedule}
                        onChange={(e) => updateMedicineField(med.id, 'schedule', e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs"
                      >
                        <option value="custom_interval">{isAr ? 'فترات متباعدة متساوية' : 'Interval'}</option>
                        <option value="before_breakfast">{isAr ? 'قبل الإفطار' : 'Before Breakfast'}</option>
                        <option value="after_breakfast">{isAr ? 'بعد الإفطار' : 'After Breakfast'}</option>
                        <option value="before_lunch">{isAr ? 'قبل الغداء' : 'Before Lunch'}</option>
                        <option value="after_lunch">{isAr ? 'بعد الغداء' : 'After Lunch'}</option>
                        <option value="before_dinner">{isAr ? 'قبل العشاء' : 'Before Dinner'}</option>
                        <option value="after_dinner">{isAr ? 'بعد العشاء' : 'After Dinner'}</option>
                        <option value="before_sleep">{isAr ? 'قبل النوم' : 'Bedtime'}</option>
                        <option value="after_wake">{isAr ? 'بعد الاستيقاظ' : 'Waking up'}</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-2xs text-slate-500 dark:text-slate-400 font-bold block mb-1">{isAr ? 'المدة (أيام)' : 'Days'}</span>
                      <input
                        type="number"
                        min="1"
                        value={med.duration}
                        onChange={(e) => updateMedicineField(med.id, 'duration', parseInt(e.target.value, 10) || 1)}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs"
                      />
                    </div>

                    <div>
                      <span className="text-2xs text-slate-500 dark:text-slate-400 font-bold block mb-1">{isAr ? 'الشكل الدوائي' : 'Form'}</span>
                      <select
                        value={med.type}
                        onChange={(e) => updateMedicineField(med.id, 'type', e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs"
                      >
                        <option value="tablet">{isAr ? 'أقراص / كبسولات' : 'Tablet'}</option>
                        <option value="syrup">{isAr ? 'شراب سائل' : 'Syrup'}</option>
                        <option value="injection">{isAr ? 'حقن' : 'Injection'}</option>
                        <option value="drops">{isAr ? 'قطرات' : 'Drops'}</option>
                        <option value="cream">{isAr ? 'مرهم / كريم' : 'Cream'}</option>
                        <option value="inhaler">{isAr ? 'بخاخ' : 'Inhaler'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <input
                      type="text"
                      placeholder={isAr ? 'ملاحظات وتعليمات الاستخدام السريرية...' : 'Clinical instructions...'}
                      value={med.notes}
                      onChange={(e) => updateMedicineField(med.id, 'notes', e.target.value)}
                      className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Approval Buttons */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>
                {isAr
                  ? `سيتم حفظ ${extractedMedicines.filter((m) => m.selected).length} أدوية معتمدة، وتوليد جدول الجرعات التلقائي ومواعيد التنبيه وربط موقع العيادة.`
                  : `${extractedMedicines.filter((m) => m.selected).length} medications will be scheduled with follow-up visit.`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHasScannedResult(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleApproveAndAdd}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isAr ? 'اعتماد وإضافة الأدوية إلى جدول الجرعات' : 'Approve & Add to Schedule'}</span>
              </button>
            </div>
          </div>

          {successNotice && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {isAr
                  ? 'تمت إضافة الأدوية المعتمدة إلى جدولك وتوليد التذكيرات بنجاح!'
                  : 'Approved medications scheduled and reminders generated successfully!'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Full Image Modal for Presenting at Conference */}
      {showFullImageModal && imagePreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-3xl w-full p-4 space-y-3">
            <div className="flex items-center justify-between text-white text-xs border-b border-slate-800 pb-2">
              <span className="font-bold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-teal-400" />
                {isAr ? 'صورة الروشتة الأصلية المفحوصة' : 'Original Prescription Image'}
              </span>
              <button
                type="button"
                onClick={() => setShowFullImageModal(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded-lg text-xs"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Prescription Full View"
                className="max-h-[72vh] object-contain w-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
