import { defineFunction, secret } from '@aws-amplify/backend'

export const createStripeSession = defineFunction({
  name: 'createStripeSession',
  entry: './handler.ts',
  resourceGroupName: 'data',
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
  },
})
