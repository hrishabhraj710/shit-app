import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { extractTextFromFile, MAX_FILE_SIZE_BYTES } from '@/lib/document-parser';
import { analyzeResumeAndProjects, ProjectFileAttachment } from '@/lib/ai/resume-analyzer';
import { DataRepository } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    let user = await getAuthUser();

    const formData = await req.formData();
    const resumeFile = formData.get('resume') as File | null;
    const projectFiles = formData.getAll('project_files') as File[];
    const guestParam = formData.get('is_guest') === 'true';

    // If unauthenticated but requested guest/instant access, create a guest session
    if (!user && (guestParam || !user)) {
      user = {
        id: `guest-${Date.now()}`,
        email: 'guest@shit.local',
        full_name: 'Guest Developer',
        is_demo: true,
      };
    }

    if (!resumeFile) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });
    }

    if (resumeFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Resume file exceeds maximum size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // 1. Extract text from resume
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
    const resumeExtract = await extractTextFromFile(resumeBuffer, resumeFile.name);

    if (resumeExtract.error || !resumeExtract.text.trim()) {
      return NextResponse.json(
        { error: resumeExtract.error || 'Failed to extract text from resume' },
        { status: 422 }
      );
    }

    // 2. Extract text from supporting project files
    const parsedProjectFiles: Array<{
      fileName: string;
      text: string;
      storagePath: string;
      fileType: string;
    }> = [];

    const projectFileAttachments: ProjectFileAttachment[] = [];

    for (const file of projectFiles) {
      if (file && file.size > 0 && file.size <= MAX_FILE_SIZE_BYTES) {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const extracted = await extractTextFromFile(fileBuffer, file.name);
        const storagePath = `${user.id}/projects/${Date.now()}_${file.name}`;

        parsedProjectFiles.push({
          fileName: file.name,
          text: extracted.text,
          storagePath,
          fileType: file.type || file.name.split('.').pop() || 'unknown',
        });

        projectFileAttachments.push({
          fileName: file.name,
          extractedText: extracted.text,
        });
      }
    }

    // 3. Run AI analysis
    const analysis = await analyzeResumeAndProjects(resumeExtract.text, projectFileAttachments);

    // 4. Save to Database
    const resumeStoragePath = `${user.id}/resumes/${Date.now()}_${resumeFile.name}`;
    const { resumeId, projectIds } = await DataRepository.saveResumeAndProjects(
      user.id,
      {
        fileName: resumeFile.name,
        text: resumeExtract.text,
        storagePath: resumeStoragePath,
      },
      analysis,
      parsedProjectFiles
    );

    // 5. Fetch newly saved projects to return
    const savedProjects = await DataRepository.getProjects(user.id);

    const response = NextResponse.json({
      success: true,
      resumeId,
      candidate_name: analysis.candidate_name,
      projectCount: projectIds.length,
      projects: savedProjects,
    });

    // If user was created as guest, set cookie so subsequent requests match
    if (user.is_demo) {
      response.cookies.set('shit_user_id', user.id, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (error: any) {
    console.error('Upload and analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during resume analysis' },
      { status: 500 }
    );
  }
}
