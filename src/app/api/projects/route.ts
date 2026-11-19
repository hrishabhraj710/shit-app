import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { DataRepository } from '@/lib/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = await DataRepository.getProjects(user.id);
  return NextResponse.json({ projects });
}
