// Optimistic Update Hook for AJAX operations
import { useState, useCallback } from 'react';

interface OptimisticState<T> {
  data: T | null;
  isOptimistic: boolean;
  error: Error | null;
}

export function useOptimisticUpdate<T>(initialData: T | null = null) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isOptimistic: false,
    error: null,
  });

  const updateOptimistically = useCallback(
    async (
      optimisticData: T,
      asyncOperation: () => Promise<T>,
      onSuccess?: (data: T) => void,
      onError?: (error: Error) => void
    ) => {
      // Immediately update UI with optimistic data
      setState({
        data: optimisticData,
        isOptimistic: true,
        error: null,
      });

      try {
        // Perform actual async operation
        const result = await asyncOperation();
        
        // Update with real data
        setState({
          data: result,
          isOptimistic: false,
          error: null,
        });

        onSuccess?.(result);
        return result;
      } catch (error) {
        // Rollback on error
        setState({
          data: initialData,
          isOptimistic: false,
          error: error as Error,
        });

        onError?.(error as Error);
        throw error;
      }
    },
    [initialData]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isOptimistic: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    updateOptimistically,
    reset,
  };
}
