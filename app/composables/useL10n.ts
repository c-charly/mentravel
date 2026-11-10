// Aides de localisation: textes bilingues du contenu, formats, noms de villes.
import { CITIES } from '~~/content/network'
import {
  formatDateLong,
  formatDateShort,
  formatDuration,
  formatFcfa,
  formatMonthYear,
  formatNumber,
  formatWeekdayShort,
} from '#shared/format'
import type { CityId, Localized } from '#shared/types'

export function useL10n() {
  const { locale } = useI18n()
  const lang = computed(() => (locale.value === 'en' ? 'en' : 'fr'))

  return {
    lang,
    loc: (value: Localized) => value[lang.value],
    city: (id: CityId) => CITIES[id].name,
    fcfa: (n: number) => formatFcfa(n, lang.value),
    num: (n: number) => formatNumber(n, lang.value),
    dateLong: (d: string) => formatDateLong(d, lang.value),
    dateShort: (d: string) => formatDateShort(d, lang.value),
    monthYear: (d: string) => formatMonthYear(d, lang.value),
    weekday: (d: string) => formatWeekdayShort(d, lang.value),
    duration: formatDuration,
  }
}
