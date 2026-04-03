import { useCallback, useState } from 'react';
import { getErrorMessage } from '../utils/error';

interface RunOptions {
  errorPrefix?: string;
}

export function useAsyncTask() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async <T>(task: () => Promise<T>, options?: RunOptions): Promise<T | null> => {
    setIsLoading(true);
    setError('');
    try {
      return await task();
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setError(options?.errorPrefix ? `${options.errorPrefix}${message}` : message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError('');
  }, []);

  return {
    isLoading,
    error,
    run,
    setError,
    reset,
  };
}
