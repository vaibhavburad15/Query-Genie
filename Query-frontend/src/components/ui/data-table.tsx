import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Download } from 'lucide-react';

interface DataTableProps {
  columns: string[];
  data: (string | number)[][];
  pageSize?: number;
}

export const DataTable = ({ columns, data, pageSize = 10 }: DataTableProps) => {
  const [sortConfig, setSortConfig] = useState<{ column: number; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // ✅ Sorting logic
  const sortedData = useMemo(() => {
    let sorted = [...data];
    if (sortConfig) {
      sorted.sort((a, b) => {
        const aVal = String(a[sortConfig.column]);
        const bVal = String(b[sortConfig.column]);
        if (sortConfig.direction === 'asc') {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      });
    }
    return sorted;
  }, [data, sortConfig]);

  // ✅ Pagination logic
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (columnIndex: number) => {
    setSortConfig(prev =>
      prev?.column === columnIndex && prev.direction === 'asc'
        ? { column: columnIndex, direction: 'desc' }
        : { column: columnIndex, direction: 'asc' }
    );
  };

  // ✅ Export functionality
  const handleExport = (format: 'csv' | 'json') => {
    const content = format === 'csv'
      ? [columns, ...sortedData].map(row => row.join(',')).join('\n')
      : JSON.stringify({ columns, data: sortedData }, null, 2);

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export.${format}`;
    a.click();
  };

  return (
    <div>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  onClick={() => handleSort(idx)}
                  className="cursor-pointer hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    {col}
                    <ArrowUpDown className="w-4 h-4 opacity-50" />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIdx) => (
              <TableRow key={rowIdx} className="hover:bg-muted/50">
                {row.map((cell, cellIdx) => (
                  <TableCell key={cellIdx} className="max-w-xs truncate">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {Math.ceil(sortedData.length / pageSize)}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={(currentPage + 1) * pageSize >= sortedData.length}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleExport('csv')}
            title="Export as CSV"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
