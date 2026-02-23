import { useState, useEffect, useRef } from 'react';
import type { BlockerType, PRData, IssueData } from '../../../shared/types';
import { GITHUB_GET_PR_BY_NUMBER, GITHUB_GET_ISSUE } from '../../../shared/constants';
import { invoke } from '../../lib/api';
import { useGitHub } from '../../contexts/GitHubContext';
import { useBranch } from '../../contexts/BranchContext';

interface BlockerFieldProps {
  blockerType: BlockerType;
  blockerRef: string | null;
  onChange: (ref: string) => void;
}

const PLACEHOLDER: Record<BlockerType, string> = {
  pr: 'PR number (e.g. 42)',
  person: 'Name or @handle',
  issue: 'Issue number (e.g. 67)',
};

export function BlockerField({ blockerType, blockerRef, onChange }: BlockerFieldProps) {
  const { isConnected } = useGitHub();
  const { remoteInfo } = useBranch();
  const [value, setValue] = useState(blockerRef ?? '');
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external changes
  useEffect(() => {
    setValue(blockerRef ?? '');
  }, [blockerRef]);

  // Fetch live status for PR or issue
  useEffect(() => {
    if (!isConnected || !remoteInfo || !value.trim()) {
      setLiveStatus(null);
      return;
    }

    const num = parseInt(value.trim(), 10);
    if (isNaN(num)) {
      setLiveStatus(null);
      return;
    }

    if (blockerType === 'person') {
      setLiveStatus(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (blockerType === 'pr') {
        const result = await invoke<PRData | null>(GITHUB_GET_PR_BY_NUMBER, {
          owner: remoteInfo.owner,
          repo: remoteInfo.repo,
          prNumber: num,
        });

        if (result.ok && result.data) {
          const stateLabel = result.data.state.charAt(0).toUpperCase() + result.data.state.slice(1);
          setLiveStatus(`PR #${num} — ${stateLabel}`);
        } else {
          setLiveStatus(`PR #${num} — Not found`);
        }
      } else {
        const result = await invoke<IssueData | null>(GITHUB_GET_ISSUE, {
          owner: remoteInfo.owner,
          repo: remoteInfo.repo,
          issueNumber: num,
        });

        if (result.ok && result.data) {
          const stateLabel = result.data.state.charAt(0).toUpperCase() + result.data.state.slice(1);
          setLiveStatus(`Issue #${num} — ${stateLabel}`);
        } else {
          setLiveStatus(`Issue #${num} — Not found`);
        }
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, blockerType, isConnected, remoteInfo]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="bg-bg-surface border border-border-default rounded-lg p-3 space-y-2">
      <label className="text-xs text-text-secondary uppercase tracking-[0.1em]">
        Blocked on
      </label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={PLACEHOLDER[blockerType]}
          className="flex-1 px-3 py-2 text-sm bg-bg-input border border-border-default rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors font-mono"
        />
      </div>
      {liveStatus && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-bg-surface-raised border border-border-default rounded px-2 py-0.5 font-mono text-xs text-text-primary">
            <span className={`w-1.5 h-1.5 rounded-full ${liveStatus.includes('Open') ? 'bg-status-ready' : liveStatus.includes('Closed') || liveStatus.includes('Merged') ? 'bg-status-blocked' : 'bg-status-waiting'}`} />
            {liveStatus}
          </span>
        </div>
      )}
    </div>
  );
}
