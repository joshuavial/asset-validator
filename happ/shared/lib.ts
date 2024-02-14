import { formatDistanceToNow } from 'date-fns';

export function formatTimeAgo(timestamp: number): string {
  // Check if the timestamp is in milliseconds (assuming no date is past a certain point in the future)
  const now = Date.now();
  const isMilliseconds = timestamp > now;
  const date = new Date(isMilliseconds ? timestamp : timestamp * 1000);

  return formatDistanceToNow(new Date(timestamp / 1000), { addSuffix: true });
  return formatDistanceToNow(date, { addSuffix: true });
}
