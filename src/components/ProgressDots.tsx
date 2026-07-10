// The visible finish line: one dot per question, filled as he advances.
export function ProgressDots({ total, done }: { total: number; done: number }) {
  return (
    <div className="progress-dots" data-testid="progress-dots">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`progress-dot ${i < done ? 'progress-dot--done' : ''}`} />
      ))}
    </div>
  )
}
