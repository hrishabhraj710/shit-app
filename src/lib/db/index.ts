import {
  Profile,
  Resume,
  Project,
  ProjectFile,
  PracticeSession,
  Question,
  AnswerAttempt,
  TopicMastery,
  UserStreak,
  DashboardMetrics,
  AIResumeAnalysisResult,
  SubmitAnswerPayload,
  SubmitAnswerResponse,
  CorrectOption,
} from '@/types';
import { getAdminFirestore } from '@/lib/firebase/server';
import { evaluateTopicPerformance, calculateStreakUpdate } from '@/lib/adaptive-engine/rules';
import { generateQuestionBatch } from '@/lib/ai/question-generator';

// ============================================================================
// IN-MEMORY / LOCAL FALLBACK STORE
// Used for guest/demo users or when Firebase is not configured yet
// ============================================================================

interface LocalStore {
  profiles: Map<string, Profile>;
  resumes: Map<string, Resume>;
  projects: Map<string, Project>;
  projectFiles: Map<string, ProjectFile>;
  sessions: Map<string, PracticeSession>;
  questions: Map<string, Question>;
  attempts: Map<string, AnswerAttempt>;
  topicMasteries: Map<string, TopicMastery>;
  streaks: Map<string, UserStreak>;
}

const globalStore = globalThis as unknown as { __shit_store?: LocalStore };
if (!globalStore.__shit_store) {
  globalStore.__shit_store = {
    profiles: new Map(),
    resumes: new Map(),
    projects: new Map(),
    projectFiles: new Map(),
    sessions: new Map(),
    questions: new Map(),
    attempts: new Map(),
    topicMasteries: new Map(),
    streaks: new Map(),
  };

  // Seed default demonstration user profile and project for instant testing
  const demoUserId = 'demo-user-id';
  globalStore.__shit_store.profiles.set(demoUserId, {
    id: demoUserId,
    full_name: 'Alex Mercer',
    avatar_url: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  globalStore.__shit_store.streaks.set(demoUserId, {
    id: 'streak-1',
    user_id: demoUserId,
    current_streak: 3,
    longest_streak: 5,
    last_activity_date: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString(),
  });

  const demoProjectId = 'project-demo-1';
  globalStore.__shit_store.projects.set(demoProjectId, {
    id: demoProjectId,
    user_id: demoUserId,
    title: 'High-Throughput Distributed Telemetry Engine',
    category: 'Distributed Systems',
    description:
      'Real-time telemetry and streaming metrics pipeline processing 420K+ events/sec with sub-50ms query latency.',
    technologies: ['TypeScript', 'Go', 'Kafka', 'PostgreSQL', 'Redis', 'Docker'],
    extracted_content: {
      problem_statement:
        'Ingesting and indexing massive high-velocity IoT telemetry without dropping packets during network partitions.',
      objective:
        'Build fault-tolerant ingestion pipeline with predictable latency and real-time visualization.',
      technical_stack: ['Go', 'Kafka', 'PostgreSQL', 'Docker'],
      tools_used: ['Grafana', 'Prometheus', 'Redis', 'Docker'],
      methodologies: ['Event-Driven Architecture', 'Continuous Integration', 'Load Testing'],
      implementation_details: [
        'Implemented partitioned Kafka consumers with auto-scaling consumer groups.',
        'Structured transactional time-series hyper-tables in PostgreSQL with automated chunk pruning.',
        'Integrated sliding-window caching in Redis to serve dashboard queries under 15ms.',
      ],
      important_concepts: [
        'At-least-once Delivery',
        'Sliding Window Aggregation',
        'WAL Contention',
        'Partition Rebalancing',
      ],
      quantitative_claims: [
        '420K+ events/sec peak ingestion',
        'Sub-50ms p99 query latency',
        '99.95% cluster availability',
      ],
      numerical_values: ['420K+', '50ms', '99.95%'],
      results: ['Sustained 3x traffic spikes without consumer lag accumulation.'],
      assumptions: ['Clients produce JSON/Protobuf payloads with monotonic timestamps.'],
      interview_topics: [
        'Handling Kafka consumer rebalances',
        'Database write amplification',
        'Redis eviction policies',
      ],
    },
    project_metadata: {
      associated_file_names: ['telemetry_architecture_spec.pdf'],
    },
    current_difficulty: 2,
    created_at: '2026-11-15T12:18:54.820Z',
    updated_at: '2026-11-18T12:18:54.820Z',
    questions_attempted: 0,
    accuracy_rate: 0,
    last_practiced_at: null,
  });
}

const store = globalStore.__shit_store!;

// ============================================================================
// FIRESTORE & DATA REPOSITORY
// Implements users/{uid} Firestore collection hierarchy
// ============================================================================

export class DataRepository {
  /**
   * Retrieves or initializes user profile from Firestore or local store
   */
  static async getUserProfile(userId: string): Promise<Profile> {
    const db = getAdminFirestore();
    if (db) {
      try {
        const docRef = db.collection('users').doc(userId);
        const snap = await docRef.get();
        if (snap.exists) {
          return { id: userId, ...(snap.data() as Omit<Profile, 'id'>) };
        }
      } catch (err) {
        console.warn('[Firestore] getUserProfile error:', err);
      }
    }

    let profile = store.profiles.get(userId);
    if (!profile) {
      profile = {
        id: userId,
        full_name: 'Developer',
        avatar_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.profiles.set(userId, profile);
    }
    return profile;
  }

  /**
   * Upserts user profile in Firestore and local store
   */
  static async upsertUserProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
    const db = getAdminFirestore();
    const now = new Date().toISOString();
    const updated: Profile = {
      id: userId,
      full_name: data.full_name || 'Developer',
      avatar_url: data.avatar_url || '',
      created_at: data.created_at || now,
      updated_at: now,
    };

    if (db) {
      try {
        await db.collection('users').doc(userId).set(updated, { merge: true });
      } catch (err) {
        console.warn('[Firestore] upsertUserProfile error:', err);
      }
    }

    store.profiles.set(userId, updated);
    return updated;
  }

  /**
   * Saves parsed resume, created projects, and maps supporting files.
   * Free-tier compliant: saves extracted text & structure in Firestore (no paid blob storage).
   */
  static async saveResumeAndProjects(
    userId: string,
    resumeData: { fileName: string; text: string; storagePath: string },
    analysis: AIResumeAnalysisResult,
    files: Array<{ fileName: string; text: string; storagePath: string; fileType: string }>
  ): Promise<{ resumeId: string; projectIds: string[] }> {
    const resumeId = `resume-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const resumeRecord: Resume = {
      id: resumeId,
      user_id: userId,
      file_name: resumeData.fileName,
      storage_path: resumeData.storagePath,
      extracted_text: resumeData.text.slice(0, 50000),
      analysis_status: 'completed',
      created_at: now,
    };

    // Store in local store
    store.resumes.set(resumeId, resumeRecord);

    const projectIds: string[] = [];
    const projectRecords: Project[] = [];

    for (const p of analysis.projects) {
      const projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      projectIds.push(projectId);

      const projectRecord: Project = {
        id: projectId,
        user_id: userId,
        resume_id: resumeId,
        title: p.title || 'Technical Project',
        category: p.category || 'Software Engineering',
        description: p.description || '',
        technologies: p.technologies || [],
        extracted_content: {
          problem_statement: p.problem_statement,
          objective: p.objective,
          technical_stack: p.technologies,
          tools_used: p.tools_used,
          methodologies: p.methodologies,
          implementation_details: p.implementation_details,
          important_concepts: p.important_concepts,
          quantitative_claims: p.quantitative_claims,
          numerical_values: p.numerical_values,
          results: p.results,
          assumptions: p.assumptions,
          interview_topics: p.interview_topics,
        },
        project_metadata: {
          associated_file_names: p.associated_file_names || [],
          explicit_resume_claims: p.quantitative_claims || [],
        },
        current_difficulty: 1,
        created_at: now,
        updated_at: now,
      };

      projectRecords.push(projectRecord);
      store.projects.set(projectId, projectRecord);

      // Save matching project files
      for (const f of files) {
        const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const isAssociated = p.associated_file_names?.includes(f.fileName);
        store.projectFiles.set(fileId, {
          id: fileId,
          user_id: userId,
          project_id: isAssociated ? projectId : null,
          file_name: f.fileName,
          storage_path: f.storagePath,
          extracted_text: f.text.slice(0, 20000),
          file_type: f.fileType,
          created_at: now,
        });
      }
    }

    // Persist to Cloud Firestore: users/{uid}/resumes/{resumeId} & users/{uid}/projects/{projectId}
    const db = getAdminFirestore();
    if (db) {
      try {
        const batch = db.batch();

        // 1. Save Resume
        const resumeRef = db.collection('users').doc(userId).collection('resumes').doc(resumeId);
        batch.set(resumeRef, resumeRecord);

        // 2. Save Projects
        for (const proj of projectRecords) {
          const projRef = db.collection('users').doc(userId).collection('projects').doc(proj.id);
          batch.set(projRef, proj);
        }

        await batch.commit();
      } catch (err) {
        console.warn('[Firestore] Error saving resume and projects:', err);
      }
    }

    return { resumeId, projectIds };
  }

  /**
   * Retrieves all projects for a user with calculated statistics
   */
  static async getProjects(userId: string): Promise<Project[]> {
    const db = getAdminFirestore();
    const list: Project[] = [];

    if (db) {
      try {
        const snap = await db.collection('users').doc(userId).collection('projects').get();
        if (!snap.empty) {
          for (const doc of snap.docs) {
            const data = doc.data() as Project;
            list.push({ ...data, id: doc.id });
          }
        }
      } catch (err) {
        console.warn('[Firestore] getProjects error:', err);
      }
    }

    // If Firestore returned items, compute stats and return
    if (list.length > 0) {
      for (let i = 0; i < list.length; i++) {
        const proj = list[i];
        const attempts = Array.from(store.attempts.values()).filter(
          (a) => a.user_id === userId && a.project_id === proj.id
        );
        const questionsAttempted = attempts.length;
        const correctCount = attempts.filter((a) => a.is_correct).length;
        const accuracyRate = questionsAttempted > 0 ? Math.round((correctCount / questionsAttempted) * 100) : 0;
        const lastAttempt = attempts.sort(
          (a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime()
        )[0];

        list[i] = {
          ...proj,
          questions_attempted: questionsAttempted,
          accuracy_rate: accuracyRate,
          last_practiced_at: lastAttempt ? lastAttempt.answered_at : null,
        };
      }
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Fallback: Query in-memory store
    for (const project of store.projects.values()) {
      if (project.user_id === userId) {
        const attempts = Array.from(store.attempts.values()).filter(
          (a) => a.user_id === userId && a.project_id === project.id
        );
        const questionsAttempted = attempts.length;
        const correctCount = attempts.filter((a) => a.is_correct).length;
        const accuracyRate = questionsAttempted > 0 ? Math.round((correctCount / questionsAttempted) * 100) : 0;
        const lastAttempt = attempts.sort(
          (a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime()
        )[0];

        list.push({
          ...project,
          questions_attempted: questionsAttempted,
          accuracy_rate: accuracyRate,
          last_practiced_at: lastAttempt ? lastAttempt.answered_at : null,
        });
      }
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Retrieves a single project by ID for a user
   */
  static async getProjectById(userId: string, projectId: string): Promise<Project | null> {
    const db = getAdminFirestore();
    let project: Project | undefined;

    if (db) {
      try {
        const docRef = db.collection('users').doc(userId).collection('projects').doc(projectId);
        const snap = await docRef.get();
        if (snap.exists) {
          project = { id: projectId, ...(snap.data() as Omit<Project, 'id'>) };
        }
      } catch (err) {
        console.warn('[Firestore] getProjectById error:', err);
      }
    }

    if (!project) {
      project = store.projects.get(projectId);
    }

    if (!project || project.user_id !== userId) {
      return null;
    }

    const attempts = Array.from(store.attempts.values()).filter(
      (a) => a.user_id === userId && a.project_id === project!.id
    );

    const questionsAttempted = attempts.length;
    const correctCount = attempts.filter((a) => a.is_correct).length;
    const accuracyRate = questionsAttempted > 0 ? Math.round((correctCount / questionsAttempted) * 100) : 0;
    const lastAttempt = attempts.sort(
      (a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime()
    )[0];

    return {
      ...project,
      questions_attempted: questionsAttempted,
      accuracy_rate: accuracyRate,
      last_practiced_at: lastAttempt ? lastAttempt.answered_at : null,
    };
  }

  /**
   * Retrieves or generates the active practice session and 10-question batch for ONE project
   */
  static async getOrCreatePracticeSession(
    userId: string,
    projectId: string
  ): Promise<{ session: PracticeSession; questions: Question[] }> {
    const project = await this.getProjectById(userId, projectId);
    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Look for active session with uncompleted questions
    let session: PracticeSession | undefined;
    for (const s of store.sessions.values()) {
      if (s.user_id === userId && s.project_id === projectId && s.status === 'active') {
        session = s;
        break;
      }
    }

    let existingQuestions: Question[] = [];
    if (session) {
      existingQuestions = Array.from(store.questions.values())
        .filter((q) => q.session_id === session!.id)
        .sort((a, b) => a.order_index - b.order_index);
    }

    // Check unanswered questions
    const answeredQuestionIds = new Set(
      Array.from(store.attempts.values())
        .filter((a) => a.session_id === session?.id)
        .map((a) => a.question_id)
    );

    const remainingQuestions = existingQuestions.filter((q) => !answeredQuestionIds.has(q.id));

    if (!session || remainingQuestions.length === 0) {
      const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const batchNumber = (session?.batch_number || 0) + 1;
      const now = new Date().toISOString();

      session = {
        id: sessionId,
        user_id: userId,
        project_id: projectId,
        status: 'active',
        batch_number: batchNumber,
        questions_attempted: 0,
        correct_answers: 0,
        started_at: now,
      };
      store.sessions.set(sessionId, session);

      // Collect topic masteries and question history for adaptation
      const topicMasteries = await this.getTopicMasteryForProject(userId, projectId);
      const historyQuestions = Array.from(store.questions.values())
        .filter((q) => q.project_id === projectId)
        .map((q) => q.question_text);

      // Generate exactly 10 questions for this project via OpenRouter or fallback
      const rawBatch = await generateQuestionBatch({
        project,
        existingQuestionsHistory: historyQuestions,
        topicMasteries,
        targetDifficulty: project.current_difficulty || 1,
      });

      const batchQuestions: Question[] = [];
      for (let i = 0; i < rawBatch.length; i++) {
        const raw = rawBatch[i];
        const qId = `q-${sessionId}-${i + 1}`;
        const question: Question = {
          ...raw,
          id: qId,
          user_id: userId,
          project_id: projectId,
          session_id: sessionId,
          order_index: i + 1,
          created_at: now,
        };
        store.questions.set(qId, question);
        batchQuestions.push(question);
      }

      // Persist session & questions to Firestore: users/{uid}/projects/{projectId}/sessions & questions
      const db = getAdminFirestore();
      if (db) {
        try {
          const batch = db.batch();
          const sessRef = db
            .collection('users')
            .doc(userId)
            .collection('projects')
            .doc(projectId)
            .collection('sessions')
            .doc(sessionId);
          batch.set(sessRef, session);

          for (const q of batchQuestions) {
            const qRef = db
              .collection('users')
              .doc(userId)
              .collection('projects')
              .doc(projectId)
              .collection('questions')
              .doc(q.id);
            batch.set(qRef, q);
          }
          await batch.commit();
        } catch (err) {
          console.warn('[Firestore] Error saving practice session:', err);
        }
      }

      return { session, questions: batchQuestions };
    }

    return { session, questions: existingQuestions };
  }

  /**
   * Deterministically evaluates an answer, records attempt, updates topic mastery and streaks
   */
  static async submitAnswer(
    userId: string,
    payload: SubmitAnswerPayload
  ): Promise<SubmitAnswerResponse> {
    const question = store.questions.get(payload.question_id);
    if (!question || question.user_id !== userId) {
      throw new Error('Question not found or unauthorized');
    }

    const session = store.sessions.get(payload.session_id);
    if (!session || session.user_id !== userId) {
      throw new Error('Session not found or unauthorized');
    }

    const now = new Date().toISOString();

    // Deterministic check against stored correct option
    const isCorrect = payload.selected_option === question.correct_option;

    // Record answer attempt
    const attemptId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const attemptRecord: AnswerAttempt = {
      id: attemptId,
      user_id: userId,
      project_id: payload.project_id,
      session_id: payload.session_id,
      question_id: payload.question_id,
      selected_option: payload.selected_option,
      is_correct: isCorrect,
      difficulty_at_attempt: question.difficulty,
      topic: question.topic,
      answered_at: now,
    };
    store.attempts.set(attemptId, attemptRecord);

    // Update practice session counts
    session.questions_attempted += 1;
    if (isCorrect) {
      session.correct_answers += 1;
    }

    // Update topic mastery
    const topicKey = `${userId}_${payload.project_id}_${question.topic}`;
    let topicMastery = store.topicMasteries.get(topicKey);
    if (!topicMastery) {
      topicMastery = {
        id: `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: userId,
        project_id: payload.project_id,
        topic: question.topic,
        current_difficulty: question.difficulty,
        mastery_score: 0,
        correct_count: 0,
        incorrect_count: 0,
        consecutive_correct: 0,
        consecutive_incorrect: 0,
        accuracy: 0,
        updated_at: now,
      };
    }

    const evalResult = evaluateTopicPerformance(topicMastery, isCorrect);
    topicMastery.current_difficulty = evalResult.new_difficulty;
    topicMastery.consecutive_correct = evalResult.new_consecutive_correct;
    topicMastery.consecutive_incorrect = evalResult.new_consecutive_incorrect;
    topicMastery.correct_count = evalResult.new_correct_count;
    topicMastery.incorrect_count = evalResult.new_incorrect_count;
    topicMastery.accuracy = evalResult.new_accuracy;
    topicMastery.mastery_score = evalResult.new_mastery_score;
    topicMastery.updated_at = now;
    store.topicMasteries.set(topicKey, topicMastery);

    // Sync project difficulty with highest mastered topic (up to 5)
    const project = store.projects.get(payload.project_id);
    if (project) {
      project.current_difficulty = Math.max(project.current_difficulty, evalResult.new_difficulty);
      project.updated_at = now;
    }

    // Update streak
    let streak = store.streaks.get(userId);
    if (!streak) {
      streak = {
        id: `str-${userId}`,
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: now.split('T')[0],
        updated_at: now,
      };
      store.streaks.set(userId, streak);
    } else {
      const streakUpdate = calculateStreakUpdate(
        streak.current_streak,
        streak.longest_streak,
        streak.last_activity_date
      );
      streak.current_streak = streakUpdate.current_streak;
      streak.longest_streak = streakUpdate.longest_streak;
      streak.last_activity_date = now.split('T')[0];
      streak.updated_at = now;
    }

    const isBatchComplete = session.questions_attempted >= 10;
    if (isBatchComplete) {
      session.status = 'completed';
      session.completed_at = now;
    }

    // Persist attempt & updated stats to Firestore: users/{uid}/projects/{projectId}/attempts
    const db = getAdminFirestore();
    if (db) {
      try {
        const batch = db.batch();
        const attRef = db
          .collection('users')
          .doc(userId)
          .collection('projects')
          .doc(payload.project_id)
          .collection('attempts')
          .doc(attemptId);
        batch.set(attRef, attemptRecord);

        // Update topic mastery in Firestore
        const tmRef = db
          .collection('users')
          .doc(userId)
          .collection('projects')
          .doc(payload.project_id)
          .collection('topicMastery')
          .doc(encodeURIComponent(question.topic));
        batch.set(tmRef, topicMastery);

        // Update streak
        const streakRef = db.collection('users').doc(userId).collection('streaks').doc('current');
        batch.set(streakRef, streak);

        await batch.commit();
      } catch (err) {
        console.warn('[Firestore] Error saving answer attempt to Firestore:', err);
      }
    }

    return {
      is_correct: isCorrect,
      correct_option: question.correct_option,
      explanation: question.explanation,
      learning_objective: question.learning_objective,
      concept_gap: isCorrect
        ? undefined
        : `Knowledge gap in ${question.topic}: Review fundamental constraints and trade-offs.`,
      difficulty_update: {
        topic: question.topic,
        old_difficulty: question.difficulty,
        new_difficulty: evalResult.new_difficulty,
        direction: evalResult.direction,
        reason: evalResult.reason,
      },
      session_stats: {
        questions_attempted: session.questions_attempted,
        correct_answers: session.correct_answers,
        is_batch_complete: isBatchComplete,
      },
    };
  }

  /**
   * Resets project difficulty only or full project practice progress
   */
  static async resetProject(
    userId: string,
    projectId: string,
    resetType: 'difficulty_only' | 'full_practice'
  ): Promise<boolean> {
    const project = store.projects.get(projectId);
    if (!project || project.user_id !== userId) {
      return false;
    }

    // Always reset difficulty
    project.current_difficulty = 1;
    project.updated_at = new Date().toISOString();

    // Reset topic masteries for this project only
    for (const [key, tm] of store.topicMasteries.entries()) {
      if (tm.user_id === userId && tm.project_id === projectId) {
        if (resetType === 'difficulty_only') {
          tm.current_difficulty = 1;
          tm.consecutive_correct = 0;
          tm.consecutive_incorrect = 0;
        } else {
          store.topicMasteries.delete(key);
        }
      }
    }

    if (resetType === 'full_practice') {
      // Clear all attempts and active sessions for THIS project only
      for (const [key, att] of store.attempts.entries()) {
        if (att.user_id === userId && att.project_id === projectId) {
          store.attempts.delete(key);
        }
      }

      for (const [key, sess] of store.sessions.entries()) {
        if (sess.user_id === userId && sess.project_id === projectId) {
          store.sessions.delete(key);
        }
      }

      for (const [key, q] of store.questions.entries()) {
        if (q.user_id === userId && q.project_id === projectId) {
          store.questions.delete(key);
        }
      }
    }

    // Sync reset to Firestore if available
    const db = getAdminFirestore();
    if (db) {
      try {
        const projRef = db.collection('users').doc(userId).collection('projects').doc(projectId);
        await projRef.update({ current_difficulty: 1, updated_at: new Date().toISOString() });
      } catch (err) {
        console.warn('[Firestore] Reset project error:', err);
      }
    }

    return true;
  }

  /**
   * Retrieves topic masteries for a project
   */
  static async getTopicMasteryForProject(userId: string, projectId: string): Promise<TopicMastery[]> {
    const db = getAdminFirestore();
    if (db) {
      try {
        const snap = await db
          .collection('users')
          .doc(userId)
          .collection('projects')
          .doc(projectId)
          .collection('topicMastery')
          .get();
        if (!snap.empty) {
          return snap.docs.map((doc: any) => doc.data() as TopicMastery);
        }
      } catch (err) {
        console.warn('[Firestore] getTopicMasteryForProject error:', err);
      }
    }

    const list: TopicMastery[] = [];
    for (const tm of store.topicMasteries.values()) {
      if (tm.user_id === userId && tm.project_id === projectId) {
        list.push(tm);
      }
    }
    return list;
  }

  /**
   * Calculates actual dashboard metrics across all user records
   */
  static async getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
    const userAttempts = Array.from(store.attempts.values()).filter((a) => a.user_id === userId);
    const totalQuestions = userAttempts.length;
    const correctAnswers = userAttempts.filter((a) => a.is_correct).length;
    const overallAccuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    const userProjects = Array.from(store.projects.values()).filter((p) => p.user_id === userId);
    let highestDifficulty = 1;
    for (const p of userProjects) {
      if (p.current_difficulty > highestDifficulty) {
        highestDifficulty = p.current_difficulty;
      }
    }

    const streak = store.streaks.get(userId);
    const currentStreak = streak?.current_streak || (totalQuestions > 0 ? 1 : 0);

    // Topic performance breakdown
    const topicStatsMap = new Map<string, { correct: number; total: number; level: number }>();
    for (const att of userAttempts) {
      const existing = topicStatsMap.get(att.topic) || { correct: 0, total: 0, level: att.difficulty_at_attempt };
      existing.total += 1;
      if (att.is_correct) existing.correct += 1;
      existing.level = Math.max(existing.level, att.difficulty_at_attempt);
      topicStatsMap.set(att.topic, existing);
    }

    const topicRankings = Array.from(topicStatsMap.entries()).map(([topic, stats]) => ({
      topic,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      level: stats.level,
    }));

    const strongest = [...topicRankings].sort((a, b) => b.accuracy - a.accuracy).slice(0, 4);
    const weakest = [...topicRankings].sort((a, b) => a.accuracy - b.accuracy).slice(0, 4);

    return {
      total_questions_answered: totalQuestions,
      highest_difficulty_unlocked: highestDifficulty,
      current_streak: currentStreak,
      overall_accuracy: overallAccuracy,
      total_projects: userProjects.length,
      strongest_topics: strongest,
      weakest_topics: weakest,
    };
  }
}
