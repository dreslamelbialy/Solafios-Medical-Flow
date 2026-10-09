import React, { useState } from 'react';
import {
  Palette,
  ExternalLink,
  X,
  Sparkles,
  BookOpen,
  Compass,
  CheckCircle2,
  Laptop,
  Check,
  Search,
} from 'lucide-react';
import { LANDING_PAGE_SOURCES, DESIGN_BEST_PRACTICES } from '../data/landingSources';

interface DesignSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  theme: 'light' | 'dark';
}

export const DesignSourcesModal: React.FC<DesignSourcesModalProps> = ({
  isOpen,
  onClose,
  lang,
  theme,
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'sources' | 'principles'>('sources');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredSources = LANDING_PAGE_SOURCES.filter((source) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      source.name.toLowerCase().includes(q) ||
      source.categoryAr.toLowerCase().includes(q) ||
      source.categoryEn.toLowerCase().includes(q) ||
      source.descAr.toLowerCase().includes(q) ||
      source.descEn.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-5 relative border flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-slate-900 text-slate-100 border-slate-800'
            : 'bg-white text-slate-900 border-slate-200'
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 ${isAr ? 'left-5' : 'right-5'} p-2 rounded-xl transition-colors cursor-pointer ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={isAr ? 'إغلاق' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 rounded-full text-xs font-bold text-teal-800 dark:text-teal-300 mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>{isAr ? 'دليل ومصادر إلهام الـ Landing Page' : 'Landing Page Inspiration & Design Guide'}</span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isAr ? 'أهم المصادر العالمية لتصميم وتطوير صفحات الهبوط' : 'Top Global References for Modern Landing Pages'}
          </h2>
          <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isAr
              ? 'مجموعة منتقاة من أكبر معارض التصميم العالمية وأرشيفات الواجهات الحقيقية لتطبيقات الرعاية الصحية (Healthcare & MedTech) لإلهامك بأحدث الأفكار البصرية:'
              : 'Curated international archives of real healthcare UI patterns, award-winning health portals, and high-conversion landing page layouts:'}
          </p>
        </div>

        {/* Sub-tabs: Sources vs Best Practices */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sources'
                ? 'bg-teal-600 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isAr ? `المصادر والمنصات (${filteredSources.length})` : `Sources & Galleries (${filteredSources.length})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('principles')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'principles'
                ? 'bg-teal-600 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'أسرار صفحة الهبوط الناجحة' : 'Key Design Principles'}</span>
          </button>

          {/* Quick Search in sources */}
          {activeTab === 'sources' && (
            <div className="mr-auto ml-auto sm:mr-auto sm:ml-0 relative flex-1 max-w-xs">
              <Search className={`w-3.5 h-3.5 absolute top-2.5 ${isAr ? 'right-2.5' : 'left-2.5'} text-slate-400`} />
              <input
                type="text"
                placeholder={isAr ? 'بحث في المصادر...' : 'Search sources...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs py-1.5 ${isAr ? 'pr-8 pl-3' : 'pl-8 pr-3'} rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500 focus:border-teal-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-teal-500'
                }`}
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[55vh]">
          {activeTab === 'sources' ? (
            filteredSources.length > 0 ? (
              filteredSources.map((source) => (
                <div
                  key={source.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                    isDark
                      ? 'bg-slate-950/60 border-slate-800 hover:border-teal-500/50'
                      : 'bg-slate-50/80 border-slate-200 hover:border-teal-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold px-2 py-0.5 rounded-md border border-teal-300 dark:border-teal-800 shrink-0">
                      {isAr ? source.tagAr : source.tagEn}
                    </span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-sm text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1.5"
                    >
                      <span>{source.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>

                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isAr ? source.descAr : source.descEn}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-2xs font-semibold text-slate-400">
                      {isAr ? source.categoryAr : source.categoryEn}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    {source.features.map((feat, i) => (
                      <span
                        key={i}
                        className={`text-2xs px-2 py-0.5 rounded-md font-mono ${
                          isDark
                            ? 'bg-slate-900 text-slate-300 border border-slate-800'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                {isAr ? 'لم يتم العثور على مصادر تطابق كلمة البحث.' : 'No sources matched your search.'}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {DESIGN_BEST_PRACTICES.map((practice, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    isDark
                      ? 'bg-slate-950/70 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-black">
                      {idx + 1}
                    </div>
                    <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? practice.titleAr : practice.titleEn}
                    </h3>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isAr ? practice.descAr : practice.descEn}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between">
          <div className="text-2xs text-slate-400 hidden sm:block">
            {isAr
              ? '💡 نصيحة: تصفح Mobbin و Land-book للحصول على أحدث تصاميم الـ MedTech'
              : '💡 Tip: Browse Mobbin & Land-book for production-grade MedTech UI'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            {isAr ? 'إغلاق الدليل' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
