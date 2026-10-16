import { useSyncExternalStore } from 'react'
import { gsap } from '@/lib/kit/gsap'

/**
 * The page has one colour at a time: the film that's framed. Everything that's
 * painted reads `--page` and `--ink`; this keeps them and the hex readout in step.
 */
let current = '#BF9563'
const listeners = new Set<() => void>()

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Ink flips to cream on darker films so text keeps its contrast */
export const inkFor = (hex: string) => (lum(hex) > 0.3 ? '#1a1612' : '#f4ede4')

export function paint(hex: string, duration = 0.9) {
  if (hex === current) return
  current = hex
  listeners.forEach(l => l())
  const root = document.documentElement
  gsap.to(root, { '--page': hex, '--ink': inkFor(hex), duration, ease: 'power2.out', overwrite: true })
}

export function initPaint(hex: string) {
  current = hex
  document.documentElement.style.setProperty('--page', hex)
  document.documentElement.style.setProperty('--ink', inkFor(hex))
}

export const usePageColor = () =>
  useSyncExternalStore(
    l => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
