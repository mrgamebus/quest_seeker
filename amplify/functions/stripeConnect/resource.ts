import { defineFunction, secret } from '@aws-amplify/backend'

export const stripeConnect = defineFunction({
  name: 'stripeConnect',
  entry: './handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 30,
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
    APP_URL: secret('APP_URL'),
  },
})
