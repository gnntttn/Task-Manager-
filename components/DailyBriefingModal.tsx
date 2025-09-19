import React, { useState, useEffect } from 'react';
import type { Task, Priority } from '../types';
import { generateDailyBriefing } from '../services/geminiService';
import { CloseIcon } from './icons/CloseIcon';
import { BriefingIcon } from './icons/BriefingIcon';

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({ isOpen, onClose, tasks }) => {
  const [briefing, setBriefing] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBriefing = async () => {
      setIsLoading(true);
      setError('');
      setBriefing('');
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const importantTasks = tasks.filter(task => {
            if (task.status === 'مكتمل') return false; // Ignore completed tasks
            const isHighPriority = task.priority === 'عالي';
            const isDueToday = task.dueDate === todayStr;
            const isOverdue = task.dueDate ? new Date(task.dueDate) < today : false;
            return isHighPriority || isDueToday || isOverdue;
        });

        if (importantTasks.length === 0) {
            setBriefing('ليس لديك مهام عاجلة لليوم. استمتع بيومك!');
            return;
        }

        const result = await generateDailyBriefing(importantTasks);
        setBriefing(result);
      } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchBriefing();
    }
  }, [isOpen, tasks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="briefing-title">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="briefing-title" className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BriefingIcon className="h-6 w-6 text-sky-500" />
            ملخص اليوم الذكي
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close dialog">
            <CloseIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto min-h-[200px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 dark:text-slate-400">جاري إعداد الملخص اليومي...</p>
            </div>
          )}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {!isLoading && !error && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {briefing}
            </div>
          )}
        </div>

        <footer className="p-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"
          >
            إغلاق
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DailyBriefingModal;
