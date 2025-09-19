
import React, { useCallback } from 'react';
import type { Task, Status, StatusConfig } from '../types';
import { STATUSES } from '../constants';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, newStatus: Status) => void;
  onTaskClick: (task: Task) => void;
  statusConfigs: { [key in Status]: StatusConfig };
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onUpdateTaskStatus, onTaskClick, statusConfigs }) => {
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, status: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onUpdateTaskStatus(taskId, status);
    }
  }, [onUpdateTaskStatus]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4">
      {STATUSES.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasks.filter(task => task.status === status)}
          onDrop={(e) => handleDrop(e, status)}
          onDragOver={handleDragOver}
          onTaskClick={onTaskClick}
          statusConfig={statusConfigs[status]}
        />
      ))}
    </div>
  );
};

export default KanbanBoard;