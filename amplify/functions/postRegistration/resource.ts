import { defineFunction } from '@aws-amplify/backend'

export const postRegistration = defineFunction({
  name: 'postRegistration',
  entry: './handler.ts',
  resourceGroupName: 'auth',
})
