import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/kit/gsap'
import type { Film } from '@/data/films'
import LazyVideo from '@/components/kit/LazyVideo'
import { isCovered } from '@/lib/covered'

/**
 * The hero: a looping column of greyscale thumbnails under four corner marks.
 * Whatever sits between the marks turns to colour, grows and plays, the marks
 * hug its shape, and the two lists beside it turn so its title and details stay
 * on the centre line.
 *
 * Reworked from creative-kit's ViewfinderStrip: thin corner marks that follow
 * the framed clip instead of the fixed lens, a turning list on both sides, every
 * thumbnail is a playing clip, and the wheel only drives the strip near the centre column
 * so the page still scrolls from the sides.
 */

export interface FilmStripProps {
  films: Film[]
  onActive?: (film: Film, index: number) => void
  onOpen?: (index: number, from: DOMRect) => void
  /** Turn the strip to this film (e.g. the one the player was left on) */
  select?: { index: number }
  /** Thumbnail size as a fraction of the height (portraits come out taller, landscapes wider) */
  size?: number
  /** How much the framed clip grows */
  zoom?: number
  className?: string
}

const GAP = 5
const LINE = 15
/** Corner marks sit this far outside the framed clip */
const PAD = 8
/** Half-width of the column where the wheel turns the strip instead of the page */
const WHEEL_ZONE = 170

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const smoothstep = (x: number, a: number, b: number) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const mod = (v: number, n: number) => ((v % n) + n) % n
const wrap = (v: number, n: number) => mod(v + n / 2, n) - n / 2

export const filmMeta = (f: Film) => `${f.category} · ${f.place} · ${f.year}`

