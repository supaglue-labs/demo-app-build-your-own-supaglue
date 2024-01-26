import {inngest} from './client'
import * as routines from '../routines'

export const scheduleSyncs = inngest.createFunction(
  {id: 'schedule-syncs'},
  {cron: '* * * * *'},
  routines.scheduleSyncs,
)

export const syncConnection = inngest.createFunction(
  {id: 'sync-connection'},
  {event: 'connection/sync'},
  routines.syncConnection,
)
