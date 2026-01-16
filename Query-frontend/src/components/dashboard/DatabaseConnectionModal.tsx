import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Database, Loader2, CheckCircle, ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE = "http://localhost:8000";

interface DatabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectSuccess: (databaseName: string) => void;
}

interface ConnectionFormData {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

type ModalStep = 'credentials' | 'selectDatabase' | 'createDatabase';

const DatabaseConnectionModal = ({ isOpen, onClose, onConnectSuccess }: DatabaseConnectionModalProps) => {
  const [step, setStep] = useState<ModalStep>('credentials');
  const [formData, setFormData] = useState<ConnectionFormData>({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: '',
  });
  
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const [newDatabaseName, setNewDatabaseName] = useState('');
  const [isCreatingDatabase, setIsCreatingDatabase] = useState(false);
  const { toast } = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('credentials');
      setServerConnected(false);
      setAvailableDatabases([]);
      setNewDatabaseName('');
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof ConnectionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Step 1: Connect to MySQL server and list databases
  const handleListDatabases = async () => {
    setIsLoadingDatabases(true);

    const payload = {
      host: formData.host,
      port: parseInt(formData.port, 10),
      user: formData.user,
      password: formData.password,
    };

    try {
      const response = await fetch(`${API_BASE}/api/list-databases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();

      if (response.ok && result.success) {
        setAvailableDatabases(result.databases);
        setServerConnected(true);
        setStep('selectDatabase');
      } else {
        throw new Error(result.error || 'Failed to connect to MySQL server.');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || 'Check credentials and server status.',
      });
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  // Step 2: Connect to selected database
  const handleConnectToDatabase = async (selectedDatabase: string) => {
    setIsConnecting(true);

    const payload = {
      host: formData.host,
      port: parseInt(formData.port, 10),
      user: formData.user,
      password: formData.password,
      database: selectedDatabase,
    };

    try {
      const response = await fetch(`${API_BASE}/api/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "✅ Connected Successfully",
          description: `Connected to ${selectedDatabase} database.`,
        });
        onConnectSuccess(selectedDatabase);
        onClose();
      } else {
        throw new Error(result.error || 'Failed to connect to database.');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || 'Could not connect to database.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Create new database
  const handleCreateDatabase = async () => {
    if (!newDatabaseName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Name",
        description: "Please enter a database name.",
      });
      return;
    }

    setIsCreatingDatabase(true);

    const payload = {
      host: formData.host,
      port: parseInt(formData.port, 10),
      user: formData.user,
      password: formData.password,
      database_name: newDatabaseName.trim(),
    };

    try {
      const response = await fetch(`${API_BASE}/api/create-database`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "✅ Database Created",
          description: `Database "${newDatabaseName}" created successfully.`,
        });
        
        // Connect to the newly created database
        await handleConnectToDatabase(newDatabaseName);
      } else {
        throw new Error(result.error || 'Failed to create database.');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.message || 'Could not create database.',
      });
    } finally {
      setIsCreatingDatabase(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'credentials':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Connect to MySQL Server
              </DialogTitle>
              <DialogDescription>
                Enter your MySQL server credentials to view available databases
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input 
                  id="host" 
                  value={formData.host} 
                  onChange={(e) => handleInputChange('host', e.target.value)} 
                  placeholder="127.0.0.1"
                />
                <p className="text-xs text-muted-foreground">Server address where MySQL is running</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input 
                  id="port" 
                  value={formData.port} 
                  onChange={(e) => handleInputChange('port', e.target.value)} 
                  placeholder="3306"
                />
                <p className="text-xs text-muted-foreground">MySQL server port (default: 3306)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user">Username</Label>
                <Input 
                  id="user" 
                  value={formData.user} 
                  onChange={(e) => handleInputChange('user', e.target.value)} 
                  placeholder="root"
                />
                <p className="text-xs text-muted-foreground">Database username for authentication</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={(e) => handleInputChange('password', e.target.value)} 
                  placeholder="Enter password (if any)"
                />
                <p className="text-xs text-muted-foreground">Leave blank if no password is set</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoadingDatabases}>
                Cancel
              </Button>
              <Button onClick={handleListDatabases} disabled={isLoadingDatabases}>
                {isLoadingDatabases ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                ) : (
                  <>List Databases <ArrowLeft className="w-4 h-4 ml-2 rotate-180" /></>
                )}
              </Button>
            </div>
          </>
        );

      case 'selectDatabase':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Select Database
              </DialogTitle>
              <DialogDescription>
                Choose a database to connect to and start querying
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {serverConnected && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800 font-medium">Server Connected Successfully</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    {formData.user}@{formData.host}:{formData.port}
                  </p>
                </div>
              )}

              <div className="space-y-2 mb-4">
                <Label>Select Database</Label>
                <Select onValueChange={(value) => {
                  if (value === '__CREATE_NEW__') {
                    setStep('createDatabase');
                  } else {
                    handleConnectToDatabase(value);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a database..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__CREATE_NEW__">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">Create New Database</span>
                      </div>
                    </SelectItem>
                    {availableDatabases.map((db) => (
                      <SelectItem key={db} value={db}>
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          {db}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {availableDatabases.length} databases available
                </p>
              </div>
            </div>

            <div className="flex justify-start gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('credentials')}
                disabled={isConnecting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </>
        );

      case 'createDatabase':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Database
              </DialogTitle>
              <DialogDescription>
                Enter a name for your new database
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newDbName">Database Name</Label>
                <Input 
                  id="newDbName" 
                  value={newDatabaseName}
                  onChange={(e) => setNewDatabaseName(e.target.value)}
                  placeholder="my_new_database"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Use lowercase letters, numbers, and underscores only
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ A new empty database will be created and you'll be connected to it automatically.
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('selectDatabase')}
                disabled={isCreatingDatabase}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button 
                onClick={handleCreateDatabase}
                disabled={isCreatingDatabase || !newDatabaseName.trim()}
              >
                {isCreatingDatabase ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" /> Create & Connect</>
                )}
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export { DatabaseConnectionModal };