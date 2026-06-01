import { defineFunction } from '@aws-amplify/backend'

export const nfcAward = defineFunction({
  name: 'nfcAward',
  entry: './handler.ts',
})
