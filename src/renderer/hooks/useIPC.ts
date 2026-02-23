import { useCallback, useState } from 'react';
import type { IPCResult } from '../../shared/types';
import { invoke as fetchInvoke } from '../lib/api';

interface UseIPCReturn<TReq, TRes> {
  invoke: (request: TReq) => Promise<TRes>;
  loading: boolean;
  error: string | null;
}

export function useIPC<TReq, TRes>(channel: string): UseIPCReturn<TReq, TRes> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invoke = useCallback(
    async (request: TReq): Promise<TRes> => {
      setLoading(true);
      setError(null);

      try {
        const result: IPCResult<TRes> = await fetchInvoke<TRes>(channel, request);

        if (!result.ok) {
          setError(result.error);
          throw new Error(result.error);
        }

        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [channel]
  );

  return { invoke, loading, error };
}
