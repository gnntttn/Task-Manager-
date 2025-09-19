
import React from 'react';
import { CogIcon } from './icons/CogIcon';
import { PlusIcon } from './icons/PlusIcon';
import { FolderIcon } from './icons/FolderIcon';

interface BottomNavBarProps {
  onAddTask: () => void;
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
  isAddTaskDisabled: boolean;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onAddTask,
  onOpenSettings,
  onOpenSidebar,
  isAddTaskDisabled,
}) => {
  return (
    <footer className="bottom-nav fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 flex md:hidden items-center justify-between px-6 z-40">
      <button
        onClick={onOpenSidebar}
        className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 p-2"
        aria-label="Open projects"
      >
        <FolderIcon className="h-6 w-6" />
        <span className="text-xs font-medium">المشاريع</span>
      </button>

      {/* Center FAB */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
        <button
          onClick={onAddTask}
          disabled={isAddTaskDisabled}
          className="bottom-nav-fab h-16 w-16 bg-sky-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-sky-700 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-sky-500 dark:focus:ring-offset-slate-900 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:hover:scale-100"
          aria-label="Add new task"
        >
          <PlusIcon className="h-8 w-8" />
        </button>
      </div>
      
      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 p-2"
        aria-label="Open settings"
      >
        <CogIcon className="h-6 w-6" />
        <span className="text-xs font-medium">الإعدادات</span>
      </button>
    </footer>
  );
};

export default BottomNavBar;
