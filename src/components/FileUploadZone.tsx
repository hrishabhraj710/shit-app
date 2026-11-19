'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface SelectedFile {
  id: string;
  file: File;
  type: 'resume' | 'project';
  sizeFormatted: string;
}

export default function FileUploadZone() {
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState<SelectedFile | null>(null);
  const [projectFiles, setProjectFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile({
        id: `res-${Date.now()}`,
        file,
        type: 'resume',
        sizeFormatted: formatFileSize(file.size),
      });
      setErrorMessage(null);
    }
  };

  const handleProjectFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: SelectedFile[] = files.map((file, idx) => ({
      id: `proj-${Date.now()}-${idx}`,
      file,
      type: 'project',
      sizeFormatted: formatFileSize(file.size),
    }));
    setProjectFiles((prev) => [...prev, ...newFiles]);
  };

  const removeProjectFile = (id: string) => {
    setProjectFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUploadAndAnalyze = async () => {
    if (!resumeFile) {
      setErrorMessage('Please select a resume file (PDF, DOCX, or TXT) to analyze.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStep('Extracting document contents and metrics...');

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile.file);
      projectFiles.forEach((f) => {
        formData.append('project_files', f.file);
      });
      // Allow instant guest/demo continuation if needed
      formData.append('is_guest', 'true');

      const progressTimer = setTimeout(() => {
        setProcessingStep('Running AI analysis: isolating projects, claims, and numerical metrics...');
      }, 1500);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(progressTimer);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to analyze resume');
      }

      setProcessingStep('Structuring interactive modules and topic masteries...');
      const data = await res.json();

      // Redirect directly to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis encountered an error. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div id="upload" className="w-full max-w-3xl mx-auto rounded-3xl border border-neutral-200/80 bg-white/90 p-6 sm:p-8 shadow-xl backdrop-blur-md">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 border border-violet-100 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span>Multi-Format Document Ingestion</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Upload Your Resume & Project Docs
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Supported formats: PDF, DOCX, TXT, CSV, XLSX. Each project will become an interactive practice module.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {/* RESUME UPLOAD SECTION */}
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              1. Primary Resume <span className="text-rose-500">*</span>
            </span>
            <span className="text-[11px] text-neutral-600">PDF, DOCX, TXT</span>
          </div>

          {!resumeFile ? (
            <div
              onClick={() => resumeInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white p-6 cursor-pointer hover:border-violet-500 hover:bg-violet-50/20 transition-all text-center"
            >
              <UploadCloud className="h-8 w-8 text-neutral-400 mb-2" />
              <p className="text-sm font-semibold text-neutral-800">
                Click to browse or drop your resume
              </p>
              <p className="text-xs text-neutral-600 mt-1">Maximum file size: 12MB</p>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleResumeSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900 truncate max-w-[280px] sm:max-w-md">
                    {resumeFile.file.name}
                  </p>
                  <p className="text-xs text-neutral-600">{resumeFile.sizeFormatted}</p>
                </div>
              </div>
              <button
                onClick={() => setResumeFile(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* SUPPORTING PROJECT FILES SECTION */}
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                2. Supporting Project Files (Optional)
              </span>
              <p className="text-[11px] text-neutral-600">
                Architecture docs, specifications, reports, schemas, or datasets.
              </p>
            </div>
            <button
              onClick={() => projectInputRef.current?.click()}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100"
            >
              + Add Files
            </button>
          </div>

          <input
            ref={projectInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.csv,.xlsx"
            onChange={handleProjectFilesSelect}
            className="hidden"
          />

          {projectFiles.length === 0 ? (
            <div
              onClick={() => projectInputRef.current?.click()}
              className="flex items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white p-4 cursor-pointer hover:border-neutral-400 text-xs text-neutral-600"
            >
              Attach supporting docs to automatically enrich project context
            </div>
          ) : (
            <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1">
              {projectFiles.map((pf) => (
                <div
                  key={pf.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-2.5 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                      {pf.file.name.endsWith('.csv') || pf.file.name.endsWith('.xlsx') ? (
                        <FileSpreadsheet className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-neutral-800 truncate">{pf.file.name}</p>
                      <p className="text-[10px] text-neutral-600">{pf.sizeFormatted}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeProjectFile(pf.id)}
                    className="p-1 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            onClick={handleUploadAndAnalyze}
            disabled={isProcessing || !resumeFile}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-sm font-bold text-white shadow-md transition-all ${
              isProcessing || !resumeFile
                ? 'bg-neutral-300 cursor-not-allowed'
                : 'bg-neutral-900 hover:bg-violet-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>{processingStep || 'Processing Resume...'}</span>
              </>
            ) : (
              <>
                <span>Analyze My Resume</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
