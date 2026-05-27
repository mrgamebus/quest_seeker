import { defineFunction, secret } from '@aws-amplify/backend'

export const stripeIdentity = defineFunction({
  name: 'stripeIdentity',
  entry: './handler.ts',
  resourceGroupName: 'data',
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: secret('STRIPE_WEBHOOK_SECRET'),
    APP_URL: 'http://localhost:5173',
  },
})
