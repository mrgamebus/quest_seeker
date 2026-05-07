import { defineFunction } from '@aws-amplify/backend'

export const support = defineFunction({
  name: 'support',
  environment: {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'webdev@maorilandinfo.co.nz',
  },
})
