'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { pingApi } from '@/lib/api';

/**
 * checking: first health check in flight
 * waking:   the API didn't answer quickly, so it's probably asleep and starting up
 * ready:    the API answered its health check
 * offline:  still no answer after GIVE_UP_AFTER_MS
 */
export type ServerStatus = 'checking' | 'waking' | 'ready' | 'offline';

const SLOW_AFTER_MS = 2500;
const RETRY_EVERY_MS = 4000;
const GIVE_UP_AFTER_MS = 120_000;

export function useServerStatus() {
  const [status, setStatus] = useState<ServerStatus>('checking');
  const [elapsed, setElapsed] = useState(0);
  const [wasAsleep, setWasAsleep] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const statusRef = useRef<ServerStatus>('checking');

  const update = (next: ServerStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();
    update('checking');
    setElapsed(0);

    const slowTimer = setTimeout(() => {
      if (!cancelled && statusRef.current === 'checking') {
        update('waking');
        setWasAsleep(true);
      }
    }, SLOW_AFTER_MS);
    const clock = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);

    (async () => {
      while (!cancelled) {
        if (await pingApi()) {
          clearInterval(clock);
          if (!cancelled) update('ready');
          return;
        }
        if (cancelled) return;
        if (Date.now() - started > GIVE_UP_AFTER_MS) {
          clearInterval(clock);
          update('offline');
          return;
        }
        update('waking');
        setWasAsleep(true);
        await new Promise((resolve) => setTimeout(resolve, RETRY_EVERY_MS));
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
      clearInterval(clock);
    };
  }, [attempt]);

  /** Start checking again, e.g. after a request failed or the user pressed "Try again". */
  const recheck = useCallback(() => setAttempt((a) => a + 1), []);

  return { status, elapsed, wasAsleep, recheck };
}
