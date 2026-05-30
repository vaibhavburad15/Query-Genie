// Progress indicator for AJAX operations
import React from 'react';
import { Progress } from './progress';
import { Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  value?: number;
  label?: string;
  showPercentage?: boolean;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value = 0,
  label,
  showPercentage = true,
  indeterminate = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  if (indeterminate) {
    return (
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        {label && <span className="text-sm text-gray-600">{label}</span>}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-gray-600">{label}</span>}
          {showPercentage && (
            <span className="font-medium text-gray-900">{Math.round(value)}%</span>
          )}
        </div>
      )}
      <Progress value={value} className={sizeClasses[size]} />
    </div>
  );
};

// Streaming progress for large data loads
export const StreamingProgress: React.FC<{
  loaded: number;
  total: number;
  label?: string;
}> = ({ loaded, total, label }) => {
  const percentage = total > 0 ? (loaded / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label || 'Loading data...'}</span>
        <span className="font-medium text-gray-900">
          {loaded.toLocaleString()} / {total.toLocaleString()} rows
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};
