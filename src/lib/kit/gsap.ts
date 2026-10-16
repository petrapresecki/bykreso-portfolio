import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Draggable } from 'gsap/Draggable'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, useGSAP)

gsap.defaults({ ease: 'power3.out', duration: 1 })

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The scroll container a block's ScrollTriggers should watch, once it exists.
 * A parent's ref is attached after a child's layout effects, so `scroller.current`
 * is still null on useGSAP's first run. Wait for this before creating triggers:
 * it is `undefined` while pending, `null` for the page, else the element.
 */
export function useScroller(scroller?: React.RefObject<HTMLElement | null>) {
  const [el, setEl] = useState<HTMLElement | null | undefined>(scroller ? undefined : null)
  useEffect(() => {
    const id = requestAnimationFrame(() => setEl(scroller?.current ?? null))
    return () => cancelAnimationFrame(id)
  }, [scroller])
  return el
}

export { gsap, ScrollTrigger, SplitText, Draggable, useGSAP }
