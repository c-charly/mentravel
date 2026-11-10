import { seedDemoBookings } from '../services/demo'
import { hookShutdown } from '../utils/store'

export default defineNitroPlugin(() => {
  seedDemoBookings()
  hookShutdown()
})
