import React, { useState, useRef } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  Download,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

interface ChartVisualizationProps {
  data: string[][];
  columns: string[];
}

type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter';

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#6366f1',
  '#f97316',
  '#14b8a6',
  '#a855f7',
];

const ChartVisualization: React.FC<ChartVisualizationProps> = ({
  data,
  columns,
}) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Detect chart compatibility
  const detectChartCompatibility = () => {
    if (data.length === 0 || columns.length < 2) return null;

    const hasNumericColumn = data.some((row) =>
      row.some((cell) => !isNaN(parseFloat(cell)) && isFinite(parseFloat(cell)))
    );

    return hasNumericColumn;
  };

  // Transform data for Recharts format
  const transformData = () => {
    if (!data || data.length === 0) return [];

    return data.map((row, index) => {
      const obj: any = {};
      columns.forEach((col, colIndex) => {
        const value = row[colIndex];
        const numValue = parseFloat(value);

        // Keep original value for labels, numeric for calculations
        obj[col] = !isNaN(numValue) ? numValue : value;
        obj[`${col}_label`] = value; // Original value for display
      });
      obj.index = index;
      return obj;
    });
  };

  // Get numeric columns
  const getNumericColumns = () => {
    return columns.filter((_, colIndex) => {
      return data.every((row) => {
        const value = parseFloat(row[colIndex]);
        return !isNaN(value);
      });
    });
  };

  // Get categorical column (usually first non-numeric)
  const getCategoryColumn = () => {
    const numericCols = getNumericColumns();
    return columns.find((col) => !numericCols.includes(col)) || columns[0];
  };

  const chartData = transformData();
  const categoryColumn = getCategoryColumn();
  const numericColumns = getNumericColumns();
  const isChartCompatible = detectChartCompatibility();

  // ✅ FIXED: Export chart as PNG
  const exportChart = async () => {
    if (!chartContainerRef.current) return;

    setIsExporting(true);
    try {
      // Wait a bit for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(chartContainerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `chart-${chartType}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: "✅ Chart Exported",
            description: "Chart has been downloaded as PNG",
          });
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "❌ Export Failed",
        description: "Could not export chart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // ✅ FIXED: Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // ✅ FIXED: Close fullscreen with Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  if (!isChartCompatible) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Chart not available</p>
          <p className="text-sm">
            This data doesn't contain numeric values suitable for visualization
          </p>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey={categoryColumn}
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#ccc' }}
            />
            <YAxis tick={{ fill: '#666' }} tickLine={{ stroke: '#ccc' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
            {numericColumns.map((col, index) => (
              <Bar
                key={col}
                dataKey={col}
                fill={COLORS[index % COLORS.length]}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey={categoryColumn}
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#ccc' }}
            />
            <YAxis tick={{ fill: '#666' }} tickLine={{ stroke: '#ccc' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
            {numericColumns.map((col, index) => (
              <Line
                key={col}
                type="monotone"
                dataKey={col}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'pie': {
        const pieData = chartData.map((item) => ({
          name: item[categoryColumn],
          value: item[numericColumns[0]],
        }));

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      }

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey={categoryColumn}
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#ccc' }}
            />
            <YAxis tick={{ fill: '#666' }} tickLine={{ stroke: '#ccc' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
            {numericColumns.map((col, index) => (
              <Area
                key={col}
                type="monotone"
                dataKey={col}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              dataKey={numericColumns[0]}
              name={numericColumns[0]}
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#ccc' }}
            />
            <YAxis
              type="number"
              dataKey={numericColumns[1] || numericColumns[0]}
              name={numericColumns[1] || numericColumns[0]}
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#ccc' }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
            <Scatter name={categoryColumn} data={chartData} fill={COLORS[0]} />
          </ScatterChart>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Chart Type Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              📊 Interactive Chart
            </Badge>
            <Badge variant="outline" className="text-sm">
              {data.length} data points
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-gray-200 rounded-md p-1">
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="h-8 px-3"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className="h-8 px-3"
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'pie' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('pie')}
                className="h-8 px-3"
              >
                <PieChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('area')}
                className="h-8 px-3"
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportChart}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-1" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>

        {/* Chart Container */}
        <div
          ref={chartContainerRef}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <ResponsiveContainer width="100%" height={400}>
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ✅ FIXED: Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  📊 {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {data.length} data points
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {/* Chart type selector in fullscreen */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-md p-1">
                  <Button
                    variant={chartType === 'bar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChartType('bar')}
                    className="h-8 px-3"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={chartType === 'line' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChartType('line')}
                    className="h-8 px-3"
                  >
                    <LineChartIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={chartType === 'pie' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChartType('pie')}
                    className="h-8 px-3"
                  >
                    <PieChartIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={chartType === 'area' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChartType('area')}
                    className="h-8 px-3"
                  >
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportChart}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Chart Content */}
            <div className="flex-1 p-6 overflow-auto">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChartVisualization;
