// src/components/dashboard/ChatWindow.tsx
import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  AlertCircle, Database, Table, BarChart3, Heart, Download,
  PieChart, ChevronDown, Check, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SqlQueryViewer from './SqlQueryViewer';
import EnhancedDataTable from './EnhancedDataTable';
import ChartVisualization from './ChartVisualization';
import ConnectionStatusPopup from './ConnectionStatusPopup';
import UserProfile from './UserProfile';
import { useToast } from '@/hooks/use-toast';
import { ChartMessage } from '@/components/chat/Chartmessage';
import { apiFetch } from '@/services/apiClient';

// ─── Skeleton ───────────────────────────────────────────────
export const ChatWindowSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-3/4" />
    <Skeleton className="h-32 w-full" />
  </div>
);

// ─── Chart helpers ───────────────────────────────────────────
function convertToChartFormat(data: string[][], columns: string[]): any[] {
  if (!data || data.length === 0) return [];
  return data.map((row) => {
    const obj: any = {};
    columns.forEach((col, index) => { obj[col] = row[index] || ''; });
    return obj;
  });
}

function inferChartType(data: any[], columns: string[]): 'table' | 'bar' | 'line' | 'pie' {
  if (!data || data.length === 0) return 'table';
  const numericColumns = columns.filter((col) =>
    data.some((row) => !isNaN(Number(row[col])) && row[col] !== '')
  );
  if (numericColumns.length >= 2) return 'bar';
  if (numericColumns.length === 1) return data.length > 10 ? 'line' : 'bar';
  return 'table';
}

interface ParsedSqlOutput {
  type: 'select' | 'status' | 'error' | 'confirmation_required';
  data?: string[][];
  columns?: string[];
  message?: string;
  rowCount?: number;
  limited?: boolean;
  table?: { columns: string[]; data: string[][] };
  sql?: string;
  pending_id?: string;
  operation_type?: string;
  description?: string;
  expires_in_seconds?: number;
}

function parseSqlOutput(output: string): ParsedSqlOutput | null {
  try {
    const parsed = JSON.parse(output);
    if (parsed?.type) return parsed;
  } catch {
    // not raw JSON
  }
  try {
    const match = output.match(/Output:\s*(\{.*\})/s);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    }
    return { type: 'error', message: 'Unable to parse response format' };
  } catch (error) {
    console.error('Error parsing output:', error);
    return null;
  }
}

function getSqlOperation(sql = '') {
  return sql.trim().split(/\s+/)[0]?.toUpperCase() || 'WRITE';
}

