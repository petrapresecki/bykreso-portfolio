import { useEffect, useRef } from 'react'

export interface LazyVideoProps {
  src: string
  className?: string
  poster?: string
}

/** Muted looping video that only plays while near the viewport. */
export default function LazyVideo({ src, className, poster }: LazyVideoProps) {
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = video.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [src])

  return <video ref={video} src={src} poster={poster} loop muted playsInline preload="metadata" className={className} />
}
