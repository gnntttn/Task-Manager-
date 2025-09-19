
import React, { useState, useEffect } from 'react';
import type { Task, Status, Priority } from '../types';
import { STATUSES, PRIORITIES, PRIORITY_COLORS } from '../constants';
import { generateSubTasks } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CloseIcon } from './icons/CloseIcon';
import SubtaskReviewModal from './SubtaskReviewModal';
import ConfirmationModal from './ConfirmationModal';


interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const formatDate = (isoString: string) => {
    if (!isoString) return 'غير متوفر';
    return new Date(isoString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
};

const formatDateRelative = (isoString: string): string => {
    if (!isoString) return 'غير متوفر';
    try {
        const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
        const now = new Date();
        const date = new Date(isoString);
        const seconds = Math.round((date.getTime() - now.getTime()) / 1000);

        if (Math.abs(seconds) < 60) {
            return 'الآن';
        }
        const minutes = Math.round(seconds / 60);
        if (Math.abs(minutes) < 60) {
            return rtf.format(minutes, 'minute');
        }
        const hours = Math.round(minutes / 60);
        if (Math.abs(hours) < 24) {
            return rtf.format(hours, 'hour');
        }
        const days = Math.round(hours / 24);
        if (Math.abs(days) < 30) {
            return rtf.format(days, 'day');
        }
        const months = Math.round(days / 30.44);
        if (Math.abs(months) < 12) {
            return rtf.format(months, 'month');
        }
        const years = Math.round(days / 365.25);
        return rtf.format(years, 'year');
    } catch (e) {
        console.error("Could not format relative date:", e);
        return formatDate(isoString); // Fallback to absolute date
    }
};


const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onUpdateTask, onDeleteTask }) => {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const [isReviewingSubtasks, setIsReviewingSubtasks] = useState(false);
  const [generatedSubtasksList, setGeneratedSubtasksList] = useState<string[]>([]);
  
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setEditedTask(task);
    setIsEditing(false); // Reset to view mode when task prop changes
  }, [task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdateTask(editedTask);
    onClose();
  };

  const handleDelete = () => {
    setIsConfirmingDelete(true);
  };
  
  const handleConfirmDelete = () => {
    onDeleteTask(task.id);
  };

  const handleCancelEdit = () => {
      setEditedTask(task);
      setIsEditing(false);
  }
  
  const handleGenerateSubtasks = async () => {
    setIsGenerating(true);
    setError('');
    try {
        const subTasks = await generateSubTasks(editedTask.title, editedTask.description);
        if(subTasks && subTasks.length > 0) {
            setGeneratedSubtasksList(subTasks);
            setIsReviewingSubtasks(true);
        }
    } catch(err: any) {
        setError(err.message || "An unexpected error occurred.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleConfirmSubtasks = (reviewedSubtasks: string[]) => {
    if (reviewedSubtasks.length > 0) {
        const subTaskMarkdown = reviewedSubtasks.map(st => `- [ ] ${st}`).join('\n');
        const separator = editedTask.description ? '\n\n' : '';
        const header = '**مهام فرعية:**\n';
        const newDescription = `${editedTask.description}${separator}${header}${subTaskMarkdown}`;
        
        setEditedTask(prev => ({ ...prev, description: newDescription }));
    }
    setIsReviewingSubtasks(false);
    setGeneratedSubtasksList([]);
  };

  const handleCancelSubtasks = () => {
      setIsReviewingSubtasks(false);
      setGeneratedSubtasksList([]);
  };


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{isEditing ? 'تعديل المهمة' : 'تفاصيل المهمة'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <CloseIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
          </button>
        </header>
        
        {isEditing ? (
            // EDIT MODE
            <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العنوان</label>
                    <input type="text" name="title" id="title" value={editedTask.title} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الوصف</label>
                    <textarea name="description" id="description" value={editedTask.description} onChange={handleChange} rows={5} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    <div className="mt-2">
                        <button onClick={handleGenerateSubtasks} disabled={isGenerating} className="flex items-center gap-2 text-sm px-3 py-2 bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 rounded-md hover:bg-sky-200 dark:hover:bg-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                            <SparklesIcon className="h-5 w-5"/>
                            {isGenerating ? 'جاري الإنشاء...' : 'إنشاء مهام فرعية بالذكاء الاصطناعي'}
                        </button>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الحالة</label>
                        <select name="status" id="status" value={editedTask.status} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الأولوية</label>
                        <select name="priority" id="priority" value={editedTask.priority} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">
                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاريخ الاستحقاق</label>
                        <input type="date" name="dueDate" id="dueDate" value={editedTask.dueDate || ''} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                    </div>
                </div>
            </div>
        ) : (
            // VIEW MODE
            <div className="p-6 space-y-4 overflow-y-auto">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{task.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-200 dark:bg-slate-700">{task.status}</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                    {task.dueDate && <span className="text-slate-500 dark:text-slate-400"><strong>تاريخ الاستحقاق:</strong> {task.dueDate}</span>}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    <p>{task.description || 'لا يوجد وصف لهذه المهمة.'}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <p title={formatDate(task.createdAt)}><strong>تاريخ الإنشاء:</strong> {formatDateRelative(task.createdAt)}</p>
                    <p title={formatDate(task.updatedAt)}><strong>آخر تحديث:</strong> {formatDateRelative(task.updatedAt)}</p>
                </div>
            </div>
        )}

        <footer className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50">
             <TrashIcon className="h-5 w-5" />
            <span>حذف</span>
          </button>
          {isEditing ? (
            <div className="flex gap-3">
              <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                إلغاء
              </button>
              <button onClick={handleSave} className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
                حفظ التغييرات
              </button>
            </div>
          ) : (
             <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                إغلاق
              </button>
              <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
                تعديل
              </button>
            </div>
          )}
        </footer>
      </div>
      <SubtaskReviewModal
        isOpen={isReviewingSubtasks}
        subtasks={generatedSubtasksList}
        onConfirm={handleConfirmSubtasks}
        onCancel={handleCancelSubtasks}
      />
      <ConfirmationModal
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={handleConfirmDelete}
        title="تأكيد حذف المهمة"
        message="هل أنت متأكد من رغبتك في حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default TaskModal;
