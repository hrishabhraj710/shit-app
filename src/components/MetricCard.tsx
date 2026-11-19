import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  gradient?: 'violet' | 'blue' | 'lavender' | 'cyan';
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient = 'violet',
}: MetricCardProps) {
  const gradientStyles = {
    violet: 'from-violet-500/10 via-purple-500/5 to-transparent border-violet-100/80',
    blue: 'from-blue-500/10 via-sky-500/5 to-transparent border-blue-100/80',
    lavender: 'from-indigo-500/10 via-violet-500/5 to-transparent border-indigo-100/80',
    cyan: 'from-cyan-500/10 via-teal-500/5 to-transparent border-cyan-100/80',
  };

  const iconColors = {
    violet: 'text-violet-600 bg-violet-100/70',
    blue: 'text-blue-600 bg-blue-100/70',
    lavender: 'text-indigo-600 bg-indigo-100/70',
    cyan: 'text-cyan-600 bg-cyan-100/70',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradientStyles[gradient]} bg-white/80 p-5 shadow-xs backdrop-blur-md transition-all hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
          {title}
        </span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconColors[gradient]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-neutral-900">{value}</span>
      </div>
      <p className="mt-1 text-xs text-neutral-600">{subtitle}</p>
    </div>
  );
}
