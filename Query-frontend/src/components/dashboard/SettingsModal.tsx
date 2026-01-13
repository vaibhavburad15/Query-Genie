// src/components/dashboard/SettingsModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, userId }) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'en',
    results_per_page: 50,
    show_tips: true,
    auto_save_sessions: true,
    sql_syntax_highlighting: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadSettings();
    }
  }, [isOpen, userId]);

  const loadSettings = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/settings/${userId}`);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/settings/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Settings saved",
          description: "Your preferences have been updated successfully.",
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Theme */}
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(value) => setSettings({ ...settings, theme: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Per Page */}
          <div className="space-y-2">
            <Label htmlFor="results">Results Per Page</Label>
            <Input
              id="results"
              type="number"
              value={settings.results_per_page}
              onChange={(e) => setSettings({ ...settings, results_per_page: parseInt(e.target.value) })}
              min="10"
              max="500"
            />
          </div>

          {/* Show Tips */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-tips" className="cursor-pointer">
              Show Tips of the Day
            </Label>
            <input
              id="show-tips"
              type="checkbox"
              checked={settings.show_tips}
              onChange={(e) => setSettings({ ...settings, show_tips: e.target.checked })}
              className="h-4 w-4 cursor-pointer"
            />
          </div>

          {/* SQL Syntax Highlighting */}
          <div className="flex items-center justify-between">
            <Label htmlFor="syntax" className="cursor-pointer">
              SQL Syntax Highlighting
            </Label>
            <input
              id="syntax"
              type="checkbox"
              checked={settings.sql_syntax_highlighting}
              onChange={(e) => setSettings({ ...settings, sql_syntax_highlighting: e.target.checked })}
              className="h-4 w-4 cursor-pointer"
            />
          </div>

          {/* Auto Save Sessions */}
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-save" className="cursor-pointer">
              Auto-Save Chat Sessions
            </Label>
            <input
              id="auto-save"
              type="checkbox"
              checked={settings.auto_save_sessions}
              onChange={(e) => setSettings({ ...settings, auto_save_sessions: e.target.checked })}
              className="h-4 w-4 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;