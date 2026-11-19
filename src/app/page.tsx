'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  TrendingUp,
  BrainCircuit,
  CheckCircle,
  HelpCircle,
  FileCheck,
  Zap,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import FileUploadZone from '@/components/FileUploadZone';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col text-neutral-900 selection:bg-violet-100 selection:text-violet-900">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Subtle decorative background gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-violet-200/40 via-blue-200/30 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Subtle badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-4 py-1.5 text-xs font-semibold text-neutral-800 shadow-2xs backdrop-blur-md mb-6">
            <span className="flex h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
            <span>AI-Powered Adaptive Resume Defense Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-950 sm:text-6xl md:text-7xl">
            Know your resume.{' '}
            <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Own your interview.
            </span>
          </h1>

          {/* Supporting text */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-neutral-600">
            Turn your projects, skills, and experience into an adaptive learning experience. Understand
            every claim on your resume before someone asks you about it.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#upload"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-violet-600 hover:shadow-lg hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#how-it-works"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-7 py-3.5 text-sm font-semibold text-neutral-800 shadow-2xs hover:bg-neutral-50 transition-colors"
            >
              <span>How it works</span>
            </a>
          </div>
        </div>

        {/* EMBEDDED UPLOAD ZONE */}
        <div className="mt-14 px-4 sm:px-6 lg:px-8">
          <FileUploadZone />
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 border-t border-neutral-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-600">
              The Architecture
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Engineered for Deep Resume Mastery
            </h2>
            <p className="mt-3 text-sm text-neutral-600">
              Stop memorizing generic interview questions. Practice specifically against the exact code,
              numbers, and architectures on your resume.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-7 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600 mb-5">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Project-by-Project Isolation</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                Each project becomes its own standalone practice module. Never mix unrelated questions:
                master one architecture completely before moving to the next.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-7 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 mb-5">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Adaptive 5-Level Engine</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                Difficulty dynamically climbs from Foundation (definitions) to Expert (tradeoffs & failure scenarios).
                3 consecutive correct answers level you up; repeated misses trigger remedial prerequisite concepts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-7 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-5">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Quantitative Claim Validation</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                If your resume claims &quot;Processed 420K+ records with sub-50ms latency&quot;, the engine generates
                rigorous mathematical and scaling questions to help you defend those exact numbers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-neutral-200 bg-white py-8 text-center text-xs text-neutral-600">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-neutral-900">SH!T</span>
            <span>· Adaptive Resume Analysis & Quiz Learning Platform</span>
          </div>
          <p>© 2026 SH!T. Engineered for technical excellence.</p>
        </div>
      </footer>
    </div>
  );
}
