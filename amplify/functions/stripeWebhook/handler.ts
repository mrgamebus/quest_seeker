import Stripe from 'stripe'
import { env } from '$amplify/env/stripeWebhook'
import type { LambdaFunctionURLEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  PutCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { sendJoinEmails, sendPublishedEmail } from '../shared/sendEmail'

const stripe = new Stripe(env.STRIPE_SECRET_KEY!)
const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false },
})

const QUEST_TABLE = process.env.QUEST_TABLE_NAME!
const USER_QUEST_TABLE = process.env.USER_QUEST_TABLE_NAME!
const PROFILE_TABLE = process.env.PROFILE_TABLE_NAME!

type QuestTask = {
  id: string
  description: string
  completed: boolean
  isImage: boolean
  isLocation: boolean
  requiresCaption: boolean
  answer: string
  caption: string
  location: string
}

export const handler = async (event: LambdaFunctionURLEvent) => {
  const body = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString()
    : event.body || ''

  const sig = event.headers['stripe-signature']
  let stripeEvent!: Stripe.Event

  try {
    if (!sig) throw new Error('Missing stripe-signature')
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('Webhook Error:', err instanceof Error ? err.message : err)
    return {
      statusCode: 400,
      body: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}`,
    }
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const { questId, profileId, type } = session.metadata ?? {}
    const now = new Date().toISOString()

    if (type !== 'quest_entry' && questId) {
      const { Item: quest } = await ddb.send(
        new GetCommand({ TableName: QUEST_TABLE, Key: { id: questId } }),
      )

      await ddb.send(
        new UpdateCommand({
          TableName: QUEST_TABLE,
          Key: { id: questId },
          UpdateExpression:
            'SET #status = :status, published_at = :now, updatedAt = :now',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': 'published', ':now': now },
          ConditionExpression: 'attribute_exists(id)',
        }),
      )

      try {
        const creatorId = quest?.creator_id
        if (creatorId) {
          await sendPublishedEmail(
            creatorId,
            quest?.quest_name ?? 'your quest',
            PROFILE_TABLE,
          )
        }
      } catch (err) {
        console.error('Failed to send published email:', err)
      }
    }

    if (type === 'quest_entry' && questId && profileId) {
      const { Item: quest } = await ddb.send(
        new GetCommand({ TableName: QUEST_TABLE, Key: { id: questId } }),
      )

      if (!quest) {
        console.error(`Quest ${questId} not found`)
        return { statusCode: 200, body: JSON.stringify({ received: true }) }
      }

      const rawTasks = (() => {
        try {
          if (!quest.quest_tasks) return []
          let parsed =
            typeof quest.quest_tasks === 'string'
              ? JSON.parse(quest.quest_tasks)
              : quest.quest_tasks
          if (typeof parsed === 'string') parsed = JSON.parse(parsed)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      })()

      const tasksForSave = JSON.stringify(
        rawTasks.map((task: QuestTask) => ({
          ...task,
          completed: false,
          answer: '',
          caption: '',
          location: '',
        })),
      )

      try {
        await ddb.send(
          new PutCommand({
            TableName: USER_QUEST_TABLE,
            Item: {
              id: randomUUID(),
              __typename: 'UserQuest',
              profileId,
              questId,
              status: 'ACTIVE',
              joinedAt: now,
              points: 0,
              tasks: tasksForSave,
              createdAt: now,
              updatedAt: now,
              owner: `${profileId}::${profileId}`,
            },
            ConditionExpression: 'attribute_not_exists(id)',
          }),
        )
      } catch (err: unknown) {
        const name = (err as { name: string }).name
        if (name === 'ConditionalCheckFailedException') {
          console.warn(`Profile ${profileId} already joined quest ${questId}`)
        } else {
          throw err
        }
      }

      await ddb.send(
        new UpdateCommand({
          TableName: PROFILE_TABLE,
          Key: { id: profileId },
          UpdateExpression:
            'SET points = if_not_exists(points, :zero) + :pts, updatedAt = :now',
          ExpressionAttributeValues: { ':pts': 10, ':zero': 0, ':now': now },
        }),
      )

      try {
        await sendJoinEmails(questId, profileId, PROFILE_TABLE, QUEST_TABLE)
      } catch (err) {
        console.error('Failed to send join emails:', err)
      }
    }
  }

  if (stripeEvent.type === 'identity.verification_session.verified') {
    const session = stripeEvent.data
      .object as Stripe.Identity.VerificationSession
    const { profileId } = session.metadata ?? {}
    const now = new Date().toISOString()

    if (!profileId) {
      console.error('Missing profileId in verification session metadata')
      return { statusCode: 200, body: JSON.stringify({ received: true }) }
    }

    await ddb.send(
      new UpdateCommand({
        TableName: PROFILE_TABLE,
        Key: { id: profileId },
        UpdateExpression: 'SET #role = :role, updatedAt = :now',
        ExpressionAttributeNames: { '#role': 'role' },
        ExpressionAttributeValues: { ':role': 'pending', ':now': now },
      }),
    )

    console.log(
      `Profile ${profileId} set to pending after identity verification`,
    )
  }

  if (stripeEvent.type === 'identity.verification_session.requires_input') {
    const session = stripeEvent.data
      .object as Stripe.Identity.VerificationSession
    const { profileId } = session.metadata ?? {}

    // Optional: log the failure reason for debugging
    console.warn(
      `Verification failed for profile ${profileId}:`,
      session.last_error?.reason,
    )
    // You could send a failure email here using your existing sendEmail helper
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
