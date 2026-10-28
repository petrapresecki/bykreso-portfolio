import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/kit/gsap'

/**
 * Text on a centre spine (after creative-kit's SpineText, without the pinned object):
 * a hairline down the middle, the label on it, left block right-aligned, right block
 * left-aligned. The line draws down and the text rises in as the section arrives.
 */
export default function Spine({ id, label, left, right, className = '' }: { id: string; label: string; left: ReactNode; right: ReactNode; className?: string }) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 70%' } })
      tl.from('[data-rule]', { scaleY: 0, transformOrigin: 'top', duration: 1.4, ease: 'expo.inOut' })
        .from('[data-rise]', { y: 14, opacity: 0, duration: 0.9, stagger: 0.05, ease: 'expo.out' }, 0.3)
    },
    { scope: root },
  )

  return (
    <section ref={root} id={id} tabIndex={-1} className={`relative flex flex-col items-center px-3 outline-none ${className}`}>
      <span data-rule className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink/30" />
      <h2 data-rise className="mono relative z-10 mb-6 bg-paper py-2">
        {label}
      </h2>
      <div className="relative grid w-full grid-cols-2 gap-x-6 md:gap-x-6">
        <div className="text-right">{left}</div>
        <div>{right}</div>
      </div>
    </section>
  )
}
