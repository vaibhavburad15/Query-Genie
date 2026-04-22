import { useState, useEffect } from 'react';
import { Database, X, Table, Key, Clock, Activity, Hash, Type, Calendar, ToggleLeft, ChevronDown, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiFetch } from '@/services/apiClient';

interface TableColumn {
  name: string;
  type: string;
  key?: string;
  nullable?: boolean;
  default?: string;
  autoincrement?: boolean;
}

interface TableSchema {
  name: string;
  columns: TableColumn[];
}

interface Table {
  name: string;
  rowCount: number;
  lastUpdated: string;
}

interface ConnectionStatusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  databaseName: string;
  tables: Table[];
  isLoading?: boolean;
  onSwitchDatabase?: () => void;
  onDisconnect?: () => void;
}

const ConnectionStatusPopup: React.FC<ConnectionStatusPopupProps> = ({
  isOpen,
  onClose,
  databaseName,
  tables,
  isLoading = false,
  onSwitchDatabase,
  onDisconnect,
}) => {
  const [expandedTableSchemas, setExpandedTableSchemas] = useState<Map<string, TableSchema>>(new Map());
  const [loadingSchemas, setLoadingSchemas] = useState<Set<string>>(new Set());
  const [connectionTime] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setExpandedTableSchemas(new Map());
      setLoadingSchemas(new Set());
    }
  }, [isOpen]);

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((currentTime.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const fetchTableSchema = async (tableName: string): Promise<TableSchema | null> => {
    try {
      const response = await apiFetch(`/api/table-schema/${encodeURIComponent(tableName)}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.columns) {
          return { 
            name: tableName, 
            columns: data.columns 
          };
        }
      }
      
      return null;
    } catch (err) {
      console.error(`Error fetching schema for ${tableName}:`, err);
      return null;
    }
  };

  const handleTableClick = async (tableName: string) => {
    if (expandedTableSchemas.has(tableName)) {
      const newSchemas = new Map(expandedTableSchemas);
      newSchemas.delete(tableName);
      setExpandedTableSchemas(newSchemas);
      return;
    }

    setLoadingSchemas(new Set(loadingSchemas).add(tableName));
    
    const schema = await fetchTableSchema(tableName);
    
    if (schema) {
      const newSchemas = new Map(expandedTableSchemas);
      newSchemas.set(tableName, schema);
      setExpandedTableSchemas(newSchemas);
    }
    
    const newLoading = new Set(loadingSchemas);
    newLoading.delete(tableName);
    setLoadingSchemas(newLoading);
  };

  const getTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('int') || lowerType.includes('decimal') || lowerType.includes('float') || lowerType.includes('double')) {
      return { icon: Hash, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    }
    if (lowerType.includes('char') || lowerType.includes('text') || lowerType.includes('varchar')) {
      return { icon: Type, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' };
    }
    if (lowerType.includes('date') || lowerType.includes('time')) {
      return { icon: Calendar, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    }
    if (lowerType.includes('bool') || lowerType.includes('bit')) {
      return { icon: ToggleLeft, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
    }
    return { icon: Database, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30' };
  };

  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          {/* Premium Header - Fixed */}
          <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-8 overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
              <div className="absolute top-0 right-0 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
              <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>
            
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}></div>

            <div className="relative flex items-start gap-5">
              <div className="
                relative bg-white/20 dark:bg-white/10 p-4 rounded-2xl
                backdrop-blur-xl shadow-2xl
                border border-white/30
                group/icon hover:scale-110 transition-transform duration-300
              ">
                <Database className="h-8 w-8 text-white" strokeWidth={2.5} />
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-3xl font-black text-white mb-3 tracking-tight">
                  {databaseName}
                </DialogTitle>
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="
                    flex items-center gap-2 
                    bg-white/20 dark:bg-white/10 
                    backdrop-blur-md px-3 py-1.5 rounded-xl
                    border border-white/20
                    shadow-lg
                  ">
                    <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
                    <span className="text-sm font-bold text-white">Active Connection</span>
                  </div>

                  <div className="
                    flex items-center gap-2 
                    bg-white/20 dark:bg-white/10 
                    backdrop-blur-md px-3 py-1.5 rounded-xl
                    border border-white/20
                    shadow-lg
                  ">
                    <Table className="h-4 w-4 text-white" strokeWidth={2.5} />
                    <span className="text-sm font-bold text-white">{tables.length} Tables</span>
                  </div>

                  <div className="
                    flex items-center gap-2 
                    bg-white/20 dark:bg-white/10 
                    backdrop-blur-md px-3 py-1.5 rounded-xl
                    border border-white/20
                    shadow-lg
                  ">
                    <Clock className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    <span className="text-sm font-bold text-white">{getTimeAgo(connectionTime)}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="
                  relative bg-white/20 hover:bg-white/30 backdrop-blur-md
                  p-3 rounded-xl transition-all duration-300
                  hover:rotate-90 hover:scale-110
                  border border-white/20
                  shadow-lg
                  group/close
                "
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-white" strokeWidth={3} />
                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover/close:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>

          {/* Scrollable Modal Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 text-center border-2 border-blue-200/60 dark:border-blue-800/40">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tables.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Tables</div>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-800/10 rounded-xl p-4 text-center border-2 border-teal-200/60 dark:border-teal-800/40">
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {totalRows.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Rows</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-4 text-center border-2 border-green-200/60 dark:border-green-800/40">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">✓</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{getTimeAgo(connectionTime)}</div>
                </div>
              </div>

              {/* Section Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1 tracking-tight">
                      Database Schema
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Explore {tables.length} {tables.length === 1 ? 'table' : 'tables'} and their structure
                    </p>
                  </div>
                </div>
              </div>

              {/* Tables List */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Loading tables...</p>
                </div>
              ) : tables.length === 0 ? (
                <div className="text-center py-20 px-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <Database className="w-10 h-10 text-gray-400 dark:text-gray-500" strokeWidth={2} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">No Tables Found</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This database is empty.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tables.map((table) => {
                    const isExpanded = expandedTableSchemas.has(table.name);
                    const isLoadingSchema = loadingSchemas.has(table.name);
                    const schema = expandedTableSchemas.get(table.name);

                    return (
                      <div 
                        key={table.name}
                        className="
                          group/table 
                          bg-white dark:bg-gray-800/50 
                          rounded-2xl 
                          border-2 border-gray-200/60 dark:border-gray-700/50
                          overflow-hidden 
                          hover:border-emerald-300 dark:hover:border-emerald-700
                          hover:shadow-2xl hover:shadow-emerald-500/10
                          transition-all duration-300
                        "
                      >
                        {/* Table Header */}
                        <button
                          onClick={() => handleTableClick(table.name)}
                          className="
                            w-full flex items-center gap-4 px-5 py-4
                            hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50
                            dark:hover:from-emerald-950/20 dark:hover:to-teal-950/20
                            transition-all duration-300
                            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset
                          "
                        >
                          <div className="
                            relative w-12 h-12 
                            bg-gradient-to-br from-emerald-500 to-teal-500 
                            rounded-xl flex items-center justify-center flex-shrink-0
                            shadow-lg shadow-emerald-500/30
                            group-hover/table:scale-110 group-hover/table:rotate-3
                            transition-all duration-300
                          ">
                            <Table className="h-6 w-6 text-white" strokeWidth={2.5} />
                          </div>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="font-mono text-base font-bold text-gray-900 dark:text-gray-50 truncate mb-0.5">
                              {table.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {table.rowCount.toLocaleString()} rows
                              {schema && ` • ${schema.columns.length} columns • ${schema.columns.filter(c => c.key === 'PRI').length} primary keys`}
                            </p>
                          </div>
                          
                          {isLoadingSchema ? (
                            <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <ChevronDown 
                              className={`
                                h-6 w-6 text-gray-400 dark:text-gray-500
                                transition-all duration-500
                                ${isExpanded ? 'rotate-180 text-emerald-500 scale-110' : 'group-hover/table:translate-y-1'}
                              `}
                              strokeWidth={2.5}
                            />
                          )}
                        </button>

                        {/* Table Schema - Expanded */}
                        {isExpanded && schema && (
                          <div className="
                            px-5 pb-5 pt-2
                            bg-gradient-to-br from-gray-50 to-gray-100/50
                            dark:from-gray-900/50 dark:to-gray-800/50
                            border-t-2 border-gray-200/60 dark:border-gray-700/50
                          ">
                            <div className="
                              grid grid-cols-[2fr_1fr_1fr] gap-3
                              px-4 py-3 mb-2
                              bg-white/60 dark:bg-gray-800/60
                              rounded-xl
                              border border-gray-200 dark:border-gray-700
                            ">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                Column Name
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 text-center">
                                DataType
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">
                                Constraints
                              </span>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                              {schema.columns.map((column, idx) => {
                                const typeInfo = getTypeIcon(column.type);
                                const TypeIcon = typeInfo.icon;
                                
                                return (
                                  <div 
                                    key={idx}
                                    className="
                                      group/column
                                      grid grid-cols-[2fr_1fr_1fr] gap-3 items-center
                                      px-4 py-3 rounded-xl
                                      bg-white dark:bg-gray-800/50
                                      border-2 border-gray-200/60 dark:border-gray-700/50
                                      hover:border-emerald-300 dark:hover:border-emerald-700
                                      hover:shadow-lg hover:shadow-emerald-500/10
                                      transition-all duration-300
                                    "
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className={`
                                        w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                                        ${typeInfo.bg}
                                        group-hover/column:scale-110 transition-transform duration-300
                                      `}>
                                        <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} strokeWidth={2.5} />
                                      </div>
                                      <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-50 truncate">
                                        {column.name}
                                      </span>
                                    </div>

                                    <div className="flex justify-center">
                                      <span className="
                                        px-3 py-1.5 rounded-lg text-xs font-mono font-bold
                                        bg-gray-100 dark:bg-gray-900/50
                                        text-gray-700 dark:text-gray-300
                                        border border-gray-200 dark:border-gray-700
                                        whitespace-nowrap
                                      ">
                                        {column.type.toLowerCase()}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 justify-end flex-wrap">
                                      {column.key === 'PRI' && (
                                        <span className="
                                          px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg
                                          bg-gradient-to-r from-amber-100 to-yellow-100
                                          dark:from-amber-900/30 dark:to-yellow-900/30
                                          text-amber-700 dark:text-amber-300
                                          border-2 border-amber-200 dark:border-amber-800/50
                                          shadow-sm shadow-amber-500/20
                                          flex items-center gap-1.5
                                        ">
                                          <Key className="w-3 h-3" strokeWidth={3} />
                                          PK
                                        </span>
                                      )}
                                      {column.key === 'MUL' && (
                                        <span className="
                                          px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg
                                          bg-gradient-to-r from-blue-100 to-indigo-100
                                          dark:from-blue-900/30 dark:to-indigo-900/30
                                          text-blue-700 dark:text-blue-300
                                          border-2 border-blue-200 dark:border-blue-800/50
                                          shadow-sm shadow-blue-500/20
                                        ">
                                          FK
                                        </span>
                                      )}
                                      {column.key === 'UNI' && (
                                        <span className="
                                          px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg
                                          bg-gradient-to-r from-purple-100 to-pink-100
                                          dark:from-purple-900/30 dark:to-pink-900/30
                                          text-purple-700 dark:text-purple-300
                                          border-2 border-purple-200 dark:border-purple-800/50
                                          shadow-sm shadow-purple-500/20
                                        ">
                                          UNQ
                                        </span>
                                      )}
                                      {!column.nullable && !column.key && (
                                        <span className="
                                          px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg
                                          bg-gray-100 dark:bg-gray-800
                                          text-gray-600 dark:text-gray-400
                                          border-2 border-gray-200 dark:border-gray-700
                                        ">
                                          NOT NULL
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700 flex gap-3">
                {onSwitchDatabase && (
                  <Button
                    onClick={() => {
                      onClose();
                      onSwitchDatabase();
                    }}
                    className="
                      group/btn flex-1 relative overflow-hidden
                      flex items-center justify-center gap-3
                      px-6 py-6 rounded-xl
                      text-sm font-bold
                      bg-gradient-to-r from-emerald-600 to-teal-600
                      hover:from-emerald-500 hover:to-teal-500
                      text-white
                      shadow-xl shadow-emerald-500/30
                      hover:shadow-2xl hover:shadow-emerald-500/40
                      hover:scale-105
                      transition-all duration-300
                    "
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                    <Database className="h-5 w-5 relative z-10 group-hover/btn:rotate-12 transition-transform duration-300" strokeWidth={2.5} />
                    <span className="relative z-10">Switch Database</span>
                  </Button>
                )}
                
                {onDisconnect && (
                  <Button
                    onClick={() => {
                      onClose();
                      onDisconnect();
                    }}
                    variant="destructive"
                    className="
                      group/btn flex-1 relative overflow-hidden
                      flex items-center justify-center gap-3
                      px-6 py-6 rounded-xl
                      text-sm font-bold
                      bg-gradient-to-r from-red-600 to-rose-600
                      hover:from-red-500 hover:to-rose-500
                      shadow-xl shadow-red-500/30
                      hover:shadow-2xl hover:shadow-red-500/40
                      hover:scale-105
                      transition-all duration-300
                    "
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                    <Power className="h-5 w-5 relative z-10 group-hover/btn:rotate-180 transition-transform duration-500" strokeWidth={2.5} />
                    <span className="relative z-10">Disconnect</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
};

export default ConnectionStatusPopup;
