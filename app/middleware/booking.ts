// Prepare l'etat de reservation depuis l'URL avant le rendu (serveur et client),
// pour que le layout (progression) et la page affichent la meme etape.
import { applyQuerySync, resolveStep } from '~/utils/bookingRoute'

export default defineNuxtRouteMiddleware((to) => {
  const store = useBookingStore()
  applyQuerySync(store, to.query)
  resolveStep(store, to.query)
})
