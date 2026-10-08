export default function LoadingState({ label = 'Loading…' }) {
  return <div className="state-block state-loading">{label}</div>;
}