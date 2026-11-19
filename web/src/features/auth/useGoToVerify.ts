import { useNavigate } from 'react-router';
import { markCodeSent, rememberPendingEmail } from './pendingSignUp';

/** Opens the verify page for this email. codeSent: a code went out just now, so start the resend timer. */
export function useGoToVerify() {
  const navigate = useNavigate();
  return (email: string, codeSent: boolean) => {
    rememberPendingEmail(email);
    if (codeSent) markCodeSent(email);
    void navigate('/verify', { state: { email: email.trim() } });
  };
}
