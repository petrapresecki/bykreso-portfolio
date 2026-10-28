import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/kit/gsap'
import { getLenis } from '@/lib/kit/lenis'
import { paint } from '@/lib/page-color'
import type { Film } from '@/data/films'

export interface PlayerProps {
  films: Film[]
  index: number
  /** Where the clip was on the page, so the player grows out of it */
  from?: DOMRect
  onIndex: (i: number) => void
  onClose: () => void
}

/** The film, full screen on its own colour, framed by the same corner marks as the strip */
export default function Player({ films, index, from, onIndex, onClose }: PlayerProps) {
  const film = films[index]
  const N = films.length
  const root = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  // Keyboard focus moves into the player and goes back to the film it came from. Read at first render, before focus moves
  const [opener] = useState(() => document.activeElement as HTMLElement | null)
  const [aspect, setAspect] = useState(film.wide ? 16 / 9 : 9 / 16)
  const [sound, setSound] = useState(false)
  const closing = useRef(false)

  // Grow out of the clicked clip, then bring in the text. With reduced motion it only fades in
  useLayoutEffect(() => {
    const lenis = getLenis()
    lenis?.stop()
    const html = document.documentElement
    if (!lenis) html.style.overflow = 'hidden'
    closeButton.current?.focus({ preventScroll: true })
    const el = frame.current!
    // A context, so a cleanup (StrictMode runs this twice) puts every inline style back before measuring again
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tl.fromTo(root.current, { backgroundColor: 'transparent' }, { backgroundColor: 'var(--page)', duration: 0.5, ease: 'power2.out' }, 0)
      if (prefersReducedMotion()) return
      if (from) {
        const to = el.getBoundingClientRect()
        tl.from(el, { x: from.left + from.width / 2 - (to.left + to.width / 2), y: from.top + from.height / 2 - (to.top + to.height / 2), scaleX: from.width / to.width, scaleY: from.height / to.height, duration: 0.9, ease: 'expo.inOut' }, 0)
      }
      tl.from('[data-chrome]', { opacity: 0, y: 6, duration: 0.5, stagger: 0.04 }, from ? 0.6 : 0.2)
    }, root)
    return () => {
      ctx.revert()
      lenis?.start()
      html.style.overflow = ''
      // After the page under it is no longer inert; skipped when StrictMode remounts the same player
      requestAnimationFrame(() => !root.current?.isConnected && opener?.focus({ preventScroll: true }))
    }
    // Only on mount: switching films inside the player crossfades instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    paint(film.color, 0.6)
  }, [film])

  // The tab says which film is open
  useEffect(() => {
    const title = document.title
    document.title = `${film.title} — Krešo`
    return () => void (document.title = title)
  }, [film.title])

  const close = () => {
    if (closing.current) return
    closing.current = true
    gsap.to(root.current, { opacity: 0, duration: 0.45, ease: 'power2.inOut', onComplete: onClose })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') onIndex((index + 1) % N)
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') onIndex((index - 1 + N) % N)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const corner = 'absolute size-4 border-ink'
  const style = aspect >= 1 ? { width: 'min(86vw, 150vh)', aspectRatio: String(aspect) } : { height: '86svh', aspectRatio: String(aspect), maxWidth: '86vw' }

  return (
    <div ref={root} role="dialog" aria-modal="true" aria-label={film.title} className="fixed inset-0 z-50 text-ink" style={{ backgroundColor: 'var(--page)' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div ref={frame} className="relative" style={style}>
          <div key={film.id} className="absolute inset-0 overflow-hidden bg-ink/10 [animation:fade_.5s_ease-out]">
            <video
              src={film.video}
              poster={film.src}
              autoPlay
              loop
              playsInline
              muted={!sound}
              onLoadedMetadata={e => setAspect(e.currentTarget.videoWidth / e.currentTarget.videoHeight)}
              onClick={close}
              className="h-full w-full cursor-pointer object-cover"
            />
          </div>
          <span className={`${corner} -top-2 -left-2 border-t-[1.5px] border-l-[1.5px]`} />
          <span className={`${corner} -top-2 -right-2 border-t-[1.5px] border-r-[1.5px]`} />
          <span className={`${corner} -bottom-2 -left-2 border-b-[1.5px] border-l-[1.5px]`} />
          <span className={`${corner} -right-2 -bottom-2 border-r-[1.5px] border-b-[1.5px]`} />
        </div>
      </div>

      <p data-chrome aria-live="polite" className="absolute top-3 left-3">
        {film.title}
      </p>
      <div data-chrome className="absolute top-3 right-3 flex gap-4">
        <button type="button" onClick={() => setSound(s => !s)} className="cursor-pointer">
          Zvuk: <span className={sound ? '' : 'opacity-60'}>{sound ? 'on' : 'off'}</span>
        </button>
        <button ref={closeButton} type="button" onClick={close} className="cursor-pointer">
          Zatvori ×
        </button>
      </div>
      <p data-chrome className="mono absolute bottom-3 left-3">
        {index + 1} / {N} — {film.category} · {film.place} · {film.year}
      </p>
      <p data-chrome lang="en" className="absolute right-3 bottom-3 text-right">
        {film.line}
      </p>
    </div>
  )
}
