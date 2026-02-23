import { useRef, useEffect } from 'react';
import { useBranch } from '../../contexts/BranchContext';
import { SearchIcon } from '../icons';
import { SEARCH_DEBOUNCE_MS } from '../../../shared/constants';

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useBranch();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for Cmd+F / Ctrl+F keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleChange = (value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.blur();
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  return (
    <div className="relative">
      <SearchIcon
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
      />
      <input
        ref={inputRef}
        type="text"
        placeholder="Filter branches..."
        defaultValue={searchQuery}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full pl-8 pr-3 py-2 text-sm bg-bg-input border border-border-default rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}
