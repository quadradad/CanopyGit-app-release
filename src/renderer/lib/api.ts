import type { IPCResult } from '../../shared/types';

/**
 * Typed API client for calling server endpoints.
 * Posts to /api/{channel} and returns IPCResult<T> envelopes.
 */
export async function invoke<T>(channel: string, data?: unknown): Promise<IPCResult<T>> {
  const response = await fetch(`/api/${channel}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data ?? {}),
  });
  return response.json() as Promise<IPCResult<T>>;
}
