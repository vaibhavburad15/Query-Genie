// ✅ ENHANCED: Custom Dashboard with Advanced Features
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
type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';
type ChartSize = 'small' | 'medium' | 'large' | 'full';
type GridLayout = '1' | '2' | '3';

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

const CHART_SIZE_CONFIG = {
  small: { height: 250, cols: 1 },
  medium: { height: 350, cols: 1 },
  large: { height: 450, cols: 2 },
  full: { height: 500, cols: 12 }
};

// ==================== UTILITY FUNCTIONS ====================
const getStorageKey = (userId: number | undefined): string => {
  const id = userId || 'guest';
  return `custom_dashboards_v2_${id}`;
};

const getActivityLogKey = (userId: number | undefined): string => {
  const id = userId || 'guest';
  return `dashboard_activity_${id}`;
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

const detectDataKeys = (data: any[]): { xKey: string; yKey: string } => {
  if (!data || data.length === 0) return { xKey: 'name', yKey: 'value' };
  const firstItem = data[0];
  const keys = Object.keys(firstItem);
  
  const nameKey = keys.find(k => 
    k.toLowerCase().includes('name') ||
    k.toLowerCase().includes('label') ||
    k.toLowerCase().includes('category') ||
    k.toLowerCase().includes('month') ||
    k.toLowerCase().includes('date')
  ) || keys[0];
  
  const valueKey = keys.find(k => 
    k.toLowerCase().includes('value') ||
    k.toLowerCase().includes('amount') ||
    k.toLowerCase().includes('total') ||
    k.toLowerCase().includes('count') ||
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

// Chart Preview Component
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
  const height = size === 'small' ? 200 : size === 'medium' ? 250 : 300;

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={normalizedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xKey} stroke="#6b7280" style={{ fontSize: '11px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
              <Tooltip />
              <Line type="monotone" dataKey={yKey} stroke={chartColors[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={normalizedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xKey} stroke="#6b7280" style={{ fontSize: '11px' }} />
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
                outerRadius={80}
                label
              >
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={normalizedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xKey} stroke="#6b7280" style={{ fontSize: '11px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
              <Tooltip />
              <Area type="monotone" dataKey={yKey} stroke={chartColors[0]} fill={chartColors[0]} fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xKey} stroke="#6b7280" style={{ fontSize: '11px' }} />
              <YAxis dataKey={yKey} stroke="#6b7280" style={{ fontSize: '11px' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={normalizedData} fill={chartColors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">Live Preview</span>
      </div>
      {renderChart()}
    </div>
  );
};

// Sortable Chart Card Component
const SortableChartCard = ({ 
  chart, 
  onEdit, 
  onDelete, 
  onCopy,
  onExport,
  gridLayout
}: { 
  chart: ChartData; 
  onEdit: (chart: ChartData) => void; 
  onDelete: (id: string) => void; 
  onCopy: (chart: ChartData) => void;
  onExport: (chart: ChartData) => void;
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
    const height = CHART_SIZE_CONFIG[chart.size || 'medium'].height;

    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={normalizedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={chart.config.xKey || xKey} stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey={chart.config.yKey || yKey} stroke={chartColors[0]} strokeWidth={2} dot={{ fill: chartColors[0], r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={normalizedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={chart.config.xKey || xKey} stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
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
                outerRadius={height / 3}
                label={(entry) => entry[chart.config.nameKey || chart.config.xKey || xKey]}
              >
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={normalizedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={chart.config.xKey || xKey} stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <Area type="monotone" dataKey={chart.config.yKey || yKey} stroke={chartColors[0]} fill={chartColors[0]} fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={chart.config.xKey || xKey} stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis dataKey={chart.config.yKey || yKey} stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <Scatter data={normalizedData} fill={chartColors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      
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
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  {chart.title}
                  <Badge variant="outline" className="text-xs">
                    {chart.type}
                  </Badge>
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
  // Form states
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [chartTitle, setChartTitle] = useState('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartSize, setChartSize] = useState<ChartSize>('medium');
  const [chartData, setChartData] = useState('');
  const [chartNotes, setChartNotes] = useState('');
  const [chartColors, setChartColors] = useState<string[]>(COLORS);
  const [dataValidation, setDataValidation] = useState<{ valid: boolean; error?: string; parsed?: any[] }>({ valid: true });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (currentDashboard) {
          setIsAddChartDialogOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDashboard]);

  // Validate chart data on change
  useEffect(() => {
    if (chartData) {
      const validation = validateChartData(chartData);
      setDataValidation(validation);
    } else {
      setDataValidation({ valid: true });
    }
  }, [chartData]);

  const loadDashboards = () => {
    try {
      const storageKey = getStorageKey(user?.id);
      const saved = loadFromLocalStorage(storageKey);
      
      if (saved && Array.isArray(saved)) {
        setDashboards(saved);
        if (saved.length > 0) {
          setCurrentDashboard(saved[0]);
        }
        setStorageError(null);
      } else {
        setDashboards([]);
        setCurrentDashboard(null);
      }
    } catch (error) {
      console.error('Error loading dashboards:', error);
      setStorageError('Failed to load dashboards');
      setDashboards([]);
    }
  };

  const loadActivityLog = () => {
    try {
      const activityKey = getActivityLogKey(user?.id);
      const saved = loadFromLocalStorage(activityKey);
      if (saved && Array.isArray(saved)) {
        setActivityLog(saved.slice(0, 10)); // Keep last 10 activities
      }
    } catch (error) {
      console.error('Error loading activity log:', error);
    }
  };

  const addActivity = (action: string, chartTitle?: string) => {
    const newActivity: ActivityLog = {
      id: `activity_${Date.now()}`,
      action,
      chartTitle,
      timestamp: new Date().toISOString()
    };
    
    const updated = [newActivity, ...activityLog].slice(0, 10);
    setActivityLog(updated);
    
    const activityKey = getActivityLogKey(user?.id);
    saveToLocalStorage(activityKey, updated);
  };

  const saveDashboards = (updatedDashboards: Dashboard[]) => {
    try {
      const storageKey = getStorageKey(user?.id);
      const success = saveToLocalStorage(storageKey, updatedDashboards);
      
      if (success) {
        setDashboards(updatedDashboards);
        setStorageError(null);
      } else {
        setStorageError('Failed to save dashboards');
        toast({
          title: "Storage Error",
          description: "Changes may not persist.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving dashboards:', error);
      setStorageError('Failed to save dashboards');
    }
  };

/**
 * Load dashboards from database on component mount
 */
useEffect(() => {
  const initializeDashboards = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if API is available
      const apiAvailable = await DashboardAPI.checkApiHealth();
      
      if (apiAvailable) {
        // Try to fetch from database
        const dbDashboards = await DashboardAPI.fetchDashboards(user.id);
        
        if (dbDashboards.length > 0) {
          // Convert to frontend format
          const formattedDashboards: Dashboard[] = dbDashboards.map(db => ({
            id: db.dashboard_id,
            name: db.name,
            description: db.description || '',
            charts: db.charts,
            layout: '2' as GridLayout,
            createdAt: db.created_at || new Date().toISOString(),
            updatedAt: db.updated_at || new Date().toISOString()
          }));
          
          setDashboards(formattedDashboards);
          if (formattedDashboards.length > 0) {
            setCurrentDashboard(formattedDashboards[0]);
          }
          console.log(`✅ Loaded ${dbDashboards.length} dashboards from database`);
          
          // Also save to localStorage as backup
          saveToLocalStorage(getStorageKey(user.id), formattedDashboards);
        } else {
          // Check if we have localStorage data to migrate
          await migrateLocalStorageToDatabase();
        }
      } else {
        // Fallback to localStorage
        loadFromLocalStorageOnly();
      }
    } catch (error) {
      console.error('❌ Error loading dashboards:', error);
      toast({
        title: 'Error Loading Dashboards',
        description: 'Failed to load dashboards. Using local storage.',
        variant: 'destructive'
      });
      loadFromLocalStorageOnly();
    } finally {
      setIsLoading(false);
    }
  };

  initializeDashboards();
  loadActivityLog();
}, [user?.id]);

/**
 * Load dashboards from localStorage only (fallback)
 */
const loadFromLocalStorageOnly = () => {
  const stored = loadFromLocalStorage(getStorageKey(user?.id));
  if (stored && Array.isArray(stored)) {
    setDashboards(stored);
    if (stored.length > 0) {
      setCurrentDashboard(stored[0]);
    }
    console.log(`✅ Loaded ${stored.length} dashboards from localStorage`);
  }
};

/**
 * Migrate localStorage data to database
 */
const migrateLocalStorageToDatabase = async () => {
  if (!user?.id) return;

  try {
    const localDashboards = loadFromLocalStorage(getStorageKey(user.id));
    
    if (localDashboards && localDashboards.length > 0) {
      console.log(`🔄 Migrating ${localDashboards.length} dashboards to database...`);
      
      const result = await DashboardAPI.migrateFromLocalStorage(user.id, localDashboards);
      
      if (result.success) {
        toast({
          title: 'Migration Complete',
          description: result.message,
        });
        
        // Reload from database
        const dbDashboards = await DashboardAPI.fetchDashboards(user.id);
        const formattedDashboards: Dashboard[] = dbDashboards.map(db => ({
          id: db.dashboard_id,
          name: db.name,
          description: db.description || '',
          charts: db.charts,
          layout: '2' as GridLayout,
          createdAt: db.created_at || new Date().toISOString(),
          updatedAt: db.updated_at || new Date().toISOString()
        }));
        
        setDashboards(formattedDashboards);
        if (formattedDashboards.length > 0) {
          setCurrentDashboard(formattedDashboards[0]);
        }
      }
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

/**
 * Save dashboard to database and localStorage
 */
const saveDashboardToDatabase = async (dashboard: Dashboard, isNew: boolean = false) => {
  if (!user?.id) {
    // Guest mode - save to localStorage only
    saveToLocalStorage(getStorageKey(user?.id), dashboards);
    return;
  }

  try {
    setIsSyncing(true);

    const dashboardData = {
      dashboard_id: dashboard.id,
      name: dashboard.name,
      description: dashboard.description || '',
      charts: dashboard.charts
    };

    if (isNew) {
      await DashboardAPI.createDashboard(user.id, dashboardData);
      console.log(`✅ Created dashboard in database: ${dashboard.name}`);
    } else {
      await DashboardAPI.updateDashboard(user.id, dashboard.id, dashboardData);
      console.log(`✅ Updated dashboard in database: ${dashboard.name}`);
    }

    saveToLocalStorage(getStorageKey(user.id), dashboards);

  } catch (error) {
    console.error('❌ Error saving to database:', error);
    
    toast({
      title: 'Sync Error',
      description: 'Failed to sync with server. Changes saved locally.',
      variant: 'destructive'
    });

    saveToLocalStorage(getStorageKey(user.id), dashboards);
  } finally {
    setIsSyncing(false);
  }
};

/**
 * Delete dashboard from database and localStorage
 */
const deleteDashboardFromDatabase = async (dashboardId: string) => {
  if (!user?.id) {
    const updated = dashboards.filter(d => d.id !== dashboardId);
    setDashboards(updated);
    saveToLocalStorage(getStorageKey(user?.id), updated);
    return;
  }

  try {
    setIsSyncing(true);

    await DashboardAPI.deleteDashboard(user.id, dashboardId);
    console.log(`✅ Deleted dashboard from database: ${dashboardId}`);

    const updated = dashboards.filter(d => d.id !== dashboardId);
    setDashboards(updated);
    saveToLocalStorage(getStorageKey(user.id), updated);

  } catch (error) {
    console.error('❌ Error deleting from database:', error);
    
    toast({
      title: 'Delete Error',
      description: 'Failed to delete from server.',
      variant: 'destructive'
    });
  } finally {
    setIsSyncing(false);
  }
};




 const createDashboard = async () => {
  if (!dashboardName.trim()) {
    toast({
      title: 'Name Required',
      description: 'Please enter a dashboard name',
      variant: 'destructive'
    });
    return;
  }

  const newDashboard: Dashboard = {
    id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: dashboardName.trim(),
    description: dashboardDescription.trim(),
    charts: [],
    layout: '2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updated = [...dashboards, newDashboard];
  setDashboards(updated);
  setCurrentDashboard(newDashboard);
  
  // ✅ Save to database
  await saveDashboardToDatabase(newDashboard, true);
  
  setIsCreateDialogOpen(false);
  setDashboardName('');
  setDashboardDescription('');
  
  addActivity('Created dashboard', dashboardName);
  
  toast({
    title: "✅ Dashboard created",
    description: `"${dashboardName}" is ready to use.`,
  });
};

  const addChart = async () => {
    if (!currentDashboard) return;

    const validation = validateChartData(chartData);
    if (!validation.valid || !validation.parsed) {
      toast({
        title: "Invalid data",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const { xKey, yKey } = detectDataKeys(validation.parsed);

    const newChart: ChartData = {
      id: editingChart?.id || `chart_${Date.now()}`,
      title: chartTitle,
      type: chartType,
      size: chartSize,
      data: validation.parsed,
      config: {
        xKey: xKey,
        yKey: yKey,
        dataKey: yKey,
        nameKey: xKey,
        colors: chartColors,
      },
      notes: chartNotes,
      createdAt: editingChart?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedDashboard = {
      ...currentDashboard,
      charts: editingChart
        ? currentDashboard.charts.map(c => c.id === editingChart.id ? newChart : c)
        : [...currentDashboard.charts, newChart],
      updatedAt: new Date().toISOString(),
    };

    const updatedDashboards = dashboards.map(d =>
      d.id === currentDashboard.id ? updatedDashboard : d
    );

    setDashboards(updatedDashboards);
    setCurrentDashboard(updatedDashboard);
    
    // ✅ Save to database
    await saveDashboardToDatabase(updatedDashboard, false);
    
    setIsAddChartDialogOpen(false);
    setEditingChart(null);
    resetChartForm();
    
    addActivity(editingChart ? 'Updated chart' : 'Added chart', chartTitle);
    
    toast({
      title: editingChart ? "✅ Chart updated" : "✅ Chart added",
      description: `"${chartTitle}" ${editingChart ? 'updated' : 'added'} successfully.`,
    });
  };

  const resetChartForm = () => {
    setChartTitle('');
    setChartType('bar');
    setChartSize('medium');
    setChartData('');
    setChartNotes('');
    setChartColors(COLORS);
    setDataValidation({ valid: true });
  };

  const deleteChart = async (chartId: string) => {
    if (!currentDashboard) return;

    const chart = currentDashboard.charts.find(c => c.id === chartId);
    if (!chart) return;

    const updatedDashboard = {
      ...currentDashboard,
      charts: currentDashboard.charts.filter(c => c.id !== chartId),
      updatedAt: new Date().toISOString(),
    };

    const updatedDashboards = dashboards.map(d =>
      d.id === currentDashboard.id ? updatedDashboard : d
    );

    setDashboards(updatedDashboards);
    setCurrentDashboard(updatedDashboard);
    
    // ✅ Save to database
    await saveDashboardToDatabase(updatedDashboard, false);
    
    setDeleteChartId(null);
    
    addActivity('Deleted chart', chart.title);
    
    toast({
      title: "🗑️ Chart deleted",
      description: "The chart has been removed.",
    });
  };

  const duplicateChart = async (chart: ChartData) => {
    if (!currentDashboard) return;

    const newChart: ChartData = {
      ...chart,
      id: `chart_${Date.now()}`,
      title: `${chart.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedDashboard = {
      ...currentDashboard,
      charts: [...currentDashboard.charts, newChart],
      updatedAt: new Date().toISOString(),
    };

    const updatedDashboards = dashboards.map(d =>
      d.id === currentDashboard.id ? updatedDashboard : d
    );

    setDashboards(updatedDashboards);
    setCurrentDashboard(updatedDashboard);
    
    // ✅ Save to database
    await saveDashboardToDatabase(updatedDashboard, false);
    
    addActivity('Duplicated chart', chart.title);
    
    toast({
      title: "📋 Chart duplicated",
      description: "A copy has been created.",
    });
  };

  const editChart = (chart: ChartData) => {
    setEditingChart(chart);
    setChartTitle(chart.title);
    setChartType(chart.type);
    setChartSize(chart.size || 'medium');
    setChartData(JSON.stringify(chart.data, null, 2));
    setChartNotes(chart.notes || '');
    setChartColors(chart.config.colors || COLORS);
    setIsAddChartDialogOpen(true);
  };

  const exportChartAsImage = async (chart: ChartData) => {
    try {
      const element = document.getElementById(`chart-${chart.id}`);
      if (!element) {
        toast({
          title: "Export failed",
          description: "Chart element not found.",
          variant: "destructive",
        });
        return;
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${chart.title.replace(/\s+/g, '_')}.png`;
          link.click();
          URL.revokeObjectURL(url);
          
          toast({
            title: "📸 Chart exported",
            description: "Downloaded as PNG image.",
          });
        }
      });
    } catch (error) {
      console.error('Error exporting chart:', error);
      toast({
        title: "Export failed",
        description: "An error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!currentDashboard || !over || active.id === over.id) return;

    const oldIndex = currentDashboard.charts.findIndex(c => c.id === active.id);
    const newIndex = currentDashboard.charts.findIndex(c => c.id === over.id);

    const reorderedCharts = arrayMove(currentDashboard.charts, oldIndex, newIndex);

    const updatedDashboard = {
      ...currentDashboard,
      charts: reorderedCharts,
      updatedAt: new Date().toISOString(),
    };

    const updatedDashboards = dashboards.map(d =>
      d.id === currentDashboard.id ? updatedDashboard : d
    );

    setDashboards(updatedDashboards);
    setCurrentDashboard(updatedDashboard);
    
    // ✅ Save to database
    await saveDashboardToDatabase(updatedDashboard, false);
    
    addActivity('Reordered charts');
  };

  const exportDashboard = () => {
    if (!currentDashboard) return;
    
    const dataStr = JSON.stringify(currentDashboard, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDashboard.name.replace(/\s+/g, '_')}_dashboard.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "📥 Dashboard exported",
      description: "Downloaded as JSON file.",
    });
  };

  const importDashboard = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        const newDashboard: Dashboard = {
          ...imported,
          id: `dashboard_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const updated = [...dashboards, newDashboard];
        saveDashboards(updated);
        setCurrentDashboard(newDashboard);
        
        addActivity('Imported dashboard', newDashboard.name);
        
        toast({
          title: "📤 Dashboard imported",
          description: `"${newDashboard.name}" imported successfully.`,
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid dashboard file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const deleteDashboard = async () => {
    if (!currentDashboard) return;

    // ✅ Delete from database
    await deleteDashboardFromDatabase(currentDashboard.id);
    
    const updated = dashboards.filter(d => d.id !== currentDashboard.id);
    setDashboards(updated);
    setCurrentDashboard(updated[0] || null);
    
    addActivity('Deleted dashboard', currentDashboard.name);
    
    toast({
      title: "🗑️ Dashboard deleted",
      description: "Dashboard removed.",
    });
  };

  const updateDashboardLayout = async (layout: GridLayout) => {
    if (!currentDashboard) return;

    const updatedDashboard = {
      ...currentDashboard,
      layout,
      updatedAt: new Date().toISOString(),
    };

    const updatedDashboards = dashboards.map(d =>
      d.id === currentDashboard.id ? updatedDashboard : d
    );

    setDashboards(updatedDashboards);
    setCurrentDashboard(updatedDashboard);
    
    // ✅ Save to database
    await saveDashboardToDatabase(updatedDashboard, false);
    
    toast({
      title: "Layout updated",
      description: `Changed to ${layout}-column layout.`,
    });
  };

  const loadDataTemplate = (template: keyof typeof DATA_TEMPLATES) => {
    setChartData(JSON.stringify(DATA_TEMPLATES[template], null, 2));
  };

  // Filtered charts based on search
  const filteredCharts = useMemo(() => {
    if (!currentDashboard) return [];
    if (!searchQuery) return currentDashboard.charts;
    
    return currentDashboard.charts.filter(chart =>
      chart.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chart.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chart.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentDashboard, searchQuery]);

  const getGridClass = () => {
    switch (currentDashboard?.layout) {
      case '1':
        return 'grid-cols-1';
      case '3':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default:
        return 'grid-cols-1 lg:grid-cols-2';
    }
  };

  // ✅ Loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-600" />
              Custom Dashboard
            </h1>
            {currentDashboard && (
              <p className="text-sm text-muted-foreground">
                {currentDashboard.name}
                {isSyncing && (
                  <Badge variant="outline" className="ml-2">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    Syncing...
                  </Badge>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentDashboard && (
            <>
              <Select
                value={currentDashboard.layout}
                onValueChange={(value) => updateDashboardLayout(value as GridLayout)}
              >
                <SelectTrigger className="w-32">
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Column</SelectItem>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={exportDashboard}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Dashboard?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{currentDashboard.name}" and all its charts. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteDashboard} className="bg-destructive text-destructive-foreground">
                      Delete Dashboard
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          
          <label>
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={importDashboard}
            />
          </label>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                New Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Dashboard</DialogTitle>
                <DialogDescription>
                  Create a custom dashboard to organize your charts
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dashboard-name">Dashboard Name *</Label>
                  <Input
                    id="dashboard-name"
                    value={dashboardName}
                    onChange={(e) => setDashboardName(e.target.value)}
                    placeholder="Q1 Sales Dashboard"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="dashboard-description">Description (Optional)</Label>
                  <Input
                    id="dashboard-description"
                    value={dashboardDescription}
                    onChange={(e) => setDashboardDescription(e.target.value)}
                    placeholder="Track quarterly sales metrics and KPIs"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createDashboard} disabled={!dashboardName.trim()}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Dashboard
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard Selector */}
      {dashboards.length > 0 && (
        <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Dashboard:</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-[200px] justify-between">
                  {currentDashboard?.name || 'Select Dashboard'}
                  <Badge variant="secondary" className="ml-2">
                    {currentDashboard?.charts.length || 0}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Your Dashboards</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {dashboards.map(dashboard => (
                  <DropdownMenuItem
                    key={dashboard.id}
                    onClick={() => setCurrentDashboard(dashboard)}
                    className="flex items-center justify-between"
                  >
                    <span>{dashboard.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {dashboard.charts.length}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {currentDashboard && currentDashboard.charts.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search charts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        {storageError && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900">Storage Warning</h3>
                <p className="text-xs text-yellow-800 mt-1">{storageError}</p>
              </div>
            </div>
          </div>
        )}

        {!currentDashboard ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="max-w-md">
              <BarChart3 size={80} className="text-gray-300 mb-6 mx-auto" />
              <h2 className="text-3xl font-bold mb-3">Welcome to Custom Dashboards</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Create beautiful, interactive dashboards to visualize your data. Start by creating your first dashboard.
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)} 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Dashboard
              </Button>
              
              <div className="mt-12 grid grid-cols-3 gap-4 text-left">
                <div className="p-4 bg-white rounded-lg border">
                  <LineChartIcon className="h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-sm">Multiple Charts</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Line, Bar, Pie, Area & Scatter charts
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <Palette className="h-8 w-8 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-sm">Custom Colors</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    10 color themes or create your own
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <Layout className="h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-semibold text-sm">Flexible Layout</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drag & drop, resize, and organize
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : currentDashboard.charts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <LineChartIcon size={80} className="text-gray-300 mb-6" />
            <h2 className="text-3xl font-bold mb-3">Add Your First Chart</h2>
            <p className="text-muted-foreground mb-8 text-lg max-w-md">
              Transform your data into beautiful visualizations. Paste JSON data or use a template to get started.
            </p>
            <Button 
              onClick={() => setIsAddChartDialogOpen(true)} 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Your First Chart
            </Button>
            
            <div className="mt-12 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-3 py-1 bg-gray-100 rounded-lg font-mono">Ctrl + K</span>
              <span>Quick add chart</span>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Stats */}
            <DashboardStats dashboard={currentDashboard} />

            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {currentDashboard.name}
                  {filteredCharts.length !== currentDashboard.charts.length && (
                    <Badge variant="secondary">
                      {filteredCharts.length} of {currentDashboard.charts.length}
                    </Badge>
                  )}
                </h2>
                {currentDashboard.description && (
                  <p className="text-sm text-muted-foreground mt-1">{currentDashboard.description}</p>
                )}
              </div>
              <Button 
                onClick={() => setIsAddChartDialogOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Chart
                <kbd className="ml-2 px-2 py-0.5 text-xs bg-blue-700 rounded">Ctrl+K</kbd>
              </Button>
            </div>

            {filteredCharts.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No charts match your search</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredCharts.map(c => c.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className={`grid ${getGridClass()} gap-6`}>
                    {filteredCharts.map(chart => (
                      <SortableChartCard
                        key={chart.id}
                        chart={chart}
                        onEdit={editChart}
                        onDelete={(id) => setDeleteChartId(id)}
                        onCopy={duplicateChart}
                        onExport={exportChartAsImage}
                        gridLayout={currentDashboard.layout}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Recent Activity Sidebar (Optional) */}
            {activityLog.length > 0 && (
              <div className="mt-8 p-4 bg-white rounded-lg border">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </h3>
                <div className="space-y-2">
                  {activityLog.slice(0, 5).map(activity => (
                    <div key={activity.id} className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>
                        {activity.action}
                        {activity.chartTitle && <strong className="text-foreground ml-1">{activity.chartTitle}</strong>}
                      </span>
                      <span className="text-xs">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Chart Dialog */}
      <Dialog open={isAddChartDialogOpen} onOpenChange={(open) => {
        setIsAddChartDialogOpen(open);
        if (!open) {
          setEditingChart(null);
          resetChartForm();
        }
      }}>
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
                      <SelectItem value="small">Small (250px)</SelectItem>
                      <SelectItem value="medium">Medium (350px)</SelectItem>
                      <SelectItem value="large">Large (450px)</SelectItem>
                      <SelectItem value="full">Full Width (500px)</SelectItem>
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
                <textarea
                  id="chart-data"
                  value={chartData}
                  onChange={(e) => setChartData(e.target.value)}
                  placeholder={`[\n  {"month": "Jan", "revenue": 4000},\n  {"month": "Feb", "revenue": 3000},\n  {"month": "Mar", "revenue": 5000}\n]`}
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