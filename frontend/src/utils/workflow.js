import { THRESHOLDS, AMBIGUOUS_SCORE } from '../config/thresholds';

export function getWorkflowStage(score, thresholds = THRESHOLDS) {
  if (score >= thresholds.SELF_HEAL) return 'SELF_HEAL';
  if (score >= thresholds.OVERRIDE_MIN) return 'OVERRIDE';
  if (score >= thresholds.ASK_MORE_MIN) return 'ASK_MORE';
  if (score <= AMBIGUOUS_SCORE) return 'ESCALATE';

  return 'ESCALATE';
}

export const STAGE_LABELS = {
  SELF_HEAL: 'Self-Heal',
  OVERRIDE: 'Analyst Override',
  ASK_MORE: 'Ask More',
  ESCALATE: 'Escalate to Production Support',
};

export function isAmbiguousScore(score) {
  return score === AMBIGUOUS_SCORE;
}