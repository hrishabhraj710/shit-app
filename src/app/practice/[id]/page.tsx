'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  BookOpen,
  Award,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import DifficultyBadge from '@/components/DifficultyBadge';
import { Question, PracticeSession, Project, CorrectOption, SubmitAnswerResponse } from '@/types';

function PracticeQuizContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<CorrectOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<SubmitAnswerResponse | null>(null);
  const [isLoadingBatch, setIsLoadingBatch] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // LLM explanation enrichment state
  const [enrichedExplanation, setEnrichedExplanation] = useState<string | null>(null);
  const [enrichedConceptGap, setEnrichedConceptGap] = useState<string | null>(null);
  const [isEnrichingExplanation, setIsEnrichingExplanation] = useState(false);
  const [explanationSource, setExplanationSource] = useState<'llm' | 'fallback' | null>(null);

  // Batch completion summary state
  const [batchCompleted, setBatchCompleted] = useState(false);
  const [batchStats, setBatchStats] = useState<{
    correct: number;
    total: number;
    accuracy: number;
  }>({ correct: 0, total: 10, accuracy: 0 });

  const loadSessionAndBatch = async () => {
    setIsLoadingBatch(true);
    setError(null);
    setBatchCompleted(false);
    setFeedback(null);
    setSelectedOption(null);

    try {
      // 1. Load project info
      const projRes = await fetch(`/api/projects/${projectId}`);
      if (!projRes.ok) throw new Error('Could not load project');
      const projData = await projRes.json();
      setProject(projData.project);

      // 2. Load or generate 10-question practice session
      const sessionRes = await fetch('/api/practice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!sessionRes.ok) {
        const sErr = await sessionRes.json();
        throw new Error(sErr.error || 'Failed to start practice batch');
      }

      const sData = await sessionRes.json();
      setSession(sData.session);
      setQuestions(sData.questions || []);

      // If user had already attempted some questions in this session, start at the next unanswered
      const startIndex = Math.min(sData.session.questions_attempted || 0, (sData.questions?.length || 1) - 1);
      setCurrentIndex(Math.max(0, startIndex));
    } catch (err: any) {
      setError(err.message || 'Error initializing practice');
    } finally {
      setIsLoadingBatch(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadSessionAndBatch();
    }
  }, [projectId]);

  const currentQuestion: Question | undefined = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !currentQuestion || !session) return;

    setIsSubmitting(true);
    setEnrichedExplanation(null);
    setEnrichedConceptGap(null);
    setExplanationSource(null);

    try {
      const res = await fetch('/api/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          project_id: projectId,
          question_id: currentQuestion.id,
          selected_option: selectedOption,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      const evalData: SubmitAnswerResponse = await res.json();
      setFeedback(evalData);

      // Check if 10 questions in batch completed
      if (evalData.session_stats.is_batch_complete) {
        setBatchStats({
          correct: evalData.session_stats.correct_answers,
          total: evalData.session_stats.questions_attempted,
          accuracy: Math.round(
            (evalData.session_stats.correct_answers / evalData.session_stats.questions_attempted) * 100
          ),
        });
      }

      // Fire-and-forget: enrich explanation with LLM (non-blocking)
      // The adaptive difficulty engine is fully deterministic and already evaluated above.
      // This only enriches the displayed explanation text.
      setIsEnrichingExplanation(true);
      fetch('/api/practice/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: currentQuestion.question_text,
          options: currentQuestion.options,
          selected_option: selectedOption,
          correct_option: currentQuestion.correct_option,
          is_correct: evalData.is_correct,
          topic: currentQuestion.topic,
          difficulty: currentQuestion.difficulty,
          project_title: project?.title || 'Project',
          project_context: project?.description || '',
          pre_generated_explanation: evalData.explanation,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.explanation) {
            setEnrichedExplanation(data.explanation);
            setEnrichedConceptGap(data.concept_gap || null);
            setExplanationSource(data.source || 'fallback');
          }
        })
        .catch(() => {
          // Silently fall back — pre-generated explanation is already shown
        })
        .finally(() => setIsEnrichingExplanation(false));
    } catch (err: any) {
      alert(err.message || 'Error evaluating answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (feedback?.session_stats.is_batch_complete || currentIndex >= questions.length - 1) {
      setBatchCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFeedback(null);
      setEnrichedExplanation(null);
      setEnrichedConceptGap(null);
      setExplanationSource(null);
    }
  };

  const optionLetters: CorrectOption[] = ['A', 'B', 'C', 'D'];

  if (isLoadingBatch) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-neutral-900 mb-3" />
          <h2 className="text-sm font-bold text-neutral-900">Preparing 10-Question Adaptive Batch...</h2>
          <p className="text-xs text-neutral-600 mt-1">
            Analyzing claims, current topic mastery, and generating targeted interview questions.
          </p>
        </div>
      </div>
    );
  }

  if (error || !project || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-md">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-3" />
          <h2 className="text-base font-bold text-neutral-900">Unable to Load Quiz</h2>
          <p className="mt-1 text-xs text-neutral-600">{error || 'Session could not be loaded.'}</p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={loadSessionAndBatch}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Retry Batch
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700"
            >
              Exit to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // BATCH COMPLETION SUMMARY SCREEN
  if (batchCompleted) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center p-4 text-neutral-900">
        <div className="w-full max-w-lg rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md mb-4">
            <Award className="h-7 w-7" />
          </div>

          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 border border-violet-100 uppercase tracking-wider">
            Batch Complete
          </span>

          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-neutral-950">
            Great Practice Session!
          </h2>
          <p className="mt-1 text-xs text-neutral-600 max-w-sm mx-auto">
            Completed 10 questions for <span className="font-semibold text-neutral-800">{project.title}</span>.
            Your topic mastery and streaks have been saved.
          </p>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4">
            <div>
              <span className="block text-[10px] font-semibold uppercase text-neutral-600">Correct</span>
              <span className="text-xl font-extrabold text-emerald-600">
                {batchStats.correct} / {batchStats.total}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold uppercase text-neutral-600">Accuracy</span>
              <span className="text-xl font-extrabold text-neutral-900">{batchStats.accuracy}%</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold uppercase text-neutral-600">Current Level</span>
              <span className="text-xl font-extrabold text-violet-600">
                Level {project.current_difficulty || 1}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={loadSessionAndBatch}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-violet-600 transition-colors"
            >
              <span>Practice Next Batch (10 Questions)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center rounded-xl border border-neutral-200 px-5 py-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col text-neutral-900">
      {/* QUIZ TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              title="Save & Exit"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="truncate">
              <h1 className="text-xs sm:text-sm font-bold text-neutral-900 truncate max-w-[200px] sm:max-w-md">
                {project.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <DifficultyBadge level={currentQuestion.difficulty} showLabel={false} />
                <span className="text-[11px] text-neutral-600 truncate">· {currentQuestion.topic}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-xs font-bold text-neutral-900">
                {currentIndex + 1}{' '}
                <span className="text-neutral-600 font-normal">/ {questions.length}</span>
              </span>
            </div>
            <Link
              href="/dashboard"
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50"
            >
              Exit
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-neutral-100">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* MAIN QUIZ CONTENT */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12 flex flex-col justify-center">
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-10 shadow-lg backdrop-blur-md">
          {/* Question Meta */}
          <div className="flex items-center justify-between mb-4">
            <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
              {currentQuestion.question_type || 'Conceptual'}
            </span>
            <span className="text-[11px] font-medium text-neutral-600">
              Level {currentQuestion.difficulty} Question
            </span>
          </div>

          {/* Question Text */}
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950 leading-relaxed">
            {currentQuestion.question_text}
          </h2>

          {/* Source Reference Note */}
          {currentQuestion.source_reference && (
            <p className="mt-2 text-[11px] text-neutral-600 italic">
              Context: {currentQuestion.source_reference}
            </p>
          )}

          {/* 4 MCQ OPTIONS */}
          <div className="mt-8 space-y-3">
            {currentQuestion.options.map((optionText, idx) => {
              const letter = optionLetters[idx];
              const isSelected = selectedOption === letter;
              const isSubmitted = feedback !== null;
              const isCorrectOption = letter === currentQuestion.correct_option;

              let optionStyle = 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50';
              let badgeStyle = 'border-neutral-200 bg-neutral-100 text-neutral-700';

              if (isSelected && !isSubmitted) {
                optionStyle = 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900';
                badgeStyle = 'border-neutral-900 bg-neutral-900 text-white';
              }

              if (isSubmitted) {
                if (isCorrectOption) {
                  optionStyle = 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500';
                  badgeStyle = 'border-emerald-600 bg-emerald-600 text-white';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = 'border-rose-400 bg-rose-50/60 ring-1 ring-rose-400';
                  badgeStyle = 'border-rose-500 bg-rose-500 text-white';
                } else {
                  optionStyle = 'border-neutral-100 opacity-60';
                }
              }

              return (
                <button
                  key={letter}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => setSelectedOption(letter)}
                  className={`w-full text-left flex items-start gap-3.5 rounded-2xl border p-4 transition-all ${optionStyle}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors ${badgeStyle}`}
                  >
                    {letter}
                  </span>
                  <span className="text-xs sm:text-sm font-medium leading-relaxed text-neutral-800 pt-0.5">
                    {optionText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SUBMIT BUTTON */}
          {!feedback ? (
            <div className="mt-8">
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!selectedOption || isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 px-6 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <span>Submit Answer</span>
                )}
              </button>
            </div>
          ) : (
            /* FEEDBACK INTERFACE */
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div
                className={`rounded-2xl border p-5 ${
                  feedback.is_correct
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-rose-200 bg-rose-50/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {feedback.is_correct ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-600" />
                    )}
                    <span
                      className={`text-sm font-extrabold ${
                        feedback.is_correct ? 'text-emerald-900' : 'text-rose-900'
                      }`}
                    >
                      {feedback.is_correct ? 'Correct!' : 'Not quite.'}
                    </span>
                  </div>

                  {feedback.difficulty_update && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        feedback.difficulty_update.direction === 'promoted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : feedback.difficulty_update.direction === 'remediated'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {feedback.difficulty_update.direction === 'promoted'
                        ? 'Level Up ↑'
                        : feedback.difficulty_update.direction === 'remediated'
                        ? 'Remediating ↓'
                        : 'Level Maintained'}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-medium">
                  {enrichedExplanation || feedback.explanation}
                </p>

                {/* LLM enrichment loading indicator */}
                {isEnrichingExplanation && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
                    <span className="text-[10px] text-violet-600 font-medium">AI refining explanation...</span>
                  </div>
                )}

                {/* Source indicator */}
                {explanationSource && !isEnrichingExplanation && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      explanationSource === 'llm'
                        ? 'bg-violet-50 text-violet-700 border border-violet-100'
                        : 'bg-neutral-50 text-neutral-500 border border-neutral-100'
                    }`}>
                      {explanationSource === 'llm' ? '✦ AI-Generated' : 'Template'}
                    </span>
                  </div>
                )}

                {/* Concept gap — prefer LLM-enriched version */}
                {(enrichedConceptGap || feedback.concept_gap) && (
                  <div className="mt-2.5 rounded-lg bg-white/80 border border-rose-100 p-2 text-xs text-rose-800">
                    <span className="font-bold">Knowledge Gap:</span> {enrichedConceptGap || feedback.concept_gap}
                  </div>
                )}
              </div>

              {/* NEXT QUESTION BUTTON (Does not auto skip) */}
              <button
                type="button"
                onClick={handleNextQuestion}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 px-6 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-violet-600"
              >
                <span>
                  {currentIndex >= questions.length - 1 ? 'View Batch Summary' : 'Next Question'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PracticeQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-neutral-900 mb-2" />
            <p className="text-xs font-semibold text-neutral-700">Loading Practice Module...</p>
          </div>
        </div>
      }
    >
      <PracticeQuizContent />
    </Suspense>
  );
}
