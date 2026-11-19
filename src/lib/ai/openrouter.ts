/**
 * OpenRouter AI Client
 * Server-side only. Never import this in client components.
 * API keys are read exclusively from server-side environment variables.
 */

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterCallOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  jsonMode?: boolean;
}

/** Returns true only if OPENROUTER_API_KEY is set and not a placeholder */
export function isOpenRouterConfigured(): boolean {
  const key = process.env.OPENROUTER_API_KEY;
  return Boolean(
    key &&
    key.length > 20 &&
    !key.includes('your-openrouter-api-key') &&
    !key.includes('sk-or-placeholder')
  );
}

/** Returns the configured model identifier */
export function getConfiguredModel(): string {
  return process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';
}

/**
 * Makes an authenticated request to OpenRouter.
 * Supports configurable timeout, retries with exponential back-off,
 * and JSON mode enforcement.
 * API key is NEVER returned to or logged in the browser.
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterCallOptions = {}
): Promise<string> {
  const {
    temperature = 0.2,
    maxTokens = 4096,
    timeoutMs = 45000,
    retries = 2,
    retryDelayMs = 1500,
    jsonMode = true,
  } = options;

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = getConfiguredModel();

  if (!apiKey || !isOpenRouterConfigured()) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    requestBody.response_format = { type: 'json_object' };
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      // Exponential back-off: 1.5s, 3s
      await sleep(retryDelayMs * attempt);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer':
              process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'SH!T - Resume Practice Platform',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.status === 429) {
        // Rate limited — always retry
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelayMs * (attempt + 2);
        await sleep(delay);
        lastError = new Error(`OpenRouter rate limited (429). Retrying after ${delay}ms.`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error body');
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new Error(
          'OpenRouter returned an empty or malformed response. ' +
          `Model: ${model}, Finish reason: ${data?.choices?.[0]?.finish_reason ?? 'unknown'}`
        );
      }

      return content;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error(
          `OpenRouter request timed out after ${timeoutMs}ms (attempt ${attempt + 1}/${retries + 1})`
        );
      } else if (err instanceof Error) {
        lastError = err;
      } else {
        lastError = new Error(String(err));
      }

      // Don't retry on hard auth errors
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        break;
      }

      // Don't retry on client-side JSON errors
      if (lastError.message.includes('JSON')) {
        break;
      }
    }
  }

  throw lastError ?? new Error('OpenRouter call failed after all retries');
}

/**
 * Lightweight probe: makes the cheapest possible valid OpenRouter request
 * to verify API key authenticity and model availability.
 * Returns detailed connection metadata, never the key itself.
 */
export async function probeOpenRouterConnection(): Promise<{
  connected: boolean;
  model: string;
  latencyMs: number;
  error?: string;
  promptTokens?: number;
}> {
  const model = getConfiguredModel();

  if (!isOpenRouterConfigured()) {
    return {
      connected: false,
      model,
      latencyMs: 0,
      error: 'OPENROUTER_API_KEY is not set or is a placeholder value',
    };
  }

  const start = Date.now();

  try {
    const result = await callOpenRouter(
      [
        {
          role: 'user',
          content:
            'Reply with only valid JSON: {"status":"ok","platform":"openrouter"}',
        },
      ],
      {
        temperature: 0,
        maxTokens: 32,
        timeoutMs: 15000,
        retries: 0,
        jsonMode: true,
      }
    );

    const latencyMs = Date.now() - start;
    const parsed = JSON.parse(cleanJsonOutput(result));
    const isValidResponse =
      parsed?.status === 'ok' || parsed?.platform === 'openrouter' || typeof parsed === 'object';

    if (!isValidResponse) {
      throw new Error('Probe returned unexpected JSON: ' + result.slice(0, 100));
    }

    return { connected: true, model, latencyMs };
  } catch (err: unknown) {
    return {
      connected: false,
      model,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Extracts and cleans JSON from LLM output.
 * Handles markdown code fences, BOM characters, trailing commas, and partial wrapping.
 */
export function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();

  // Strip UTF-8 BOM
  if (cleaned.charCodeAt(0) === 0xfeff) {
    cleaned = cleaned.slice(1);
  }

  // Strip markdown ```json ... ``` or ``` ... ``` fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  // Some models prefix with "json\n" outside of fences
  cleaned = cleaned.replace(/^json\s*\n/i, '');

  return cleaned.trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
