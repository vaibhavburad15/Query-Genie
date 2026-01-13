// src/components/dashboard/TipNotification.tsx
import React from 'react';
import { X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TipNotificationProps {
  tip: {
    id?: number;
    title: string;
    content: string;
    category: string;
    icon?: string;
  };
  onClose: () => void;
}

const TipNotification: React.FC<TipNotificationProps> = ({ tip, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 w-96 bg-white border-2 border-green-500 rounded-lg shadow-lg p-4 animate-in slide-in-from-right duration-300">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Lightbulb className="h-5 w-5 text-green-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">{tip.title}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-600 leading-relaxed">{tip.content}</p>
          
          <div className="mt-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              {tip.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipNotification;