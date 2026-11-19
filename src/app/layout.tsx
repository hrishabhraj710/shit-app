import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import IntegrationStatusPanel from '@/components/IntegrationStatusPanel';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SH!T — Know your resume. Own your interview.',
  description:
    'Turn your projects, skills, and experience into an adaptive learning experience. Understand every claim on your resume before someone asks you about it.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#F7F8FA] text-neutral-900 selection:bg-violet-100 selection:text-violet-900">
        {children}
        <IntegrationStatusPanel />
      </body>
    </html>
  );
}
