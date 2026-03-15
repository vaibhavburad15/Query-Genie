// ✅ ENHANCED: Custom Dashboard with Advanced Features - FIXED CHART RENDERING
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as DashboardAPI from '@/services/dashboardApi';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit,
  Copy,
  MoreVertical,
  GripVertical,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Save,
  Palette,
  AlertCircle,
  Search,
  Filter,
  Grid3x3,
  Layout,
  Image as ImageIcon,
  TrendingUp,
  Calendar,
  Eye,
  Sparkles,
  AreaChart as AreaChartIcon,
  ScatterChart as ScatterChartIcon,
  Maximize2,
  Minimize2,
  FileJson,
  Clock,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import html2canvas from 'html2canvas';

// ==================== TYPES ====================
type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'map' | 'card' | 'table';
type ChartSize = 'small' | 'medium' | 'large' | 'full';
type GridLayout = '1' | '2' | '3';

interface CalculatedField {
  name: string;
  expression: string;
}

interface DashboardBookmark {
  id: string;
  name: string;
  layout: GridLayout;
  searchQuery: string;
  slicerColumn: string;
  slicerValue: string;
  createdAt: string;
}

interface ChartData {
  id: string;
  title: string;
  type: ChartType;
  size?: ChartSize;
  data: any[];
  config: {
    xKey?: string;
    yKey?: string;
    dataKey?: string;
    nameKey?: string;
    colors?: string[];
    calculatedFields?: CalculatedField[];
  };
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  charts: ChartData[];
  layout: GridLayout;
  bookmarks?: DashboardBookmark[];
  isPublished?: boolean;
  shareSlug?: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  chartTitle?: string;
  timestamp: string;
}

// ==================== CONSTANTS ====================
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#6366f1'];

