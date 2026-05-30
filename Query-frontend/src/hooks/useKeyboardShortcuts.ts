// Keyboard shortcuts for RIA power users
import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}

// Predefined shortcuts for the application
export const APP_SHORTCUTS = {
  NEW_CHAT: { key: 'n', ctrl: true, description: 'New Chat' },
  SEARCH: { key: 'k', ctrl: true, description: 'Search' },
  TOGGLE_SIDEBAR: { key: 'b', ctrl: true, description: 'Toggle Sidebar' },
  FOCUS_INPUT: { key: '/', description: 'Focus Input' },
  EXPORT_DATA: { key: 'e', ctrl: true, description: 'Export Data' },
  COPY_SQL: { key: 'c', ctrl: true, shift: true, description: 'Copy SQL' },
  RUN_QUERY: { key: 'Enter', ctrl: true, description: 'Run Query' },
  UNDO: { key: 'z', ctrl: true, description: 'Undo' },
  REDO: { key: 'y', ctrl: true, description: 'Redo' },
};
