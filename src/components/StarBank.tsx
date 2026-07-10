import { Star } from './creatures'
import { useGameStore } from '../state/gameStore'

export function StarBank() {
  const balance = useGameStore((s) => s.starBalance)
  return (
    <div className="star-bank" data-testid="star-bank">
      <Star size={40} />
      <span data-testid="star-balance">{balance}</span>
    </div>
  )
}
