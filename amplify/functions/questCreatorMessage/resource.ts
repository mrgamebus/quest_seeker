import { defineFunction } from '@aws-amplify/backend'

export const questCreatorMessage = defineFunction({
  name: 'quest-creator-message',
  entry: './handler.ts',
  timeoutSeconds: 60,
  resourceGroupName: 'data',
})
