import { useState, useCallback } from 'react';

export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>): Promise<T> => {
      setIsLoading(true);
      try {
        const result = await promise;
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { isLoading, setIsLoading, withLoading };
}
