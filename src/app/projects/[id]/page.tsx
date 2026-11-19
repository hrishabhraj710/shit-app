'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Layers,
  Code,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Tag,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import DifficultyBadge from '@/components/DifficultyBadge';
import ResetModal from '@/components/ResetModal';
import { Project, TopicMastery } from '@/types';

function ProjectDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [topicMasteries, setTopicMasteries] = useState<TopicMastery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        throw new Error('Project not found');
      }
      const data = await res.json();
      setProject(data.project);
      setTopicMasteries(data.topicMasteries || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-xs text-neutral-600">
          Loading project specifications...
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <Navbar />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-3" />
          <h2 className="text-lg font-bold text-neutral-900">Project Not Found</h2>
          <p className="mt-1 text-xs text-neutral-600">This module does not exist or you don&apos;t have access.</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col text-neutral-900">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 py-8">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* HEADER BAR */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white/80 p-6 sm:p-8 shadow-xs backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-md bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  {project.category}
                </span>
                <DifficultyBadge level={project.current_difficulty || 1} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
                {project.title}
              </h1>
              <p className="mt-2 text-sm text-neutral-600 max-w-3xl leading-relaxed">
                {project.description}
              </p>
            </div>

            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2.5 shrink-0">
              <Link
                href={`/practice/${project.id}`}
                className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-violet-600 transition-all hover:shadow-md"
              >
                <span>Start Practice</span>
                <Play className="h-3.5 w-3.5 fill-current" />
              </Link>
              <button
                onClick={() => setIsResetOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-600 hover:text-rose-600 hover:border-rose-200 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Progress</span>
              </button>
            </div>
          </div>

          {/* Tech Stack Chips */}
          {project.technologies && project.technologies.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
              {project.technologies.map((t, idx) => (
                <span
                  key={idx}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CLAIMS & TECHNICAL ARCHITECTURE BREAKDOWN */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quantitative Claims & Numbers */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700 mb-4">
              <TrendingUp className="h-4 w-4 text-violet-600" />
              <span>Quantitative Claims & Numerical Metrics</span>
            </div>

            {project.extracted_content?.quantitative_claims &&
            project.extracted_content.quantitative_claims.length > 0 ? (
              <ul className="space-y-2.5">
                {project.extracted_content.quantitative_claims.map((claim, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 rounded-xl bg-violet-50/50 border border-violet-100 p-3 text-xs font-medium text-neutral-800"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-600 text-[10px] font-bold text-white">
                      #{idx + 1}
                    </span>
                    <span className="leading-relaxed">{claim}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-neutral-600 italic">No quantitative claims detected in resume.</p>
            )}
          </div>

          {/* Core Implementation Details */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700 mb-4">
              <Code className="h-4 w-4 text-blue-600" />
              <span>Implementation Details</span>
            </div>

            {project.extracted_content?.implementation_details &&
            project.extracted_content.implementation_details.length > 0 ? (
              <ul className="space-y-2">
                {project.extracted_content.implementation_details.map((detail, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs leading-relaxed text-neutral-700"
                  >
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-neutral-600 italic">No bullet points extracted.</p>
            )}
          </div>
        </div>

        {/* ASSOCIATED FILES & TOPIC MASTERY TABLE */}
        <div className="mt-8 space-y-6">
          {/* Associated Files */}
          {project.project_metadata?.associated_file_names &&
            project.project_metadata.associated_file_names.length > 0 && (
              <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-5 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2 block">
                  Associated Project Documents
                </span>
                <div className="flex flex-wrap gap-2">
                  {project.project_metadata.associated_file_names.map((fn, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-800"
                    >
                      <FileText className="h-3.5 w-3.5 text-neutral-500" />
                      <span>{fn}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Topic Mastery Progression */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Topic Mastery Progression</h3>
                <p className="text-xs text-neutral-600">
                  Adaptive difficulty adapts independently across each topic.
                </p>
              </div>
            </div>

            {topicMasteries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-xs text-neutral-600">
                You haven&apos;t answered questions for this project yet. Start a 10-question practice batch
                to unlock topic masteries!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                    <tr>
                      <th className="pb-2.5">Topic</th>
                      <th className="pb-2.5">Current Level</th>
                      <th className="pb-2.5">Mastery Score</th>
                      <th className="pb-2.5">Accuracy</th>
                      <th className="pb-2.5">Attempts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium">
                    {topicMasteries.map((tm) => (
                      <tr key={tm.id} className="hover:bg-neutral-50/50">
                        <td className="py-3 font-semibold text-neutral-900">{tm.topic}</td>
                        <td className="py-3">
                          <DifficultyBadge level={tm.current_difficulty} />
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-neutral-900">{tm.mastery_score}</span>
                          <span className="text-[10px] text-neutral-600"> / 100</span>
                        </td>
                        <td className="py-3 font-semibold text-neutral-800">{tm.accuracy}%</td>
                        <td className="py-3 text-neutral-600">
                          {tm.correct_count} correct · {tm.incorrect_count} missed
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reset Confirmation Modal */}
      <ResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        projectTitle={project.title}
        projectId={project.id}
        onResetComplete={loadProject}
      />
    </div>
  );
}

export default function ProjectDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-neutral-900 mb-2" />
            <p className="text-xs font-semibold text-neutral-700">Loading Project Details...</p>
          </div>
        </div>
      }
    >
      <ProjectDetailsContent />
    </Suspense>
  );
}
