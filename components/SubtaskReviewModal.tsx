
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface SubtaskReviewModalProps {
  isOpen: boolean;
  subtasks: string[];
  onConfirm: (editedSubtasks: string[]) => void;
  onCancel: () => void;
}

const SubtaskReviewModal: React.FC<SubtaskReviewModalProps> = ({ isOpen, subtasks, onConfirm, onCancel }) => {
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEditedText(subtasks.join('\n'));
    }
  }, [isOpen, subtasks]);

  const handleConfirm = () => {
    const editedList = editedText.split('\n').filter(line => line.trim() !== '');
    onConfirm(editedList);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-60 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">مراجعة المهام الفرعية المقترحة</h2>
          <button onClick={onCancel} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <CloseIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                قام الذكاء الاصطناعي باقتراح المهام الفرعية التالية. يمكنك تعديلها أو حذفها أو الإضافة إليها قبل إضافتها إلى وصف المهمة.
            </p>
            <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="مهمة فرعية واحدة في كل سطر..."
                aria-label=" قائمة المهام الفرعية القابلة للتعديل"
            />
        </div>

        <footer className="p-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
            إلغاء
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
            إضافة للوصف
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SubtaskReviewModal;
