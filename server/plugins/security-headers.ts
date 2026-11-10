// Les reponses de l'API (billets, verification, paiement) ne doivent jamais etre mises en cache.
// Applique juste avant l'envoi pour passer apres les en-tetes ajoutes par d'autres modules.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    if (getRequestURL(event).pathname.startsWith('/api/')) {
      setResponseHeader(event, 'Cache-Control', 'no-store')
    }
  })
})
