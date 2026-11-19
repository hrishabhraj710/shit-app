'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, ArrowRight, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { signInWithGoogle, isFirebaseConfigured } from '@/lib/firebase/client';

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('tab') === 'signup') {
      setActiveTab('signup');
    }
  }, [searchParams]);

  // Google OAuth sign-in via Firebase
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      if (!isFirebaseConfigured()) {
        throw new Error(
          'Firebase is not configured in environment variables. Please add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID to .env.local, or use the Demo Account below.'
        );
      }

      const result = await signInWithGoogle();
      if (!result) return;

      const { user, idToken } = result;

      // Exchange Firebase ID Token with server to create/retrieve profile in Firestore & set cookie
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_token: idToken,
          uid: user.uid,
          email: user.email,
          full_name: user.displayName || user.email?.split('@')[0] || 'Developer',
          avatar_url: user.photoURL,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to synchronize Firebase session');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setErrorMessage(err.message || 'Google sign-in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const endpoint = activeTab === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const payload =
      activeTab === 'signup'
        ? { email, password, full_name: fullName }
        : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_demo: true }),
      });

      if (!res.ok) {
        throw new Error('Failed to start demo session');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo access error');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-xl backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 text-white font-black text-base shadow-sm mb-3">
          SH!T
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          {activeTab === 'login' ? 'Welcome Back' : 'Create Your Account'}
        </h1>
        <p className="mt-1 text-xs text-neutral-600">
          {activeTab === 'login'
            ? 'Sign in to access your projects and adaptive quiz history'
            : 'Start transforming your resume into interactive practice'}
        </p>
      </div>

      {/* Primary: Continue with Google Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
        className="w-full flex items-center justify-center gap-3 rounded-2xl border border-neutral-300 bg-white py-3 px-4 text-xs font-bold text-neutral-800 shadow-2xs hover:bg-neutral-50 hover:border-neutral-400 transition-all disabled:opacity-50"
      >
        {isGoogleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-neutral-600" />
        ) : (
          <GoogleIcon />
        )}
        <span>Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-neutral-400 uppercase tracking-wider text-[10px] font-semibold">
            Or With Email
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-neutral-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab('login');
            setErrorMessage(null);
          }}
          className={`w-1/2 rounded-lg py-2 text-xs font-semibold transition-all ${
            activeTab === 'login'
              ? 'bg-white text-neutral-900 shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('signup');
            setErrorMessage(null);
          }}
          className={`w-1/2 rounded-lg py-2 text-xs font-semibold transition-all ${
            activeTab === 'signup'
              ? 'bg-white text-neutral-900 shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'signup' && (
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-xs text-neutral-900 focus:border-violet-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-xs text-neutral-900 focus:border-violet-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-xs text-neutral-900 focus:border-violet-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-neutral-800 disabled:bg-neutral-300"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <>
              <span>{activeTab === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-neutral-400 uppercase tracking-wider text-[10px] font-semibold">
            Or Instant Evaluation
          </span>
        </div>
      </div>

      {/* Instant Demo Account Button */}
      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={isLoading || isGoogleLoading}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50/60 py-2.5 px-4 text-xs font-bold text-violet-700 transition-all hover:bg-violet-100 hover:border-violet-300"
      >
        <Sparkles className="h-3.5 w-3.5 text-violet-600" />
        <span>One-Click Demo Developer Account</span>
      </button>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col text-neutral-900">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Suspense fallback={<div className="text-center text-xs text-neutral-500">Loading...</div>}>
          <AuthContent />
        </Suspense>
      </div>
    </div>
  );
}
