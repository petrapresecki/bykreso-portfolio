import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/kit/gsap'
import type { Film } from '@/data/films'

/**
 * Every film as one strip: its barcode, one column per frame, so each row is the
 * whole film at a glance. Hovering a row floods it with the film's colour; a click
 * opens the player. Rows open from the centre line as the section scrolls in.
 *
 * Grew out of creative-kit's WorkStrips (hover widens into colour), turned on its
 * side and fed with barcodes instead of video.
 */
export default function Work({ films, onOpen }: { films: Film[]; onOpen: (index: number, from: DOMRect) => void }) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('[data-row]', {
        clipPath: 'inset(0 50% 0 50%)',
        duration: 1.3,
        ease: 'expo.inOut',
        stagger: 0.06,
        scrollTrigger: { trigger: '[data-rows]', start: 'top 80%' },
      })
      gsap.from('[data-chip]', { opacity: 0, duration: 0.6, stagger: 0.06, delay: 0.7, scrollTrigger: { trigger: '[data-rows]', start: 'top 80%' } })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="rad" tabIndex={-1} className="relative pt-16 pb-28 outline-none">
      <div className="mb-6 grid grid-cols-2 gap-x-6">
        <h2 className="mono text-right">Rad</h2>
        <p className="mono max-w-[30ch] text-ink/60">{films.length} filmova · Svaka traka je cijeli film, kadar po kadar</p>
      </div>

      <ul data-rows className="flex flex-col gap-[5px] px-3">
        {films.map((film, i) => (
          <li key={film.id} data-row>
            <button
              type="button"
              onClick={e => onOpen(i, e.currentTarget.getBoundingClientRect())}
              className="group relative block h-[clamp(22px,5.2vh,46px)] w-full cursor-pointer overflow-hidden"
            >
              <img src={film.barcode} alt="" draggable={false} className="absolute inset-0 h-full w-full object-fill [image-rendering:pixelated] saturate-[0.85] transition-[filter] duration-500 group-hover:saturate-125" />
              <span className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" style={{ backgroundColor: film.color }} />
              <span className="absolute inset-y-0 left-0 w-px bg-ink/0 transition-colors group-hover:bg-ink/40" />
              <span
                data-chip
                className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-baseline gap-3 px-2 py-[3px] whitespace-nowrap transition-colors duration-500"
                style={{ backgroundColor: 'color-mix(in srgb, var(--page) 88%, transparent)' }}
              >
                <span>{film.title}</span>
                <span className="mono text-ink/55">
                  {film.category} · {film.year}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