const COLOR_PRESETS = {
  default: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#6366f1'],
  blues: ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'],
  greens: ['#065f46', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  purples: ['#5b21b6', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff'],
  reds: ['#991b1b', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2'],
  warm: ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#7c3aed'],
  cool: ['#06b6d4', '#0891b2', '#0284c7', '#0369a1', '#075985', '#0c4a6e', '#082f49', '#0a1929'],
  pastel: ['#fbbf24', '#a3e635', '#34d399', '#22d3ee', '#818cf8', '#c084fc', '#f472b6', '#fb923c'],
  vibrant: ['#dc2626', '#ea580c', '#f59e0b', '#84cc16', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'],
  monochrome: ['#000000', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#e5e5e5', '#f5f5f5', '#ffffff']
};

const DATA_TEMPLATES = {
  sales: [
    { month: 'Jan', revenue: 4000, expenses: 2400 },
    { month: 'Feb', revenue: 3000, expenses: 1398 },
    { month: 'Mar', revenue: 2000, expenses: 9800 },
    { month: 'Apr', revenue: 2780, expenses: 3908 },
    { month: 'May', revenue: 1890, expenses: 4800 },
    { month: 'Jun', revenue: 2390, expenses: 3800 }
  ],
  users: [
    { category: 'Active', count: 400 },
    { category: 'Inactive', count: 300 },
    { category: 'New', count: 200 },
    { category: 'Churned', count: 100 }
  ],
  performance: [
    { metric: 'Speed', score: 85 },
    { metric: 'Quality', score: 92 },
    { metric: 'Efficiency', score: 78 },
    { metric: 'Satisfaction', score: 95 }
  ]
};

// ✅ FIXED: Dynamic chart sizes based on data length
const CHART_SIZE_CONFIG = {
  small: { height: 300, cols: 1 },
  medium: { height: 400, cols: 1 },
  large: { height: 500, cols: 2 },
  full: { height: 600, cols: 12 }
};

// ==================== UTILITY FUNCTIONS ====================
const getStorageKey = (userId: number | undefined): string => {
  const userIdStr = userId || 'guest';
  return `custom_dashboards_v2_${userIdStr}`;
};

const getActivityLogKey = (userId: number | undefined): string => {
  const userIdStr = userId || 'guest';
  return `dashboard_activity_${userIdStr}`;
};

const saveToLocalStorage = (key: string, data: any): boolean => {
  try {
    const jsonString = JSON.stringify(data);
    localStorage.setItem(key, jsonString);
    console.log(`✅ Saved to localStorage: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
    return false;
  }
};

const loadFromLocalStorage = (key: string): any | null => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('❌ Error loading from localStorage:', error);
    return null;
  }
};

const normalizeChartData = (data: any[]): any[] => {
  if (!data || data.length === 0) return [];
  if (data.every(item => typeof item === 'object' && !Array.isArray(item))) {
    return data;
  }
  if (Array.isArray(data[0])) {
    return data.map(row => ({
      name: String(row[0] || ''),
      value: Number(row[1] || 0)
    }));
  }
  return data;
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
};

const parseCsvText = (csvText: string): any[] => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV file must include a header and at least one data row');
  }

  const headers = parseCsvLine(lines[0]);
  if (headers.some((header) => !header)) {
    throw new Error('CSV header contains empty column names');
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, any> = {};

    headers.forEach((header, index) => {
      const raw = values[index] ?? '';
      const numeric = Number(raw);
      row[header] = raw !== '' && !Number.isNaN(numeric) ? numeric : raw;
    });

    return row;
  });
};

const safeEvaluateExpression = (expression: string, row: Record<string, any>): number | string => {
  try {
    const sanitized = expression.replace(/[^a-zA-Z0-9_+\-*/().\s]/g, '');
    const evaluator = new Function('row', `with (row) { return ${sanitized}; }`);
    const value = evaluator(row);
    return typeof value === 'number' && Number.isFinite(value) ? value : value ?? '';
  } catch {
    return '';
  }
};

const applyCalculatedFields = (data: any[], fields: CalculatedField[]): any[] => {
  if (!fields.length) return data;

  return data.map((item) => {
    const next = { ...item };
    fields.forEach((field) => {
      if (!field.name.trim() || !field.expression.trim()) return;
      next[field.name.trim()] = safeEvaluateExpression(field.expression, next);
    });
    return next;
  });
};

const applySlicer = (data: any[], column: string, value: string): any[] => {
  if (!column || !value) return data;
  return data.filter((row) => String(row[column] ?? '').toLowerCase() === value.toLowerCase());
};

const detectDataKeys = (data: any[]): { xKey: string; yKey: string } => {
  if (!data || data.length === 0) return { xKey: 'name', yKey: 'value' };
  const firstItem = data[0];
  const keys = Object.keys(firstItem);
  
  const nameKey = keys.find(k => 
    k.toLowerCase().includes('name') ||
    k.toLowerCase().includes('label') ||
    k.toLowerCase().includes('category') ||
    k.toLowerCase().includes('month') ||
    k.toLowerCase().includes('date') ||
    k.toLowerCase().includes('product')
  ) || keys[0];
  
  const valueKey = keys.find(k => 
    k.toLowerCase().includes('value') ||
    k.toLowerCase().includes('amount') ||
    k.toLowerCase().includes('total') ||
    k.toLowerCase().includes('count') ||
    k.toLowerCase().includes('price') ||
    k.toLowerCase().includes('stock') ||
    !isNaN(Number(firstItem[k]))
  ) || keys[1] || keys[0];
  
  return { xKey: nameKey, yKey: valueKey };
};

const validateChartData = (data: string): { valid: boolean; error?: string; parsed?: any[] } => {
  try {
    if (!data.trim()) {
      return { valid: false, error: 'Data cannot be empty' };
    }
    
    const parsed = JSON.parse(data);
    
    if (!Array.isArray(parsed)) {
      return { valid: false, error: 'Data must be an array' };
    }
    
    if (parsed.length === 0) {
      return { valid: false, error: 'Array cannot be empty' };
    }
    
    if (parsed.length > 1000) {
      return { valid: false, error: 'Too many data points (max 1000)' };
    }
    
    const normalized = normalizeChartData(parsed);
    return { valid: true, parsed: normalized };
    
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format' };
  }
};

// ✅ FIXED: Custom tick formatter to handle long labels
const CustomXAxisTick = ({ x, y, payload, dataLength }: any) => {
  const maxLength = dataLength > 20 ? 8 : dataLength > 10 ? 12 : 20;
  const text = String(payload.value);
  const truncated = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} 
        y={0} 
        dy={16} 
        textAnchor="end" 
        fill="#6b7280" 
        transform="rotate(-45)"
        fontSize={dataLength > 20 ? 9 : 11}
      >
        {truncated}
      </text>
    </g>
  );
};

// ==================== COMPONENTS ====================

// Color Picker Component
const ColorPicker = ({ 
  selectedColors, 
  onColorsChange 
}: { 
  selectedColors: string[]; 
  onColorsChange: (colors: string[]) => void 
}) => {
  const [activePreset, setActivePreset] = useState<string>('default');

  const handlePresetSelect = (presetName: string) => {
    setActivePreset(presetName);
    onColorsChange(COLOR_PRESETS[presetName as keyof typeof COLOR_PRESETS]);
  };

  const handleCustomColorChange = (index: number, color: string) => {
    const newColors = [...selectedColors];
    newColors[index] = color;
    onColorsChange(newColors);
    setActivePreset('custom');
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Color Themes
        </Label>
        <ScrollArea className="h-48">
          <div className="grid grid-cols-2 gap-2 pr-4">
            {Object.entries(COLOR_PRESETS).map(([name, colors]) => (
              <button
                key={name}
                onClick={() => handlePresetSelect(name)}
                className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                  activePreset === name 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium capitalize">{name}</span>
                  {activePreset === name && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </div>
                <div className="flex gap-1">
                  {colors.slice(0, 6).map((color, idx) => (
                    <div
                      key={idx}
                      className="h-6 flex-1 rounded shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">
          Custom Colors {activePreset === 'custom' && <span className="text-blue-600">(Active)</span>}
        </Label>
        <div className="grid grid-cols-4 gap-3">
          {selectedColors.slice(0, 8).map((color, index) => (
            <div key={index} className="space-y-1">
              <div className="relative group">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleCustomColorChange(index, e.target.value)}
                  className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-blue-400 transition-colors"
                />
                <div 
                  className="absolute inset-2 rounded pointer-events-none border border-white/20"
                  style={{ backgroundColor: color }}
                />
              </div>
              <p className="text-xs text-center text-gray-500 font-mono">
                {color.slice(0, 7).toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ✅ FIXED: Chart Preview Component with proper rendering for large datasets
const ChartPreview = ({ 
  chartType, 
  chartData, 
  chartColors, 
  size = 'small' 
}: { 
  chartType: ChartType; 
  chartData: any[]; 
  chartColors: string[];
  size?: ChartSize;
}) => {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed">
        <p className="text-sm text-muted-foreground">No data to preview</p>
      </div>
    );
  }

  const normalizedData = normalizeChartData(chartData);
  const { xKey, yKey } = detectDataKeys(normalizedData);
  const dataLength = normalizedData.length;
  
  // ✅ FIXED: Dynamic height based on data size
  const baseHeight = size === 'small' ? 250 : size === 'medium' ? 300 : 350;
  const height = dataLength > 20 ? baseHeight + 50 : baseHeight;

  // ✅ FIXED: Dynamic margins for large datasets
  const chartMargin = dataLength > 15 
    ? { top: 5, right: 30, left: 20, bottom: 80 }
    : { top: 5, right: 30, left: 20, bottom: 50 };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={normalizedData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={xKey} 
                stroke="#6b7280" 
                angle={dataLength > 10 ? -45 : 0}
                textAnchor={dataLength > 10 ? "end" : "middle"}
                height={dataLength > 10 ? 80 : 30}
                interval={0}
                tick={{ fontSize: dataLength > 20 ? 9 : 11 }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey={yKey} 
                stroke={chartColors[0]} 
                strokeWidth={2}
                dot={dataLength < 30}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={normalizedData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={xKey} 
                stroke="#6b7280" 
                angle={dataLength > 10 ? -45 : 0}
                textAnchor={dataLength > 10 ? "end" : "middle"}
                height={dataLength > 10 ? 80 : 30}
                interval={0}
                tick={{ fontSize: dataLength > 20 ? 9 : 11 }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
              <Tooltip />
              <Bar dataKey={yKey} fill={chartColors[0]} radius={[6, 6, 0, 0]}>
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={normalizedData}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={Math.min(height / 3, 100)}
                label={dataLength < 15}
              >
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              {dataLength < 15 && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={normalizedData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={xKey} 
                stroke="#6b7280" 
                angle={dataLength > 10 ? -45 : 0}
                textAnchor={dataLength > 10 ? "end" : "middle"}
                height={dataLength > 10 ? 80 : 30}
                interval={0}
                tick={{ fontSize: dataLength > 20 ? 9 : 11 }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey={yKey} 
                stroke={chartColors[0]} 
                fill={chartColors[0]} 
                fillOpacity={0.6} 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={xKey} 
                stroke="#6b7280" 
                angle={dataLength > 10 ? -45 : 0}
                textAnchor={dataLength > 10 ? "end" : "middle"}
                height={dataLength > 10 ? 80 : 30}
                tick={{ fontSize: dataLength > 20 ? 9 : 11 }}
              />
              <YAxis dataKey={yKey} stroke="#6b7280" style={{ fontSize: '11px' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={normalizedData} fill={chartColors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'map': {
        const latKey = Object.keys(normalizedData[0] || {}).find((key) => ['lat', 'latitude', 'y'].includes(key.toLowerCase())) || yKey;
        const lngKey = Object.keys(normalizedData[0] || {}).find((key) => ['lng', 'lon', 'long', 'longitude', 'x'].includes(key.toLowerCase())) || xKey;
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={lngKey} stroke="#6b7280" name="Longitude" />
              <YAxis dataKey={latKey} stroke="#6b7280" name="Latitude" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={normalizedData} fill={chartColors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      }

      case 'card': {
        const values = normalizedData
          .map((row) => Number(row[yKey]))
          .filter((value) => Number.isFinite(value));
        const total = values.reduce((sum, value) => sum + value, 0);
        const average = values.length ? total / values.length : 0;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-3xl font-bold" style={{ color: chartColors[0] }}>{total.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="text-3xl font-bold" style={{ color: chartColors[1] || chartColors[0] }}>{average.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        );
      }

      case 'table': {
        const columns = Object.keys(normalizedData[0] || {});
        return (
          <div className="max-h-[320px] overflow-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="text-left p-2 font-medium">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalizedData.slice(0, 50).map((row, index) => (
                  <tr key={index} className="border-t">
                    {columns.map((column) => (
                      <td key={`${index}-${column}`} className="p-2">{String(row[column] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">Live Preview</span>
        {dataLength > 15 && (
          <Badge variant="outline" className="text-xs">
            {dataLength} data points
          </Badge>
        )}
      </div>
      {renderChart()}
    </div>
  );
};

// ✅ FIXED: Sortable Chart Card with proper rendering
const SortableChartCard = ({ 
  chart, 
  onEdit, 
  onDelete, 
  onCopy,
  onExport,
  onDrill,
  gridLayout
}: { 
  chart: ChartData; 
  onEdit: (chart: ChartData) => void; 
  onDelete: (id: string) => void; 
  onCopy: (chart: ChartData) => void;
  onExport: (chart: ChartData) => void;
  onDrill: (chart: ChartData) => void;
  gridLayout: GridLayout;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chart.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderChart = () => {
    if (!chart.data || chart.data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground bg-gray-50 rounded-lg border-2 border-dashed">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 mb-2 text-gray-400" />
            <p>No data available</p>
          </div>
        </div>
      );
    }

    const normalizedData = normalizeChartData(chart.data);
    const { xKey, yKey } = detectDataKeys(normalizedData);
    const chartColors = chart.config.colors || COLORS;
    const dataLength = normalizedData.length;
    
    // ✅ FIXED: Dynamic height and margins based on data size and chart size
    const baseHeight = CHART_SIZE_CONFIG[chart.size || 'medium'].height;
    const height = dataLength > 20 ? baseHeight + 80 : baseHeight;
    
    const chartMargin = dataLength > 15 
      ? { top: 5, right: 30, left: 20, bottom: 100 }
      : { top: 5, right: 30, left: 20, bottom: 60 };

    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={normalizedData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={chart.config.xKey || xKey} 
                stroke="#6b7280" 
                angle={dataLength > 10 ? -45 : 0}
                textAnchor={dataLength > 10 ? "end" : "middle"}
                height={dataLength > 10 ? 90 : 30}
                interval={0}
                tick={{ fontSize: dataLength > 20 ? 9 : 11 }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line 
                type="monotone" 
                dataKey={chart.config.yKey || yKey} 
                stroke={chartColors[0]} 
                strokeWidth={2} 
                dot={dataLength < 30 ? { fill: chartColors[0], r: 4 } : false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={normalizedData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={chart.config.xKey || xKey} 
                stroke="#6b7280" 
                angle={dataLength > 10 ? -45 : 0}
                textAnchor={dataLength > 10 ? "end" : "middle"}
                height={dataLength > 10 ? 90 : 30}
                interval={0}
                tick={{ fontSize: dataLength > 20 ? 9 : 11 }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey={chart.config.yKey || yKey} fill={chartColors[0]} radius={[8, 8, 0, 0]}>
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={normalizedData}
                dataKey={chart.config.dataKey || chart.config.yKey || yKey}
                nameKey={chart.config.nameKey || chart.config.xKey || xKey}
                cx="50%"
                cy="50%"
                outerRadius={Math.min(height / 3.5, 120)}
                label={dataLength < 15 ? (entry) => entry[chart.config.nameKey || chart.config.xKey || xKey] : false}
              >
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              {dataLength < 15 && <Legend wrapperStyle={{ paddingTop: '10px' }} />}
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={normalizedData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={chart.config.xKey || xKey} 
                stroke="#6b7280" 
                angle={dataLength > 10 ? -45 : 0}
                textAnchor={dataLength > 10 ? "end" : "middle"}
                height={dataLength > 10 ? 90 : 30}
                interval={0}
                tick={{ fontSize: dataLength > 20 ? 9 : 11 }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area 
                type="monotone" 
                dataKey={chart.config.yKey || yKey} 
                stroke={chartColors[0]} 
                fill={chartColors[0]} 
                fillOpacity={0.6} 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={chart.config.xKey || xKey} 
                stroke="#6b7280" 
                angle={dataLength > 10 ? -45 : 0}
                textAnchor={dataLength > 10 ? "end" : "middle"}
                height={dataLength > 10 ? 90 : 30}
                tick={{ fontSize: dataLength > 20 ? 9 : 11 }}
              />
              <YAxis dataKey={chart.config.yKey || yKey} stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Scatter data={normalizedData} fill={chartColors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'map': {
        const latKey = Object.keys(normalizedData[0] || {}).find((key) => ['lat', 'latitude', 'y'].includes(key.toLowerCase())) || yKey;
        const lngKey = Object.keys(normalizedData[0] || {}).find((key) => ['lng', 'lon', 'long', 'longitude', 'x'].includes(key.toLowerCase())) || xKey;
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={lngKey} stroke="#6b7280" name="Longitude" />
              <YAxis dataKey={latKey} stroke="#6b7280" name="Latitude" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Scatter data={normalizedData} fill={chartColors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      }

      case 'card': {
        const values = normalizedData
          .map((row) => Number(row[chart.config.yKey || yKey]))
          .filter((value) => Number.isFinite(value));
        const total = values.reduce((sum, value) => sum + value, 0);
        const average = values.length ? total / values.length : 0;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-3xl font-bold" style={{ color: chartColors[0] }}>{total.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="text-3xl font-bold" style={{ color: chartColors[1] || chartColors[0] }}>{average.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        );
      }

      case 'table': {
        const columns = Object.keys(normalizedData[0] || {});
        return (
          <div className="max-h-[420px] overflow-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="text-left p-2 font-medium">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalizedData.slice(0, 100).map((row, index) => (
                  <tr key={index} className="border-t">
                    {columns.map((column) => (
                      <td key={`${index}-${column}`} className="p-2">{String(row[column] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      
      default:
        return null;
    }
  };

  const getGridColSpan = () => {
    const size = chart.size || 'medium';
    if (size === 'full') return 'col-span-full';
    if (size === 'large' && gridLayout !== '1') return gridLayout === '3' ? 'col-span-2' : 'col-span-2';
    return 'col-span-1';
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${getGridColSpan()}`} id={`chart-${chart.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:bg-gray-200 rounded p-1 transition-colors">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-semibold flex items-center gap-2 flex-wrap">
                  {chart.title}
                  <Badge variant="outline" className="text-xs">
                    {chart.type}
                  </Badge>
                  {chart.data.length > 15 && (
                    <Badge variant="secondary" className="text-xs">
                      {chart.data.length} items
                    </Badge>
                  )}
                </CardTitle>
                {chart.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{chart.notes}</p>
                )}
                {chart.updatedAt && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(chart.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(chart)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Chart
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy(chart)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(chart)}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Export as Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDrill(chart)}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Drill Through
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(chart.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {renderChart()}
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard Stats Component
const DashboardStats = ({ dashboard }: { dashboard: Dashboard }) => {
  const stats = useMemo(() => {
    const totalCharts = dashboard.charts.length;
    const chartTypes = dashboard.charts.reduce((acc, chart) => {
      acc[chart.type] = (acc[chart.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: totalCharts,
      types: chartTypes,
      lastUpdated: new Date(dashboard.updatedAt).toLocaleDateString()
    };
  }, [dashboard]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Charts</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{Object.keys(stats.types).length}</p>
            <p className="text-xs text-muted-foreground">Chart Types</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-sm font-semibold">{stats.lastUpdated}</p>
            <p className="text-xs text-muted-foreground">Last Updated</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Layout className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold">{dashboard.layout}</p>
            <p className="text-xs text-muted-foreground">Column Layout</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const CustomDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddChartDialogOpen, setIsAddChartDialogOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartData | null>(null);
  const [deleteChartId, setDeleteChartId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [slicerColumn, setSlicerColumn] = useState('');
  const [slicerValue, setSlicerValue] = useState('');
  const [bookmarkName, setBookmarkName] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [drillChart, setDrillChart] = useState<ChartData | null>(null);
  const [calculatedFields, setCalculatedFields] = useState<CalculatedField[]>([]);
  const [calcName, setCalcName] = useState('');
  const [calcExpression, setCalcExpression] = useState('');

  // Form states
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [chartTitle, setChartTitle] = useState('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartSize, setChartSize] = useState<ChartSize>('medium');
  const [chartData, setChartData] = useState('');
  const [chartNotes, setChartNotes] = useState('');
  const [chartColors, setChartColors] = useState<string[]>(COLORS);
  
  // Data validation
  const dataValidation = useMemo(() => validateChartData(chartData), [chartData]);

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ==================== LIFECYCLE ====================
  useEffect(() => {
    loadDashboards();
    loadActivityLog();
  }, [user]);

  useEffect(() => {
    if (currentDashboard) {
      saveDashboards();
    }
  }, [currentDashboard]);

  // ==================== STORAGE FUNCTIONS ====================
  const loadDashboards = () => {
    try {
      setIsLoading(true);
      const key = getStorageKey(user?.id);
      const stored = loadFromLocalStorage(key);
      const sharedSlug = new URLSearchParams(window.location.search).get('share');
      
      if (stored && Array.isArray(stored)) {
        const hydrated = stored.map((dashboard: Dashboard) => ({
          ...dashboard,
          bookmarks: dashboard.bookmarks || []
        }));
        setDashboards(hydrated);
        if (hydrated.length > 0 && !currentDashboard) {
          const sharedDashboard = sharedSlug
            ? hydrated.find((dashboard: Dashboard) => dashboard.isPublished && dashboard.shareSlug === sharedSlug)
            : null;
          setCurrentDashboard(sharedDashboard || hydrated[0]);
        }
      } else {
        // Initialize with a default dashboard
        const defaultDashboard: Dashboard = {
          id: crypto.randomUUID(),
          name: 'My First Dashboard',
          description: 'Welcome! Create your first chart to get started.',
          charts: [],
          layout: '2',
          bookmarks: [],
          isPublished: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setDashboards([defaultDashboard]);
        setCurrentDashboard(defaultDashboard);
        saveToLocalStorage(key, [defaultDashboard]);
      }
      setStorageError(null);
    } catch (error) {
      console.error('Error loading dashboards:', error);
      setStorageError('Failed to load dashboards from storage');
      toast({
        title: "Error",
        description: "Failed to load your dashboards",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveDashboards = () => {
    try {
      const key = getStorageKey(user?.id);
      const updated = dashboards.map(d => 
        d.id === currentDashboard?.id ? currentDashboard : d
      );
      
      if (!updated.find(d => d.id === currentDashboard?.id) && currentDashboard) {
        updated.push(currentDashboard);
      }
      
      const success = saveToLocalStorage(key, updated);
      if (success) {
        setDashboards(updated);
        setStorageError(null);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving dashboards:', error);
      setStorageError('Failed to save dashboard changes');
      toast({
        title: "Warning",
        description: "Your changes may not be saved",
        variant: "destructive"
      });
    }
  };

  const loadActivityLog = () => {
    try {
      const key = getActivityLogKey(user?.id);
      const stored = loadFromLocalStorage(key);
      if (stored && Array.isArray(stored)) {
        setActivityLog(stored.slice(0, 50)); // Keep last 50 activities
      }
    } catch (error) {
      console.error('Error loading activity log:', error);
    }
  };

  const addActivity = (action: string, chartTitle?: string) => {
    const newActivity: ActivityLog = {
      id: crypto.randomUUID(),
      action,
      chartTitle,
      timestamp: new Date().toISOString()
    };
    
    const updated = [newActivity, ...activityLog].slice(0, 50);
    setActivityLog(updated);
    
    const key = getActivityLogKey(user?.id);
    saveToLocalStorage(key, updated);
  };

  // ==================== DASHBOARD FUNCTIONS ====================
  const createDashboard = () => {
    if (!dashboardName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a dashboard name",
        variant: "destructive"
      });
      return;
    }

    const newDashboard: Dashboard = {
      id: crypto.randomUUID(),
      name: dashboardName.trim(),
      description: dashboardDescription.trim(),
      charts: [],
      layout: '2',
      bookmarks: [],
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...dashboards, newDashboard];
    setDashboards(updated);
    setCurrentDashboard(newDashboard);
    
    const key = getStorageKey(user?.id);
    saveToLocalStorage(key, updated);

    toast({
      title: "Dashboard Created",
      description: `"${newDashboard.name}" has been created successfully`,
    });

    addActivity('Created dashboard', newDashboard.name);
    
    setIsCreateDialogOpen(false);
    setDashboardName('');
    setDashboardDescription('');
  };

  const updateDashboardLayout = (layout: GridLayout) => {
    if (!currentDashboard) return;
    
    const updated = {
      ...currentDashboard,
      layout,
      updatedAt: new Date().toISOString()
    };
    
    setCurrentDashboard(updated);
    addActivity(`Changed layout to ${layout} columns`);
  };

  const deleteDashboard = (id: string) => {
    const updated = dashboards.filter(d => d.id !== id);
    setDashboards(updated);
    
    if (currentDashboard?.id === id) {
      setCurrentDashboard(updated[0] || null);
    }
    
    const key = getStorageKey(user?.id);
    saveToLocalStorage(key, updated);

    toast({
      title: "Dashboard Deleted",
      description: "The dashboard has been removed",
    });

    addActivity('Deleted dashboard');
  };

  // ==================== CHART FUNCTIONS ====================
  const resetChartForm = () => {
    setChartTitle('');
    setChartType('bar');
    setChartSize('medium');
    setChartData('');
    setChartNotes('');
    setChartColors(COLORS);
    setCalculatedFields([]);
    setCalcName('');
    setCalcExpression('');
  };

  const addCalculatedField = () => {
    if (!calcName.trim() || !calcExpression.trim()) {
      toast({
        title: 'Missing field data',
        description: 'Provide both a calculated field name and expression',
        variant: 'destructive'
      });
      return;
    }

    const nextField: CalculatedField = {
      name: calcName.trim(),
      expression: calcExpression.trim()
    };

    setCalculatedFields((prev) => {
      const withoutDuplicate = prev.filter((field) => field.name !== nextField.name);
      return [...withoutDuplicate, nextField];
    });
    setCalcName('');
    setCalcExpression('');
  };

  const removeCalculatedField = (fieldName: string) => {
    setCalculatedFields((prev) => prev.filter((field) => field.name !== fieldName));
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = String(e.target?.result || '');
        const parsed = parseCsvText(csvText);
        setChartData(JSON.stringify(parsed, null, 2));
        toast({
          title: 'CSV loaded',
          description: `${parsed.length} rows imported from ${file.name}`
        });
      } catch (error) {
        toast({
          title: 'CSV import failed',
          description: error instanceof Error ? error.message : 'Could not parse CSV file',
          variant: 'destructive'
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const addChart = () => {
    if (!currentDashboard) {
      toast({
        title: "Error",
        description: "No dashboard selected",
        variant: "destructive"
      });
      return;
    }

    if (!chartTitle.trim() || !dataValidation.valid || !chartData.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields with valid data",
        variant: "destructive"
      });
      return;
    }

    const calculatedData = applyCalculatedFields(dataValidation.parsed!, calculatedFields);
    const { xKey, yKey } = detectDataKeys(calculatedData);

    const newChart: ChartData = {
      id: editingChart?.id || crypto.randomUUID(),
      title: chartTitle.trim(),
      type: chartType,
      size: chartSize,
      data: calculatedData,
      config: {
        xKey,
        yKey,
        colors: chartColors,
        calculatedFields: [...calculatedFields]
      },
      notes: chartNotes.trim(),
      createdAt: editingChart?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedCharts;
    if (editingChart) {
      updatedCharts = currentDashboard.charts.map(c => 
        c.id === editingChart.id ? newChart : c
      );
      addActivity('Updated chart', newChart.title);
    } else {
      updatedCharts = [...currentDashboard.charts, newChart];
      addActivity('Created chart', newChart.title);
    }

    const updatedDashboard = {
      ...currentDashboard,
      charts: updatedCharts,
      updatedAt: new Date().toISOString()
    };

    setCurrentDashboard(updatedDashboard);

    toast({
      title: editingChart ? "Chart Updated" : "Chart Added",
      description: `"${newChart.title}" has been ${editingChart ? 'updated' : 'added'} successfully`,
    });

    setIsAddChartDialogOpen(false);
    setEditingChart(null);
    resetChartForm();
  };

  const editChart = (chart: ChartData) => {
    setEditingChart(chart);
    setChartTitle(chart.title);
    setChartType(chart.type);
    setChartSize(chart.size || 'medium');
    setChartData(JSON.stringify(chart.data, null, 2));
    setChartNotes(chart.notes || '');
    setChartColors(chart.config.colors || COLORS);
    setCalculatedFields(chart.config.calculatedFields || []);
    setIsAddChartDialogOpen(true);
  };

  const createBookmark = () => {
    if (!currentDashboard || !bookmarkName.trim()) return;
    const nextBookmark: DashboardBookmark = {
      id: crypto.randomUUID(),
      name: bookmarkName.trim(),
      layout: currentDashboard.layout,
      searchQuery,
      slicerColumn,
      slicerValue,
      createdAt: new Date().toISOString()
    };

    const updatedDashboard = {
      ...currentDashboard,
      bookmarks: [...(currentDashboard.bookmarks || []), nextBookmark],
      updatedAt: new Date().toISOString()
    };

    setCurrentDashboard(updatedDashboard);
    setBookmarkName('');
    addActivity('Created bookmark', nextBookmark.name);
  };

  const applyBookmark = (bookmark: DashboardBookmark) => {
    if (!currentDashboard) return;
    setSearchQuery(bookmark.searchQuery);
    setSlicerColumn(bookmark.slicerColumn);
    setSlicerValue(bookmark.slicerValue);
    updateDashboardLayout(bookmark.layout);
    addActivity('Applied bookmark', bookmark.name);
  };

  const publishDashboard = async () => {
    if (!currentDashboard) return;
    const shareSlug = currentDashboard.shareSlug || crypto.randomUUID().slice(0, 8);
    const updatedDashboard: Dashboard = {
      ...currentDashboard,
      isPublished: true,
      shareSlug,
      updatedAt: new Date().toISOString()
    };
    setCurrentDashboard(updatedDashboard);

    const url = `${window.location.origin}/custom-dashboard?share=${shareSlug}`;
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Dashboard published',
        description: 'Share link copied to clipboard'
      });
    } catch {
      toast({
        title: 'Dashboard published',
        description: 'Share link generated. Copy it from the input box.'
      });
    }
    addActivity('Published dashboard', currentDashboard.name);
  };

  const deleteChart = (chartId: string) => {
    if (!currentDashboard) return;

    const chart = currentDashboard.charts.find(c => c.id === chartId);
    const updatedCharts = currentDashboard.charts.filter(c => c.id !== chartId);
    
    const updatedDashboard = {
      ...currentDashboard,
      charts: updatedCharts,
      updatedAt: new Date().toISOString()
    };

    setCurrentDashboard(updatedDashboard);
    setDeleteChartId(null);

    toast({
      title: "Chart Deleted",
      description: `"${chart?.title}" has been removed`,
    });

    addActivity('Deleted chart', chart?.title);
  };

  const copyChart = (chart: ChartData) => {
    if (!currentDashboard) return;

    const newChart: ChartData = {
      ...chart,
      id: crypto.randomUUID(),
      title: `${chart.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedDashboard = {
      ...currentDashboard,
      charts: [...currentDashboard.charts, newChart],
      updatedAt: new Date().toISOString()
    };

    setCurrentDashboard(updatedDashboard);

    toast({
      title: "Chart Duplicated",
      description: `"${newChart.title}" has been created`,
    });

    addActivity('Duplicated chart', chart.title);
  };

  const exportChartAsImage = async (chart: ChartData) => {
    try {
      const element = document.getElementById(`chart-${chart.id}`);
      if (!element) {
        throw new Error('Chart element not found');
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2
      });

      const link = document.createElement('a');
      link.download = `${chart.title.replace(/\s+/g, '_')}_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: "Chart Exported",
        description: `"${chart.title}" has been saved as an image`,
      });

      addActivity('Exported chart as image', chart.title);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Could not export the chart as an image",
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!currentDashboard || !over || active.id === over.id) return;

    const oldIndex = currentDashboard.charts.findIndex(c => c.id === active.id);
    const newIndex = currentDashboard.charts.findIndex(c => c.id === over.id);

    const reorderedCharts = arrayMove(currentDashboard.charts, oldIndex, newIndex);

    const updatedDashboard = {
      ...currentDashboard,
      charts: reorderedCharts,
      updatedAt: new Date().toISOString()
    };

    setCurrentDashboard(updatedDashboard);
    addActivity('Reordered charts');
  };

  const loadDataTemplate = (templateName: keyof typeof DATA_TEMPLATES) => {
    const template = DATA_TEMPLATES[templateName];
    setChartData(JSON.stringify(template, null, 2));
    toast({
      title: "Template Loaded",
      description: `${templateName.charAt(0).toUpperCase() + templateName.slice(1)} data template has been loaded`,
    });
  };

  const exportDashboard = () => {
    if (!currentDashboard) return;

    const dataStr = JSON.stringify(currentDashboard, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard_${currentDashboard.name.replace(/\s+/g, '_')}_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Dashboard Exported",
      description: "Your dashboard has been exported as JSON",
    });

    addActivity('Exported dashboard', currentDashboard.name);
  };

  const importDashboard = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        
        if (!imported.id || !imported.name || !Array.isArray(imported.charts)) {
          throw new Error('Invalid dashboard format');
        }

        const newDashboard: Dashboard = {
          ...imported,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const updated = [...dashboards, newDashboard];
        setDashboards(updated);
        setCurrentDashboard(newDashboard);

        const key = getStorageKey(user?.id);
        saveToLocalStorage(key, updated);

        toast({
          title: "Dashboard Imported",
          description: `"${newDashboard.name}" has been imported successfully`,
        });

        addActivity('Imported dashboard', newDashboard.name);
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Import Failed",
          description: "The file is not a valid dashboard export",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  // ==================== FILTERED CHARTS ====================
  const slicerColumns = useMemo(() => {
    if (!currentDashboard?.charts.length) return [];
    const columns = new Set<string>();
    currentDashboard.charts.forEach((chart) => {
      const sample = chart.data?.[0];
      if (sample && typeof sample === 'object') {
        Object.keys(sample).forEach((key) => columns.add(key));
      }
    });
    return Array.from(columns);
  }, [currentDashboard]);

  const slicerValues = useMemo(() => {
    if (!currentDashboard || !slicerColumn) return [];
    const values = new Set<string>();
    currentDashboard.charts.forEach((chart) => {
      chart.data?.forEach((row) => {
        if (row && row[slicerColumn] !== undefined && row[slicerColumn] !== null) {
          values.add(String(row[slicerColumn]));
        }
      });
    });
    return Array.from(values).slice(0, 200);
  }, [currentDashboard, slicerColumn]);

  const filteredCharts = useMemo(() => {
    if (!currentDashboard) return [];
    const query = searchQuery.trim().toLowerCase();

    return currentDashboard.charts
      .filter((chart) => {
        if (!query) return true;
        return (
          chart.title.toLowerCase().includes(query) ||
          chart.type.toLowerCase().includes(query) ||
          chart.notes?.toLowerCase().includes(query)
        );
      })
      .map((chart) => ({
        ...chart,
        data: applySlicer(chart.data || [], slicerColumn, slicerValue)
      }));
  }, [currentDashboard, searchQuery, slicerColumn, slicerValue]);

  // ==================== RENDER ====================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-muted-foreground">Loading dashboards...</p>
        </div>
      </div>
    );
  }

  if (!currentDashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">No Dashboard Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Create your first dashboard to get started</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gridClass = currentDashboard.layout === '1' 
    ? 'grid-cols-1' 
    : currentDashboard.layout === '2' 
    ? 'grid-cols-1 md:grid-cols-2'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-blue-600" />
              Custom Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage your custom data visualizations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Layout className="h-4 w-4" />
                {currentDashboard.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>My Dashboards</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {dashboards.map(dashboard => (
                <DropdownMenuItem
                  key={dashboard.id}
                  onClick={() => setCurrentDashboard(dashboard)}
                  className={currentDashboard.id === dashboard.id ? 'bg-accent' : ''}
                >
                  <div className="flex-1">
                    <p className="font-medium">{dashboard.name}</p>
                    <p className="text-xs text-muted-foreground">{dashboard.charts.length} charts</p>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => {
            setEditingChart(null);
            resetChartForm();
            setIsAddChartDialogOpen(true);
          }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Chart
          </Button>

          <Button variant="outline" onClick={publishDashboard}>
            <Upload className="mr-2 h-4 w-4" />
            Publish & Share
          </Button>
        </div>
      </div>

      {shareUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <Label className="min-w-fit">Share URL</Label>
              <Input value={shareUrl} readOnly className="font-mono text-xs" />
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    toast({ title: 'Copied', description: 'Share URL copied to clipboard' });
                  } catch {
                    toast({ title: 'Copy failed', description: 'Please copy URL manually', variant: 'destructive' });
                  }
                }}
              >
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Stats */}
      <DashboardStats dashboard={currentDashboard} />

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search charts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={slicerColumn || '__none__'} onValueChange={(value) => {
                if (value === '__none__') {
                  setSlicerColumn('');
                  setSlicerValue('');
                  return;
                }
                setSlicerColumn(value);
                setSlicerValue('');
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Slicer column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No slicer</SelectItem>
                  {slicerColumns.map((column) => (
                    <SelectItem key={column} value={column}>{column}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={slicerValue || '__all__'}
                onValueChange={(value) => setSlicerValue(value === '__all__' ? '' : value)}
                disabled={!slicerColumn}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Slicer value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All values</SelectItem>
                  {slicerValues.map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Grid3x3 className="mr-2 h-4 w-4" />
                    Layout: {currentDashboard.layout}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => updateDashboardLayout('1')}>
                    1 Column
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateDashboardLayout('2')}>
                    2 Columns
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateDashboardLayout('3')}>
                    3 Columns
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={exportDashboard}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={importDashboard}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row gap-2 md:items-center">
            <Input
              placeholder="Bookmark name"
              value={bookmarkName}
              onChange={(e) => setBookmarkName(e.target.value)}
              className="md:max-w-xs"
            />
            <Button variant="outline" size="sm" onClick={createBookmark} disabled={!bookmarkName.trim()}>
              Save Bookmark
            </Button>
            <div className="flex flex-wrap gap-2">
              {(currentDashboard.bookmarks || []).slice(-6).map((bookmark) => (
                <Button
                  key={bookmark.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => applyBookmark(bookmark)}
                >
                  {bookmark.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      {filteredCharts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Charts Yet</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No charts match your search' : 'Start by creating your first chart'}
            </p>
            {!searchQuery && (
              <Button onClick={() => {
                setEditingChart(null);
                resetChartForm();
                setIsAddChartDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Create Chart
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredCharts.map(c => c.id)} strategy={rectSortingStrategy}>
            <div className={`grid ${gridClass} gap-6`}>
              {filteredCharts.map((chart) => (
                <SortableChartCard
                  key={chart.id}
                  chart={chart}
                  onEdit={editChart}
                  onDelete={setDeleteChartId}
                  onCopy={copyChart}
                  onExport={exportChartAsImage}
                  onDrill={setDrillChart}
                  gridLayout={currentDashboard.layout}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create Dashboard Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
            <DialogDescription>
              Set up a new dashboard to organize your charts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dashboard-name">Dashboard Name *</Label>
              <Input
                id="dashboard-name"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="Sales Analytics Dashboard"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="dashboard-description">Description (Optional)</Label>
              <Input
                id="dashboard-description"
                value={dashboardDescription}
                onChange={(e) => setDashboardDescription(e.target.value)}
                placeholder="Track monthly sales performance and trends"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setDashboardName('');
              setDashboardDescription('');
            }}>
              Cancel
            </Button>
            <Button onClick={createDashboard} disabled={!dashboardName.trim()}>
              Create Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Chart Dialog */}
      <Dialog 
        open={isAddChartDialogOpen} 
        onOpenChange={(open) => {
          setIsAddChartDialogOpen(open);
          if (!open) {
            setEditingChart(null);
            resetChartForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingChart ? (
                <>
                  <Edit className="h-5 w-5" />
                  Edit Chart
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Add New Chart
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Customize your chart with data, type, colors, and size options
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="data">Data & Preview</TabsTrigger>
              <TabsTrigger value="style">Style & Colors</TabsTrigger>
            </TabsList>
            
            <TabsContent value="config" className="space-y-4">
              <div>
                <Label htmlFor="chart-title">Chart Title *</Label>
                <Input
                  id="chart-title"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  placeholder="Monthly Revenue Trend"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chart-type">Chart Type</Label>
                  <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">
                        <div className="flex items-center gap-2">
                          <LineChartIcon className="h-4 w-4" />
                          Line Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="bar">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Bar Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="pie">
                        <div className="flex items-center gap-2">
                          <PieChartIcon className="h-4 w-4" />
                          Pie Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="area">
                        <div className="flex items-center gap-2">
                          <AreaChartIcon className="h-4 w-4" />
                          Area Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="scatter">
                        <div className="flex items-center gap-2">
                          <ScatterChartIcon className="h-4 w-4" />
                          Scatter Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="map">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Map Plot
                        </div>
                      </SelectItem>
                      <SelectItem value="card">
                        <div className="flex items-center gap-2">
                          <Layout className="h-4 w-4" />
                          KPI Card
                        </div>
                      </SelectItem>
                      <SelectItem value="table">
                        <div className="flex items-center gap-2">
                          <Grid3x3 className="h-4 w-4" />
                          Table
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="chart-size">Chart Size</Label>
                  <Select value={chartSize} onValueChange={(value) => setChartSize(value as ChartSize)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (300px)</SelectItem>
                      <SelectItem value="medium">Medium (400px)</SelectItem>
                      <SelectItem value="large">Large (500px)</SelectItem>
                      <SelectItem value="full">Full Width (600px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="chart-notes">Description / Notes (Optional)</Label>
                <Input
                  id="chart-notes"
                  value={chartNotes}
                  onChange={(e) => setChartNotes(e.target.value)}
                  placeholder="Additional context about this chart"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="data" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="chart-data">Chart Data (JSON) *</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <label className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload CSV
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={handleCsvUpload}
                          className="hidden"
                        />
                      </label>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileJson className="mr-2 h-4 w-4" />
                          Use Template
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => loadDataTemplate('sales')}>
                          Sales Data
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => loadDataTemplate('users')}>
                          User Categories
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => loadDataTemplate('performance')}>
                          Performance Metrics
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <textarea
                  id="chart-data"
                  value={chartData}
                  onChange={(e) => setChartData(e.target.value)}
                  placeholder={`[\n  {"product_name": "iPhone", "price": 999},\n  {"product_name": "Samsung", "price": 899}\n]`}
                  className={`w-full h-64 p-3 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 ${
                    dataValidation.valid 
                      ? 'focus:ring-blue-500 border-gray-300' 
                      : 'focus:ring-red-500 border-red-300'
                  }`}
                />
                {!dataValidation.valid && dataValidation.error && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {dataValidation.error}
                  </p>
                )}
                {dataValidation.valid && chartData && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    ✓ Valid JSON with {dataValidation.parsed?.length} data points
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Paste a JSON array. Keys will be auto-detected. Max 1000 data points.
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Basic Calculated Fields</Label>
                  <Badge variant="outline">Formula: revenue - expenses</Badge>
                </div>
                <div className="grid md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Field name (e.g. profit)"
                    value={calcName}
                    onChange={(e) => setCalcName(e.target.value)}
                  />
                  <Input
                    placeholder="Expression (e.g. revenue - expenses)"
                    value={calcExpression}
                    onChange={(e) => setCalcExpression(e.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={addCalculatedField}>
                    Add Field
                  </Button>
                </div>
                {!!calculatedFields.length && (
                  <div className="flex flex-wrap gap-2">
                    {calculatedFields.map((field) => (
                      <Button
                        key={field.name}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => removeCalculatedField(field.name)}
                      >
                        {field.name}: {field.expression}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {dataValidation.valid && dataValidation.parsed && (
                <ChartPreview 
                  chartType={chartType} 
                  chartData={dataValidation.parsed} 
                  chartColors={chartColors}
                  size={chartSize}
                />
              )}
            </TabsContent>
            
            <TabsContent value="style" className="space-y-4">
              <ColorPicker
                selectedColors={chartColors}
                onColorsChange={setChartColors}
              />
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddChartDialogOpen(false);
              setEditingChart(null);
              resetChartForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={addChart} 
              disabled={!chartTitle.trim() || !dataValidation.valid || !chartData.trim()} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {editingChart ? 'Update Chart' : 'Add Chart'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!drillChart} onOpenChange={(open) => !open && setDrillChart(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Drill Through: {drillChart?.title}</DialogTitle>
            <DialogDescription>
              Detailed view with rich tooltip context and underlying rows.
            </DialogDescription>
          </DialogHeader>
          {drillChart && (
            <div className="space-y-4">
              <ChartPreview
                chartType={drillChart.type}
                chartData={drillChart.data}
                chartColors={drillChart.config.colors || COLORS}
                size={drillChart.size || 'large'}
              />
              <div className="max-h-[340px] overflow-auto border rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {Object.keys(drillChart.data[0] || {}).map((key) => (
                        <th key={key} className="text-left p-2">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drillChart.data.map((row, index) => (
                      <tr key={index} className="border-t">
                        {Object.keys(drillChart.data[0] || {}).map((key) => (
                          <td key={`${index}-${key}`} className="p-2">{String(row[key] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Chart Confirmation Dialog */}
      <AlertDialog open={!!deleteChartId} onOpenChange={(open) => !open && setDeleteChartId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chart?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chart. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteChartId && deleteChart(deleteChartId)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete Chart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomDashboard;