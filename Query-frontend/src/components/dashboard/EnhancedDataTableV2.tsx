// Enhanced Data Table with Virtual Scrolling, AJAX features, and RIA principles
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  RefreshCw,
  Columns,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { showSuccessToast, showErrorToast } from '@/components/ui/toast-notification';
import { TableSkeleton } from '@/components/ui/skeleton-loader';

interface EnhancedDataTableV2Props {
  data: string[][];
  columns: string[];
  totalRows?: number;
  pageSize?: number;
  searchable?: boolean;
  sortable?: boolean;
  exportable?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

type SortDirection = 'asc' | 'desc' | null;

const EnhancedDataTableV2: React.FC<EnhancedDataTableV2Props> = ({
  data,
  columns,
  totalRows = data.length,
  pageSize = 10,
  searchable = true,
  sortable = true,
  exportable = true,
  isLoading = false,
  onRefresh,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [copied, setCopied] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(
    new Set(columns.map((_, i) => i))
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter data based on search term (debounced)
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm) return data;
    return data.filter(row =>
      row.some(cell => 
        cell?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    );
  }, [data, debouncedSearchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (sortColumn === null || sortDirection === null) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn] || '';
      const bVal = b[sortColumn] || '';
      
      // Try to parse as numbers for numeric sorting
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // String comparison
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Visible columns
  const visibleColumns = useMemo(() => {
    return columns.filter((_, index) => selectedColumns.has(index));
  }, [columns, selectedColumns]);

  const handleSort = useCallback((columnIndex: number) => {
    if (!sortable) return;
    
    if (sortColumn === columnIndex) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  }, [sortable, sortColumn, sortDirection]);

  const exportToCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const csvContent = [
        visibleColumns.join(','),
        ...sortedData.map(row => 
          row
            .filter((_, index) => selectedColumns.has(index))
            .map(cell => `"${cell?.replace(/"/g, '""') || ''}"`)
            .join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_results_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccessToast({
        title: 'Export successful',
        description: `Exported ${sortedData.length} rows to CSV`,
      });
    } catch (error) {
      showErrorToast({
        title: 'Export failed',
        description: 'Failed to export data. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  }, [sortedData, visibleColumns, selectedColumns]);

  const exportToJSON = useCallback(async () => {
    setIsExporting(true);
    try {
      const jsonData = sortedData.map(row => {
        const obj: Record<string, string> = {};
        visibleColumns.forEach((col, index) => {
          const originalIndex = columns.indexOf(col);
          obj[col] = row[originalIndex] || '';
        });
        return obj;
      });
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_results_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccessToast({
        title: 'Export successful',
        description: `Exported ${sortedData.length} rows to JSON`,
      });
    } catch (error) {
      showErrorToast({
        title: 'Export failed',
        description: 'Failed to export data. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  }, [sortedData, visibleColumns, columns]);

  const copyToClipboard = useCallback(async () => {
    try {
      const textContent = [
        visibleColumns.join('\t'),
        ...sortedData.map(row => 
          row
            .filter((_, index) => selectedColumns.has(index))
            .join('\t')
        )
      ].join('\n');
      
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      showSuccessToast({
        title: 'Copied to clipboard',
        description: `${sortedData.length} rows copied`,
      });
    } catch (err) {
      showErrorToast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard',
      });
    }
  }, [sortedData, visibleColumns, selectedColumns]);

  const getSortIcon = (columnIndex: number) => {
    if (sortColumn !== columnIndex) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const toggleColumn = (index: number) => {
    setSelectedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        if (newSet.size > 1) { // Keep at least one column visible
          newSet.delete(index);
        }
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <TableSkeleton rows={pageSize} columns={columns.length} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg font-medium mb-2">No data to display</p>
          <p className="text-sm">Try running a different query</p>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-sm font-medium">
            {sortedData.length.toLocaleString()} rows
          </Badge>
          {debouncedSearchTerm && (
            <Badge variant="outline" className="text-sm">
              Filtered from {data.length.toLocaleString()}
            </Badge>
          )}
          {sortColumn !== null && (
            <Badge variant="outline" className="text-sm flex items-center gap-1">
              Sorted by {columns[sortColumn]}
              <button
                onClick={() => {
                  setSortColumn(null);
                  setSortDirection(null);
                }}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search data... (Ctrl+F)"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                aria-label="Search table data"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          
          {/* Column selector */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="text-sm"
            >
              <Columns className="h-4 w-4 mr-1" />
              Columns ({selectedColumns.size})
            </Button>
            
            {showColumnSelector && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                <div className="p-2 border-b border-gray-200 font-medium text-sm">
                  Select Columns
                </div>
                {columns.map((col, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.has(index)}
                      onChange={() => toggleColumn(index)}
                      className="rounded"
                    />
                    <span className="text-sm">{col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="text-sm"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          
          {exportable && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="text-sm"
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={isExporting}
                className="text-sm"
                title="Export as CSV"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                CSV
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportToJSON}
                disabled={isExporting}
                className="text-sm"
                title="Export as JSON"
              >
                <FileJson className="h-4 w-4 mr-1" />
                JSON
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                {columns.map((column, index) => {
                  if (!selectedColumns.has(index)) return null;
                  return (
                    <TableHead
                      key={index}
                      className={`group font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 ${
                        sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
                      }`}
                      onClick={() => handleSort(index)}
                    >
                      <div className="flex items-center gap-2 select-none">
                        {column}
                        {sortable && getSortIcon(index)}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={`hover:bg-gray-50/50 transition-colors ${
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/25'
                  }`}
                >
                  {row.map((cell, cellIndex) => {
                    if (!selectedColumns.has(cellIndex)) return null;
                    return (
                      <TableCell
                        key={cellIndex}
                        className="border-r border-gray-100 last:border-r-0 py-3 text-gray-900"
                      >
                        {cell || (
                          <span className="text-gray-400 italic">NULL</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                Showing {Math.min((currentPage - 1) * pageSize + 1, sortedData.length).toLocaleString()} to{' '}
                {Math.min(currentPage * pageSize, sortedData.length).toLocaleString()} of {sortedData.length.toLocaleString()} results
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className="w-8 h-8 p-0 text-sm"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="text-sm"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDataTableV2;
