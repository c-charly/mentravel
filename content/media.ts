// Registre des visuels. Remplacer `src` par une vraie photo (WebP ou AVIF, dans public/images)
// suffit a la faire apparaitre partout; sans `src`, un visuel graphique de remplacement s'affiche.
import type { Localized } from '../shared/types'

export interface MediaDef {
  src: string | null
  alt: Localized
  ratio: string
  tone: 'yde' | 'dla' | 'kri' | 'night'
}

export const MEDIA: Record<string, MediaDef> = {
  'hero-road': {
    src: '/images/hero-road.svg',
    alt: { fr: 'Un bus MEN TRAVEL sur la route entre deux villes', en: 'A MEN TRAVEL bus on the road between two cities' },
    ratio: '4 / 3',
    tone: 'night',
  },
  'city-yaounde': {
    src: '/images/city-yaounde.svg',
    alt: { fr: 'Yaoundé, ses collines et sa tour', en: 'Yaoundé, its hills and its tower' },
    ratio: '5 / 6',
    tone: 'yde',
  },
  'city-douala': {
    src: '/images/city-douala.svg',
    alt: { fr: 'Douala, son port et ses grues au coucher du soleil', en: 'Douala, its port and cranes at sunset' },
    ratio: '5 / 6',
    tone: 'dla',
  },
  'city-kribi': {
    src: '/images/city-kribi.svg',
    alt: { fr: 'Kribi, ses palmiers et son océan', en: 'Kribi, its palms and its ocean' },
    ratio: '5 / 6',
    tone: 'kri',
  },
  'class-business': {
    src: '/images/class-business.svg',
    alt: { fr: 'Sièges Business en 2+2', en: 'Business 2+2 seats' },
    ratio: '3 / 2',
    tone: 'kri',
  },
  'class-masterclass-s': {
    src: '/images/class-masterclass-s.svg',
    alt: { fr: 'Fauteuil MasterClass S avec écran personnel', en: 'MasterClass S armchair with personal screen' },
    ratio: '3 / 2',
    tone: 'dla',
  },
  'class-masterclass-plus': {
    src: '/images/class-masterclass-plus.svg',
    alt: { fr: 'Siège-lit MasterClass Plus', en: 'MasterClass Plus lie-flat seat' },
    ratio: '3 / 2',
    tone: 'yde',
  },
  'fleet-double-deck': {
    src: '/images/hero-road.svg',
    alt: { fr: 'Bus double-étage MEN TRAVEL sur la route', en: 'MEN TRAVEL double-decker on the road' },
    ratio: '16 / 9',
    tone: 'night',
  },
  'seats-leather': {
    src: '/images/class-masterclass-s.svg',
    alt: { fr: 'Sièges inclinables', en: 'Reclining seats' },
    ratio: '4 / 3',
    tone: 'dla',
  },
  entertainment: {
    src: null,
    alt: { fr: 'Divertissement à bord', en: 'On-board entertainment' },
    ratio: '4 / 3',
    tone: 'kri',
  },
  'usb-sockets': {
    src: null,
    alt: { fr: 'Prise USB à chaque siège', en: 'A USB socket at every seat' },
    ratio: '4 / 3',
    tone: 'yde',
  },
  'bio-safe': {
    src: null,
    alt: { fr: 'Bus certifié Bio Safe', en: 'Bio Safe certified bus' },
    ratio: '4 / 3',
    tone: 'kri',
  },
  'meal-onboard': {
    src: '/images/class-masterclass-plus.svg',
    alt: { fr: 'Repas servi à bord', en: 'Meal served on board' },
    ratio: '4 / 3',
    tone: 'dla',
  },
}
