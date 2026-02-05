import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Database, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ChartMessageProps {
  data: any[];
  query: string;
  chartType?: 'table' | 'bar' | 'line' | 'pie';
}

export const ChartMessage: React.FC<ChartMessageProps> = ({ data, query, chartType = 'table' }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const copyChartData = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: "Chart data copied!",
      description: "Paste this in your custom dashboard to create a chart",
      duration: 3000,
    });
  };

  return (
    <div className="my-3">
      {/* Compact Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          {/* Left Side - Info */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">Query Result</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {data.length} rows
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Ready to add to your custom dashboard
              </p>
            </div>
          </div>
          
          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={copyChartData}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy for Dashboard
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 hover:text-gray-900 hover:bg-white/50"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Expandable Preview */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="bg-white rounded-md p-3 max-h-64 overflow-auto border border-gray-200 shadow-sm">
              <pre className="text-xs font-mono text-gray-800">
                {JSON.stringify(data.slice(0, 10), null, 2)}
                {data.length > 10 && (
                  <span className="text-gray-500">
                    {'\n'}... and {data.length - 10} more rows
                  </span>
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Export button component for existing charts
export const ExportChartButton: React.FC<{ data: any[]; title: string }> = ({ data, title }) => {
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: "Chart data exported!",
      description: "Now paste it in your custom dashboard",
      duration: 3000,
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleExport}
      className="gap-2"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Export to Dashboard
        </>
      )}
    </Button>
  );
};