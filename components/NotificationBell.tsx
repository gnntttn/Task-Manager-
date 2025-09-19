import React, { useState, useEffect, useRef } from 'react';
import type { Task } from '../types';
import { BellIcon } from './icons/BellIcon';
import { ClockIcon } from './icons/ClockIcon';

interface NotificationBellProps {
  notifications: Task[];
  onTaskClick: (task: Task) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onTaskClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getDueDateStatus = (dueDate: string | undefined): { status: 'overdue' | 'due-soon', text: string } | null => {
      if (!dueDate) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDateObj = new Date(dueDate);

      const diffTime = dueDateObj.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
          return { status: 'overdue', text: `متأخرة منذ ${Math.abs(diffDays)} يوم` };
      }
      if (diffDays === 0) {
          return { status: 'due-soon', text: 'تستحق اليوم' };
      }
      if (diffDays === 1) {
          return { status: 'due-soon', text: 'تستحق غداً' };
      }
      return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        aria-label={`Notifications (${notifications.length})`}
      >
        <BellIcon className="h-6 w-6" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">الإشعارات</h3>
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(task => {
                const dueDateStatus = getDueDateStatus(task.dueDate);
                return (
                    <li key={task.id}>
                        <button
                            onClick={() => {
                                onTaskClick(task);
                                setIsOpen(false);
                            }}
                            className="w-full text-right p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <p className="font-medium text-slate-800 dark:text-slate-200">{task.title}</p>
                            {dueDateStatus && (
                                <p className={`flex items-center gap-1 text-sm ${dueDateStatus.status === 'overdue' ? 'text-red-500' : 'text-yellow-500'}`}>
                                    <ClockIcon className="h-4 w-4" />
                                    {dueDateStatus.text}
                                </p>
                            )}
                        </button>
                    </li>
                );
              })
            ) : (
              <li className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                لا توجد إشعارات جديدة.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
