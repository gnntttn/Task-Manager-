
import React, { useState } from 'react';
import type { Project } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { CloseIcon } from './icons/CloseIcon';
import { TrashIcon } from './icons/TrashIcon';


interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (name: string) => void;
  onRequestDeleteProject: (project: Project) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ projects, activeProjectId, onSelectProject, onAddProject, onRequestDeleteProject, isOpen, onClose }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setIsAdding(false);
    }
  };

  return (
    <aside className={`
        bg-slate-50 dark:bg-slate-800/80 dark:md:bg-slate-800/50 backdrop-blur-md md:backdrop-blur-none
        w-64 p-4 flex flex-col 
        transition-transform duration-300 ease-in-out
        fixed md:static inset-y-0 right-0 z-50
        md:translate-x-0
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        border-l border-slate-200 dark:border-slate-700`
    }>
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6.5A3.5 3.5 0 0 0 8.5 3A3.5 3.5 0 0 0 5 6.5A3.5 3.5 0 0 0 8.5 10A3.5 3.5 0 0 0 15 6.5Z"/><path d="M18.5 18a3.5 3.5 0 0 0 0-7H6.5a3.5 3.5 0 0 0 0 7H12"/><path d="m12 14.5 9.5 9.5"/></svg>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">مهامي</h2>
        </div>
         <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 md:hidden" aria-label="Close menu">
            <CloseIcon className="h-6 w-6 text-slate-500 dark:text-slate-400"/>
        </button>
      </div>
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2 uppercase tracking-wider">المشاريع</h3>
      <nav className="flex-1 overflow-y-auto">
        <ul>
          {projects.map(project => (
            <li key={project.id} className="group relative">
              <button
                onClick={() => onSelectProject(project.id)}
                className={`w-full text-right pl-10 pr-3 py-2 rounded-md text-base transition-colors truncate ${
                  activeProjectId === project.id 
                    ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 font-semibold' 
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {project.name}
              </button>
               <button
                onClick={() => onRequestDeleteProject(project)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`حذف مشروع ${project.name}`}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-4">
        {isAdding ? (
          <form onSubmit={handleAddProject}>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="اسم المشروع الجديد"
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              autoFocus
              onBlur={() => { if(!newProjectName) setIsAdding(false) }}
            />
            <button type="submit" className="hidden">إضافة</button>
          </form>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>إضافة مشروع جديد</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
