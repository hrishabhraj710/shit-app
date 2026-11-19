'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User as UserIcon,
  Mail,
  Flame,
  Award,
  CheckCircle2,
  TrendingUp,
  LogOut,
  Trash2,
  Lock,
  ArrowLeft,
  Check,
  AlertTriangle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { DashboardMetrics } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; full_name: string } | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [name, setName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setUser(data.user);
          setName(data.user.full_name);
        }
      });

    fetch('/api/analytics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setMetrics(data);
      });
  }, []);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col text-neutral-900">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Profile Header */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white/80 p-6 sm:p-8 shadow-xs backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-2xl font-black text-white shadow-md">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                {name || 'Developer Profile'}
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">{user?.email || 'user@example.com'}</p>

              {/* Stats Strip */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-xl bg-neutral-50 p-2.5 border border-neutral-100">
                  <span className="block text-[10px] font-semibold text-neutral-600 uppercase">SH!Ts Done</span>
                  <span className="text-base font-extrabold text-neutral-900">
                    {metrics?.total_questions_answered ?? 0}
                  </span>
                </div>
                <div className="rounded-xl bg-neutral-50 p-2.5 border border-neutral-100">
                  <span className="block text-[10px] font-semibold text-neutral-600 uppercase">Accuracy</span>
                  <span className="text-base font-extrabold text-neutral-900">
                    {metrics?.overall_accuracy ?? 0}%
                  </span>
                </div>
                <div className="rounded-xl bg-neutral-50 p-2.5 border border-neutral-100">
                  <span className="block text-[10px] font-semibold text-neutral-600 uppercase">Current Streak</span>
                  <span className="text-base font-extrabold text-neutral-900">
                    {metrics?.current_streak ?? 0}d
                  </span>
                </div>
                <div className="rounded-xl bg-neutral-50 p-2.5 border border-neutral-100">
                  <span className="block text-[10px] font-semibold text-neutral-600 uppercase">Highest Level</span>
                  <span className="text-base font-extrabold text-violet-600">
                    L{metrics?.highest_difficulty_unlocked ?? 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SETTINGS FORMS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit Profile */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-neutral-900 mb-4">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-xs text-neutral-900 focus:border-violet-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs text-neutral-600 cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition-colors"
              >
                {savedSuccess && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                <span>{savedSuccess ? 'Saved Changes' : 'Save Profile'}</span>
              </button>
            </form>
          </div>

          {/* Account Actions & Danger Zone */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 mb-4">Account & Session</h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Manage your credentials or sign out of your active browser session.
              </p>
              <div className="mt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5 text-neutral-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            <div className="mt-8 border-t border-neutral-100 pt-4">
              <span className="text-xs font-bold text-rose-700 block mb-1">Danger Zone</span>
              <p className="text-[11px] text-neutral-600 mb-3">
                Permanently delete your account, uploaded resumes, and learning history.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-neutral-900">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed mb-6">
              Are you sure you want to delete your account? All your uploaded resumes, extracted
              projects, and adaptive test sessions will be permanently purged.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
