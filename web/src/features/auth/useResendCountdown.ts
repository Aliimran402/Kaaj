import { useCallback, useEffect, useState } from 'react';
import { markCodeSent, secondsUntilResend } from './pendingSignUp';

/** Seconds until a new code may be requested for this email, ticking down once a second. */
export function useResendCountdown(email: string) {
  const [now, setNow] = useState(() => Date.now());
  const secondsLeft = secondsUntilResend(email, now);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setNow(Date.now()), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft, now]);

  const restart = useCallback(() => {
    markCodeSent(email);
    setNow(Date.now());
  }, [email]);

  return { secondsLeft, restart };
}
