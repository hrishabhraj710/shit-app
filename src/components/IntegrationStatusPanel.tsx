'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Cpu,
  Flame,
  Zap,
} from 'lucide-react';

interface IntegrationStatus {
  timestamp: string;
  environment: string;
  integrations: {
    openrouter: {
      configured: boolean;
      connected: boolean;
      model: string;
      latencyMs: number;
      error?: string;
      keyPresent: boolean;
      keyLength: number;
    };
    firebase: {
      configured: boolean;
      connected: boolean;
      projectId?: string;
      latencyMs: number;
      error?: string;
      adminConfigured: boolean;
    };
  };
  fallbackMode: {
    active: boolean;
    aiInference: 'live_llm' | 'deterministic_fallback';
    database: 'cloud_firestore' | 'in_memory_local_store';
    auth: 'firebase_google_auth' | 'demo_session';
  };
}

/**
 * Dev-only integration status panel.
 * Shows real connectivity status for OpenRouter and Firebase.
 * Only renders in development or localhost environments.
 * Never displays API keys or credentials.
 */
export default function IntegrationStatusPanel() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Only show in dev/localhost
  useEffect(() => {
    const isDev =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('local');
    setIsVisible(isDev);
  }, []);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/integration-status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Silently fail — panel is non-critical
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && isExpanded && !status) {
      fetchStatus();
    }
  }, [isVisible, isExpanded]);

  if (!isVisible) return null;

  const or = status?.integrations.openrouter;
  const fb = status?.integrations.firebase;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs">
      {/* Collapsed pill */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold shadow-lg border backdrop-blur-md transition-all hover:scale-105 ${
          status?.fallbackMode.active === false
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
            : status
              ? 'bg-amber-50/90 border-amber-200 text-amber-800'
              : 'bg-neutral-50/90 border-neutral-200 text-neutral-700'
        }`}
      >
        <Activity className="h-3 w-3" />
        <span>Integration Status</span>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )}
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="mt-2 rounded-2xl border border-neutral-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-neutral-900">
              Runtime Integrations
            </h3>
            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              title="Re-probe connections"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {!status && isLoading && (
            <div className="flex items-center gap-2 py-4 justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
              <span className="text-[11px] text-neutral-500">
                Probing connections...
              </span>
            </div>
          )}

          {status && (
            <div className="space-y-3">
              {/* OpenRouter */}
              <div className="rounded-xl border border-neutral-100 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-violet-600" />
                    <span className="text-[11px] font-bold text-neutral-800">
                      OpenRouter AI
                    </span>
                  </div>
                  {or?.connected ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Live
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
                      <XCircle className="h-3 w-3" />
                      Fallback
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-neutral-600 space-y-0.5">
                  <div>
                    Model:{' '}
                    <span className="font-mono font-semibold text-neutral-800">
                      {or?.model || '—'}
                    </span>
                  </div>
                  {or?.connected && (
                    <div>
                      Probe latency:{' '}
                      <span className="font-semibold text-neutral-800">
                        {or.latencyMs}ms
                      </span>
                    </div>
                  )}
                  {or?.error && (
                    <div className="text-rose-600 font-medium mt-0.5">
                      {or.error.length > 80
                        ? or.error.slice(0, 80) + '…'
                        : or.error}
                    </div>
                  )}
                  <div>
                    Key present:{' '}
                    <span className="font-semibold">
                      {or?.keyPresent ? `Yes (${or.keyLength} chars)` : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Firebase & Cloud Firestore */}
              <div className="rounded-xl border border-neutral-100 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[11px] font-bold text-neutral-800">
                      Firebase & Firestore
                    </span>
                  </div>
                  {fb?.connected ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Live
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
                      <XCircle className="h-3 w-3" />
                      Local Store
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-neutral-600 space-y-0.5">
                  {fb?.connected && fb?.projectId && (
                    <div>
                      Project:{' '}
                      <span className="font-mono font-semibold text-neutral-800">
                        {fb.projectId}
                      </span>
                    </div>
                  )}
                  {fb?.connected && (
                    <div>
                      Probe latency:{' '}
                      <span className="font-semibold text-neutral-800">
                        {fb.latencyMs}ms
                      </span>
                    </div>
                  )}
                  {fb?.error && (
                    <div className="text-rose-600 font-medium mt-0.5">
                      {fb.error.length > 80
                        ? fb.error.slice(0, 80) + '…'
                        : fb.error}
                    </div>
                  )}
                  <div>
                    Spark Plan:{' '}
                    <span className="font-semibold text-emerald-700">
                      Free Tier Compatible
                    </span>
                  </div>
                </div>
              </div>

              {/* Overall mode */}
              <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="h-3 w-3 text-neutral-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                    Active Mode
                  </span>
                </div>
                <div className="text-[10px] text-neutral-700 space-y-0.5">
                  <div>
                    AI inference:{' '}
                    <span
                      className={`font-bold ${
                        status.fallbackMode.aiInference === 'live_llm'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {status.fallbackMode.aiInference === 'live_llm'
                        ? 'Live LLM'
                        : 'Deterministic Fallback'}
                    </span>
                  </div>
                  <div>
                    Database:{' '}
                    <span
                      className={`font-bold ${
                        status.fallbackMode.database === 'cloud_firestore'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {status.fallbackMode.database === 'cloud_firestore'
                        ? 'Cloud Firestore'
                        : 'In-Memory Local Store'}
                    </span>
                  </div>
                  <div>
                    Auth:{' '}
                    <span
                      className={`font-bold ${
                        status.fallbackMode.auth === 'firebase_google_auth'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {status.fallbackMode.auth === 'firebase_google_auth'
                        ? 'Google OAuth (Firebase)'
                        : 'Demo Session'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-neutral-400 text-center pt-1">
                Probed at{' '}
                {new Date(status.timestamp).toLocaleTimeString()} ·
                Dev-only panel
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
