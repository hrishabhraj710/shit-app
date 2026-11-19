# SH!T — Adaptive Resume Defense & Quiz Platform

> **"Know your resume. Own your interview."**

**SH!T** is a production-grade, AI-powered adaptive learning SaaS platform that analyzes a candidate's resume and supporting project documentation and converts their professional experience into interactive quiz-based learning sessions.

---

## 🚀 Key Features

1. **Multi-Format Ingestion**: Upload resumes and supporting project documentation across **PDF, DOCX, TXT, CSV, and XLSX**. Document content is extracted server-side without permanently retaining raw files.
2. **Project-by-Project Module Isolation**: Questions are generated for **ONE project at a time in 10-question batches**, ensuring deep, uninterrupted focus.
3. **Adaptive 5-Level Learning Engine**:
   - **Level 1 (Foundation)**: Core terminology, syntax, basic concepts.
   - **Level 2 (Understanding)**: Tool selection reasoning, component interactions.
   - **Level 3 (Application)**: Implementation decisions, debugging, concurrency.
   - **Level 4 (Advanced)**: Scale bottlenecks, quantitative calculation, resume metrics defense.
   - **Level 5 (Expert)**: System failure scenarios, CAP theorem tradeoffs, architectural retrospective.
4. **Independent Topic Mastery**: Performance adapts per topic (e.g., strength in Python won't skew questions for SQL; 3 consecutive correct promote difficulty, 2 consecutive incorrect trigger prerequisite remediation).
5. **Deterministic MCQ Verification**: Instant answer correctness checking with 1-3 line contextual explanations and identified knowledge gaps powered by OpenRouter LLMs.
6. **Strict Progress Persistence & Isolation**: Safe per-project reset (difficulty only vs full progress reset) that never touches other projects.
7. **Firebase Spark Plan Architecture**: Firebase Authentication (Google Sign-In) + Cloud Firestore with zero-trust Security Rules enforcing strict user data isolation.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React icons.
- **Backend**: Next.js Route Handlers, Server Actions, Server-side Document Parser (`unpdf`, `mammoth`, `xlsx`).
- **Database & Auth**: Firebase Authentication (Google Sign-In & Session Verification), Cloud Firestore (Spark free plan), Firebase Admin SDK (`firebase-admin`), and Firestore Security Rules (`firestore.rules`).
- **AI Orchestration**: OpenRouter API with configurable models (`OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct`), structured JSON outputs, deterministic adaptive engine, and live contextual explanation endpoints.
- **Hosting**: Vercel & GitHub.

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18.17+ or 20+
- npm or pnpm
- Firebase Project (Free Spark Plan)
- OpenRouter API Key

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# OpenRouter AI Configuration (Server-Side)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct

# Firebase Client Configuration (Free Spark Plan)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: Firebase Admin Service Account Key (JSON string) for privileged server-side verification
# FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

NEXT_PUBLIC_APP_URL=http://localhost:3000
```
*(Note: If Firebase keys are not set yet, SH!T operates seamlessly with a high-fidelity in-memory persistent store and one-click demo developer profile for instant local testing).*

### 3. Deploy Firestore Security Rules
Deploy `firestore.rules` via the Firebase CLI or paste into Firebase Console → Firestore → Rules:
```bash
firebase deploy --only firestore:rules
```

Rules enforce strict ownership:
- Users can only read and write their own documents under `/users/{userId}/**`.
- Default deny-all for any unauthenticated or unauthorized access.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build & Start
```bash
npm run build
npm start
```

---

## 🧠 Adaptive Difficulty Engine Architecture

The platform maintains independent topic mastery records in `topicMastery`:
- **Promotion**: 3 consecutive correct answers in a topic increases that topic's difficulty by +1 (up to Level 5).
- **Remediation**: 2 consecutive incorrect answers triggers a prerequisite review question at difficulty -1 (min Level 1).
- **Oscillation Cooldown**: Consecutive counters reset upon level transition to ensure stable progression.
- **Mastery Score Calculation**:
  $$\text{Mastery Score} = \min\left(100, \left(\frac{\text{Current Level}}{5} \times 70\right) + \left(\frac{\text{Accuracy \%}}{100} \times 30\right)\right)$$

---

## 🚢 Vercel Deployment

1. Push this repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Add the environment variables from `.env.example`.
4. Deploy! Next.js App Router and server routes deploy automatically to Vercel Serverless Functions.

---

## 📄 License
MIT
