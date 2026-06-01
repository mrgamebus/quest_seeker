import { defineFunction } from '@aws-amplify/backend'

export const updateSeekerRank = defineFunction({
  name: 'updateSeekerRank',
  entry: './handler.ts',
})
