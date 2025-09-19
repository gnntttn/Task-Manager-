import React, { useState, useEffect, useRef } from 'react';
import { Status, Priority } from '../types';
import type { Task } from '../types';
import { PRIORITIES } from '../constants';
import { parseTaskFromNaturalLanguage } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { CloseIcon } from './icons/CloseIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

// FIX: Add types for Web Speech API which are not standard in TS
// This allows using window.SpeechRecognition and window.webkitSpeechRecognition
interface SpeechRecognition {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAddTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.Medium);
  const [dueDate, setDueDate] = useState('');
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [microphonePermission, setMicrophonePermission] = useState<PermissionState>('prompt');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (navigator.permissions) {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
            setMicrophonePermission(permissionStatus.state);
            permissionStatus.onchange = () => {
                setMicrophonePermission(permissionStatus.state);
            };
        }).catch(() => {
            // If query fails, assume we can prompt.
            setMicrophonePermission('prompt');
        });
    }
  }, [isOpen]);

  useEffect(() => {
    // Check for browser support and initialize SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'ar-SA';
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAiPrompt(transcript);
        // Automatically trigger parsing after a short delay
        setTimeout(() => handleAiParse(transcript), 100);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            setError('تم رفض إذن استخدام الميكروفون. يرجى السماح بالوصول في إعدادات المتصفح.');
        } else {
            setError('حدث خطأ أثناء التعرف على الصوت.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleAiParse = async (promptText?: string) => {
    const textToParse = promptText || aiPrompt;
    if (!textToParse.trim()) return;
    setIsParsing(true);
    setError('');
    try {
        const parsedTask = await parseTaskFromNaturalLanguage(textToParse);
        if (parsedTask.title) setTitle(parsedTask.title);
        if (parsedTask.description) setDescription(parsedTask.description);
        if (parsedTask.priority) setPriority(parsedTask.priority);
        if (parsedTask.dueDate) setDueDate(parsedTask.dueDate);
        setAiPrompt('');
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
    } finally {
        setIsParsing(false);
    }
  };
  
  const handleListen = () => {
    if (microphonePermission === 'denied') {
        setError('تم حظر الوصول إلى الميكروفون. يرجى تفعيله من إعدادات الموقع في متصفحك.');
        return;
    }

    if (!recognitionRef.current) {
        setError("ميزة التعرف على الصوت غير مدعومة في هذا المتصفح.");
        return;
    }
    if (isListening) {
        recognitionRef.current.stop();
    } else {
        recognitionRef.current.start();
        setIsListening(true);
        setError('');
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({
      title,
      description,
      status: Status.ToDo,
      priority,
      dueDate,
    });
    // Reset form is handled by useEffect on isOpen change
  };
  
  // Reset state when modal is closed to avoid showing stale data
  useEffect(() => {
    if (!isOpen) {
        setTitle('');
        setDescription('');
        setPriority(Priority.Medium);
        setDueDate('');
        setAiPrompt('');
        setError('');
        setIsParsing(false);
        setIsListening(false);
    }
  }, [isOpen]);


  if (!isOpen) return null;

  const getMicrophoneButtonTitle = () => {
    if (microphonePermission === 'denied') return 'تم حظر الوصول إلى الميكروفون';
    if (isListening) return 'إيقاف الاستماع';
    return 'إضافة مهمة بالصوت';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إضافة مهمة جديدة</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <CloseIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6 p-4 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 rounded-lg">
             <label htmlFor="ai-prompt" className="flex items-center gap-2 text-sm font-semibold text-sky-800 dark:text-sky-200 mb-2">
              <SparklesIcon className="h-5 w-5" />
              <span>إنشاء مهمة بالذكاء الاصطناعي</span>
            </label>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                اكتب أو استخدم الميكروفون لإنشاء مهمة. مثال: "مراجعة تصميمات التطبيق غداً".
            </p>
            <div className="flex gap-2">
                <input
                id="ai-prompt"
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="اكتب طلبك أو استخدم الإدخال الصوتي..."
                className="flex-1 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                disabled={isParsing || isListening}
                />
                 <button
                    type="button"
                    onClick={handleListen}
                    disabled={isParsing || microphonePermission === 'denied'}
                    className={`p-2.5 rounded-md transition-colors flex items-center justify-center ${
                        isListening
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
                    } ${microphonePermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label={getMicrophoneButtonTitle()}
                    title={getMicrophoneButtonTitle()}
                >
                    <MicrophoneIcon className="h-5 w-5" />
                </button>
                <button
                onClick={() => handleAiParse()}
                disabled={isParsing || isListening || !aiPrompt.trim()}
                className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-sky-300 dark:disabled:bg-sky-800 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                >
                {isParsing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : 'إنشاء'}
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العنوان</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الوصف</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الأولوية</label>
                    <select
                        id="priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Priority)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاريخ الاستحقاق</label>
                    <input
                        type="date"
                        id="dueDate"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>
            </div>
             <footer className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                إلغاء
              </button>
              <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
                إضافة المهمة
              </button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;