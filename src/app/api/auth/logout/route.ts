import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('shit_firebase_token');
  response.cookies.delete('shit_user_id');
  response.cookies.delete('shit_user_name');
  response.cookies.delete('shit_user_email');
  response.cookies.delete('shit_is_demo');
  return response;
}