export default function FilmStrip({ films, onActive, onOpen, select, size = 0.15, zoom = 1.55, className = '' }: FilmStripProps) {
  const N = films.length
  const root = useRef<HTMLDivElement>(null)
  const tiles = useRef<(HTMLButtonElement | null)[]>([])
  const titles = useRef<(HTMLLIElement | null)[]>([])
  const metas = useRef<(HTMLLIElement | null)[]>([])
  const corners = useRef<HTMLDivElement>(null)
  const lists = useRef<HTMLDivElement>(null)
  // Known from the data, so the first layout is already right; the posters refine it when they load
  const aspects = useRef<number[]>(films.map(f => (f.wide ? 16 / 9 : 9 / 16)))
  const [height, setHeight] = useState(800)
  const [framed, setFramed] = useState(0)
  const reduced = useMemo(() => prefersReducedMotion(), [])
  // The page keeps the first film's colour until the strip has risen in, instead of flashing through every film it passes
  const [arrived, setArrived] = useState(reduced)
  // Which tiles are on the strip ('1') or parked out of sight ('0'): only those on it play
  const [shown, setShown] = useState('')
  const inView = useRef(true)
  const motion = useRef({ scroll: 0, target: 0, lastInput: 0, dragging: false, dragY: 0, moved: 0, open: 1, started: false, centres: [] as number[], length: 1, box: { w: 0, h: 0 } })

  const copies = Math.max(1, Math.ceil((2.4 * height) / Math.max(1, N * (height * size * 1.1 + GAP))))
  const loop = useMemo(() => Array.from({ length: copies }, () => films).flat(), [copies, films])
  const active = framed % N

  useEffect(() => {
    const el = root.current!
    const observer = new ResizeObserver(() => setHeight(el.clientHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (arrived) onActive?.(films[active], active)
  }, [active, films, onActive, arrived])

  // Nothing to turn while the strip is scrolled away or under the player
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => (inView.current = e.isIntersecting))
    io.observe(root.current!)
    return () => io.disconnect()
  }, [])

  const offsetTo = (k: number) => {
    const m = motion.current
    let best = Infinity
    for (let c = 0; c < copies; c++) {
      const d = wrap(m.centres[k + c * N] - m.target, m.length)
      if (Math.abs(d) < Math.abs(best)) best = d
    }
    return best
  }
  const nearest = () => {
    const m = motion.current
    let best = 0
    m.centres.forEach((c, j) => {
      if (Math.abs(wrap(c - m.target, m.length)) < Math.abs(wrap(m.centres[best] - m.target, m.length))) best = j
    })
    return best
  }
  const goTo = (k: number) => {
    motion.current.target += offsetTo(mod(k, N))
    motion.current.lastInput = 0
  }
  const step = (dir: number) => goTo((nearest() % N) + dir)

  useEffect(() => {
    if (select !== undefined && motion.current.started) goTo(select.index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [select])
  const open = (j: number) => {
    const tile = tiles.current[j]
    if (tile && onOpen) onOpen(j % N, tile.getBoundingClientRect())
  }

  useEffect(() => {
    const m = motion.current
    const el = root.current!
    let current = -1
    let lastShown = ''

    const tick = (_t: number, deltaMs: number) => {
      if (m.started && (!inView.current || isCovered())) return
      const dt = Math.min(deltaMs / 1000, 1 / 30)
      const H = el.clientHeight
      const base = H * size
      const heights = loop.map((_, j) => base / Math.sqrt(aspects.current[j % N] ?? 0.5625))
      let acc = 0
      m.centres = heights.map(h => {
        const c = acc + h / 2
        acc += h + GAP
        return c
      })
      m.length = acc
      if (!m.started) {
        m.started = true
        m.scroll = m.target = m.centres[0]
        if (!reduced) {
          // Rise in from below while the corner marks open out of the centre
          m.scroll -= H * 1.1
          m.open = 0
          gsap.to(m, { open: 1, duration: 1.4, delay: 0.4, ease: 'expo.inOut', onComplete: () => setArrived(true) })
        }
      }

      const now = performance.now()
      if (!m.dragging && m.lastInput && now - m.lastInput > 160) {
        m.lastInput = 0
        m.target += wrap(m.centres[nearest()] - m.target, m.length)
      }
      const k = 1 - Math.exp(-(m.dragging || reduced ? 30 : m.open < 1 ? 3 : 7) * dt)
      m.scroll += (m.target - m.scroll) * k

      const ys = m.centres.map(c => wrap(c - m.scroll, m.length))
      const focus = ys.map((y, j) => 1 - smoothstep(Math.abs(y), 0, (heights[j] + GAP) * 0.85))
      const grow = heights.map((h, j) => h * (zoom - 1) * focus[j])
      let nearestJ = 0
      ys.forEach((y, j) => {
        if (Math.abs(y) < Math.abs(ys[nearestJ])) nearestJ = j
      })

      // The corner marks hug whatever is framed, blended between the two nearest clips
      let boxW = 0
      let boxH = 0
      let weight = 0
      let onStrip = ''
      tiles.current.forEach((tile, j) => {
        if (!tile) return
        let y = ys[j]
        for (let i = 0; i < ys.length; i++) if (i !== j && grow[i] > 0.01) y += (grow[i] / 2) * Math.sign(ys[j] - ys[i])
        const h = heights[j]
        const w = h * (aspects.current[j % N] ?? 0.5625)
        const f = focus[j]
        if (f > 0.001) {
          boxW += w * (1 + (zoom - 1) * f) * f
          boxH += h * (1 + (zoom - 1) * f) * f
          weight += f
        }
        const visible = Math.abs(y) < H / 2 + h * zoom
        onStrip += visible ? '1' : '0'
        tile.style.visibility = visible ? 'visible' : 'hidden'
        if (!visible) return
        tile.style.height = `${h}px`
        tile.style.width = `${w}px`
        tile.style.transform = `translate(-50%, -50%) translate3d(0, ${y.toFixed(2)}px, 0) scale(${(1 + (zoom - 1) * f).toFixed(4)})`
        tile.style.filter = f > 0.99 ? 'none' : `grayscale(${1 - f}) contrast(${0.85 + 0.15 * f}) brightness(${0.92 + 0.08 * f})`
        tile.style.zIndex = f > 0.5 ? '2' : '1'
      })
      if (onStrip !== lastShown) {
        lastShown = onStrip
        setShown(onStrip)
      }
      if (weight > 0) {
        const tw = boxW / weight + PAD * 2
        const th = boxH / weight + PAD * 2
        m.box.w = m.box.w ? m.box.w + (tw - m.box.w) * Math.min(1, k * 2) : tw
        m.box.h = m.box.h ? m.box.h + (th - m.box.h) * Math.min(1, k * 2) : th
      }
      if (corners.current) {
        corners.current.style.width = `${(m.box.w * m.open).toFixed(1)}px`
        corners.current.style.height = `${(m.box.h * (0.25 + 0.75 * m.open)).toFixed(1)}px`
        corners.current.style.opacity = String(m.open)
      }
      lists.current?.style.setProperty('--clear', `${(m.box.w / 2 + 28).toFixed(1)}px`)

      // Both lists turn with the strip, so the framed film always sits on the centre line
      const idx = nearestJ % N
      const frac = -ys[nearestJ] / (heights[nearestJ] + GAP)
      const listPos = idx + frac
      for (const group of [titles.current, metas.current]) {
        group.forEach((li, i) => {
          if (!li) return
          const off = wrap(i - listPos, N)
          li.style.transform = `translate3d(0, ${(off * LINE).toFixed(2)}px, 0)`
          li.style.opacity = String((1 - smoothstep(Math.abs(off), N / 2 - 1.5, N / 2 - 0.5)) * m.open)
        })
      }

      if (nearestJ !== current) {
        current = nearestJ
        setFramed(nearestJ)
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [loop, N, size, zoom, reduced])

  useEffect(() => {
    const el = root.current!
    const m = motion.current
    const onWheel = (e: WheelEvent) => {
      const r = el.getBoundingClientRect()
      if (Math.abs(e.clientX - (r.left + r.width / 2)) > WHEEL_ZONE) return
      e.preventDefault()
      e.stopPropagation()
      m.target += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 32 : 1)
      m.lastInput = performance.now()
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      m.dragging = true
      m.dragY = e.clientY
      m.moved = 0
    }
    const move = (e: PointerEvent) => {
      if (!m.dragging) return
      const dy = e.clientY - m.dragY
      m.dragY = e.clientY
      m.moved += Math.abs(dy)
      m.target -= dy
    }
    const up = () => {
      if (!m.dragging) return
      m.dragging = false
      m.lastInput = performance.now() - 1000
    }
    // Capture phase, so Lenis on the window never sees a wheel the strip took
    el.addEventListener('wheel', onWheel, { passive: false, capture: true })
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('wheel', onWheel, { capture: true })
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  // Keyboard focus on the strip: the viewfinder's marks grow and thicken
  const corner = 'absolute size-3 border-ink transition-[width,height] duration-300 group-focus-visible:size-5'

  return (
    <div
      ref={root}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Filmovi. Strelice mijenjaju film, Enter ga otvara."
      onKeyDown={e => {
        if (document.querySelector('[role=dialog]')) return
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') step(1)
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') step(-1)
        else if (e.key === 'Enter') open(framed)
        else return
        e.preventDefault()
      }}
      className={`group relative touch-pan-y overflow-clip outline-none select-none ${className}`}
    >
      {loop.map((film, j) => (
        <button
          key={`${film.id}-${j}`}
          ref={el => {
            tiles.current[j] = el
          }}
          type="button"
          tabIndex={-1}
          aria-label={film.title}
          onClick={() => {
            const m = motion.current
            if (m.moved > 6) return
            if (j === framed && Math.abs(wrap(m.centres[j] - m.scroll, m.length)) < 4) open(j)
            else goTo(j % N)
          }}
          className="absolute top-1/2 left-1/2 block cursor-pointer touch-none overflow-hidden bg-ink/10 will-change-transform"
          style={{ visibility: 'hidden' }}
        >
          <img
            src={film.thumb}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
            onLoad={e => {
              const img = e.currentTarget
              aspects.current[j % N] = img.naturalWidth / img.naturalHeight
              // If a poster changed the layout, settle back onto the nearest film
              if (!motion.current.dragging) motion.current.lastInput = performance.now() - 1000
            }}
          />
          {/* Every thumbnail on the strip plays a light loop (greyscale until framed); tiles parked off it pause */}
          <LazyVideo src={film.preview} poster={film.thumb} active={shown[j] === '1'} className="absolute inset-0 h-full w-full object-cover" />
        </button>
      ))}

      {/* Corner marks */}
      <div ref={corners} className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <span className={`${corner} top-0 left-0 border-t-[1.5px] border-l-[1.5px] group-focus-visible:border-t-[3px] group-focus-visible:border-l-[3px]`} />
        <span className={`${corner} top-0 right-0 border-t-[1.5px] border-r-[1.5px] group-focus-visible:border-t-[3px] group-focus-visible:border-r-[3px]`} />
        <span className={`${corner} bottom-0 left-0 border-b-[1.5px] border-l-[1.5px] group-focus-visible:border-b-[3px] group-focus-visible:border-l-[3px]`} />
        <span className={`${corner} right-0 bottom-0 border-r-[1.5px] border-b-[1.5px] group-focus-visible:border-r-[3px] group-focus-visible:border-b-[3px]`} />
      </div>

      {/* Turning lists: titles on the left, category · place · year on the right */}
      <div ref={lists} className="pointer-events-none absolute inset-x-0 top-1/2 z-20 hidden -translate-y-1/2 md:block" style={{ height: LINE, lineHeight: `${LINE}px` }}>
        <ul className="absolute inset-y-0 right-[calc(50%+var(--clear,80px))] w-[28ch] text-right">
          {films.map((film, i) => (
            <li
              key={film.id}
              ref={el => {
                titles.current[i] = el
              }}
              className="absolute inset-x-0 top-0 truncate"
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => goTo(i)}
                className={`pointer-events-auto cursor-pointer transition-colors duration-300 ${i === active ? 'text-ink' : 'text-ink/35 hover:text-ink/70'}`}
              >
                {film.title}
              </button>
            </li>
          ))}
        </ul>
        <ul className="absolute inset-y-0 left-[calc(50%+var(--clear,80px))] w-[36ch]">
          {films.map((film, i) => (
            <li
              key={film.id}
              ref={el => {
                metas.current[i] = el
              }}
              className={`absolute inset-x-0 top-0 truncate transition-colors duration-300 ${i === active ? 'text-ink' : 'text-ink/35'}`}
            >
              {filmMeta(film)}
            </li>
          ))}
        </ul>
      </div>

      {/* For screen readers: which film is framed now */}
      <p className="sr-only" aria-live="polite">
        {films[active] && `${films[active].title}, ${filmMeta(films[active])}`}
      </p>

      {/* Small screens: the framed title under the strip */}
      <p className="pointer-events-none absolute inset-x-0 bottom-14 z-20 px-4 text-center md:hidden">
        {films[active]?.title}
        <span className="block text-ink/50">{films[active] && filmMeta(films[active])}</span>
      </p>
    </div>
  )
}
