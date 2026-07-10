// Original creature art — friendly round shapes, no copyrighted IP.
import { motion } from 'framer-motion'

const bounce = {
  animate: { y: [0, -10, 0] },
  transition: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' as const }
}

/** Kazu, the big dino guide (deep voice) */
export function GuideDino({ size = 160, cheer = false }: { size?: number; cheer?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      {...(cheer ? { animate: { rotate: [0, -6, 6, 0], y: [0, -16, 0] }, transition: { duration: 0.7 } } : bounce)}
      aria-hidden
    >
      <ellipse cx="100" cy="120" rx="70" ry="62" fill="#4DA184" />
      <ellipse cx="100" cy="136" rx="46" ry="38" fill="#DFF0D8" />
      {/* tail */}
      <path d="M165 140 q30 -6 24 -32 q-14 10 -28 14z" fill="#4DA184" />
      {/* legs */}
      <ellipse cx="70" cy="180" rx="18" ry="12" fill="#3F8A6F" />
      <ellipse cx="130" cy="180" rx="18" ry="12" fill="#3F8A6F" />
      {/* eyes */}
      <circle cx="76" cy="100" r="15" fill="#fff" />
      <circle cx="124" cy="100" r="15" fill="#fff" />
      <circle cx="80" cy="103" r="7" fill="#3D3A4B" />
      <circle cx="120" cy="103" r="7" fill="#3D3A4B" />
      {/* smile */}
      <path d="M82 138 q18 14 36 0" stroke="#3D3A4B" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* back spots */}
      <circle cx="66" cy="66" r="11" fill="#FFD66B" />
      <circle cx="100" cy="56" r="13" fill="#FFD66B" />
      <circle cx="134" cy="66" r="11" fill="#FFD66B" />
    </motion.svg>
  )
}

/** Pip, the small chirpy companion (high voice) */
export function Pip({ size = 90, cheer = false }: { size?: number; cheer?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      {...(cheer ? { animate: { y: [0, -24, 0, -14, 0] }, transition: { duration: 0.8 } } : bounce)}
      aria-hidden
    >
      <circle cx="60" cy="70" r="40" fill="#8ECAE6" />
      <circle cx="60" cy="80" r="26" fill="#EAF6FC" />
      <circle cx="46" cy="60" r="9" fill="#fff" />
      <circle cx="74" cy="60" r="9" fill="#fff" />
      <circle cx="48" cy="62" r="4.5" fill="#3D3A4B" />
      <circle cx="72" cy="62" r="4.5" fill="#3D3A4B" />
      <path d="M50 84 q10 8 20 0" stroke="#3D3A4B" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* antenna */}
      <path d="M60 30 q0 -14 10 -18" stroke="#5FA8CB" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="72" cy="10" r="7" fill="#FFD66B" />
    </motion.svg>
  )
}

/** A tappable baby dino for the tap-count pattern */
export function LittleDino({ size = 96, color = '#7FC8A9' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ellipse cx="50" cy="62" rx="34" ry="30" fill={color} />
      <ellipse cx="50" cy="70" rx="21" ry="17" fill="#F6FBF3" />
      <circle cx="39" cy="52" r="7.5" fill="#fff" />
      <circle cx="61" cy="52" r="7.5" fill="#fff" />
      <circle cx="41" cy="54" r="3.5" fill="#3D3A4B" />
      <circle cx="59" cy="54" r="3.5" fill="#3D3A4B" />
      <path d="M42 72 q8 7 16 0" stroke="#3D3A4B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="26" r="7" fill="#FFD66B" />
    </svg>
  )
}

/** A fruit for the feed pattern */
export function Berry({ size = 72 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden>
      <circle cx="40" cy="46" r="26" fill="#F4A9C4" />
      <circle cx="32" cy="38" r="7" fill="#FBD5E4" />
      <path d="M40 20 q2 -10 12 -12" stroke="#4DA184" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="54" cy="10" rx="9" ry="5" fill="#7FC8A9" transform="rotate(18 54 10)" />
    </svg>
  )
}

export function Star({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden>
      <path
        d="M30 4 l7.6 15.8 17.4 2.4 -12.7 12.1 3.1 17.2 -15.4 -8.3 -15.4 8.3 3.1 -17.2 -12.7 -12.1 17.4 -2.4z"
        fill="#FFB830"
        stroke="#E89C0E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
