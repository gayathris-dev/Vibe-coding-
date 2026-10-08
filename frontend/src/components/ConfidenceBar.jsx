import { getWorkflowStage, STAGE_LABELS } from '../utils/workflow';

const STAGE_TONE = {
  SELF_HEAL: 'success',
  OVERRIDE: 'info',
  ASK_MORE: 'warn',
  ESCALATE: 'danger',
};

// Makes the confidence-based decision visually obvious in one glance:
// fill color + stage chip both derive from the existing getWorkflowStage()
// logic. No workflow behavior lives here, only presentation.
export default function ConfidenceBar({ score }) {
  const stage = getWorkflowStage(score);
  const tone = STAGE_TONE[stage];

  return (
    <div className="confidence-bar">
      <div className="confidence-bar__track">
        <div
          className={`confidence-bar__fill confidence-bar__fill--${tone}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="confidence-bar__meta">
        <strong>{score}%</strong>
        <span className={`confidence-bar__stage confidence-bar__stage--${tone}`}>
          {STAGE_LABELS[stage]}
        </span>
      </div>
    </div>
  );
}