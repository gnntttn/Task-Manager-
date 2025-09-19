
import React, { useState, useEffect } from 'react';
import type { Status, Theme, StatusConfig } from '../types';
import { STATUSES, AVAILABLE_ICONS } from '../constants';
import { CloseIcon } from './icons/CloseIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfigs: { [key in Status]: StatusConfig };
  onSave: (newConfigs: { [key in Status]: StatusConfig }) => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentConfigs, onSave, currentTheme, onThemeChange }) => {
  const [configs, setConfigs] = useState(currentConfigs);
  const [editingIconFor, setEditingIconFor] = useState<Status | null>(null);

  useEffect(() => {
    setConfigs(currentConfigs);
  }, [currentConfigs, isOpen]);

  const handleColorChange = (status: Status, color: string) => {
    setConfigs(prev => ({ ...prev, [status]: { ...prev[status], color }}));
  };
  
  const handleIconChange = (status: Status, icon: string) => {
    setConfigs(prev => ({ ...prev, [status]: { ...prev[status], icon } }));
    setEditingIconFor(null);
  };

  const handleSave = () => {
    onSave(configs);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">الإعدادات</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <CloseIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">المظهر</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">اختر المظهر المفضل لديك.</p>
                <div className="flex gap-2 rounded-lg bg-slate-200 dark:bg-slate-700 p-1">
                    {(['light', 'dark', 'high-contrast'] as Theme[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => onThemeChange(t)}
                            className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${
                                currentTheme === t
                                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600/50'
                            }`}
                            aria-pressed={currentTheme === t}
                        >
                            {t === 'light' && 'فاتح'}
                            {t === 'dark' && 'داكن'}
                            {t === 'high-contrast' && 'عالي التباين'}
                        </button>
                    ))}
                </div>
            </div>
            
            <hr className="border-slate-200 dark:border-slate-600" />

            <div>
                 <h3 className="text-lg font-semibold text-slate-800 dark:text-white">أيقونات وألوان الحالة</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    قم بتخصيص الأيقونات والألوان لتناسب أسلوب عملك.
                </p>
                <div className="space-y-2">
                    {STATUSES.map(status => {
                        const IconComponent = AVAILABLE_ICONS[configs[status].icon];
                        return (
                            <div key={status} className="p-2 rounded-lg transition-colors bg-slate-100/50 dark:bg-slate-700/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                        onClick={() => setEditingIconFor(editingIconFor === status ? null : status)}
                                        className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"
                                        title="تغيير الأيقونة"
                                        aria-label={`Change icon for ${status}`}
                                        >
                                            <IconComponent className="h-6 w-6" style={{ color: configs[status].color }} />
                                        </button>
                                        <label htmlFor={`color-${status}`} className="text-slate-700 dark:text-slate-300">
                                            {status}
                                        </label>
                                    </div>
                                    <input
                                        id={`color-${status}`}
                                        type="color"
                                        value={configs[status].color}
                                        onChange={(e) => handleColorChange(status, e.target.value)}
                                        className="w-16 h-8 p-0 border-none rounded-md bg-transparent cursor-pointer"
                                        title={`اختر لونًا لـ ${status}`}
                                    />
                                </div>
                                {editingIconFor === status && (
                                    <div className="mt-2 p-2 bg-slate-200/50 dark:bg-slate-900/50 rounded-md grid grid-cols-5 gap-2">
                                        {Object.keys(AVAILABLE_ICONS).map(iconKey => {
                                            const PickerIcon = AVAILABLE_ICONS[iconKey];
                                            return(
                                                <button
                                                    key={iconKey}
                                                    onClick={() => handleIconChange(status, iconKey)}
                                                    className={`p-2 rounded-md transition-colors ${configs[status].icon === iconKey ? 'bg-sky-200 dark:bg-sky-500/30' : 'hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                                    aria-label={`Select ${iconKey} icon`}
                                                >
                                                    <PickerIcon className="h-6 w-6 text-slate-600 dark:text-slate-300 mx-auto" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
        
        <footer className="pt-4 p-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
            إغلاق
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
            حفظ
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;