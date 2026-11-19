import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { DataRepository } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { reset_type } = await req.json();

  if (!['difficulty_only', 'full_practice'].includes(reset_type)) {
    return NextResponse.json(
      { error: 'Invalid reset_type. Must be "difficulty_only" or "full_practice"' },
      { status: 400 }
    );
  }

  const success = await DataRepository.resetProject(user.id, id, reset_type);
  if (!success) {
    return NextResponse.json({ error: 'Project not found or reset failed' }, { status: 404 });
  }

  const updatedProject = await DataRepository.getProjectById(user.id, id);
  return NextResponse.json({ success: true, project: updatedProject });
}
