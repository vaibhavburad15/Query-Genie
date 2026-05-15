import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSpreadsheet,
  FolderUp,
  Loader2,
  Plus,
  Server,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetch } from '@/services/apiClient';
import {
  DATABASE_SOURCES,
  DEFAULT_DATABASE_SOURCE,
  getDatabaseSource,
} from '@/lib/dataSources';
import { ConnectDatabasePayload } from '@/contexts/DatabaseContext';

interface DatabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (data: ConnectDatabasePayload) => Promise<void>;
}

interface ConnectionFormState {
  type: string;
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
  path: string;
  file: File | null;
}

interface ConnectionError {
  error: string;
  message: string;
  suggestion?: string;
  code?: string;
}

type ConnectionStep = 'details' | 'database-selection';

const TYPE_DEFAULTS: Record<
  string,
  Pick<ConnectionFormState, 'host' | 'port' | 'user' | 'database' | 'path'>
> = {
  mysql: { host: '127.0.0.1', port: '3306', user: 'root', database: '', path: '' },
  postgresql: { host: '127.0.0.1', port: '5432', user: 'postgres', database: '', path: '' },
  mariadb: { host: '127.0.0.1', port: '3306', user: 'root', database: '', path: '' },
  oracle: { host: '127.0.0.1', port: '1521', user: '', database: '', path: '' },
  sqlserver: { host: '127.0.0.1', port: '1433', user: 'sa', database: '', path: '' },
  db2: { host: '127.0.0.1', port: '50000', user: '', database: '', path: '' },
  sqlite: { host: '', port: '', user: '', database: '', path: '' },
  mongodb: { host: '127.0.0.1', port: '27017', user: '', database: '', path: '' },
  redis: { host: '127.0.0.1', port: '6379', user: '', database: '0', path: '' },
  csv: { host: '', port: '', user: '', database: '', path: '' },
  excel: { host: '', port: '', user: '', database: '', path: '' },
};

const createInitialState = (): ConnectionFormState => ({
  type: DEFAULT_DATABASE_SOURCE.type,
  host: TYPE_DEFAULTS.mysql.host,
  port: TYPE_DEFAULTS.mysql.port,
  user: TYPE_DEFAULTS.mysql.user,
  password: '',
  database: '',
  path: '',
  file: null,
});

