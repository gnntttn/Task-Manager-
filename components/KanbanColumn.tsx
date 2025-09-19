
import React, { useState, useMemo } from 'react';
import type { Task, Status, Priority, StatusConfig } from '../types';
import TaskCard from './TaskCard';
import { AVAILABLE_ICONS } from '../constants';

interface KanbanColumnProps {
  status: Status;
  tasks: Task[];
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onTaskClick: (task: Task) => void;
  statusConfig: StatusConfig;
}

type SortKey = 'creation' | 'dueDate' | 'priority';

const priorityOrder: { [key in Priority]: number } = {
  'عالي': 3,
  'متوسط': 2,
  'منخفض': 1,
};


const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, tasks, onDrop, onDragOver, onTaskClick, statusConfig }) => {
  const [sortBy, setSortBy] = useState<SortKey>('creation');

  const sortedTasks = useMemo(() => {
    const tasksToSort = [...tasks];
    
    tasksToSort.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1; // a goes to the end
          if (!b.dueDate) return -1; // b goes to the end
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

        case 'creation':
        default:
          const timeA = new Date(a.createdAt).getTime() || 0;
          const timeB = new Date(b.createdAt).getTime() || 0;
          return timeB - timeA; // Newest first
      }
    });

    return tasksToSort;
  }, [tasks, sortBy]);

  const IconComponent = AVAILABLE_ICONS[statusConfig.icon] || AVAILABLE_ICONS['Circle'];

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      className="bg-slate-200/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col h-full min-h-[200px]"
    >
      <div 
        className="flex items-start justify-between mb-4 pb-2 border-b-2"
        style={{ borderBottomColor: statusConfig.color }}
      >
        <div className="flex items-center gap-2">
            <IconComponent className="h-6 w-6" style={{ color: statusConfig.color }} aria-hidden="true" />
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">{status}</h3>
            <span className="text-sm font-medium bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2 py-1">
            {tasks.length}
            </span>
        </div>
        <div>
            <label htmlFor={`sort-${status}`} className="sr-only">فرز حسب</label>
            <select
                id={`sort-${status}`}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="bg-transparent text-sm text-slate-500 dark:text-slate-400 border-none rounded-md p-1 pr-7 focus:ring-2 focus:ring-sky-500"
                aria-label="Sort tasks by"
            >
                <option value="creation">تاريخ الإنشاء</option>
                <option value="dueDate">تاريخ الاستحقاق</option>
                <option value="priority">الأولوية</option>
            </select>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 -mr-2">
        {sortedTasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onClick={() => onTaskClick(task)} 
            statusColor={statusConfig.color}
          />
        ))}
      </div>
    </div>
  );
};

export default KanbanColumn;