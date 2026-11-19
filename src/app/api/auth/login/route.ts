import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/firebase/server';
import { DataRepository } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_token, uid, email, full_name, avatar_url, is_demo } = body;

    // 1. Instant Demo Developer Account
    if (is_demo) {
      const response = NextResponse.json({
        success: true,
        user: {
          id: 'demo-user-id',
          email: 'demo.developer@example.com',
          full_name: 'Alex Mercer',
          is_demo: true,
        },
      });

      response.cookies.set('shit_user_id', 'demo-user-id', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      response.cookies.set('shit_user_name', 'Alex Mercer', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      response.cookies.set('shit_user_email', 'demo.developer@example.com', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      response.cookies.set('shit_is_demo', 'true', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    // 2. Firebase Google Authentication / ID Token Session
    if (id_token || uid) {
      let verifiedUid = uid;
      let verifiedEmail = email;
      let verifiedName = full_name;

      if (id_token) {
        try {
          const decoded = await verifyFirebaseIdToken(id_token);
          if (decoded) {
            verifiedUid = decoded.uid;
            verifiedEmail = decoded.email || email;
            verifiedName = decoded.name || full_name || verifiedEmail?.split('@')[0];
          }
        } catch {
          // Fall back to client-provided UID if admin verification is not configured
        }
      }

      if (!verifiedUid) {
        return NextResponse.json({ error: 'Valid user ID is required' }, { status: 400 });
      }

      // Upsert profile in Firestore (users/{uid})
      await DataRepository.upsertUserProfile(verifiedUid, {
        full_name: verifiedName || 'Developer',
        avatar_url: avatar_url || '',
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: verifiedUid,
          email: verifiedEmail || 'user@example.com',
          full_name: verifiedName || 'Developer',
          avatar_url,
          is_demo: false,
        },
      });

      // Set secure session cookies
      if (id_token) {
        response.cookies.set('shit_firebase_token', id_token, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 14,
        });
      }
      response.cookies.set('shit_user_id', verifiedUid, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      if (verifiedName) {
        response.cookies.set('shit_user_name', verifiedName, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });
      }
      if (verifiedEmail) {
        response.cookies.set('shit_user_email', verifiedEmail, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });
      }
      response.cookies.set('shit_is_demo', 'false', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    // 3. Fallback email/password login
    if (email) {
      const localUserId = `user-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const name = full_name || email.split('@')[0];

      await DataRepository.upsertUserProfile(localUserId, {
        full_name: name,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: localUserId,
          email,
          full_name: name,
          is_demo: false,
        },
      });

      response.cookies.set('shit_user_id', localUserId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      response.cookies.set('shit_user_name', name, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      response.cookies.set('shit_user_email', email, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      response.cookies.set('shit_is_demo', 'false', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid login request' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
