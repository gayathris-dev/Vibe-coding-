import { isAmbiguousScore } from '../utils/workflow';

export default function ConfidenceMeter({ score }) {
  const getBand = () => {
    if (score === 100) return 'Self-Heal';
    if (score >= 95) return 'Analyst Override';
    if (score >= 81) return 'Ask More';
    if (score === 80) return 'Ambiguous';
    return 'Escalate';
  };

  const band = getBand();

  return (
    <div className="confidence-meter">
      <div className="confidence-meter__header">
        <strong>Confidence</strong>
        <strong>{score}%</strong>
      </div>

      <div className="confidence-meter__track">
        <div
          className="confidence-meter__fill"
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="confidence-meter__labels">
        <span>&lt;80% Escalate</span>
        <span>81–94% Ask More</span>
        <span>95–99% Override</span>
        <span>100% Self-Heal</span>
      </div>

      <div className="confidence-meter__stage">
        Current decision: <strong>{band}</strong>
      </div>

      {isAmbiguousScore(score) && (
        <div className="confidence-meter__warning">
          80% is an ambiguous boundary. Confirm the expected behavior
          with the mentor before finalizing the workflow.
        </div>
      )}
    </div>
  );
}