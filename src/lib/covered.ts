/**
 * Whether a full-screen layer (the player) covers the page. What's under it
 * stops moving: the strip stops turning and its clips pause.
 */
let covered = false
const listeners = new Set<() => void>()

export const isCovered = () => covered

export function setCovered(on: boolean) {
  covered = on
  listeners.forEach(f => f())
}

export function onCover(f: () => void) {
  listeners.add(f)
  return () => void listeners.delete(f)
}
