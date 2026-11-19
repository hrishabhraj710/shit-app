export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type CorrectOption = 'A' | 'B' | 'C' | 'D';

export type QuestionType =
  | 'terminology'
  | 'conceptual'
  | 'technical'
  | 'tools'
  | 'methodology'
  | 'implementation'
  | 'quantitative'
  | 'tradeoff'
  | 'failure_scenario'
  | 'architecture';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  extracted_text?: string;
  analysis_status: AnalysisStatus;
  created_at: string;
}

export interface ExtractedProjectContent {
  problem_statement?: string;
  objective?: string;
  technical_stack?: string[];
  tools_used?: string[];
  methodologies?: string[];
  implementation_details?: string[];
  important_concepts?: string[];
  quantitative_claims?: string[];
  numerical_values?: string[];
  results?: string[];
  assumptions?: string[];
  interview_topics?: string[];
  knowledge_areas?: string[];
}

export interface ProjectMetadata {
  raw_bullet_points?: string[];
  associated_file_names?: string[];
  explicit_resume_claims?: string[];
  supported_by_docs?: string[];
  inferred_by_ai?: string[];
  unverified_points?: string[];
}

export interface Project {
  id: string;
  user_id: string;
  resume_id?: string;
  title: string;
  category: string;
  description: string;
  technologies: string[];
  extracted_content: ExtractedProjectContent;
  project_metadata: ProjectMetadata;
  current_difficulty: number; // 1 to 5
  created_at: string;
  updated_at: string;
  // Computed stats from joins/analytics
  questions_attempted?: number;
  accuracy_rate?: number;
  last_practiced_at?: string | null;
  topic_count?: number;
}

export interface ProjectFile {
  id: string;
  user_id: string;
  project_id?: string | null;
  file_name: string;
  storage_path: string;
  extracted_text?: string;
  file_type: string;
  created_at: string;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  project_id: string;
  status: SessionStatus;
  batch_number: number;
  questions_attempted: number;
  correct_answers: number;
  started_at: string;
  completed_at?: string | null;
}

export interface Question {
  id: string;
  user_id: string;
  project_id: string;
  session_id: string;
  question_text: string;
  options: [string, string, string, string]; // exactly 4 options: A, B, C, D
  correct_option: CorrectOption;
  explanation: string;
  topic: string;
  difficulty: number; // 1 to 5
  question_type: QuestionType | string;
  source_reference?: string;
  learning_objective?: string;
  order_index: number;
  created_at: string;
}

export interface AnswerAttempt {
  id: string;
  user_id: string;
  project_id: string;
  session_id: string;
  question_id: string;
  selected_option: CorrectOption;
  is_correct: boolean;
  difficulty_at_attempt: number;
  topic: string;
  answered_at: string;
}

export interface TopicMastery {
  id: string;
  user_id: string;
  project_id: string;
  topic: string;
  current_difficulty: number; // 1 to 5
  mastery_score: number; // 0 to 100
  correct_count: number;
  incorrect_count: number;
  consecutive_correct: number;
  consecutive_incorrect: number;
  accuracy: number; // 0 to 100 percentage
  updated_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string | null;
  updated_at: string;
}

export interface DashboardMetrics {
  total_questions_answered: number; // "SH!Ts Done"
  highest_difficulty_unlocked: number; // "Levels Unlocked" (1 to 5)
  current_streak: number; // "Current Streak"
  overall_accuracy: number; // "Accuracy Rate" in %
  total_projects: number;
  strongest_topics: { topic: string; accuracy: number; level: number }[];
  weakest_topics: { topic: string; accuracy: number; level: number }[];
}

export interface AIResumeAnalysisResult {
  candidate_name: string;
  education: Array<{ degree: string; institution: string; year?: string }>;
  skills: string[];
  technical_tools: string[];
  internships: Array<{
    title: string;
    organization: string;
    period?: string;
    description: string;
    skills: string[];
  }>;
  work_experience: Array<{
    role: string;
    company: string;
    period?: string;
    achievements: string[];
  }>;
  projects: Array<{
    title: string;
    category: string;
    description: string;
    problem_statement: string;
    objective: string;
    technologies: string[];
    tools_used: string[];
    methodologies: string[];
    implementation_details: string[];
    important_concepts: string[];
    quantitative_claims: string[];
    numerical_values: string[];
    results: string[];
    assumptions: string[];
    interview_topics: string[];
    associated_file_names?: string[];
  }>;
}

export interface SubmitAnswerPayload {
  session_id: string;
  project_id: string;
  question_id: string;
  selected_option: CorrectOption;
}

export interface SubmitAnswerResponse {
  is_correct: boolean;
  correct_option: CorrectOption;
  explanation: string;
  learning_objective?: string;
  concept_gap?: string;
  difficulty_update?: {
    topic: string;
    old_difficulty: number;
    new_difficulty: number;
    direction: 'promoted' | 'remediated' | 'maintained';
    reason: string;
  };
  session_stats: {
    questions_attempted: number;
    correct_answers: number;
    is_batch_complete: boolean;
  };
}

export interface GenerateBatchPayload {
  project_id: string;
  session_id?: string;
}

export interface ResetProjectPayload {
  project_id: string;
  reset_type: 'difficulty_only' | 'full_practice';
}
