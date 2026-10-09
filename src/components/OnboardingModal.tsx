import React, { useState } from 'react';
import {
  FolderPlus,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Cloud,
  FileSpreadsheet,
  ShieldCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import { FamilyProfile } from '../types/mediflow';
import { getAccessToken } from '../lib/googleAuth';
import {
  getOrCreateMainAppFolder,
  createRelativeFolder,
  syncRelativeMedicinesToSheet,
} from '../lib/googleDriveSync';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profiles: FamilyProfile[]) => void;
  lang: 'ar' | 'en';
  userEmail?: string | null;
}

const QUICK_SUGGESTIONS = [
  { name: 'أنا (الرئيسي)', relation: 'self', icon: '👤' },
  { name: 'والدي', relation: 'father', icon: '👴' },
  { name: 'والدتي', relation: 'mother', icon: '👵' },
  { name: 'ابني / ابنتي', relation: 'child', icon: '🧒' },
  { name: 'شريك الحياة', relation: 'spouse', icon: '💍' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  lang,
  userEmail,
}) => {
  const isAr = lang === 'ar';

  const [foldersList, setFoldersList] = useState<
    { id: string; name: string; relation: string; age?: string }[]
  >([
    { id: '1', name: 'أنا (الملف الشخصي)', relation: 'self' },
    { id: '2', name: 'والدي', relation: 'father', age: '68' },
    { id: '3', name: 'والدتي', relation: 'mother', age: '63' },
  ]);

  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderRelation, setNewFolderRelation] = useState('other');
  const [newFolderAge, setNewFolderAge] = useState('');
  const [isCreatingOnDrive, setIsCreatingOnDrive] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('');
  const [createdResultDriveUrl, setCreatedResultDriveUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const item = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newFolderName.trim(),
      relation: newFolderRelation,
      age: newFolderAge.trim() || undefined,
    };
    setFoldersList([...foldersList, item]);
    setNewFolderName('');
    setNewFolderAge('');
  };

  const handleAddSuggestion = (suggestion: typeof QUICK_SUGGESTIONS[0]) => {
    if (foldersList.some((f) => f.name.includes(suggestion.name))) return;
    const item = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: suggestion.name,
      relation: suggestion.relation,
    };
    setFoldersList([...foldersList, item]);
  };

  const handleRemoveFolder = (id: string) => {
    if (foldersList.length <= 1) return;
    setFoldersList(foldersList.filter((f) => f.id !== id));
  };

  const handleFinalize = async () => {
    setIsCreatingOnDrive(true);
    setSyncStatusText(isAr ? 'جارٍ التحقق من الاتصال بحسابك في Google...' : 'Connecting to Google...');

    const token = await getAccessToken();
    const finalProfiles: FamilyProfile[] = [];

    try {
      let mainDriveFolderId: string | undefined;
      let mainDriveFolderUrl: string | undefined;

      if (token) {
        setSyncStatusText(isAr ? 'جارٍ إنشاء المجلد الرئيسي على Google Drive...' : 'Creating main folder on Google Drive...');
        const mainFolder = await getOrCreateMainAppFolder(token);
        mainDriveFolderId = mainFolder.id;
        mainDriveFolderUrl = mainFolder.webViewLink;
        setCreatedResultDriveUrl(mainDriveFolderUrl);

        for (const f of foldersList) {
          setSyncStatusText(
            isAr
              ? `جارٍ إنشاء مجلد وجدول إكسل خاص بـ (${f.name}) في Google Drive...`
              : `Creating folder and spreadsheet for (${f.name})...`
          );
          try {
            const relFolder = await createRelativeFolder(token, mainFolder.id, f.name);
            const relSheet = await syncRelativeMedicinesToSheet(token, relFolder.id, f.name, []);
            finalProfiles.push({
              id: f.id,
              name: f.name,
              relation: f.relation,
              age: f.age,
              driveFolderId: relFolder.id,
              driveFolderUrl: relFolder.webViewLink,
              driveSheetId: relSheet.sheetId,
              driveSheetUrl: relSheet.sheetUrl,
              created_at: new Date().toISOString(),
            });
          } catch (relErr) {
            console.warn('Relative folder creation warning:', relErr);
            finalProfiles.push({
              id: f.id,
              name: f.name,
              relation: f.relation,
              age: f.age,
              created_at: new Date().toISOString(),
            });
          }
        }
      } else {
        // Offline / Local profiles without active Google token
        foldersList.forEach((f) => {
          finalProfiles.push({
            id: f.id,
            name: f.name,
            relation: f.relation,
            age: f.age,
            created_at: new Date().toISOString(),
          });
        });
      }

      onComplete(finalProfiles);
      onClose();
    } catch (err: any) {
      console.error('Finalize error:', err);
      // Fallback: save profiles locally
      const fallbackProfiles = foldersList.map((f) => ({
        id: f.id,
        name: f.name,
        relation: f.relation,
        age: f.age,
        created_at: new Date().toISOString(),
      }));
      onComplete(fallbackProfiles);
      onClose();
    } finally {
      setIsCreatingOnDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-6 relative border border-slate-100 dark:border-slate-800">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-full text-xs font-bold text-teal-800 dark:text-teal-300 mb-2">
            <Cloud className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{isAr ? 'مزامنة السجلات الطبية في Google Drive' : 'Google Drive Medical Folders'}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            {isAr ? 'حدد أسماء المجلدات العائلية التي ترغب في إنشائها' : 'Name Your Family Health Folders'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {isAr
              ? 'اجعل الأمر سهلاً ومباشراً: اكتب أسماء الأقارب أو الأفراد الذين ترغب في حفظ أدويتهم وجداولهم، وسيقوم النظام بإنشاء مجلد وملف إكسل خاص بكل فرد تلقائياً على Google Drive.'
              : 'Write the names of the family members you want. We will automatically create folders and Excel spreadsheets on Google Drive for each.'}
          </p>
          {userEmail && (
            <div className="mt-2 text-2xs text-teal-700 dark:text-teal-300 font-mono bg-teal-50/60 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg inline-block border border-teal-200/50 dark:border-teal-800">
              {isAr ? `الحساب المتصل: ${userEmail}` : `Connected: ${userEmail}`}
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="space-y-2 text-right">
          <span className="text-2xs font-bold text-slate-400 dark:text-slate-500 block">
            {isAr ? 'اقتراحات سريعة بنقرة واحدة:' : 'Quick suggestions:'}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddSuggestion(s)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-800 dark:hover:text-teal-300 text-slate-700 dark:text-slate-300 rounded-lg text-2xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{s.icon}</span>
                <span>{s.name}</span>
                <Plus className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Add custom folder input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block text-right">
            {isAr ? 'كتابة اسم مجلد أو شخص جديد:' : 'Add a family member or folder name:'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFolder())}
              placeholder={isAr ? 'اكتب الاسم هنا (مثال: والدي، عمتي نادية، طفلي عمر...)' : 'Write name here...'}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddFolder}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة' : 'Add'}</span>
            </button>
          </div>
        </div>

        {/* Current list of folders to create with Parent Folder Hierarchy Visual */}
        <div className="space-y-2.5 text-right">
          {/* Main Parent Folder Banner */}
          <div className="p-3 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 dark:from-teal-950/60 dark:via-emerald-950/40 dark:to-teal-950/60 border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                📁
              </div>
              <div>
                <span className="text-2xs text-teal-800 dark:text-teal-300 font-bold block">
                  {isAr ? 'المجلد الرئيسي الموحد في Google Drive:' : 'Main Parent Folder on Google Drive:'}
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                  Solafios Mediflow - السجلات الطبية والعائلية
                </span>
              </div>
            </div>
            <span className="text-2xs bg-teal-200/80 dark:bg-teal-900 text-teal-900 dark:text-teal-200 font-bold px-2 py-0.5 rounded-full border border-teal-300 dark:border-teal-700 shrink-0">
              {isAr ? 'مجلد رئيسي موحد' : 'Root Folder'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
            <span className="flex items-center gap-1.5">
              <span>↳</span>
              <span>
                {isAr
                  ? `المجلدات الفرعية للأقارب بداخله (${foldersList.length}):`
                  : `Subfolders per relative inside it (${foldersList.length}):`}
              </span>
            </span>
            <span className="text-2xs text-teal-700 dark:text-teal-400 font-semibold">
              {isAr ? 'مجلد فرعي + ملف إكسل لكل فرد' : '1 folder + 1 sheet each'}
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {foldersList.map((f, idx) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-3 bg-teal-50/40 dark:bg-slate-800/60 border border-teal-200/80 dark:border-teal-800/80 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-2xs">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{f.name}</span>
                    <span className="text-2xs text-slate-500 dark:text-slate-400">
                      {isAr ? '📂 مجلد فرعي داخل المجلد الرئيسي' : 'Subfolder inside main folder'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xs bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                    {isAr ? 'جاهز للإنشاء' : 'Ready'}
                  </span>
                  {foldersList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFolder(f.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                      title={isAr ? 'حذف' : 'Remove'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Progress Status */}
        {isCreatingOnDrive && (
          <div className="p-4 bg-teal-50 border border-teal-300 rounded-2xl text-center space-y-2 animate-pulse">
            <div className="flex items-center justify-center gap-2 text-teal-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
              <span>{syncStatusText}</span>
            </div>
            <div className="w-full bg-teal-200/60 rounded-full h-1.5 overflow-hidden">
              <div className="bg-teal-600 h-1.5 rounded-full w-3/4 animate-pulse" />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            disabled={isCreatingOnDrive}
            onClick={() => {
              // Direct skip with current profiles
              const defaultFallback = foldersList.map((f) => ({
                id: f.id,
                name: f.name,
                relation: f.relation,
                age: f.age,
                created_at: new Date().toISOString(),
              }));
              onComplete(defaultFallback);
              onClose();
            }}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer"
          >
            {isAr ? 'تخطي والبدء مباشرة بالبيانات المحلية' : 'Skip and use local data'}
          </button>

          <button
            type="button"
            disabled={isCreatingOnDrive || foldersList.length === 0}
            onClick={handleFinalize}
            className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{isAr ? 'تأكيد وإنشاء المجلدات الآن 🚀' : 'Confirm & Create Folders'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
