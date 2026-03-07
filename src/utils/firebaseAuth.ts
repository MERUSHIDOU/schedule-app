import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

// 未サインインの場合のみ匿名認証でサインインする
export async function signInAnonymouslyIfNeeded(): Promise<User> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  const credential = await signInAnonymously(auth);
  return credential.user;
}

// 現在のユーザーIDを返す（未サインインの場合はnull）
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid ?? null;
}

// 認証状態の変化を監視する
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
