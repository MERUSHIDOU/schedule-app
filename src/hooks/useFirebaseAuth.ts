import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { signInAnonymouslyIfNeeded, subscribeToAuthState } from '../utils/firebaseAuth';

interface UseFirebaseAuthResult {
  userId: string | null;
  isLoading: boolean;
  error: Error | null;
}

// Firebase匿名認証を管理するカスタムフック
export function useFirebaseAuth(): UseFirebaseAuthResult {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user: User | null) => {
      setUserId(user?.uid ?? null);
      setIsLoading(false);
    });

    signInAnonymouslyIfNeeded().catch((err: Error) => {
      setError(err);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return { userId, isLoading, error };
}
