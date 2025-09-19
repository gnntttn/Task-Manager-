
import React from 'react';
import type { Task } from '../types';
import { PRIORITY_COLORS } from '../constants';
import { ClockIcon } from './icons/ClockIcon';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  statusColor: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, statusColor }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
  };
  
  const getDueDateStatus = (): { status: 'overdue' | 'due-soon', text: string } | null => {
      if (!task.dueDate) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dueDateObj = new Date(task.dueDate); // This is at midnight

      if (dueDateObj < today) {
          return { status: 'overdue', text: 'المهمة متأخرة' };
      }
      
      if (dueDateObj.getTime() === today.getTime()) {
          return { status: 'due-soon', text: 'تستحق اليوم' };
      }
      
      return null;
  }

  const dueDateStatus = getDueDateStatus();

  return (
    <div
      onClick={onClick}
      draggable="true"
      onDragStart={handleDragStart}
      className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm hover:shadow-md cursor-pointer border-t-4 transition-all duration-200 hover:scale-[1.02]"
      style={{ borderTopColor: statusColor }}
    >
      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{task.title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{task.description}</p>
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        <div className="flex items-center gap-2">
            {dueDateStatus && (
                <div title={dueDateStatus.text}>
                    <ClockIcon className={`h-5 w-5 ${dueDateStatus.status === 'overdue' ? 'text-red-500 dark:text-red-400' : 'text-yellow-500 dark:text-yellow-400'}`} />
                </div>
            )}
            {task.dueDate && (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>{task.dueDate}</span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
