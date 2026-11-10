// Preference de theme: auto (systeme), clair ou nuit. Stockee dans un cookie pour le rendu serveur.
export type ThemePref = 'auto' | 'light' | 'night'

export function useThemePref() {
  const pref = useCookie<ThemePref>('mt_theme', {
    default: () => 'auto',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  const prefersDark = usePreferredDark()

  const dataTheme = computed(() => {
    if (pref.value === 'light') return 'mentravel'
    if (pref.value === 'night') return 'mentravel-night'
    return undefined
  })

  const isNight = computed(() => (pref.value === 'auto' ? prefersDark.value : pref.value === 'night'))

  function toggle() {
    pref.value = isNight.value ? 'light' : 'night'
  }

  return { pref, dataTheme, isNight, toggle }
}
