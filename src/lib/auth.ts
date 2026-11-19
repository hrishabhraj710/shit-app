import { cookies } from 'next/headers';
import { verifyFirebaseIdToken } from './firebase/server';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_demo?: boolean;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('shit_firebase_token')?.value;
  const sessionUserId = cookieStore.get('shit_user_id')?.value;
  const sessionUserEmail = cookieStore.get('shit_user_email')?.value;
  const sessionUserName = cookieStore.get('shit_user_name')?.value;
  const isDemo = cookieStore.get('shit_is_demo')?.value === 'true';

  // 1. If Firebase ID token is stored in cookie, attempt to verify it
  if (sessionToken) {
    try {
      const decoded = await verifyFirebaseIdToken(sessionToken);
      if (decoded) {
        return {
          id: decoded.uid,
          email: decoded.email || sessionUserEmail || 'user@example.com',
          full_name: decoded.name || sessionUserName || decoded.email?.split('@')[0] || 'User',
          avatar_url: decoded.picture,
          is_demo: false,
        };
      }
    } catch {
      // Token verification failed or server admin not configured
    }
  }

  // 2. If session cookie exists from Google Sign-In or Demo login
  if (sessionUserId) {
    return {
      id: sessionUserId,
      email: sessionUserEmail || (isDemo ? 'demo.developer@example.com' : 'user@example.com'),
      full_name: sessionUserName || (isDemo ? 'Alex Mercer' : 'Developer'),
      is_demo: isDemo,
    };
  }

  return null;
}
