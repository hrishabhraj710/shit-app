import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

export function getAdminApp(): App | null {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || projectId,
      });
      return adminApp;
    } catch (err) {
      console.warn('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', err);
    }
  }

  if (projectId && !projectId.includes('your-firebase-project')) {
    try {
      adminApp = initializeApp({
        projectId,
      });
      return adminApp;
    } catch (err) {
      console.warn('[Firebase Admin] Initialized without credentials for project:', projectId, err);
    }
  }

  return null;
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  if (!app) return null;
  try {
    return getAuth(app);
  } catch {
    return null;
  }
}

export function getAdminFirestore(): Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch {
    return null;
  }
}

export async function verifyFirebaseIdToken(token: string): Promise<DecodedIdToken | null> {
  // 1. Try Admin SDK if service account is configured
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const auth = getAdminAuth();
    if (auth) {
      try {
        return await auth.verifyIdToken(token);
      } catch (err) {
        console.warn('[Firebase Admin] Service account verification failed, falling back to REST:', err);
      }
    }
  }

  // 2. Fallback to Firebase Auth REST API using Web API Key (Works on Spark Plan without Service Account)
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
        signal: AbortSignal.timeout(6000),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('[Firebase Auth REST] Token verification failed:', errData);
      return null;
    }

    const data = await res.json();
    const user = data.users?.[0];
    if (!user || !user.localId) {
      return null;
    }

    return {
      uid: user.localId,
      sub: user.localId,
      email: user.email,
      email_verified: user.emailVerified,
      name: user.displayName,
      picture: user.photoUrl,
      aud: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      firebase: { identities: {}, sign_in_provider: 'google.com' },
      iat: Math.floor(Date.now() / 1000),
      iss: `https://securetoken.google.com/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
    } as unknown as DecodedIdToken;
  } catch (err) {
    console.warn('[Firebase Auth REST] Error verifying token:', err);
    return null;
  }
}
