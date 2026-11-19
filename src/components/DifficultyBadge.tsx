import React from 'react';

interface DifficultyBadgeProps {
  level: number;
  showLabel?: boolean;
}

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Foundation',
  2: 'Understanding',
  3: 'Application',
  4: 'Advanced',
  5: 'Expert',
};

export default function DifficultyBadge({ level, showLabel = true }: DifficultyBadgeProps) {
  const boundedLevel = Math.max(1, Math.min(5, level || 1));
  const name = LEVEL_NAMES[boundedLevel];

  const colorStyles: Record<number, string> = {
    1: 'bg-blue-50 text-blue-700 border-blue-200',
    2: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    3: 'bg-violet-50 text-violet-700 border-violet-200',
    4: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    5: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const dotStyles: Record<number, string> = {
    1: 'bg-blue-500',
    2: 'bg-cyan-500',
    3: 'bg-violet-500',
    4: 'bg-fuchsia-500',
    5: 'bg-amber-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        colorStyles[boundedLevel]
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[boundedLevel]}`} />
      <span>Level {boundedLevel}</span>
      {showLabel && <span className="opacity-75 font-normal">· {name}</span>}
    </span>
  );
}
