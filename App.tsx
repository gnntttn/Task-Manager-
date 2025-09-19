import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Project, Task, Status, Theme, StatusConfig } from './types';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import AddTaskModal from './components/AddTaskModal';
import TaskModal from './components/TaskModal';
import NotificationBell from './components/NotificationBell';
import SettingsModal from './components/SettingsModal';
import BottomNavBar from './components/BottomNavBar';
import { PlusIcon } from './components/icons/PlusIcon';
import { CogIcon } from './components/icons/CogIcon';
import { MenuIcon } from './components/icons/MenuIcon';
import { DEFAULT_STATUS_CONFIGS } from './constants';
import ConfirmationModal from './components/ConfirmationModal';
import * as db from './services/db';
import * as geminiService from './services/geminiService';
import { SearchIcon } from './components/icons/SearchIcon';
import { CloseIcon } from './components/icons/CloseIcon';
import DailyBriefingModal from './components/DailyBriefingModal';
import { BriefingIcon } from './components/icons/BriefingIcon';


const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isBriefingModalOpen, setBriefingModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [notifications, setNotifications] = useState<Task[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusConfigs, setStatusConfigs] = useState<{ [key in Status]: StatusConfig }>(DEFAULT_STATUS_CONFIGS);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultIds, setSearchResultIds] = useState<string[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    const loadData = async () => {
        try {
            await db.initDB();
            const [savedProjects, savedTasks, savedTheme, savedStatusConfigs] = await Promise.all([
                db.getAll<Project>('projects'),
                db.getAll<Task>('tasks'),
                db.getSetting<Theme>('theme'),
                db.getSetting<{ [key in Status]: StatusConfig }>('statusConfigs'),
            ]);

            if (savedProjects.length > 0) {
                setProjects(savedProjects);
            } else {
                // Database is empty, create initial project
                const initialProject = { id: `proj-${Date.now()}`, name: 'مشروعي الأول' };
                await db.add('projects', initialProject);
                setProjects([initialProject]);
            }
            
            const migratedTasks = savedTasks.map(task => {
                if (!task.createdAt) {
                    const timestamp = parseInt(task.id.split('-')[1], 10);
                    const creationDate = new Date(timestamp).toISOString();
                    return { ...task, createdAt: creationDate, updatedAt: creationDate };
                }
                return task;
            });
            setTasks(migratedTasks);

            if (savedTheme) {
                setTheme(savedTheme);
            }
            if (savedStatusConfigs) {
                setStatusConfigs(savedStatusConfigs);
            }

        } catch (error) {
            console.error("Failed to load data from database", error);
            // Here you could set an error state and show a message to the user
        } finally {
            setIsLoading(false);
        }
    };
    
    loadData();
  }, []);
  
  useEffect(() => {
    if(!isLoading && projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId, isLoading]);

  // Clear search when active project changes
  useEffect(() => {
    setSearchQuery('');
    setSearchResultIds(null);
    setSearchError('');
  }, [activeProjectId]);
  
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'high-contrast');
    if (theme === 'dark') {
        root.classList.add('dark');
    } else if (theme === 'high-contrast') {
        root.classList.add('high-contrast');
    }
    if (!isLoading) {
      db.putSetting('theme', theme);
    }
  }, [theme, isLoading]);
  
  useEffect(() => {
      if (!isLoading) {
          db.putSetting('statusConfigs', statusConfigs);
      }
  }, [statusConfigs, isLoading]);

  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth >= 768) { // md breakpoint
              setSidebarOpen(false);
          }
      };
      
      window.addEventListener('resize', handleResize);
      
      if (isSidebarOpen) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = '';
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        document.body.style.overflow = ''; // cleanup on unmount
      };
  }, [isSidebarOpen]);


  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    const upcomingOrOverdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < dayAfterTomorrow;
    });

    upcomingOrOverdueTasks.sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
    });
    
    setNotifications(upcomingOrOverdueTasks);
  }, [tasks]);


  const addProject = async (name: string) => {
    const newProject: Project = { id: `proj-${Date.now()}`, name };
    try {
        await db.add('projects', newProject);
        setProjects(prev => [...prev, newProject]);
        setActiveProjectId(newProject.id);
    } catch (error) {
        console.error("Failed to add project:", error);
    }
  };
  
  const onRequestDeleteProject = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleConfirmDeleteProject = async () => {
      if (!projectToDelete) return;
      const projectId = projectToDelete.id;

      try {
          await db.deleteItem('projects', projectId);
          await db.deleteTasksByProjectId(projectId);

          const remainingProjects = projects.filter(p => p.id !== projectId);
          setProjects(remainingProjects);

          const remainingTasks = tasks.filter(t => t.projectId !== projectId);
          setTasks(remainingTasks);

          if (activeProjectId === projectId) {
              setActiveProjectId(remainingProjects.length > 0 ? remainingProjects[0].id : null);
          }
          
          setProjectToDelete(null);
      } catch (error) {
          console.error("Failed to delete project:", error);
      }
  };


  const addTask = useCallback(async (task: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    if (!activeProjectId) return;
    const now = new Date().toISOString();
    const newTask: Task = { 
        ...task, 
        id: `task-${Date.now()}`, 
        projectId: activeProjectId,
        createdAt: now,
        updatedAt: now,
    };
    try {
        await db.add('tasks', newTask);
        setTasks(prev => [...prev, newTask]);
        setAddTaskModalOpen(false);
    } catch (error) {
        console.error("Failed to add task:", error);
    }
  }, [activeProjectId]);

  const updateTask = useCallback(async (updatedTask: Task) => {
    const taskWithUpdateDate: Task = { ...updatedTask, updatedAt: new Date().toISOString() };
    try {
        await db.put('tasks', taskWithUpdateDate);
        setTasks(prev => prev.map(task => task.id === taskWithUpdateDate.id ? taskWithUpdateDate : task));
    } catch (error) {
        console.error("Failed to update task:", error);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
        await db.deleteItem('tasks', taskId);
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setEditingTask(null);
    } catch (error) {
        console.error("Failed to delete task:", error);
    }
  }, []);
  
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: Status) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    const now = new Date().toISOString();
    const updatedTask = { ...taskToUpdate, status: newStatus, updatedAt: now };

    try {
        await db.put('tasks', updatedTask);
        setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
    } catch (error) {
        console.error("Failed to update task status:", error);
    }
  }, [tasks]);

  const handleSaveStatusConfigs = (newConfigs: { [key in Status]: StatusConfig }) => {
    setStatusConfigs(newConfigs);
  };


  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
  const filteredTasks = useMemo(() => tasks.filter(task => task.projectId === activeProjectId), [tasks, activeProjectId]);

  // Debounced search handler
  const handleSearch = useCallback(async (query: string, tasksToSearch: Task[]) => {
    if (!query || !activeProjectId) {
      setSearchResultIds(null);
      return;
    }

    setIsSearching(true);
    setSearchError('');
    try {
      const results = await geminiService.filterTasksWithAI(query, tasksToSearch);
      setSearchResultIds(results);
    } catch (err: any) {
      setSearchError(err.message || 'An unexpected error occurred.');
      setSearchResultIds([]); // Set to empty array on error
    } finally {
      setIsSearching(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery, filteredTasks);
      } else {
        setSearchResultIds(null);
        setSearchError('');
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, filteredTasks, handleSearch]);

  const displayedTasks = useMemo(() => {
    if (searchResultIds === null) {
        return filteredTasks;
    }
    const idSet = new Set(searchResultIds);
    return filteredTasks.filter(task => idSet.has(task.id));
  }, [filteredTasks, searchResultIds]);
  
  const clearSearch = () => {
      setSearchQuery('');
      setSearchResultIds(null);
      setSearchError('');
  }
  
  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xl text-slate-500 dark:text-slate-400">جاري تحميل مهامك...</p>
            </div>
        </div>
    );
  }

  const SearchBar = () => (
     <div className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <SearchIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input
            type="search"
            placeholder="ابحث عن مهام باللغة الطبيعية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={!activeProjectId}
            className="w-full rounded-lg border border-transparent bg-slate-200 py-2 pr-10 pl-4 text-slate-900 transition-colors focus:border-sky-500 focus:bg-white focus:ring-sky-500 dark:bg-slate-700/50 dark:text-slate-200 dark:focus:bg-slate-800"
            aria-label="Search tasks"
        />
        {searchQuery && (
          <button onClick={clearSearch} className="absolute inset-y-0 left-0 flex items-center pl-3" aria-label="Clear search">
            <CloseIcon className="h-5 w-5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
          </button>
        )}
     </div>
  );

  return (
    <div className="flex h-screen w-full font-sans text-slate-800 dark:text-slate-200">
      <Sidebar 
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onAddProject={addProject}
        onRequestDeleteProject={onRequestDeleteProject}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={`fixed inset-0 bg-black/30 z-40 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="sticky top-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md z-30 p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-4">
             <button onClick={() => setSidebarOpen(true)} className="p-1.5 md:hidden rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Open menu">
                <MenuIcon className="h-6 w-6 text-slate-600 dark:text-slate-300"/>
            </button>
            <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold truncate text-slate-900 dark:text-white" title={activeProject?.name || 'Loading...'}>
                    {activeProject ? activeProject.name : 'تحميل...'}
                </h1>
            </div>
            <div className="hidden md:flex flex-1 max-w-md items-center gap-2">
              <SearchBar />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                  onClick={() => setBriefingModalOpen(true)}
                  disabled={!activeProjectId}
                  className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="عرض الملخص اليومي"
                  title="عرض الملخص اليومي"
              >
                  <BriefingIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
              </button>
              <NotificationBell notifications={notifications} onTaskClick={setEditingTask} />
              <button onClick={() => setSettingsModalOpen(true)} className="hidden md:block p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" aria-label="Open settings">
                <CogIcon className="h-6 w-6"/>
              </button>
              <button 
                onClick={() => setAddTaskModalOpen(true)}
                disabled={!activeProjectId}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-5 w-5"/>
                <span>إضافة مهمة</span>
              </button>
            </div>
          </div>
          <div className="mt-4 md:hidden">
            <SearchBar />
          </div>
          {isSearching && (
             <div className="text-center pt-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري البحث بالذكاء الاصطناعي...</span>
                </div>
            </div>
          )}
           {searchError && <p className="text-center pt-2 text-sm text-red-500 dark:text-red-400">{searchError}</p>}
           {searchResultIds !== null && !isSearching && (
               <div className="text-center pt-2 text-sm text-slate-500 dark:text-slate-400">
                  عرض {displayedTasks.length} من {filteredTasks.length} مهمة.
               </div>
           )}
        </header>
        
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeProjectId ? (
            <KanbanBoard 
              tasks={displayedTasks} 
              onUpdateTaskStatus={updateTaskStatus}
              onTaskClick={setEditingTask}
              statusConfigs={statusConfigs}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-5xl mb-4">📂</div>
                <h2 className="text-2xl font-bold mb-2">لا يوجد مشروع محدد</h2>
                <p className="text-slate-500 dark:text-slate-400">
                    اختر مشروعاً من القائمة أو قم بإنشاء مشروع جديد للبدء.
                </p>
            </div>
          )}
        </div>
      </main>
      
      {isAddTaskModalOpen && (
        <AddTaskModal 
          isOpen={isAddTaskModalOpen}
          onClose={() => setAddTaskModalOpen(false)}
          onAddTask={addTask}
        />
      )}

      {editingTask && (
        <TaskModal 
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentConfigs={statusConfigs}
        onSave={handleSaveStatusConfigs}
        currentTheme={theme}
        onThemeChange={setTheme}
      />
      
      <ConfirmationModal
        isOpen={projectToDelete !== null}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDeleteProject}
        title={`حذف مشروع "${projectToDelete?.name}"`}
        message={
            <>
                <p>هل أنت متأكد من رغبتك في حذف هذا المشروع؟</p>
                <p className="font-bold text-red-600 dark:text-red-400 mt-2">سيتم حذف جميع المهام المرتبطة به بشكل دائم ولا يمكن التراجع عن هذا الإجراء.</p>
            </>
        }
      />

      <DailyBriefingModal 
        isOpen={isBriefingModalOpen}
        onClose={() => setBriefingModalOpen(false)}
        tasks={filteredTasks}
      />
      
      <BottomNavBar 
        onAddTask={() => setAddTaskModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenSidebar={() => setSidebarOpen(true)}
        isAddTaskDisabled={!activeProjectId}
      />
    </div>
  );
};

export default App;
