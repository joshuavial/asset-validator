import { formatDistanceToNow } from 'date-fns';

export function formatTimeAgo(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
}
