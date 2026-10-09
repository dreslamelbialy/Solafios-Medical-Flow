import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, Copy, Check, X, UserCheck } from 'lucide-react';

interface AuthErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  isDomainIssue: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  lang: 'ar' | 'en';
}

export const AuthErrorModal: React.FC<AuthErrorModalProps> = ({
  isOpen,
  title,
  message,
  isDomainIssue,
  onClose,
  onContinueAsGuest,
  lang,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const isAr = lang === 'ar';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your-site.vercel.app';

  const handleCopyHost = () => {
    navigator.clipboard.writeText(currentHost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDomainIssue
                  ? (isAr ? 'خطوة سريعة لتفعيل حساب Google على هذا النطاق' : 'One quick step to enable Google Auth')
                  : (isAr ? 'يرجى مراجعة التعليمات أدناه' : 'Please check details below')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-5">
          {message}
        </div>

        {/* If domain issue, show host helper and steps */}
        {isDomainIssue && (
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>{isAr ? 'نطاق Vercel الخاص بك:' : 'Your Vercel Domain:'}</span>
              <button
                type="button"
                onClick={handleCopyHost}
                className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-bold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النطاق' : 'Copy Host')}</span>
              </button>
            </div>

            <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 select-all">
              {currentHost}
            </div>

            <div className="text-2xs text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? '📌 خطوات تفعيله في Firebase Console (خلال دقيقة واحدة):' : '📌 How to authorize in Firebase Console:'}
              </p>
              <ol className="list-decimal list-inside space-y-0.5 ps-1">
                <li>{isAr ? 'افتح مشروعك في Firebase Console' : 'Open project in Firebase Console'}</li>
                <li>{isAr ? 'انتقل إلى: Authentication ⬅️ Settings ⬅️ Authorized domains' : 'Go to Authentication -> Settings -> Authorized domains'}</li>
                <li>{isAr ? 'اضغط "Add domain" وألصق النطاق أعلاه واضغط حفظ' : 'Click "Add domain", paste the host above and save'}</li>
              </ol>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onContinueAsGuest();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-102 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>{isAr ? 'المتابعة كزائر فوراً' : 'Continue as Guest'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
