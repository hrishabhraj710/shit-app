'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, RefreshCw, Trash2 } from 'lucide-react';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  projectId: string;
  onResetComplete: () => void;
}

export default function ResetModal({
  isOpen,
  onClose,
  projectTitle,
  projectId,
  onResetComplete,
}: ResetModalProps) {
  const [resetType, setResetType] = useState<'difficulty_only' | 'full_practice'>('difficulty_only');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_type: resetType }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Reset failed');
      }

      onResetComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reset progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 text-amber-600">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">Reset Project Progress</h3>
            <p className="text-xs text-neutral-600">{projectTitle}</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-600 leading-relaxed">
          Choose what you want to reset for this project. Other projects in your account will remain
          completely untouched.
        </p>

        {/* Option Selection */}
        <div className="mt-4 space-y-2.5">
          <label
            onClick={() => setResetType('difficulty_only')}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
              resetType === 'difficulty_only'
                ? 'border-violet-500 bg-violet-50/50 ring-1 ring-violet-500'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <input
              type="radio"
              name="resetType"
              checked={resetType === 'difficulty_only'}
              onChange={() => setResetType('difficulty_only')}
              className="mt-0.5 text-violet-600"
            />
            <div>
              <p className="text-xs font-bold text-neutral-900">Reset Difficulty Only</p>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                Resets current level back to Level 1 (Foundation) and resets topic cooldowns, but retains your
                question attempt history and accuracy stats.
              </p>
            </div>
          </label>

          <label
            onClick={() => setResetType('full_practice')}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
              resetType === 'full_practice'
                ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <input
              type="radio"
              name="resetType"
              checked={resetType === 'full_practice'}
              onChange={() => setResetType('full_practice')}
              className="mt-0.5 text-rose-600"
            />
            <div>
              <p className="text-xs font-bold text-rose-900">Reset All Practice Progress</p>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                Permanently clears all question attempts, topic mastery scores, and practice sessions for this project.
                Starts fresh as if newly uploaded.
              </p>
            </div>
          </label>
        </div>

        {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            disabled={isSubmitting}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors ${
              resetType === 'full_practice'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-neutral-900 hover:bg-neutral-800'
            }`}
          >
            {isSubmitting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : resetType === 'full_practice' ? (
              <Trash2 className="h-3.5 w-3.5" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>Confirm Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
