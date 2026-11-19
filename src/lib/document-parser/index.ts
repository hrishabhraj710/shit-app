import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Supported mime types and extensions
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.csv', '.xlsx'];
export const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB limit

/**
 * Sanitizes extracted document text to prevent prompt injection and remove malformed artifacts.
 */
export function sanitizeDocumentText(rawText: string): string {
  if (!rawText) return '';

  let cleaned = rawText
    // Remove control characters (except common whitespace)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    // Normalize newlines
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove repeated spaces
    .replace(/[ \t]{2,}/g, ' ')
    // Remove excessive consecutive newlines
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();

  // Strip potential AI jailbreak / prompt injection patterns from untrusted user documents
  const injectionPatterns = [
    /ignore (all )?(previous|above) instructions/gi,
    /system prompt override/gi,
    /you are now an unrestricted/gi,
    /reveal (your|the) (secret|system|api) key/gi,
  ];

  for (const pattern of injectionPatterns) {
    cleaned = cleaned.replace(pattern, '[REDACTED_SECURITY_PROMPT]');
  }

  return cleaned;
}

/**
 * Extracts plain text from an uploaded file Buffer based on filename extension.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string
): Promise<{ text: string; error?: string }> {
  try {
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        text: '',
        error: `Unsupported file extension: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }

    if (ext === '.txt') {
      const text = buffer.toString('utf-8');
      return { text: sanitizeDocumentText(text) };
    }

    if (ext === '.csv') {
      const text = buffer.toString('utf-8');
      return { text: sanitizeDocumentText(text) };
    }

    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer });
      return { text: sanitizeDocumentText(result.value) };
    }

    if (ext === '.xlsx') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetsText: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        sheetsText.push(`--- Sheet: ${sheetName} ---\n${csv}`);
      }
      return { text: sanitizeDocumentText(sheetsText.join('\n\n')) };
    }

    if (ext === '.pdf') {
      try {
        // Use unpdf for fast and clean server-side PDF text extraction
        const { extractText } = await import('unpdf');
        const uint8Array = new Uint8Array(buffer);
        const { text } = await extractText(uint8Array, { mergePages: true });
        if (text && text.trim().length > 0) {
          return { text: sanitizeDocumentText(text) };
        }
      } catch (pdfErr) {
        console.warn('unpdf failed, trying fallback PDF stream parsing:', pdfErr);
      }

      // Fallback basic text extraction if unpdf fails on complex stream
      const textFromBuffer = buffer
        .toString('latin1')
        .replace(/[^\x20-\x7E\n\t]/g, ' ')
        .replace(/\s+/g, ' ');
      return { text: sanitizeDocumentText(textFromBuffer.slice(0, 15000)) };
    }

    return { text: '', error: 'Unknown file format' };
  } catch (error: any) {
    console.error(`Error parsing file ${fileName}:`, error);
    return {
      text: '',
      error: `Failed to extract text from ${fileName}: ${error.message || String(error)}`,
    };
  }
}
