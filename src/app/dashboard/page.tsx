'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  TrendingUp,
  Flame,
  Award,
  BookOpen,
  ArrowRight,
  PlusCircle,
  AlertCircle,
  Sparkles,
  BarChart2,
  Brain,
  ShieldAlert,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import MetricCard from '@/components/MetricCard';
import ProjectCard from '@/components/ProjectCard';
import DifficultyBadge from '@/components/DifficultyBadge';
import { Project, DashboardMetrics } from '@/types';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [userName, setUserName] = useState<string>('Developer');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, projRes, metricsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/projects'),
          fetch('/api/analytics'),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData?.user?.full_name) {
            setUserName(userData.user.full_name.split(' ')[0]);
          }
        }

        if (projRes.ok) {
          const pData = await projRes.json();
          setProjects(pData.projects || []);
        }

        if (metricsRes.ok) {
          const mData = await metricsRes.json();
          setMetrics(mData);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col text-neutral-900">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* WELCOME SECTION */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-neutral-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 border border-violet-100 mb-2">
              <Sparkles className="h-3 w-3 text-violet-600" />
              <span>Personalized Learning Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
              Welcome back, {userName}.
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Ready to get better at explaining what you&apos;ve built?
            </p>
          </div>

          <Link
            href="/#upload"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 shadow-2xs hover:bg-neutral-50 transition-colors self-start md:self-auto"
          >
            <PlusCircle className="h-4 w-4 text-violet-600" />
            <span>Upload New Resume / Project</span>
          </Link>
        </div>

        {/* PERFORMANCE DASHBOARD: 4 METRICS CARDS */}
        <div className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">
            Practice Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="SH!Ts Done"
              value={metrics?.total_questions_answered ?? 0}
              subtitle="Total questions answered"
              icon={CheckCircle2}
              gradient="violet"
            />
            <MetricCard
              title="Levels Unlocked"
              value={`Level ${metrics?.highest_difficulty_unlocked ?? 1}`}
              subtitle="Highest difficulty achieved"
              icon={Award}
              gradient="blue"
            />
            <MetricCard
              title="Current Streak"
              value={`${metrics?.current_streak ?? 0} ${metrics?.current_streak === 1 ? 'day' : 'days'}`}
              subtitle="Consecutive practice days"
              icon={Flame}
              gradient="lavender"
            />
            <MetricCard
              title="Accuracy Rate"
              value={`${metrics?.overall_accuracy ?? 0}%`}
              subtitle="Correct answer ratio"
              icon={TrendingUp}
              gradient="cyan"
            />
          </div>
        </div>

        {/* PROJECT SECTION */}
        <div className="mt-12">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                Your Experience
              </h2>
              <p className="mt-0.5 text-xs text-neutral-600">
                Choose what you want to practice today. Questions are isolated per project.
              </p>
            </div>
            <span className="text-xs font-semibold text-neutral-600">
              {projects.length} {projects.length === 1 ? 'Module' : 'Modules'} Available
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl border border-neutral-200/60 bg-white/50 animate-pulse p-6"
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-10 text-center shadow-xs">
              <BookOpen className="mx-auto h-10 w-10 text-neutral-300 mb-3" />
              <h3 className="text-base font-bold text-neutral-900">No projects analyzed yet</h3>
              <p className="text-xs text-neutral-600 mt-1 max-w-sm mx-auto">
                Upload your resume to extract your projects and generate adaptive 10-question practice modules.
              </p>
              <Link
                href="/#upload"
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-violet-600 transition-colors"
              >
                <span>Upload Resume Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* PROJECT ANALYTICS SECTION */}
        {metrics && (metrics.strongest_topics.length > 0 || metrics.weakest_topics.length > 0) && (
          <div className="mt-14 pt-8 border-t border-neutral-200/80">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="h-5 w-5 text-neutral-700" />
              <h2 className="text-lg font-bold tracking-tight text-neutral-900">
                Topic Mastery Analytics
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strongest Topics */}
              <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <Brain className="h-4 w-4 text-emerald-600" />
                    Strongest Topics
                  </span>
                  <span className="text-[11px] text-neutral-600">Ready for advanced defense</span>
                </div>

                <div className="space-y-3">
                  {metrics.strongest_topics.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-800">{item.topic}</span>
                        <div className="flex items-center gap-2">
                          <DifficultyBadge level={item.level} showLabel={false} />
                          <span className="font-bold text-neutral-900">{item.accuracy}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${item.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics Requiring Improvement */}
              <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    Topics Requiring Improvement
                  </span>
                  <span className="text-[11px] text-neutral-600">Adaptive remediation queued</span>
                </div>

                <div className="space-y-3">
                  {metrics.weakest_topics.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-800">{item.topic}</span>
                        <div className="flex items-center gap-2">
                          <DifficultyBadge level={item.level} showLabel={false} />
                          <span className="font-bold text-neutral-900">{item.accuracy}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${item.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
