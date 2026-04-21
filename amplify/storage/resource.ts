import { defineStorage } from '@aws-amplify/backend'

export const storage = defineStorage({
  name: 'amplifyQuestSeeker',
  access: (allow) => ({
    'public/*': [
      allow.authenticated.to(['read', 'write']),
      allow.groups(['creator']).to(['read', 'write', 'delete']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
  }),
})
