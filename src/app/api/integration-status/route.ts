/**
 * Integration Status API — Server-side only
 * Makes live probe requests to OpenRouter and Firebase.
 * Returns connectivity metadata. NEVER returns API keys or credentials.
 */

import { NextRequest, NextResponse } from 'next/server';
import { probeOpenRouterConnection, getConfiguredModel, isOpenRouterConfigured } from '@/lib/ai/openrouter';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import { isFirebaseAdminConfigured, getAdminFirestore } from '@/lib/firebase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function probeFirebase(): Promise<{
  configured: boolean;
  connected: boolean;
  projectId?: string;
  latencyMs: number;
  error?: string;
}> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!isFirebaseConfigured() || !projectId) {
    return {
      configured: false,
      connected: false,
      latencyMs: 0,
      error: 'NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID not configured',
    };
  }

  const start = Date.now();
  try {
    // 1. If service account is configured, test with admin firestore
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const adminDb = getAdminFirestore();
      if (adminDb) {
        await adminDb.collection('users').limit(1).get();
        return {
          configured: true,
          connected: true,
          projectId,
          latencyMs: Date.now() - start,
        };
      }
    }

    // 2. Otherwise probe Firebase REST API endpoint
    const probeUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    const res = await fetch(probeUrl, {
      headers: apiKey ? { 'x-goog-api-key': apiKey } : {},
      signal: AbortSignal.timeout(6000),
    });

    const latencyMs = Date.now() - start;

    // 200 (database ready) or 403 (rules active) means Firestore is active and reachable
    if (res.ok || res.status === 200 || res.status === 403) {
      return {
        configured: true,
        connected: true,
        projectId,
        latencyMs,
      };
    }

    // 404 indicates Firestore database (default) has not been created yet in console
    if (res.status === 404) {
      return {
        configured: true,
        connected: false,
        projectId,
        latencyMs,
        error: 'Firestore Database not yet created. Go to Firebase Console > Firestore Database > Create database',
      };
    }

    return {
      configured: true,
      connected: false,
      projectId,
      latencyMs,
      error: `Firebase responded with HTTP ${res.status}`,
    };
  } catch (err: unknown) {
    return {
      configured: true,
      connected: false,
      projectId,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function GET(req: NextRequest) {
  const [openrouterResult, firebaseResult] = await Promise.all([
    probeOpenRouterConnection(),
    probeFirebase(),
  ]);

  const payload = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    integrations: {
      openrouter: {
        configured: isOpenRouterConfigured(),
        connected: openrouterResult.connected,
        model: getConfiguredModel(),
        latencyMs: openrouterResult.latencyMs,
        ...(openrouterResult.error ? { error: openrouterResult.error } : {}),
        keyPresent: Boolean(process.env.OPENROUTER_API_KEY?.length),
        keyLength: process.env.OPENROUTER_API_KEY?.length ?? 0,
      },
      firebase: {
        configured: firebaseResult.configured,
        connected: firebaseResult.connected,
        ...(firebaseResult.projectId ? { projectId: firebaseResult.projectId } : {}),
        latencyMs: firebaseResult.latencyMs,
        ...(firebaseResult.error ? { error: firebaseResult.error } : {}),
        adminConfigured: isFirebaseAdminConfigured(),
      },
    },
    fallbackMode: {
      active: !openrouterResult.connected || !firebaseResult.connected,
      aiInference: openrouterResult.connected ? 'live_llm' : 'deterministic_fallback',
      database: firebaseResult.connected ? 'cloud_firestore' : 'in_memory_local_store',
      auth: firebaseResult.connected ? 'firebase_google_auth' : 'demo_session',
    },
  };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Powered-By': 'SH!T Platform',
    },
  });
}
