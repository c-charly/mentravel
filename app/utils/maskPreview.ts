// Apercu "masque" cote client dans le billet en cours: premiere lettre puis des points.
export function maskDisplay(value: string): string {
  const v = value.trim()
  if (!v) return ''
  return `${v.charAt(0).toUpperCase()}******`
}
