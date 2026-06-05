import Stripe from 'stripe'
import { env } from '$amplify/env/stripeConnect'
import type { LambdaFunctionURLEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const stripe = new Stripe(env.STRIPE_SECRET_KEY!)
const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false },
})

const PROFILE_TABLE = process.env.PROFILE_TABLE_NAME!

type ConnectRequestBody = {
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

  let parsed: ConnectRequestBody
  try {
    parsed = JSON.parse(body) as ConnectRequestBody
  } catch {
    return { statusCode: 400, body: 'Invalid request body' }
  }

  const { profileId, email } = parsed

  if (!profileId || !email) {
    return { statusCode: 400, body: 'Missing profileId or email' }
  }

  try {
    // 1. Create the Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      metadata: { profileId },
      capabilities: {
        transfers: { requested: true },
      },
    })

    // 2. Save stripeAccountId to profile
    const now = new Date().toISOString()
    await ddb.send(
      new UpdateCommand({
        TableName: PROFILE_TABLE,
        Key: { id: profileId },
        UpdateExpression: 'SET stripeAccountId = :accountId, updatedAt = :now',
        ExpressionAttributeValues: {
          ':accountId': account.id,
          ':now': now,
        },
      }),
    )

    // 3. Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/user/account?connect=refresh`,
      return_url: `${appUrl}/user/account?connect=success`,
      type: 'account_onboarding',
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ url: accountLink.url }),
    }
  } catch (err) {
    console.error('Stripe Connect error:', err)
    return { statusCode: 500, body: 'Failed to create Connect account' }
  }
}
