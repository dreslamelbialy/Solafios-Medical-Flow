import React, { useState } from 'react';
import { Download, Copy, Check, X, Shield, ExternalLink, Image as ImageIcon, AlertTriangle, Sparkles } from 'lucide-react';

interface OAuthHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ar' | 'en';
}

export const OAuthHelperModal: React.FC<OAuthHelperModalProps> = ({
  isOpen,
  onClose,
  lang = 'ar',
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;
  const isAr = lang === 'ar';

  const handleCopy = (fieldId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const currentOrigin = window.location.origin;

  const fields = [
    {
      id: 'appName',
      labelAr: 'اسم التطبيق (App name) *إلزامي*',
      labelEn: 'App name *Required*',
      value: 'Solafios Mediflow',
      noteAr: 'اكتب هذا الاسم في الخانة الأولى',
    },
    {
      id: 'supportEmail',
      labelAr: 'بريد دعم المستخدم (User support email) *إلزامي*',
      labelEn: 'User support email *Required*',
      value: 'dr.eslamelbialy@gmail.com',
      noteAr: 'اختر إيميلك من القائمة المنسدلة',
    },
    {
      id: 'developerEmail',
      labelAr: 'بيانات الاتصال بالمطور (Developer contact email) *إلزامي*',
      labelEn: 'Developer contact email *Required*',
      value: 'dr.eslamelbialy@gmail.com',
      noteAr: 'اكتب إيميلك الشخصي في أسفل الصفحة',
    },
    {
      id: 'logoField',
      labelAr: 'شعار التطبيق (App Logo) [اتركه فارغاً ⚠️]',
      labelEn: 'App Logo [Leave Empty ⚠️]',
      value: 'اتركه فارغاً (Leave Blank)',
      noteAr: '⚠️ سر مهم: إذا رفعت لوجو ستطلب منك جوجل إثبات ملكية ومراجعة معقدة! تركه فارغاً يجعل الدخول يعمل فوراً بدون أي شاشات تحذير.',
    },
    {
      id: 'homePage',
      labelAr: 'الصفحة الرئيسية للتطبيق (Application home page)',
      labelEn: 'Application home page',
      value: currentOrigin,
      noteAr: 'رابط موقعك (مثل https://solafios-medical-flow.vercel.app)',
    },
    {
      id: 'privacyPolicy',
      labelAr: 'رابط سياسة الخصوصية (Privacy policy link)',
      labelEn: 'Privacy policy link',
      value: `${currentOrigin}/privacy.html`,
      noteAr: 'رابط مباشر بدون # (مقبول ومعتمد فوراً في Google)',
    },
    {
      id: 'terms',
      labelAr: 'رابط بنود الخدمة (Terms of service link)',
      labelEn: 'Terms of service link',
      value: `${currentOrigin}/terms.html`,
      noteAr: 'اختياري، أو ضع رابط البنود',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'حل مشكلة إعدادات Google ورسالة التحقق' : 'Google OAuth Setup & Bypass Verification'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'كيف تتخطى رسالة Branding Verification وتجعل تسجيل الدخول يعمل فوراً'
                  : 'How to bypass Branding Verification and enable login immediately'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Urgent Golden Tip Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <h3 className="font-bold text-sm">
              {isAr ? '💡 الحل الفوري لرسالة "Branding Verification / Domain Verification":' : '💡 Instant Fix for Verification Warning:'}
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            {isAr
              ? 'سبب ظهور هذه الرسالة هو رفع صورة اللوجو (App Logo) أو إضافة دومين Vercel في Google Console. بمجرد رفع صورة تطلب Google إثبات ملكية عبر Search Console وتأخير أيام.'
              : 'Uploading an app logo or adding Vercel domains triggers mandatory Google branding verification.'}
          </p>
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-300/40 text-xs font-semibold text-amber-900 dark:text-amber-200">
            {isAr ? (
              <span>
                ✅ <strong>الحل في ثانية واحدة:</strong> احذف اللوجو من Google Console (اتركه فاضي تماماً)، وامسح روابط Homepage و Domains، واكتفِ بملء اسم التطبيق وإيميلك فقط، ثم اضغط <strong>Save and Continue</strong>! ستختفي المشكلة فوراً ويعمل تسجيل الدخول لجميع المستخدمين.
              </span>
            ) : (
              <span>
                ✅ <strong>Instant Solution:</strong> Remove the logo from Google Console (leave App Logo blank), leave App Domain blank, fill only App Name and Emails, then click Save and Continue. Login will work immediately for everyone.
              </span>
            )}
          </div>
        </div>

        {/* Logo Download Card (For personal / app use) */}
        <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="MediFlow Logo"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-teal-500/40 shadow-md"
            />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                {isAr ? 'لوجو التطبيق (للاستخدام داخل التطبيق وفي موقعك)' : 'Application Logo (For App & Site)'}
              </h4>
              <p className="text-2xs text-slate-500 mt-0.5">
                {isAr
                  ? 'اللوجو موجود ويعمل داخل التطبيق بالفعل. لا داعي لرفعه في Google Console لتفادي التحقق.'
                  : 'Already embedded in your app. Not required in Google Console.'}
              </p>
            </div>
          </div>
          <a
            href="/logo.png"
            download="mediflow-logo.png"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تحميل اللوجو (Download PNG)' : 'Download Logo'}</span>
          </a>
        </div>

        {/* AI Prompt Generator Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                {isAr ? 'أوامر (Prompts) لتوليد لوجو جديد بأي ذكاء اصطناعي (ChatGPT / Midjourney)' : 'AI Prompts to generate custom logo'}
              </h4>
            </div>
            <span className="text-2xs bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full">
              Copy & Paste
            </span>
          </div>
          <p className="text-2xs text-slate-600 dark:text-slate-400">
            {isAr
              ? 'انسخ أي من الأوصاف التالية وضعها في ChatGPT (DALL-E 3) أو Midjourney أو Leonardo AI أو Bing Image Creator لإنتاج لوجو فائق الجودة:'
              : 'Copy any prompt below and paste into Midjourney, ChatGPT, or Leonardo AI:'}
          </p>

          <div className="space-y-2.5">
            {/* Option 1: 3D Modern Glossy App Icon */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  {isAr ? '١. نمط أبل ثلاثي الأبعاد فخم (Apple 3D Glossy Icon):' : '1. Apple 3D Glossy Icon:'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      'prompt-3d',
                      'A modern minimalist premium app icon logo for "MediFlow" healthcare and medicine tracker. Glossy 3D rounded squircle iOS app icon design, featuring an elegant glowing stylized capsule pill crossed with a clean medical plus sign and subtle vibrant pulse wave ribbon. Palette: deep surgical teal (#0d9488), vivid cyan, and crisp pure white. Smooth frosted glassmorphism reflections, studio product lighting, clean solid neutral studio background, 8k resolution, photorealistic 3D render, perfectly centered app icon, dribbble trending, high end digital health brand.'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-2xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedField === 'prompt-3d' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600">{isAr ? 'تم النسخ' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{isAr ? 'نسخ الوصف' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-2xs text-slate-500 dark:text-slate-400 font-mono select-all line-clamp-2">
                A modern minimalist premium app icon logo for "MediFlow" healthcare and medicine tracker. Glossy 3D rounded squircle iOS app icon design...
              </p>
            </div>

            {/* Option 2: Minimalist Flat Vector */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  {isAr ? '٢. نمط متجهي مسطح بسيط (Flat Minimalist Vector):' : '2. Minimalist Flat Vector:'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      'prompt-flat',
                      'A minimalist flat modern vector logo for "Solafios MediFlow" smart medicine and health management app. Icon mark inside a rounded square: an artistic fusion of a medical cross, a healing capsule pill, and an organic caring heart shape. Clean geometric lines, dual-tone emerald green and deep teal gradients, on pure clean white background. Flat vector graphic, tech startup branding, behance award winner, no text, square aspect ratio 1:1, crisp vector illustration.'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-2xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedField === 'prompt-flat' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600">{isAr ? 'تم النسخ' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{isAr ? 'نسخ الوصف' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-2xs text-slate-500 dark:text-slate-400 font-mono select-all line-clamp-2">
                A minimalist flat modern vector logo for "Solafios MediFlow" smart medicine and health management app. Icon mark inside a rounded square...
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields Helper */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            {isAr ? 'البيانات المطلوب تعبئتها في صفحة Google:' : 'Fields to complete in Google Console:'}
          </h4>

          {fields.map((field) => (
            <div
              key={field.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? field.labelAr : field.labelEn}
                </div>
                <div className="text-2xs text-teal-600 dark:text-teal-400 font-mono truncate mt-0.5 select-all">
                  {field.value}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(field.id, field.value)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedField === field.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">{isAr ? 'تم النسخ' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isAr ? 'نسخ' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-2xs text-slate-500">
          <a
            href="https://console.cloud.google.com/apis/credentials/consent?project=mediflow-app-ef213"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>{isAr ? 'فتح شاشة الموافقة في Google Console' : 'Open Google Console'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
