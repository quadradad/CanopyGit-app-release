import { useState, useEffect } from 'react';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function formatRelative(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();

  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);
    return `${mins} min ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diff / DAY);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function useRelativeTime(isoDate: string | null): string {
  const [text, setText] = useState(() =>
    isoDate ? formatRelative(isoDate) : ''
  );

  useEffect(() => {
    if (!isoDate) {
      setText('');
      return;
    }

    setText(formatRelative(isoDate));

    const interval = setInterval(() => {
      setText(formatRelative(isoDate));
    }, 60_000);

    return () => clearInterval(interval);
  }, [isoDate]);

  return text;
}
