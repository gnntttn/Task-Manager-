
import React from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد الحذف',
  cancelText = 'إلغاء',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-70 p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-message">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="confirmation-title" className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
            {title}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close dialog">
            <CloseIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto">
          <p id="confirmation-message" className="text-slate-600 dark:text-slate-300">
            {message}
          </p>
        </div>

        <footer className="p-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-800"
          >
            {confirmText}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmationModal;
