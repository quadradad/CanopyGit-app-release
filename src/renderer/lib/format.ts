import type { GitSyncStatus } from '../../shared/types';

export function formatSyncStatus(status: GitSyncStatus): string {
  if (!status.hasUpstream) return 'No upstream';

  const parts: string[] = [];
  if (status.ahead > 0) parts.push(`${status.ahead} ahead`);
  if (status.behind > 0) parts.push(`${status.behind} behind`);

  if (parts.length === 0) return 'In sync';
  return parts.join(', ');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
