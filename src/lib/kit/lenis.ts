import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'

let lenis: Lenis | null = null
const tick = (time: number) => lenis?.raf(time * 1000)

/** Smooth scroll, kept in sync with GSAP ScrollTrigger. Call once at app start. */
export function initLenis(): Lenis {
  if (lenis) return lenis
  lenis = new Lenis()
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export const getLenis = () => lenis

export function destroyLenis() {
  gsap.ticker.remove(tick)
  lenis?.destroy()
  lenis = null
}
