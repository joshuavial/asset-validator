import { formatDistanceToNow } from 'date-fns';
import type { ValidationClaimsSignal } from './types';

export function formatTimeAgo(timestamp: number): string {
  // Determine if the timestamp is in seconds, milliseconds, or microseconds
  // by comparing it to the current time in milliseconds.
  const now = Date.now();
  let adjustedTimestamp = timestamp;
  // If the timestamp is more than 1000 times the current time, it's likely in microseconds
  if (timestamp > now ) {
    adjustedTimestamp = timestamp / 1000; // convert microseconds to milliseconds
  } else if (timestamp < now) {
    adjustedTimestamp = timestamp * 1000; // convert seconds to milliseconds
  } else {
  }
  // No conversion needed if the timestamp is already in milliseconds

  const date = new Date(adjustedTimestamp);

  return formatDistanceToNow(date, { addSuffix: true });
}

export function onNewObservation(client, callback) {
  client.on('signal', signal => {
    if (signal.zome_name !== 'validation_claims') return;
    const payload = signal.payload as ValidationClaimsSignal;
    if (payload.type !== 'EntryCreated') return;
    if (payload.app_entry.type !== 'Observation') return;
    callback(payload);
  });
}

