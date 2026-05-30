// Enhanced toast notifications with undo functionality
import React from 'react';
import { toast as sonnerToast } from 'sonner';
import { Button } from './button';
import { Undo2, CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

interface ToastOptions {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  undo?: () => void;
  duration?: number;
}

export const showSuccessToast = (options: ToastOptions) => {
  sonnerToast.success(options.title, {
    description: options.description,
    duration: options.duration || 3000,
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    action: options.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : options.undo ? {
      label: 'Undo',
      onClick: options.undo,
    } : undefined,
  });
};

export const showErrorToast = (options: ToastOptions) => {
  sonnerToast.error(options.title, {
    description: options.description,
    duration: options.duration || 5000,
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    action: options.action,
  });
};

export const showInfoToast = (options: ToastOptions) => {
  sonnerToast.info(options.title, {
    description: options.description,
    duration: options.duration || 3000,
    icon: <Info className="h-5 w-5 text-blue-600" />,
    action: options.action,
  });
};

export const showWarningToast = (options: ToastOptions) => {
  sonnerToast.warning(options.title, {
    description: options.description,
    duration: options.duration || 4000,
    icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
    action: options.action,
  });
};

export const showLoadingToast = (title: string, promise: Promise<any>) => {
  return sonnerToast.promise(promise, {
    loading: title,
    success: 'Completed successfully',
    error: 'Operation failed',
  });
};
