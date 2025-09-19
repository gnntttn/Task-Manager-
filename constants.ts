
import { Status, Priority, StatusConfig } from './types';
import { CircleIcon, InProgressIcon, CheckCircleIcon, SquareIcon, PlayIcon } from './components/icons/StatusIcons';
import React from 'react';

export const STATUSES: Status[] = [Status.ToDo, Status.InProgress, Status.Done];

export const PRIORITIES: Priority[] = [Priority.Low, Priority.Medium, Priority.High];

export const PRIORITY_COLORS: { [key in Priority]: string } = {
  [Priority.High]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  [Priority.Medium]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [Priority.Low]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

export const DEFAULT_STATUS_CONFIGS: { [key in Status]: StatusConfig } = {
    [Status.ToDo]: { color: '#9CA3AF', icon: 'Circle' },       // gray-400
    [Status.InProgress]: { color: '#3B82F6', icon: 'InProgress' }, // blue-500
    [Status.Done]: { color: '#22C55E', icon: 'CheckCircle' },       // green-500
}

export const AVAILABLE_ICONS: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    'Circle': CircleIcon,
    'InProgress': InProgressIcon,
    'CheckCircle': CheckCircleIcon,
    'Square': SquareIcon,
    'Play': PlayIcon,
};