export const DatabaseConnectionModal = ({
  isOpen,
  onClose,
  onConnect,
}: DatabaseConnectionModalProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<ConnectionStep>('details');
  const [form, setForm] = useState<ConnectionFormState>(createInitialState);
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDatabaseName, setNewDatabaseName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingDatabase, setIsCreatingDatabase] = useState(false);

  const source = useMemo(() => getDatabaseSource(form.type), [form.type]);

  const updateForm = (field: keyof ConnectionFormState, value: string | File | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setConnectionError(null);
  };

  const handleSourceChange = (type: string) => {
    const defaults = TYPE_DEFAULTS[type] ?? TYPE_DEFAULTS.mysql;
    setForm((prev) => ({
      ...prev,
      type,
      host: defaults.host,
      port: defaults.port,
      user: defaults.user,
      password: '',
      database: defaults.database,
      path: defaults.path,
      file: null,
    }));
    setCurrentStep('details');
    setAvailableDatabases([]);
    setSelectedDatabase('');
    setConnectionError(null);
    setCreateError(null);
  };

  const buildServerPayload = () => ({
    type: form.type,
    host: form.host.trim(),
    port: form.port ? parseInt(form.port, 10) : undefined,
    user: form.user.trim(),
    password: form.password,
  });

  const validateDetails = (forListing: boolean) => {
    if (source.category === 'file') {
      if (!form.file) {
        throw new Error(`Please choose a ${source.shortLabel} file to upload.`);
      }
      return;
    }

    if (source.type === 'sqlite') {
      if (!form.path.trim()) {
        throw new Error('Please enter the SQLite file path.');
      }
      return;
    }

    if (!form.host.trim()) {
      throw new Error('Please enter the server host.');
    }

    if (source.defaultPort) {
      const portNum = parseInt(form.port, 10);
      if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
        throw new Error('Port must be a number between 1 and 65535.');
      }
    }

    if (forListing) {
      if (source.type !== 'redis' && !form.user.trim() && source.type !== 'mongodb') {
        throw new Error('Please enter the database username.');
      }
      return;
    }

    if (!source.supportsListing && !form.database.trim() && source.type !== 'redis') {
      throw new Error(`Please enter the ${source.databaseLabel.toLowerCase()}.`);
    }
  };

  const handleListDatabases = async () => {
    try {
      validateDetails(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Missing Details',
        description: error.message,
      });
      return;
    }

    setConnectionError(null);
    setIsLoadingDatabases(true);

    try {
      const response = await apiFetch('/api/list-databases', {
        method: 'POST',
        body: JSON.stringify(buildServerPayload()),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setConnectionError({
          error: data.error || 'Connection Error',
          message: data.message || data.error || 'Unable to list available databases.',
          suggestion: data.suggestion,
          code: data.code,
        });
        return;
      }

      setAvailableDatabases(data.databases || []);
      setCurrentStep('database-selection');
      toast({
        title: 'Server Connected',
        description: `Found ${data.databases?.length || 0} available source(s).`,
      });
    } catch (error: any) {
      setConnectionError({
        error: 'Network Error',
        message: error?.message || 'Unable to reach the backend server.',
      });
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const buildDirectConnectPayload = (): ConnectDatabasePayload => ({
    type: form.type,
    host: form.host.trim(),
    port: form.port,
    user: form.user.trim(),
    password: form.password,
    database:
      source.category === 'file'
        ? form.file?.name || form.database || source.shortLabel
        : form.database.trim(),
    path: form.path.trim(),
    file: form.file,
  });

  const handleConnect = async () => {
    try {
      validateDetails(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Missing Details',
        description: error.message,
      });
      return;
    }

    if (source.supportsListing && !selectedDatabase) {
      toast({
        variant: 'destructive',
        title: 'Database Required',
        description: 'Please select a database to connect to.',
      });
      return;
    }

    setConnectionError(null);
    setIsConnecting(true);

    try {
      await onConnect(
        source.supportsListing
          ? {
              type: form.type,
              host: form.host.trim(),
              port: form.port,
              user: form.user.trim(),
              password: form.password,
              database: selectedDatabase,
            }
          : buildDirectConnectPayload()
      );
      handleClose();
    } catch (error: any) {
      setConnectionError({
        error: 'Connection Error',
        message: error?.message || 'Failed to connect to the selected source.',
      });
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: error?.message || 'Could not connect to the selected source.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateDatabase = async () => {
    const dbName = newDatabaseName.trim();

    if (!dbName) {
      setCreateError('Database name is required.');
      return;
    }

    setCreateError(null);
    setIsCreatingDatabase(true);

    try {
      const response = await apiFetch('/api/create-database', {
        method: 'POST',
        body: JSON.stringify({
          ...buildServerPayload(),
          database_name: dbName,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setCreateError(data.message || data.error || 'Failed to create database.');
        return;
      }

      setAvailableDatabases((prev) => [...prev, dbName].sort());
      setSelectedDatabase(dbName);
      setNewDatabaseName('');
      setShowCreateDialog(false);
      toast({
        title: 'Database Created',
        description: `${dbName} is ready to use.`,
      });
    } catch (error: any) {
      setCreateError(error?.message || 'Failed to create database.');
    } finally {
      setIsCreatingDatabase(false);
    }
  };

  const handleBack = () => {
    setCurrentStep('details');
    setSelectedDatabase('');
    setConnectionError(null);
  };

  const handleClose = () => {
    setCurrentStep('details');
    setForm(createInitialState());
    setAvailableDatabases([]);
    setSelectedDatabase('');
    setConnectionError(null);
    setShowCreateDialog(false);
    setNewDatabaseName('');
    setCreateError(null);
    onClose();
  };

  const renderSourceDetails = () => {
    if (source.category === 'file') {
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="source-file">{source.databaseLabel}</Label>
            <Input
              id="source-file"
              type="file"
              accept={source.fileAccept}
              disabled={isConnecting}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                updateForm('file', file);
                updateForm('database', file?.name || '');
              }}
            />
            <p className="text-xs text-muted-foreground">{source.helperText}</p>
          </div>

          {form.file && (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              Selected file: <span className="font-medium">{form.file.name}</span>
            </div>
          )}
        </>
      );
    }

    if (source.type === 'sqlite') {
      return (
        <div className="space-y-2">
          <Label htmlFor="sqlite-path">{source.databaseLabel}</Label>
          <Input
            id="sqlite-path"
            value={form.path}
            onChange={(event) => updateForm('path', event.target.value)}
            placeholder={source.databasePlaceholder}
            disabled={isConnecting}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">{source.helperText}</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              value={form.host}
              onChange={(event) => updateForm('host', event.target.value)}
              placeholder="127.0.0.1"
              disabled={isLoadingDatabases || isConnecting}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              value={form.port}
              onChange={(event) => updateForm('port', event.target.value)}
              placeholder={source.defaultPort || ''}
              disabled={isLoadingDatabases || isConnecting}
              className="font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="user">Username</Label>
            <Input
              id="user"
              value={form.user}
              onChange={(event) => updateForm('user', event.target.value)}
              placeholder="Enter username"
              disabled={isLoadingDatabases || isConnecting}
              className="font-mono"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(event) => updateForm('password', event.target.value)}
              placeholder="Enter password"
              disabled={isLoadingDatabases || isConnecting}
              autoComplete="current-password"
            />
          </div>
        </div>

        {!source.supportsListing && (
          <div className="space-y-2">
            <Label htmlFor="database-name">{source.databaseLabel}</Label>
            <Input
              id="database-name"
              value={form.database}
              onChange={(event) => updateForm('database', event.target.value)}
              placeholder={source.databasePlaceholder}
              disabled={isConnecting}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">{source.helperText}</p>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {currentStep === 'database-selection' ? 'Select Database' : 'Connect a Data Source'}
            </DialogTitle>
            <DialogDescription>
              {currentStep === 'database-selection'
                ? `Choose the ${source.shortLabel} database you want to query.`
                : 'Pick a source type and enter the connection details that source needs.'}
            </DialogDescription>
          </DialogHeader>

          {connectionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{connectionError.error}</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>{connectionError.message}</p>
                  {connectionError.suggestion && (
                    <p className="text-xs text-muted-foreground">{connectionError.suggestion}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-2">
            {currentStep === 'details' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="source-type">Source Type</Label>
                  <Select value={form.type} onValueChange={handleSourceChange}>
                    <SelectTrigger id="source-type">
                      <SelectValue placeholder="Choose a source type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATABASE_SOURCES.map((item) => (
                        <SelectItem key={item.type} value={item.type}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{source.helperText}</p>
                </div>

                {renderSourceDetails()}

                {!source.supportsChat && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Query Genie can connect and inspect this source, but natural-language query execution is
                    not enabled for it yet.
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button variant="outline" onClick={handleClose} disabled={isLoadingDatabases || isConnecting}>
                    Cancel
                  </Button>
                  {source.supportsListing ? (
                    <Button onClick={handleListDatabases} disabled={isLoadingDatabases || isConnecting}>
                      {isLoadingDatabases ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading
                        </>
                      ) : (
                        <>
                          List Databases
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleConnect} disabled={isConnecting}>
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting
                        </>
                      ) : source.category === 'file' ? (
                        <>
                          <FolderUp className="mr-2 h-4 w-4" />
                          Upload and Connect
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-900">
                    <CheckCircle className="h-4 w-4" />
                    Server reachable
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-800">
                    <Server className="h-3.5 w-3.5" />
                    <span className="font-mono">
                      {form.user || 'user'}@{form.host}:{form.port}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="database-select">{source.databaseLabel}</Label>
                  <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                    <SelectTrigger id="database-select" className="font-mono">
                      <SelectValue placeholder={`Choose a ${source.databaseLabel.toLowerCase()}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDatabases.map((database) => (
                        <SelectItem key={database} value={database}>
                          {database}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {availableDatabases.length} option{availableDatabases.length === 1 ? '' : 's'} available
                  </p>
                </div>

                {source.supportsCreate && (
                  <Button variant="outline" onClick={() => setShowCreateDialog(true)} disabled={isConnecting}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Database
                  </Button>
                )}

                <div className="flex justify-between gap-2 border-t pt-4">
                  <Button variant="outline" onClick={handleBack} disabled={isConnecting}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleConnect} disabled={!selectedDatabase || isConnecting}>
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Create Database
            </DialogTitle>
            <DialogDescription>
              Create a new {source.shortLabel} database on the connected server.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Create Failed</AlertTitle>
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-db-name">Database Name</Label>
              <Input
                id="new-db-name"
                value={newDatabaseName}
                onChange={(event) => {
                  setNewDatabaseName(event.target.value);
                  setCreateError(null);
                }}
                placeholder="analytics_workspace"
                className="font-mono"
                disabled={isCreatingDatabase}
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isCreatingDatabase}>
                Cancel
              </Button>
              <Button onClick={handleCreateDatabase} disabled={isCreatingDatabase || !newDatabaseName.trim()}>
                {isCreatingDatabase ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
