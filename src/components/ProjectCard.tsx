import React from 'react';
import Link from 'next/link';
import { Play, Calendar, HelpCircle, Target, ArrowRight } from 'lucide-react';
import { Project } from '@/types';
import DifficultyBadge from './DifficultyBadge';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const attempted = project.questions_attempted || 0;
  const accuracy = project.accuracy_rate || 0;
  const lastPracticed = project.last_practiced_at
    ? new Date(project.last_practiced_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : 'Not practiced yet';

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-md transition-all hover:border-neutral-300 hover:shadow-lg hover:-translate-y-0.5">
      <div>
        {/* Top Header: Category and Difficulty */}
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-neutral-600 uppercase">
            {project.category || 'Software Project'}
          </span>
          <DifficultyBadge level={project.current_difficulty || 1} />
        </div>

        {/* Project Title & Description */}
        <div className="mt-4">
          <h3 className="text-lg font-bold tracking-tight text-neutral-900 group-hover:text-violet-600 transition-colors">
            {project.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 line-clamp-2">
            {project.description || 'Practice claims and technical concepts for this project.'}
          </p>
        </div>

        {/* Technologies */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 5).map((tech, i) => (
              <span
                key={i}
                className="rounded-md border border-neutral-200/70 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 5 && (
              <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-600">
                +{project.technologies.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-neutral-100 pt-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-neutral-50/80 p-2">
            <span className="block text-[11px] font-medium text-neutral-600">Attempted</span>
            <span className="text-sm font-bold text-neutral-800">{attempted}</span>
          </div>
          <div className="rounded-lg bg-neutral-50/80 p-2">
            <span className="block text-[11px] font-medium text-neutral-600">Accuracy</span>
            <span className="text-sm font-bold text-neutral-800">{accuracy}%</span>
          </div>
          <div className="rounded-lg bg-neutral-50/80 p-2">
            <span className="block text-[11px] font-medium text-neutral-600">Practiced</span>
            <span className="text-[11px] font-semibold text-neutral-700 truncate">{lastPracticed}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            href={`/projects/${project.id}`}
            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Details & Claims
          </Link>

          <Link
            href={`/practice/${project.id}`}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-violet-600 hover:shadow-md"
          >
            <span>Start Practice</span>
            <Play className="h-3.5 w-3.5 fill-current" />
          </Link>
        </div>
      </div>
    </div>
  );
}
