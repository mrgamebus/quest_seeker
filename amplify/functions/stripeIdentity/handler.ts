import Stripe from 'stripe'
import type { LambdaFunctionURLEvent } from 'aws-lambda'
// NOTE: Some build environments may not provide the generated
// '$amplify/env/stripeIdentity' module. Fall back to process.env.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(STRIPE_SECRET_KEY)

type VerificationRequestBody = {
  profileId: string
  email: string
}

export const handler = async (event: LambdaFunctionURLEvent) => {
  const appUrl = process.env.APP_URL
  if (!appUrl) {
    console.error('APP_URL environment variable is not set')
    return { statusCode: 500, body: 'Server misconfiguration' }
  }
  const body = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString()
    : event.body || ''

  let parsed: VerificationRequestBody

  try {
    parsed = JSON.parse(body) as VerificationRequestBody
  } catch {
    return { statusCode: 400, body: 'Invalid request body' }
  }
  const { profileId, email } = parsed

  try {
    const verificationSession =
      await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: { profileId },
        provided_details: { email },
        options: {
          document: { require_live_capture: true },
        },
        return_url: `${appUrl}/user/account?verified=true`,
      })

    return {
      statusCode: 200,
      body: JSON.stringify({ url: verificationSession.url }),
    }
  } catch (err) {
    console.error('Stripe Identity error:', err)
    return { statusCode: 500, body: 'Failed to create verification session' }
  }
}
