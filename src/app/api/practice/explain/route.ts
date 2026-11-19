/**
 * LLM-Powered Contextual Explanation API
 * Called after an answer is submitted to enrich the explanation with
 * project-specific, resume-grounded reasoning from the live LLM.
 *
 * Falls back to the pre-generated explanation gracefully if LLM is unavailable.
 * API key is server-side only — never returned or logged to browser.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callOpenRouter, cleanJsonOutput, isOpenRouterConfigured } from '@/lib/ai/openrouter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ExplainRequest {
  question_text: string;
  options: string[];
  selected_option: 'A' | 'B' | 'C' | 'D';
  correct_option: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  topic: string;
  difficulty: number;
  project_title: string;
  project_context?: string;        // brief implementation details
  pre_generated_explanation: string; // fallback if LLM unavailable
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ExplainRequest = await req.json();

    const {
      question_text,
      options,
      selected_option,
      correct_option,
      is_correct,
      topic,
      difficulty,
      project_title,
      project_context = '',
      pre_generated_explanation,
    } = body;

    // Validate required fields
    if (!question_text || !options || !selected_option || !correct_option || !project_title) {
      return NextResponse.json(
        { error: 'Missing required explanation fields' },
        { status: 400 }
      );
    }

    // If OpenRouter is not configured, return the pre-generated explanation immediately
    if (!isOpenRouterConfigured()) {
      return NextResponse.json({
        explanation: pre_generated_explanation,
        concept_gap: null,
        source: 'fallback',
      });
    }

    const optionLabels = ['A', 'B', 'C', 'D'];
    const optionsFormatted = options
      .map((text, i) => `${optionLabels[i]}. ${text}`)
      .join('\n');

    const selectedText = options[optionLabels.indexOf(selected_option)] ?? selected_option;
    const correctText = options[optionLabels.indexOf(correct_option)] ?? correct_option;

    const systemPrompt = `You are a Senior Staff Engineer and Technical Interview Coach on the SH!T platform.
Your role is to explain quiz answers in the context of the candidate's specific project.
Be concise, technically accurate, and grounded in the project's actual implementation.
Do NOT fabricate details not present in the project context.
Return valid JSON only.`;

    const userPrompt = `PROJECT: "${project_title}"
TOPIC: ${topic} (Difficulty Level ${difficulty}/5)
${project_context ? `PROJECT CONTEXT:\n${project_context.slice(0, 800)}\n` : ''}
QUESTION: ${question_text}

OPTIONS:
${optionsFormatted}

SELECTED ANSWER: ${selected_option}. ${selectedText}
CORRECT ANSWER: ${correct_option}. ${correctText}
OUTCOME: ${is_correct ? 'CORRECT ✓' : 'INCORRECT ✗'}

Provide a JSON response:
{
  "explanation": "2-4 sentence technical explanation of why ${correct_option} is correct, grounded in the project.",
  "concept_gap": ${is_correct ? 'null' : '"One-sentence description of the specific knowledge gap revealed by this mistake, with the concept to review."'}
}`;

    try {
      const rawJson = await callOpenRouter(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.1,
          maxTokens: 512,
          timeoutMs: 20000,
          retries: 1,
          jsonMode: true,
        }
      );

      const cleaned = cleanJsonOutput(rawJson);
      const parsed = JSON.parse(cleaned);

      return NextResponse.json({
        explanation: parsed.explanation || pre_generated_explanation,
        concept_gap: parsed.concept_gap || null,
        source: 'llm',
      });
    } catch (llmErr: unknown) {
      // LLM enrichment failed — return fallback explanation silently
      console.warn(
        '[explain] LLM explanation failed, using pre-generated:',
        llmErr instanceof Error ? llmErr.message : String(llmErr)
      );
      return NextResponse.json({
        explanation: pre_generated_explanation,
        concept_gap: null,
        source: 'fallback',
      });
    }
  } catch (error: unknown) {
    console.error('[explain] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
