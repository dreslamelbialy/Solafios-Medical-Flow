import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  ChevronDown,
  Plus,
  Check,
  Folder,
  ExternalLink,
  User,
  Heart,
  Cloud,
} from 'lucide-react';
import { FamilyProfile } from '../types/mediflow';

interface ProfileSwitcherProps {
  profiles: FamilyProfile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onOpenAddProfileModal: () => void;
  lang: 'ar' | 'en';
}

export const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onOpenAddProfileModal,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProfileIcon = (relation: string) => {
    switch (relation) {
      case 'father':
        return '👴';
      case 'mother':
        return '👵';
      case 'child':
        return '🧒';
      case 'spouse':
        return '💍';
      case 'self':
        return '👤';
      default:
        return '👤';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-teal-50/90 dark:bg-slate-800 hover:bg-teal-100/90 dark:hover:bg-slate-700 border border-teal-200 dark:border-teal-700/80 rounded-xl text-xs font-bold text-teal-950 dark:text-teal-200 transition-colors shadow-2xs cursor-pointer"
        title={isAr ? 'تبديل الملف الطبي العائلي' : 'Switch family medical profile'}
      >
        <span className="text-sm">{activeProfile ? getProfileIcon(activeProfile.relation) : '👤'}</span>
        <div className="text-right">
          <span className="text-2xs text-teal-700 dark:text-teal-400 block font-normal leading-tight">
            {isAr ? 'الملف الحالي:' : 'Active profile:'}
          </span>
          <span className="truncate max-w-[110px] block">
            {activeProfile ? activeProfile.name : (isAr ? 'ملف المريض' : 'Profile')}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-teal-700 dark:text-teal-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-1.5 right-0 sm:right-auto sm:left-0 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'الملفات العائلية (Google Drive)' : 'Family Health Profiles'}</span>
            </span>
            <span className="text-2xs bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-mono px-2 py-0.5 rounded-full font-bold border border-teal-300 dark:border-teal-800">
              {profiles.length} {isAr ? 'ملفات' : 'profiles'}
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1">
            {profiles.map((p) => {
              const isSelected = p.id === activeProfileId;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProfile(p.id);
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-slate-800 border border-teal-300 dark:border-teal-600 text-teal-950 dark:text-teal-200 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{getProfileIcon(p.relation)}</span>
                    <div>
                      <div className="text-xs flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.age && <span className="text-2xs text-slate-400 font-mono">({p.age} سنة)</span>}
                      </div>
                      {p.driveFolderUrl && (
                        <div className="text-2xs text-teal-700 flex items-center gap-1 mt-0.5 font-normal">
                          <Cloud className="w-3 h-3 text-teal-600" />
                          <span>{isAr ? 'مجلد درايف متصل' : 'Drive folder linked'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {p.driveFolderUrl && (
                      <a
                        href={p.driveFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-teal-100 rounded-md text-teal-700 transition-colors"
                        title={isAr ? 'فتح مجلد Google Drive' : 'Open in Google Drive'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-teal-600" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAddProfileModal();
              }}
              className="w-full px-3 py-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAr ? 'إضافة ملف أو شخص جديد' : 'Add New Family Member'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
