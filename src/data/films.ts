export interface Film {
  id: string
  title: string
  /** Shown in caps in the work rows and the player, e.g. Vjenčanje, Grad */
  category: string
  place: string
  year: number
  /** One line under the player, in English */
  line: string
  /** Poster image; any aspect ratio */
  src: string
  /** Clip that plays in the framed slot and the player */
  video?: string
  /** The whole film as one strip, one column per frame (public/barcodes, made by scripts/barcode.swift) */
  barcode: string
  /** The film's colour: the page turns this colour while it's framed */
  color: string
}

const film = (f: Omit<Film, 'src' | 'video' | 'barcode'> & { still?: boolean }): Film => ({
  ...f,
  src: `/media/${f.id}.jpg`,
  video: f.still ? undefined : `/media/${f.id}.mp4`,
  barcode: `/barcodes/${f.id}.png`,
})

// Colours marked "old site" were read off the screen recording of the original; the rest are picked to sit with them
export const films: Film[] = [
  film({ id: 'love-in-adhd', title: 'Love in ADHD', category: 'Vjenčanje', place: 'Gornji Grad, Zagreb', year: 2025, line: 'A wedding that never sat still.', color: '#B39A8C' }),
  film({ id: 'jam-the-tram', title: 'Jam the Tram', category: 'Event', place: 'Tram 13, Zagreb', year: 2024, line: 'A party on the number 13.', color: '#8A7A70' }),
  film({ id: 'dea-luka', title: 'Dea & Luka', category: 'Vjenčanje', place: 'Zagreb', year: 2025, line: 'May Day shenanigans.', color: '#968774' }), // old site
  film({ id: 'ki-klop-soma', title: 'Ki Klop × SOMA', category: 'Glazba', place: 'SOMA, Zagreb', year: 2025, line: 'A short lecture at SOMA University.', color: '#8C7F86' }),
  film({ id: 'the-loop', title: 'The Loop', category: 'Igrani film', place: 'Zagreb', year: 2025, line: 'Working from home, again.', color: '#7A4A2E' }),
  film({ id: 'espresso-macchiato', title: 'Espresso macchiato', category: 'Brand', place: 'Regular Bar, Zagreb', year: 2025, line: 'Coffee at Regular Bar.', color: '#8E725F' }),
  film({ id: 'love-in-adhd-finale', title: 'Love in ADHD: The Finale', category: 'Vjenčanje', place: 'Zagreb', year: 2025, line: 'The last dance.', color: '#9C7E6B' }),
  film({ id: 'southern-comfort', title: 'Southern Comfort', category: 'Grad', place: 'Split', year: 2025, line: 'Split, in the heat.', color: '#9A7A68' }), // old site
  film({ id: 'analogija', title: 'Analogija liberalnog uma', category: 'Grad', place: 'Zagreb', year: 2025, line: 'An analogy of a liberal mind.', color: '#BF9563' }), // old site
  film({ id: 'freud', title: 'Freud has left the chat', category: 'Kratki film', place: 'Somewhere flat', year: 2025, line: 'Somewhere flat, facing the sea.', color: '#DBBE92', still: true }), // old site
  film({ id: 'pravda', title: 'Pravda za Martićevu', category: 'Grad', place: 'Martićeva, Zagreb', year: 2025, line: 'Justice for Martićeva street.', color: '#A86248' }), // old site
]
