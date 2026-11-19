import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { DataRepository } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id } = await req.json();
    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    const { session, questions } = await DataRepository.getOrCreatePracticeSession(user.id, project_id);

    return NextResponse.json({ session, questions });
  } catch (error: any) {
    console.error('Practice session generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start practice session' },
      { status: 500 }
    );
  }
}
