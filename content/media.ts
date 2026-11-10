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
  'fleet-double-deck': {
    src: null,
    alt: { fr: 'Bus double-étage MEN TRAVEL sur la route', en: 'MEN TRAVEL double-decker on the road' },
    ratio: '16 / 9',
    tone: 'night',
  },
  'seats-leather': {
    src: null,
    alt: { fr: 'Sièges inclinables en cuir', en: 'Leather reclining seats' },
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
    src: null,
    alt: { fr: 'Repas servi à bord', en: 'Meal served on board' },
    ratio: '4 / 3',
    tone: 'dla',
  },
}
