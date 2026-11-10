import { releaseHold } from '../../services/holds'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id') ?? ''
  return { released: releaseHold(id) }
})
