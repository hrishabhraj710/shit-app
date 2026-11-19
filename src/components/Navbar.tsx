'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Brain, User as UserIcon, LogOut, UploadCloud, LayoutDashboard, Sparkles } from 'lucide-react';

interface AuthUserState {
  id: string;
  email: string;
  full_name: string;
  is_demo?: boolean;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUserState | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const { signOutFirebase } = await import('@/lib/firebase/client');
      await signOutFirebase();
    } catch {
      // Ignore client signout error if Firebase not configured
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setShowDropdown(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-neutral-900 to-neutral-700 text-white shadow-sm transition-transform group-hover:scale-105">
            <span className="font-black text-sm tracking-tighter">SH!T</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-neutral-900">SH!T</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-600 -mt-1">
              Adaptive Practice
            </span>
          </div>
        </Link>

        {/* Center / Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/dashboard'
                ? 'text-neutral-900 bg-neutral-100'
                : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/#upload"
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/upload'
                ? 'text-neutral-900 bg-neutral-100'
                : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            Upload Resume
          </Link>
        </nav>

        {/* Right Section: User Menu or Auth CTA */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1.5 pr-3 shadow-xs hover:border-neutral-300 transition-colors focus:outline-hidden"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-bold text-white">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-medium text-neutral-800 max-w-[120px] truncate">
                  {user.full_name}
                </span>
                {user.is_demo && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                    Demo
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-900 truncate">{user.full_name}</p>
                    <p className="text-[11px] text-neutral-600 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <LayoutDashboard className="h-4 w-4 text-neutral-600" />
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <UserIcon className="h-4 w-4 text-neutral-600" />
                    Profile & Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/login?tab=signup"
                className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
