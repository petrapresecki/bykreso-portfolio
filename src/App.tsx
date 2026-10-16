import { useCallback, useEffect, useState } from 'react'
import { initLenis, destroyLenis, getLenis } from '@/lib/kit/lenis'
import { initPaint, paint, usePageColor } from '@/lib/page-color'
import { films, type Film } from '@/data/films'
import FilmStrip from '@/components/FilmStrip'
import Spine from '@/components/Spine'
import Work from '@/components/Work'
import Player from '@/components/Player'

const sections = [
  { id: 'o-meni', label: 'O meni' },
  { id: 'rad', label: 'Rad' },
  { id: 'kontakt', label: 'Kontakt' },
]

initPaint(films[0].color)

export default function App() {
  const hex = usePageColor()
  const [current, setCurrent] = useState<string | null>(null)
  const [player, setPlayer] = useState<{ index: number; from?: DOMRect } | null>(null)
  const [framed, setFramed] = useState(0)
  const [select, setSelect] = useState<{ index: number }>()

  useEffect(() => {
    initLenis()
    return () => destroyLenis()
  }, [])

  // Which section the nav marks: the one crossing the middle of the screen
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id === 'top' ? null : e.target.id)
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    for (const id of ['top', ...sections.map(s => s.id)]) {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])

  const onActive = useCallback((film: Film, index: number) => {
    setFramed(index)
    paint(film.color)
  }, [])

  const go = (id: string) => getLenis()?.scrollTo(id === 'top' ? 0 : `#${id}`, { duration: 1.6 })

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex justify-between px-3 py-3">
        <button type="button" onClick={() => go('top')} className="mono cursor-pointer text-[11px]">
          bykreso
        </button>
        <nav className="flex gap-4">
          {sections.map(s => (
            <button key={s.id} type="button" onClick={() => go(s.id)} className={`mono cursor-pointer text-[10px] transition-opacity duration-300 ${current === s.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}>
              {s.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="bg-paper text-ink">
        <section id="top" className="relative h-svh">
          <FilmStrip films={films} select={select} onActive={onActive} onOpen={(index, from) => setPlayer({ index, from })} className="h-full" />
          <p className="mono pointer-events-none absolute bottom-3 left-3 z-30">Krešo — snima i gradira, Zagreb</p>
          <p className="mono pointer-events-none absolute right-3 bottom-3 z-30 tabular-nums">{hex}</p>
        </section>

        <Spine
          id="o-meni"
          label="O meni"
          className="pt-24 pb-16"
          left={
            <div data-rise className="ml-auto max-w-[34ch] space-y-3">
              <p>Krešo snima i sam gradira sve što snimi: vjenčanja, bendove, barove i gradove. Ljudi u njegovim filmovima pričaju u kameru, kao da je snima prijatelj.</p>
              <p>Voli kad je sve na sredini kadra i kad je toplo. Svaki film ima svoju boju, pa je ima i ova stranica.</p>
            </div>
          }
          right={
            <ul data-rise>
              <li>Vjenčanja</li>
              <li>Glazba i eventi</li>
              <li>Brendovi</li>
              <li>Kratki i igrani film</li>
              <li className="mt-1 text-ink/50">Sony FX3, staro staklo, fisheye</li>
              <li className="text-ink/50">Grade u DaVinci Resolveu</li>
            </ul>
          }
        />

        <Work films={films} onOpen={(index, from) => setPlayer({ index, from })} />

        <Spine
          id="kontakt"
          label="Kontakt"
          className="min-h-[70svh] pt-24 pb-40"
          left={
            <div data-rise>
              <a href="mailto:hello@bykreso.com" className="underline-offset-2 hover:underline">
                hello@bykreso.com
              </a>
              <p className="mt-2 text-ink/50">Ženiš se? Otvaraš bar? Imaš bend?</p>
            </div>
          }
          right={
            <div data-rise>
              <a href="https://www.instagram.com/bykreso/" target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                @bykreso
              </a>
              <p className="mt-2 text-ink/50">Zagreb, i gdje god treba.</p>
            </div>
          }
        />

        <footer className="mono flex justify-between px-3 pb-3">
          <span>© {new Date().getFullYear()}</span>
          <span>bykreso</span>
        </footer>
      </main>

      {player && (
        <Player
          films={films}
          index={player.index}
          from={player.from}
          onIndex={index => setPlayer(p => p && { ...p, index })}
          onClose={() => {
            setPlayer(null)
            // Leave the strip on the film the player was on
            if (player.index === framed) paint(films[framed].color)
            else setSelect({ index: player.index })
          }}
        />
      )}
    </>
  )
}
