import { defineFunction } from '@aws-amplify/backend'

export const approveCreator = defineFunction({
  name: 'approveCreator',
  resourceGroupName: 'data',
})
