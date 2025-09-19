export enum Priority {
  Low = 'منخفض',
  Medium = 'متوسط',
  High = 'عالي',
}

export enum Status {
  ToDo = 'المهام',
  InProgress = 'قيد التنفيذ',
  Done = 'مكتمل',
}

export interface StatusConfig {
  color: string;
  icon: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate?: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
}

export type Theme = 'light' | 'dark' | 'high-contrast';