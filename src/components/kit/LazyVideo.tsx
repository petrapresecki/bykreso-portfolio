import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/kit/gsap'
import { isCovered, onCover } from '@/lib/covered'

export interface LazyVideoProps {
  src: string
  className?: string
  poster?: string
  /** The parent can say it's out of sight (e.g. a strip tile parked off the strip) */
  active?: boolean
}

/**
 * Muted looping video. The clip loads a screen before it's needed and plays
 * only while it's on screen, active and not under the player. With reduced
 * motion it stays on its poster.
 */
export default function LazyVideo({ src, className, poster, active = true }: LazyVideoProps) {
  const video = useRef<HTMLVideoElement>(null)
  const [near, setNear] = useState(false)
  const [still] = useState(prefersReducedMotion)

  useEffect(() => {
    const el = video.current
    if (!el) return
    let onScreen = false
    const sync = () => {
      if (near && onScreen && active && !still && !isCovered()) el.play().catch(() => {})
      else el.pause()
    }
    const ahead = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '100% 0px' })
    const seen = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      sync()
    })
    if (!near) ahead.observe(el)
    seen.observe(el)
    const off = onCover(sync)
    return () => {
      ahead.disconnect()
      seen.disconnect()
      off()
    }
  }, [src, near, active, still])

  return <video ref={video} src={near && !still ? src : undefined} poster={poster} loop muted playsInline preload="metadata" aria-hidden className={className} />
}
