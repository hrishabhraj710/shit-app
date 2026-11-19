import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { DataRepository } from '@/lib/db';
import { SubmitAnswerPayload, CorrectOption } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { session_id, project_id, question_id, selected_option } = body;

    if (!session_id || !project_id || !question_id || !selected_option) {
      return NextResponse.json(
        { error: 'session_id, project_id, question_id, and selected_option are required' },
        { status: 400 }
      );
    }

    const payload: SubmitAnswerPayload = {
      session_id,
      project_id,
      question_id,
      selected_option: selected_option.toUpperCase() as CorrectOption,
    };

    const evaluation = await DataRepository.submitAnswer(user.id, payload);

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error('Answer submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit answer attempt' },
      { status: 500 }
    );
  }
}
