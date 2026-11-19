import { NextRequest, NextResponse } from 'next/server';
import { DataRepository } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const name = full_name || email.split('@')[0];

    await DataRepository.upsertUserProfile(userId, {
      full_name: name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        full_name: name,
      },
    });

    response.cookies.set('shit_user_id', userId, {
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

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Signup failed' }, { status: 500 });
  }
}
