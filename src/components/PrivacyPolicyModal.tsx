import React from 'react';
import { ShieldCheck, X, Lock, CheckCircle2, FileText, Database, HeartHandshake } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ar' | 'en';
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  lang = 'ar',
}) => {
  if (!isOpen) return null;
  const isAr = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'سياسة الخصوصية وبنود الاستخدام' : 'Privacy Policy & Terms of Service'}
              </h2>
              <p className="text-xs text-slate-400">Solafios Mediflow • 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-500" />
              {isAr ? '1. حماية البيانات الطبية والخصوصية' : '1. Medical Data & Privacy Protection'}
            </h3>
            <p className="text-xs sm:text-sm">
              {isAr
                ? 'يلتزم تطبيق Solafios Mediflow بأعلى معايير الخصوصية والأمان. لا يتم بيع أو مشاركة أي بيانات صحية أو شخصية مع أي جهات خارجية أو إعلانية. بياناتك الطبية تظل تحت تحكمك الكامل.'
                : 'Solafios Mediflow adheres to the highest privacy and security standards. No health or personal data is ever sold or shared with third parties or advertisers. Your medical records remain under your sole control.'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-500" />
              {isAr ? '2. صلاحيات Google Drive وخدمات Google' : '2. Google Drive & Google Services Access'}
            </h3>
            <p className="text-xs sm:text-sm">
              {isAr
                ? 'يستخدم التطبيق صلاحيات Google فقط لإنشاء مجلدات مخصصة لملفات الأدوية الخاصة بك وجداول Excel لنسخ سجلات الجرعات احتياطياً في حسابك الشخصي فقط، ولا يتم الوصول لأي ملفات أخرى خارج التطبيق.'
                : 'The application uses Google permissions strictly to organize medication sheets and backup dosage schedules directly within your own Google account. No other personal files are accessed.'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-teal-500" />
              {isAr ? '3. الاستخدام والمسؤولية الطبية' : '3. Clinical Usage Disclaimer'}
            </h3>
            <p className="text-xs sm:text-sm">
              {isAr
                ? 'تطبيق Solafios Mediflow هو أداة تنظيمية مساعدة لتذكير المريض ومتابعة الجرعات والتقارير الطبية. ولا يعد بديلاً عن الاستشارة الطبية المباشرة من الطبيب المعالج أو الصيدلي المختص.'
                : 'Solafios Mediflow is an organizational tool designed to help patients manage doses and medication schedules. It does not replace professional medical advice from licensed healthcare providers.'}
            </p>
          </section>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all shadow-md cursor-pointer"
          >
            {isAr ? 'موافق وإغلاق' : 'Accept & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
