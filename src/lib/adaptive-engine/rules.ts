import { TopicMastery } from '@/types';

export interface DifficultyEvaluationResult {
  new_difficulty: number;
  new_consecutive_correct: number;
  new_consecutive_incorrect: number;
  new_correct_count: number;
  new_incorrect_count: number;
  new_accuracy: number;
  new_mastery_score: number;
  direction: 'promoted' | 'remediated' | 'maintained';
  reason: string;
}

/**
 * Calculates adaptive difficulty update for a specific topic based on performance rules.
 * Implements deterministic mastery thresholds with oscillation guards.
 */
export function evaluateTopicPerformance(
  current: Partial<TopicMastery>,
  isCorrect: boolean
): DifficultyEvaluationResult {
  const currentDiff = Math.max(1, Math.min(5, current.current_difficulty || 1));
  const prevConsecutiveCorrect = current.consecutive_correct || 0;
  const prevConsecutiveIncorrect = current.consecutive_incorrect || 0;
  const prevCorrect = current.correct_count || 0;
  const prevIncorrect = current.incorrect_count || 0;

  const new_correct_count = isCorrect ? prevCorrect + 1 : prevCorrect;
  const new_incorrect_count = !isCorrect ? prevIncorrect + 1 : prevIncorrect;
  const totalAttempts = new_correct_count + new_incorrect_count;
  const new_accuracy = totalAttempts > 0 ? Math.round((new_correct_count / totalAttempts) * 100) : 0;

  let new_consecutive_correct = isCorrect ? prevConsecutiveCorrect + 1 : 0;
  let new_consecutive_incorrect = !isCorrect ? prevConsecutiveIncorrect + 1 : 0;

  let new_difficulty = currentDiff;
  let direction: 'promoted' | 'remediated' | 'maintained' = 'maintained';
  let reason = 'Difficulty maintained based on consistent performance.';

  if (isCorrect) {
    // 3 consecutive correct answers: promote topic difficulty by 1 level
    if (new_consecutive_correct >= 3 && currentDiff < 5) {
      new_difficulty = currentDiff + 1;
      direction = 'promoted';
      reason = `Mastery shown with ${new_consecutive_correct} consecutive correct answers. Promoted to Level ${new_difficulty}.`;
      new_consecutive_correct = 0; // reset streak after promotion
    } else {
      reason = `Correct answer recorded (${new_consecutive_correct}/3 towards Level ${Math.min(5, currentDiff + 1)}).`;
    }
  } else {
    // 2 consecutive incorrect answers: remediate topic difficulty by 1 level
    if (new_consecutive_incorrect >= 2 && currentDiff > 1) {
      new_difficulty = currentDiff - 1;
      direction = 'remediated';
      reason = `Knowledge gap identified (${new_consecutive_incorrect} incorrect answers). Remediated to Level ${new_difficulty} for targeted practice.`;
      new_consecutive_incorrect = 0; // reset streak after remediation
    } else {
      reason = `Incorrect answer recorded. Reviewing concept before adjusting difficulty.`;
    }
  }

  // Mastery score formula: blends difficulty weight (up to 70%) and accuracy (up to 30%)
  const difficultyWeight = (new_difficulty / 5) * 70;
  const accuracyWeight = (new_accuracy / 100) * 30;
  const new_mastery_score = Math.min(100, Math.round(difficultyWeight + accuracyWeight));

  return {
    new_difficulty,
    new_consecutive_correct,
    new_consecutive_incorrect,
    new_correct_count,
    new_incorrect_count,
    new_accuracy,
    new_mastery_score,
    direction,
    reason,
  };
}

/**
 * Calculates user streak updates based on last activity date.
 */
export function calculateStreakUpdate(
  currentStreak: number,
  longestStreak: number,
  lastActivityDateStr?: string | null
): { current_streak: number; longest_streak: number; is_new_day: boolean } {
  const today = new Date().toISOString().split('T')[0];

  if (!lastActivityDateStr) {
    return {
      current_streak: 1,
      longest_streak: Math.max(1, longestStreak),
      is_new_day: true,
    };
  }

  const lastDate = lastActivityDateStr.split('T')[0];
  if (lastDate === today) {
    // Already practiced today; maintain streak
    return {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      is_new_day: false,
    };
  }

  // Check if yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newCurrent = 1;
  if (lastDate === yesterdayStr) {
    newCurrent = currentStreak + 1;
  }

  return {
    current_streak: newCurrent,
    longest_streak: Math.max(newCurrent, longestStreak),
    is_new_day: true,
  };
}
