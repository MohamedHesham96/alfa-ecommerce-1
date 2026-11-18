export default function InfoTip({ text }) {
  if (!text) return null;
  return (
    <span
      className="analytics-info"
      tabIndex={0}
      role="note"
      aria-label={text}
      title={text}
    >
      <span aria-hidden="true">i</span>
      <span className="analytics-info-bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}
