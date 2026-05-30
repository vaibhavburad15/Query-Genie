// Command Palette for RIA power users
import React, { useState, useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './command';
import {
  Database,
  MessageSquare,
  Download,
  Settings,
  Search,
  FileText,
  BarChart3,
  Heart,
  History,
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
  group: string;
}

interface CommandPaletteProps {
  commands: Command[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands,
  open,
  onOpenChange,
}) => {
  const groupedCommands = commands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) {
      acc[cmd.group] = [];
    }
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedCommands).map(([group, cmds], index) => (
          <React.Fragment key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {cmds.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => {
                    cmd.onSelect();
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {cmd.icon}
                    <span>{cmd.label}</span>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

// Default commands for Query Genie
export const createDefaultCommands = (handlers: {
  onNewChat: () => void;
  onConnectDatabase: () => void;
  onExportData: () => void;
  onOpenSettings: () => void;
  onOpenFavorites: () => void;
  onOpenHistory: () => void;
  onOpenDashboard: () => void;
}): Command[] => [
  {
    id: 'new-chat',
    label: 'New Chat',
    icon: <MessageSquare className="h-4 w-4" />,
    shortcut: '⌘N',
    onSelect: handlers.onNewChat,
    group: 'Actions',
  },
  {
    id: 'connect-db',
    label: 'Connect Database',
    icon: <Database className="h-4 w-4" />,
    shortcut: '⌘D',
    onSelect: handlers.onConnectDatabase,
    group: 'Actions',
  },
  {
    id: 'export',
    label: 'Export Data',
    icon: <Download className="h-4 w-4" />,
    shortcut: '⌘E',
    onSelect: handlers.onExportData,
    group: 'Actions',
  },
  {
    id: 'favorites',
    label: 'View Favorites',
    icon: <Heart className="h-4 w-4" />,
    shortcut: '⌘F',
    onSelect: handlers.onOpenFavorites,
    group: 'Navigation',
  },
  {
    id: 'history',
    label: 'View History',
    icon: <History className="h-4 w-4" />,
    shortcut: '⌘H',
    onSelect: handlers.onOpenHistory,
    group: 'Navigation',
  },
  {
    id: 'dashboard',
    label: 'Custom Dashboard',
    icon: <BarChart3 className="h-4 w-4" />,
    shortcut: '⌘B',
    onSelect: handlers.onOpenDashboard,
    group: 'Navigation',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-4 w-4" />,
    shortcut: '⌘,',
    onSelect: handlers.onOpenSettings,
    group: 'Settings',
  },
];
