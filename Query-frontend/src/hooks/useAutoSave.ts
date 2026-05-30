// Auto-save functionality for RIA
import { useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';

interface AutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
}: AutoSaveOptions<T>) {
  const debouncedData = useDebounce(data, delay);
  const isFirstRender = useRef(true);
  const lastSavedData = useRef<T>(data);

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip if disabled or data hasn't changed
    if (!enabled || debouncedData === lastSavedData.current) {
      return;
    }

    const save = async () => {
      try {
        await onSave(debouncedData);
        lastSavedData.current = debouncedData;
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    save();
  }, [debouncedData, onSave, enabled]);

  return {
    lastSavedData: lastSavedData.current,
  };
}