function cleanSqlIdentifier(identifier = '') {
  return identifier.replace(/[;`"\[\]]/g, '').split(/\s+/)[0] || '';
}

function getImpactedTable(sql = '') {
  const patterns = [
    /\bDROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([`"\[\]\w.]+)/i,
    /\bTRUNCATE\s+TABLE\s+([`"\[\]\w.]+)/i,
    /\bALTER\s+TABLE\s+([`"\[\]\w.]+)/i,
    /\bUPDATE\s+([`"\[\]\w.]+)/i,
    /\bDELETE\s+FROM\s+([`"\[\]\w.]+)/i,
    /\bINSERT\s+INTO\s+([`"\[\]\w.]+)/i,
    /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"\[\]\w.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = sql.match(pattern);
    if (match?.[1]) return cleanSqlIdentifier(match[1]);
  }

  return '';
}

function getConfirmationDescription(confirmation: ParsedSqlOutput) {
  const operation = (confirmation.operation_type || getSqlOperation(confirmation.sql)).toUpperCase();
  const tableName = getImpactedTable(confirmation.sql);

  if (operation === 'DROP' && tableName) {
    return `This will permanently drop the ${tableName} table and all its data. This action is irreversible.`;
  }

  if (operation === 'TRUNCATE' && tableName) {
    return `This will permanently remove all rows from the ${tableName} table. This action is irreversible.`;
  }

  if (operation === 'DELETE' && tableName) {
    return `This will permanently delete data from the ${tableName} table. This action is irreversible.`;
  }

  const fallback = confirmation.description?.replace(/^[^\w`'"(]+/, '').trim();
  return fallback || 'This action will modify your database and cannot be undone.';
}

interface ConfirmationRequiredCardProps {
  confirmation: ParsedSqlOutput;
  isConfirming: boolean;
  isCancelling: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationRequiredCard = ({
  confirmation,
  isConfirming,
  isCancelling,
  onConfirm,
  onCancel,
}: ConfirmationRequiredCardProps) => {
  const operation = (confirmation.operation_type || getSqlOperation(confirmation.sql)).toUpperCase();
  const tableName = getImpactedTable(confirmation.sql) || 'database object';
  const sql = confirmation.sql?.trim() || 'SQL unavailable';
  const description = getConfirmationDescription(confirmation);
  const actionInProgress = isConfirming || isCancelling;
  const actionDisabled = actionInProgress || !confirmation.pending_id;

  return (
    <div className="flex justify-start">
      <section className="w-full max-w-3xl overflow-hidden rounded-lg border border-zinc-700 bg-[#2f302d] text-zinc-100 shadow-2xl">
        <header className="flex items-start gap-4 border-b border-zinc-700 px-7 py-6">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-500/15 text-red-300">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold leading-6 text-zinc-100">Confirm operation</h3>
            <p className="mt-1 text-sm font-semibold text-zinc-400">
              This action will modify your database and cannot be undone.
            </p>
          </div>
        </header>

        <div className="space-y-6 px-7 py-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-bold uppercase tracking-wide text-red-300">
              {operation}
            </span>
            <span className="text-sm font-semibold text-zinc-300">Table - {tableName}</span>
          </div>

          <p className="text-lg font-bold leading-8 text-zinc-100">
            {description}
          </p>

          <div className="rounded-lg bg-[#232420] px-5 py-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-400">
              SQL that will run
            </p>
            <pre className="overflow-x-auto font-mono text-sm font-semibold leading-6 text-zinc-100">
              <code>{sql}</code>
            </pre>
          </div>
        </div>

        <footer className="flex flex-wrap justify-end gap-3 px-7 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={actionDisabled}
            className="min-w-24 border-zinc-600 bg-transparent text-zinc-100 hover:bg-zinc-800 hover:text-white"
          >
            {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={actionDisabled}
            className="min-w-32 border border-red-400/60 bg-red-500/15 font-bold text-red-200 hover:bg-red-500/25 hover:text-red-100"
          >
            {isConfirming ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Confirm
          </Button>
        </footer>
      </section>
    </div>
  );
};

// ─── Types ───────────────────────────────────────────────────
interface Message {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
  role?: 'user' | 'ai';
}

interface ChatWindowProps {
  messages: Message[];
  onConnectDatabase: () => void;
  onConfirmSql: (pendingId: string) => void | Promise<void>;
  onCancelSql: (pendingId: string) => void | Promise<void>;
  userId: number;
  currentQuestion: string;
  refreshFavorites: () => void;
  onFavoriteToggle?: () => void;
  isConnected?: boolean;
  connectedDatabase?: string;
  databaseType?: string;
  databaseTables?: Array<{ name: string; rowCount: number; lastUpdated: string }>;
}

// ─── Component ───────────────────────────────────────────────
const ChatWindow: React.FC<ChatWindowProps> = memo(
  ({
    messages,
    onConnectDatabase,
    onConfirmSql,
    onCancelSql,
    userId,
    currentQuestion,
    refreshFavorites,
    onFavoriteToggle,
    isConnected = false,
    connectedDatabase = '',
    databaseType = '',
    databaseTables = [],
  }) => {
    const [sqlVisibility, setSqlVisibility] = useState<Record<string, boolean>>({});
    const [confirmationHandled, setConfirmationHandled] = useState<Record<string, boolean>>({});
    const [confirmationAction, setConfirmationAction] = useState<Record<string, 'confirm' | 'cancel'>>({});
    const [favoritedQueries, setFavoritedQueries] = useState<Record<string, boolean>>({});
    const [viewMode, setViewMode] = useState<Record<string, 'table' | 'chart'>>({});
    const [connectionStatusOpen, setConnectionStatusOpen] = useState(false);
    const { toast } = useToast();

    const handleConnectDatabase = useCallback(() => onConnectDatabase(), [onConnectDatabase]);
    const handleConfirmSql = useCallback((pendingId: string) => onConfirmSql(pendingId), [onConfirmSql]);
    const handleCancelSql = useCallback((pendingId: string) => onCancelSql(pendingId), [onCancelSql]);
    const handleRefreshFavorites = useCallback(() => refreshFavorites(), [refreshFavorites]);
    const handleFavoriteToggle = useCallback(() => onFavoriteToggle?.(), [onFavoriteToggle]);

    const runConfirmationAction = useCallback(
      async (
        messageId: string,
        action: 'confirm' | 'cancel',
        pendingId: string,
        callback: (pendingId: string) => void | Promise<void>
      ) => {
        setConfirmationAction((prev) => ({ ...prev, [messageId]: action }));
        try {
          await callback(pendingId);
          setConfirmationHandled((prev) => ({ ...prev, [messageId]: true }));
        } finally {
          setConfirmationAction((prev) => {
            const next = { ...prev };
            delete next[messageId];
            return next;
          });
        }
      },
      []
    );

    // Check which queries are already favorited
    useEffect(() => {
      const checkFavorites = async () => {
        for (const message of messages) {
          if (message.role === 'ai') {
            const sqlMatch = message.content.match(/SQL:\s*[`']([^`']+)[`']/);
            if (sqlMatch) {
              const sql = sqlMatch[1];
              try {
                const res = await apiFetch(
                  `/api/favorites/${userId}/check?sql=${encodeURIComponent(sql)}`
                );
                const data = await res.json();
                setFavoritedQueries((prev) => ({ ...prev, [message.id]: data.is_favorite }));
              } catch {
                // silently ignore
              }
            }
          }
        }
      };
      if (userId && messages.length > 0) checkFavorites();
    }, [messages, userId]);

    const toggleFavorite = async (messageId: string, question: string, sqlQuery: string) => {
      const isFavorited = favoritedQueries[messageId];

      if (isFavorited) {
        try {
          const checkRes = await apiFetch(
            `/api/favorites/${userId}/check?sql=${encodeURIComponent(sqlQuery)}`
          );
          if (!checkRes.ok) throw new Error(`HTTP error ${checkRes.status}`);
          const checkData = await checkRes.json();
          if (checkData.favorite_id) {
            const deleteRes = await apiFetch(
              `/api/favorites/${checkData.favorite_id}?user_id=${userId}`,
              { method: 'DELETE' }
            );
            if (!deleteRes.ok) throw new Error(`HTTP error ${deleteRes.status}`);
            setFavoritedQueries((prev) => ({ ...prev, [messageId]: false }));
            onFavoriteToggle?.();
            toast({ title: 'Removed from favorites', description: 'Query removed from your favorites.' });
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to remove from favorites.',
            variant: 'destructive',
          });
        }
      } else {
        try {
          const payload = {
            user_id: userId,
            question: question || currentQuestion || 'Untitled Query',
            sql_query: sqlQuery,
            tags: 'query',
            description: '',
          };
          const res = await apiFetch('/api/favorites', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`HTTP error ${res.status}: ${await res.text()}`);
          const data = await res.json();
          if (data.success) {
            setFavoritedQueries((prev) => ({ ...prev, [messageId]: true }));
            onFavoriteToggle?.();
            toast({ title: 'Added to favorites', description: 'Query saved to your favorites.' });
          } else {
            throw new Error(data.message || 'Unknown error');
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to add to favorites.',
            variant: 'destructive',
          });
        }
      }
    };

    const handleExport = async (data: string[][], columns: string[], format: 'csv' | 'json') => {
      try {
        const res = await apiFetch('/api/export', {
          method: 'POST',
          body: JSON.stringify({ data, columns, format }),
        });
        const result = await res.json();
        if (result.success) {
          const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
          const blob = new Blob([result.data], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast({ title: 'Export successful', description: `Results exported as ${format.toUpperCase()}` });
        }
      } catch {
        toast({ title: 'Export failed', description: 'Failed to export results. Please try again.', variant: 'destructive' });
      }
    };

    return (
      <>
        <ConnectionStatusPopup
          isOpen={connectionStatusOpen}
          onClose={() => setConnectionStatusOpen(false)}
          databaseName={connectedDatabase || 'Database'}
          tables={databaseTables || []}
        />

        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-purple-50/20 to-gray-50">
          <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-end backdrop-blur-sm bg-white/40 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                {isConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConnectionStatusOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:bg-green-100 shadow-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">
                      Connected to {connectedDatabase}
                    </span>
                    {databaseType && (
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-700 font-medium">
                        {databaseType}
                      </span>
                    )}
                    <span className="text-xs bg-white/80 px-2 py-1 rounded-full text-gray-600 font-semibold">
                      {databaseTables.length} tables
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
                <UserProfile />
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto p-4 flex justify-center min-h-0">
              <div className="max-w-4xl mx-auto space-y-6 w-full">
                {messages.length === 0 ? (
                  <div className="text-center py-12 max-w-4xl mx-auto">
                    <div className="mb-8">
                      <h2 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent mb-4 leading-tight">
                        Welcome to Query Genie
                      </h2>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Transform natural language into powerful SQL queries. Get instant insights without writing code.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                      {/* Card 1 */}
                      <div className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 shadow-lg border border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">1</div>
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Database className="h-6 w-6 text-blue-600" strokeWidth={2.5} />
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-3">Connect Your Database</h3>
                          <p className="text-gray-600 leading-relaxed">
                            Connect to SQL databases, spreadsheets, or metadata sources in one place.
                          </p>
                        </div>
                      </div>

                      {/* Card 2 */}
                      <div className="group relative bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-6 shadow-lg border border-green-100 hover:border-green-300 hover:shadow-xl transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">2</div>
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <BarChart3 className="h-6 w-6 text-green-600" strokeWidth={2.5} />
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-3">Ask Natural Questions</h3>
                          <p className="text-gray-600 leading-relaxed">
                            Use plain English like "Show me sales by region" or "Find top customers"
                          </p>
                        </div>
                      </div>

                      {/* Card 3 */}
                      <div className="group relative bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-6 shadow-lg border border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">3</div>
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Table className="h-6 w-6 text-purple-600" strokeWidth={2.5} />
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-3">Get Instant Results</h3>
                          <p className="text-gray-600 leading-relaxed">
                            View formatted tables, export data, and see generated SQL queries instantly
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const effectiveType = message.role === 'ai' ? 'assistant' : message.type;

                    if (effectiveType === 'assistant') {
                      const sqlMatch = message.content.match(/SQL:\s*[`']([^`']+)[`']/);
                      const parsedOutput = parseSqlOutput(message.content);

                      // Confirmation required
                      if (
                        parsedOutput?.type === 'confirmation_required' &&
                        parsedOutput.pending_id &&
                        !confirmationHandled[message.id]
                      ) {
                        const currentAction = confirmationAction[message.id];
                        return (
                          <ConfirmationRequiredCard
                            key={message.id}
                            confirmation={parsedOutput}
                            isConfirming={currentAction === 'confirm'}
                            isCancelling={currentAction === 'cancel'}
                            onConfirm={() =>
                              runConfirmationAction(
                                message.id,
                                'confirm',
                                parsedOutput.pending_id!,
                                handleConfirmSql
                              )
                            }
                            onCancel={() =>
                              runConfirmationAction(
                                message.id,
                                'cancel',
                                parsedOutput.pending_id!,
                                handleCancelSql
                              )
                            }
                          />
                        );
                      }

                      if (sqlMatch && parsedOutput) {
                        const showSqlQuery = sqlVisibility[message.id] || false;
                        const isFavorited = favoritedQueries[message.id] || false;
                        const currentViewMode = viewMode[message.id] || 'table';

                        if (parsedOutput.type === 'select' && parsedOutput.data) {
                          const columns: string[] =
                            parsedOutput.columns && parsedOutput.columns.length > 0
                              ? parsedOutput.columns
                              : parsedOutput.data.length > 0
                              ? parsedOutput.data[0].map((_, idx) => `Column_${idx + 1}`)
                              : ['Value'];

                          const rowCount = parsedOutput.rowCount || parsedOutput.data.length;
                          const chartData = convertToChartFormat(parsedOutput.data, columns);
                          const suggestedChartType = inferChartType(chartData, columns);

                          return (
                            <div key={message.id} className="space-y-4">
                              <div className="flex items-start gap-2">
                                <div className="flex-1">
                                  <SqlQueryViewer
                                    query={sqlMatch[1]}
                                    rowCount={rowCount}
                                    isVisible={showSqlQuery}
                                    onToggleVisibility={() =>
                                      setSqlVisibility((prev) => ({ ...prev, [message.id]: !prev[message.id] }))
                                    }
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFavorite(message.id, currentQuestion, sqlMatch[1])}
                                  className="mt-1 hover:bg-pink-50"
                                >
                                  <Heart
                                    className={`h-5 w-5 transition-all ${
                                      isFavorited ? 'fill-pink-500 text-pink-500 scale-110' : 'text-gray-400 hover:text-pink-400'
                                    }`}
                                  />
                                </Button>
                              </div>

                              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                                        <Button
                                          variant={currentViewMode === 'table' ? 'default' : 'ghost'}
                                          size="sm"
                                          onClick={() => setViewMode((prev) => ({ ...prev, [message.id]: 'table' }))}
                                          className="h-9 px-4 transition-all"
                                        >
                                          <Table className="h-4 w-4 mr-2" />Table
                                        </Button>
                                        <Button
                                          variant={currentViewMode === 'chart' ? 'default' : 'ghost'}
                                          size="sm"
                                          onClick={() => setViewMode((prev) => ({ ...prev, [message.id]: 'chart' }))}
                                          className="h-9 px-4 transition-all"
                                        >
                                          <PieChart className="h-4 w-4 mr-2" />Chart
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-sm text-gray-600 font-medium bg-white px-3 py-1.5 rounded-lg shadow-sm">
                                        {rowCount} row{rowCount !== 1 ? 's' : ''}
                                        {parsedOutput.limited && (
                                          <span className="ml-1 text-amber-600">(limited)</span>
                                        )}
                                      </div>
                                      <Button
                                        variant="outline" size="sm"
                                        onClick={() => handleExport(parsedOutput.data!, columns, 'csv')}
                                        className="shadow-sm hover:shadow-md transition-shadow"
                                      >
                                        <Download className="h-4 w-4 mr-2" />CSV
                                      </Button>
                                      <Button
                                        variant="outline" size="sm"
                                        onClick={() => handleExport(parsedOutput.data!, columns, 'json')}
                                        className="shadow-sm hover:shadow-md transition-shadow"
                                      >
                                        <Download className="h-4 w-4 mr-2" />JSON
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {chartData.length > 0 && (
                                  <ChartMessage data={chartData} query={sqlMatch[1]} chartType={suggestedChartType} />
                                )}

                                <div className="p-6">
                                  {currentViewMode === 'table' ? (
                                    <EnhancedDataTable
                                      data={parsedOutput.data}
                                      columns={columns}
                                      totalRows={rowCount}
                                      pageSize={10}
                                      searchable={true}
                                      sortable={true}
                                      exportable={false}
                                    />
                                  ) : (
                                    <ChartVisualization data={parsedOutput.data} columns={columns} />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        } else if (parsedOutput.type === 'status') {
                          return (
                            <div key={message.id} className="space-y-4">
                              <div className="flex items-start gap-2">
                                <div className="flex-1">
                                  <SqlQueryViewer
                                    query={sqlMatch[1]}
                                    rowCount={0}
                                    isVisible={showSqlQuery}
                                    onToggleVisibility={() =>
                                      setSqlVisibility((prev) => ({ ...prev, [message.id]: !prev[message.id] }))
                                    }
                                  />
                                </div>
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => toggleFavorite(message.id, currentQuestion, sqlMatch[1])}
                                  className="mt-1 hover:bg-pink-50"
                                >
                                  <Heart
                                    className={`h-5 w-5 transition-all ${
                                      isFavorited ? 'fill-pink-500 text-pink-500 scale-110' : 'text-gray-400 hover:text-pink-400'
                                    }`}
                                  />
                                </Button>
                              </div>
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 text-green-900 px-6 py-4 rounded-xl max-w-[95%] flex items-start gap-3 shadow-lg">
                                <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">✓</div>
                                <div>
                                  <p className="font-semibold">{parsedOutput.message || 'Statement executed successfully'}</p>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (parsedOutput.type === 'error') {
                          return (
                            <div key={message.id} className="space-y-4">
                              {sqlMatch && (
                                <SqlQueryViewer
                                  query={sqlMatch[1]}
                                  rowCount={0}
                                  isVisible={showSqlQuery}
                                  onToggleVisibility={() =>
                                    setSqlVisibility((prev) => ({ ...prev, [message.id]: !prev[message.id] }))
                                  }
                                />
                              )}
                              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-300 text-red-900 px-6 py-4 rounded-xl max-w-[95%] flex items-start gap-3 shadow-lg">
                                <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-red-600" strokeWidth={2.5} />
                                <div>
                                  <p className="font-semibold whitespace-pre-wrap">{parsedOutput.message || 'An error occurred'}</p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      }

                      // Fallback plain text assistant message
                      return (
                        <div key={message.id} className="flex justify-start">
                          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg text-gray-900 px-6 py-4 rounded-xl max-w-[95%] overflow-auto">
                            <pre className="font-mono text-base whitespace-pre-wrap">{message.content}</pre>
                          </div>
                        </div>
                      );
                    }

                    // User message
                    if (effectiveType === 'user') {
                      return (
                        <div key={message.id} className="flex justify-end">
                          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-xl max-w-[90%] shadow-lg">
                            <p className="text-base font-medium">{message.content}</p>
                          </div>
                        </div>
                      );
                    }

                    // Error message
                    if (effectiveType === 'error') {
                      return (
                        <div key={message.id} className="flex justify-center">
                          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-300 text-red-900 px-6 py-4 rounded-xl max-w-[90%] flex items-start gap-3 shadow-lg">
                            <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-red-600" strokeWidth={2.5} />
                            <div className="space-y-3">
                              <p className="font-semibold">{message.content}</p>
                              <Button
                                onClick={handleConnectDatabase}
                                variant="outline" size="sm"
                                className="border-red-300 text-red-800 hover:bg-red-100 shadow-sm"
                              >
                                <Database size={16} className="mr-2" />Connect Database
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },
  (prev, next) =>
    prev.messages === next.messages &&
    prev.isConnected === next.isConnected &&
    prev.connectedDatabase === next.connectedDatabase &&
    prev.databaseType === next.databaseType &&
    prev.databaseTables === next.databaseTables &&
    prev.userId === next.userId &&
    prev.currentQuestion === next.currentQuestion
);

export default ChatWindow;
