import React, { useState, useEffect } from 'react';
import { AlertCircle, Database, Table, BarChart3, Heart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SqlQueryViewer from './SqlQueryViewer';
import EnhancedDataTable from './EnhancedDataTable';
import queryGenieLogo from '@/assets/query-genie-logo.png';
import { useToast } from '@/hooks/use-toast';

// Helper function to parse SQL output string to structured data
function parseSqlOutput(output: string): {
  type: 'select' | 'status' | 'error' | 'confirmation_required';
  data?: string[][];
  columns?: string[];
  message?: string;
  rowCount?: number;
  table?: {
    columns: string[];
    data: string[][];
  };
  sql?: string;
} | null {
  try {
    const parsed = JSON.parse(output);

    if (parsed?.type === "confirmation_required") {
      return parsed;
    }
  } catch {
    // Not JSON → continue to normal SQL parsing
  }
  console.log('Parsing output:', output);
  try {
    // Extract JSON from Output: {...}
    const match = output.match(/Output:\s*(\{.*\})/s);
    if (match) {
      const jsonString = match[1];
      console.log('Extracted JSON string:', jsonString);

      try {
        const parsed = JSON.parse(jsonString);
        console.log('Parsed structured data:', parsed);
        return parsed;
      } catch (jsonError) {
        console.error('JSON parsing failed:', jsonError);
        return null;
      }
    }

    // Fallback: If no JSON found, assume old format and return as error or status
    console.warn('No structured output found, falling back to legacy parsing');
    return {
      type: 'error',
      message: 'Unable to parse response format'
    };
  } catch (error) {
    console.error('Error parsing output:', error, 'Output was:', output);
    return null;
  }
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
  role?: 'user' | 'ai';
}

interface ChatWindowProps {
  messages: Message[];
  onConnectDatabase: () => void;
  onConfirmSql: (sql: string) => void;
  onCancelSql: () => void;
  userId: number;
  currentQuestion: string;
  refreshFavorites: () => void;
  onFavoriteToggle?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onConnectDatabase,
  onConfirmSql,
  onCancelSql,
  userId,
  currentQuestion,
  refreshFavorites,
  onFavoriteToggle,
}) => {
  const [sqlVisibility, setSqlVisibility] = useState<Record<string, boolean>>({});
  const [confirmationHandled, setConfirmationHandled] = useState<Record<string, boolean>>({});
  const [favoritedQueries, setFavoritedQueries] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  console.log('Rendering ChatWindow with messages:', messages);

  // Check if queries are favorited
  useEffect(() => {
    const checkFavorites = async () => {
      for (const message of messages) {
        if (message.role === 'ai') {
          const sqlMatch = message.content.match(/SQL:\s*[`']([^`']+)[`']/);
          if (sqlMatch) {
            const sql = sqlMatch[1];
            try {
              const response = await fetch(
                `http://localhost:8000/api/favorites/${userId}/check?sql=${encodeURIComponent(sql)}`
              );
              const data = await response.json();
              setFavoritedQueries(prev => ({ ...prev, [message.id]: data.is_favorite }));
            } catch (error) {
              console.error('Failed to check favorite:', error);
            }
          }
        }
      }
    };

    if (userId && messages.length > 0) {
      checkFavorites();
    }
  }, [messages, userId]);

const toggleFavorite = async (messageId: string, question: string, sqlQuery: string) => {
  const isFavorited = favoritedQueries[messageId];

  if (isFavorited) {
    // Remove from favorites
    try {
      const checkResponse = await fetch(
        `http://localhost:8000/api/favorites/${userId}/check?sql=${encodeURIComponent(sqlQuery)}`
      );
      
      if (!checkResponse.ok) {
        throw new Error(`HTTP error! status: ${checkResponse.status}`);
      }
      
      const checkData = await checkResponse.json();

      if (checkData.favorite_id) {
        const deleteResponse = await fetch(
          `http://localhost:8000/api/favorites/${checkData.favorite_id}?user_id=${userId}`, 
          { method: 'DELETE' }
        );
        
        if (!deleteResponse.ok) {
          throw new Error(`HTTP error! status: ${deleteResponse.status}`);
        }
        
        setFavoritedQueries(prev => ({ ...prev, [messageId]: false }));
        
        // ✅ ADD THIS: Notify parent to refresh favorites
        if (onFavoriteToggle) {
          onFavoriteToggle();
        }
        
        toast({
          title: "Removed from favorites",
          description: "Query removed from your favorites.",
        });
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove from favorites.",
        variant: "destructive",
      });
    }
  } else {
    // Add to favorites
    try {
      const payload = {
        user_id: userId,
        question: question || currentQuestion || 'Untitled Query',
        sql_query: sqlQuery,
        tags: 'query',
        description: '',
      };
      
      const response = await fetch('http://localhost:8000/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setFavoritedQueries(prev => ({ ...prev, [messageId]: true }));
        
        // ✅ ADD THIS: Notify parent to refresh favorites
        if (onFavoriteToggle) {
          onFavoriteToggle();
        }
        
        toast({
          title: "Added to favorites",
          description: "Query saved to your favorites.",
        });
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to favorites.",
        variant: "destructive",
      });
    }
  }
};


  const handleExport = async (data: string[][], columns: string[], format: 'csv' | 'json') => {
    try {
      const response = await fetch('http://localhost:8000/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, columns, format }),
      });

      const result = await response.json();

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

        toast({
          title: "Export successful",
          description: `Results exported as ${format.toUpperCase()}`,
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export results. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-16 max-w-3xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-50 h-50 rounded-full mb-6">
                <img src={queryGenieLogo} alt="Query Genie Logo" className="h-20 w-20 object-contain" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Query Genie
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform your natural language questions into powerful database insights. 
                Connect your data source and start exploring with AI-powered queries.
              </p>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Database</h3>
                <p className="text-gray-600 text-sm">Link to MySQL, PostgreSQL, or upload Excel files to get started</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ask Natural Questions</h3>
                <p className="text-gray-600 text-sm">Use plain English like "Show me sales by region" or "Find top customers"</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                  <Table className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Instant Results</h3>
                <p className="text-gray-600 text-sm">View formatted tables, export data, and see the generated SQL queries</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            console.log('Processing message:', message);
            const effectiveType = message.role === 'ai' ? 'assistant' : message.type;
            
            if (effectiveType === 'assistant') {
              const sqlMatch = message.content.match(/SQL:\s*[`']([^`']+)[`']/);
              const parsedOutput = parseSqlOutput(message.content);
              
              // 🟡 CONFIRMATION REQUIRED TABLE
              if (
                parsedOutput?.type === 'confirmation_required' &&
                parsedOutput.table &&
                !confirmationHandled[message.id]
              ) {
                return (
                  <div key={message.id} className="space-y-4">
                    
                    {/* Warning box */}
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-6 py-4 rounded-lg">
                      <p className="font-semibold mb-2">⚠️ Confirmation Required</p>
                      <p className="text-sm">
                        This action will permanently modify the database.
                      </p>
                    </div>

                    {/* Preview Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4">
                        <EnhancedDataTable
                          data={parsedOutput.table.data}
                          columns={parsedOutput.table.columns}
                          pageSize={5}
                          searchable={false}
                          sortable={false}
                          exportable={false}
                        />
                      </div>
                    </div>

                    {/* Confirm / Cancel buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setConfirmationHandled(prev => ({ ...prev, [message.id]: true }));
                          onConfirmSql(parsedOutput.sql!);
                        }}
                      >
                        Confirm & Execute
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setConfirmationHandled(prev => ({ ...prev, [message.id]: true }));
                          onCancelSql();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              }

              if (sqlMatch && parsedOutput) {
                const showSqlQuery = sqlVisibility[message.id] || false;
                const isFavorited = favoritedQueries[message.id] || false;

                if (parsedOutput.type === 'select' && parsedOutput.data) {
                  let columns: string[] = [];
                  
                  if (parsedOutput.columns && parsedOutput.columns.length > 0) {
                    columns = parsedOutput.columns;
                  } else if (parsedOutput.data.length > 0) {
                    columns = parsedOutput.data[0].map((_, idx) => `Column_${idx + 1}`);
                  } else {
                    columns = ['Value'];
                  }
                  
                  const rowCount = parsedOutput.rowCount || parsedOutput.data.length;

                  return (
                    <div key={message.id} className="space-y-4">
                      {/* SQL Query Viewer with Favorite Button */}
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <SqlQueryViewer
                            query={sqlMatch[1]}
                            rowCount={rowCount}
                            isVisible={showSqlQuery}
                            onToggleVisibility={() => setSqlVisibility(prev => ({ ...prev, [message.id]: !prev[message.id] }))}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(message.id, currentQuestion, sqlMatch[1])}
                          className="mt-1"
                        >
                          <Heart
                            className={`h-5 w-5 ${isFavorited ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}`}
                          />
                        </Button>
                      </div>

                      {/* Enhanced Data Table with Export */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Table className="h-4 w-4 text-gray-600" />
                              <h3 className="text-sm font-medium text-gray-900">Query Results</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-gray-500">
                                {rowCount} row{rowCount !== 1 ? 's' : ''} returned
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExport(parsedOutput.data!, columns, 'csv')}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                CSV
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExport(parsedOutput.data!, columns, 'json')}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                JSON
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          <EnhancedDataTable
                            data={parsedOutput.data}
                            columns={columns}
                            totalRows={rowCount}
                            pageSize={10}
                            searchable={true}
                            sortable={true}
                            exportable={false}
                          />
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
                            onToggleVisibility={() => setSqlVisibility(prev => ({ ...prev, [message.id]: !prev[message.id] }))}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(message.id, currentQuestion, sqlMatch[1])}
                          className="mt-1"
                        >
                          <Heart
                            className={`h-5 w-5 ${isFavorited ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}`}
                          />
                        </Button>
                      </div>

                      <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg max-w-[90%] flex items-start gap-3 shadow-sm">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">✓</div>
                        <div>
                          <p className="font-medium">{parsedOutput.message || 'Statement executed successfully'}</p>
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
                          onToggleVisibility={() => setSqlVisibility(prev => ({ ...prev, [message.id]: !prev[message.id] }))}
                        />
                      )}

                      <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg max-w-[90%] flex items-start gap-3 shadow-sm">
                        <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-red-600" />
                        <div>
                          <p className="font-medium whitespace-pre-wrap">{parsedOutput.message || 'An error occurred'}</p>
                        </div>
                      </div>
                    </div>
                  );
                }
              }

              return (
                <div key={message.id} className="flex justify-start">
                  <div className="bg-white border border-gray-200 shadow-sm text-gray-900 px-6 py-4 rounded-lg max-w-[90%] overflow-auto">
                    <pre className="font-mono text-sm whitespace-pre-wrap">
                      {message.content}
                    </pre>
                  </div>
                </div>
              );
            }

            // User messages
            if (effectiveType === 'user') {
              return (
                <div key={message.id} className="flex justify-end">
                  <div className="bg-blue-600 text-white px-6 py-4 rounded-lg max-w-[80%] shadow-sm">
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              );
            }

            // Error messages
            if (effectiveType === 'error') {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg max-w-[80%] flex items-start gap-3 shadow-sm">
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-red-600" />
                    <div className="space-y-3">
                      <p className="font-medium">{message.content}</p>
                      <Button
                        onClick={onConnectDatabase}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-800 hover:bg-red-100"
                      >
                        <Database size={16} className="mr-2" />
                        Connect Database
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
  );
};

export default ChatWindow;