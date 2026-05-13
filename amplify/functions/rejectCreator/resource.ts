import { defineFunction } from '@aws-amplify/backend'

export const rejectCreator = defineFunction({
  name: 'rejectCreator',
  resourceGroupName: 'data',
})
