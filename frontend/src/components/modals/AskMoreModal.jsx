import { useState } from 'react';

export default function AskMoreModal({
  isOpen,
  questions = [],
  onClose,
  onConfirm,
  loading = false,
}) {
  const [answers, setAnswers] = useState({});

  if (!isOpen) {
    return null;
  }

  const handleChange = (question, value) => {
    setAnswers((current) => ({
      ...current,
      [question]: value,
    }));
  };

  const handleSubmit = () => {
    onConfirm(answers);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Ask More</h2>

        <p>
          Please answer the clarification questions before
          the ticket is matched again.
        </p>

        <div className="modal__questions">
          {questions.map((question) => (
            <div
              className="modal__question"
              key={question}
            >
              <label>{question}</label>

              <input
                type="text"
                value={answers[question] || ''}
                onChange={(event) =>
                  handleChange(
                    question,
                    event.target.value
                  )
                }
                disabled={loading}
              />
            </div>
          ))}
        </div>

        <div className="modal__actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
  className="btn btn-primary"
  onClick={handleSubmit}
  disabled={loading}
>
  {loading ? 'Re-matching…' : 'Resubmit'}
</button>
        </div>
      </div>
    </div>
  );
}