import type { Handler } from 'aws-lambda'
import type { Schema } from '../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { sendCreatorMessageEmail } from '../shared/sendEmail'
import { env } from '$amplify/env/quest-creator-message'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)
Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

export const handler: Handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2))

  // Parse arguments based on invocation type
  let questId: string | undefined
  let creatorMessage: string | undefined
  let creatorName: string | undefined

  // GraphQL invocation (from AppSync/Amplify mutations)
  if (event.arguments) {
    console.log('GraphQL invocation - arguments:', event.arguments)
    questId = event.arguments.questId
    creatorMessage = event.arguments.creatorMessage
    creatorName = event.arguments.creatorName
  }
  // Direct Lambda invocation with body (e.g., from API Gateway)
  else if (event.body) {
    console.log('API Gateway invocation - body:', event.body)
    const body =
      typeof event.body === 'string' ? JSON.parse(event.body) : event.body
    questId = body.questId
    creatorMessage = body.creatorMessage
    creatorName = body.creatorName
  }
  // Direct Lambda invocation with direct properties
  else if (event.questId) {
    console.log('Direct invocation - event properties')
    questId = event.questId
    creatorMessage = event.creatorMessage
    creatorName = event.creatorName
  }

  console.log('Parsed values:', { questId, creatorMessage, creatorName })

  // If specific questId is provided, only send for that quest
  if (questId && creatorMessage) {
    try {
      const { data: quest } = await client.models.Quest.get({ id: questId })

      if (!quest) {
        console.error(`Quest ${questId} not found`)
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Quest not found' }),
        }
      }

      const { data: userQuests } = await client.models.UserQuest.list({
        filter: {
          questId: { eq: questId },
        },
      })

      if (!userQuests || userQuests.length === 0) {
        console.log(`No participants found for quest ${questId}`)
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'No participants found',
            emailsSent: 0,
          }),
        }
      }

      console.log(
        `Sending emails to ${userQuests.length} participants with creatorName: ${creatorName}`,
      )

      const results = await Promise.allSettled(
        userQuests.map((userQuest) =>
          sendCreatorMessageEmail(
            userQuest.profileId,
            quest.quest_name ?? 'a quest',
            quest.id,
            creatorMessage,
            creatorName ?? quest.creator_id ?? undefined,
          ),
        ),
      )

      const successCount = results.filter(
        (r) => r.status === 'fulfilled',
      ).length
      const failureCount = results.filter((r) => r.status === 'rejected').length

      console.log(
        `✅ Sent ${successCount} emails, ${failureCount} failed for quest ${questId}`,
      )

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Creator message emails sent',
          emailsSent: successCount,
          failures: failureCount,
        }),
      }
    } catch (err) {
      console.error(`Failed to send creator message for quest ${questId}:`, err)
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to send emails',
          details: err instanceof Error ? err.message : 'Unknown error',
        }),
      }
    }
  }

  // If no specific quest, process all quests (for scheduled runs or testing)
  const { data: quests } = await client.models.Quest.list()

  for (const quest of quests) {
    // Only send if there's a creator message and quest is expired
    if (!quest.creator_message || quest.status !== 'expired') {
      continue
    }

    try {
      const { data: userQuests } = await client.models.UserQuest.list({
        filter: {
          questId: { eq: quest.id },
        },
      })

      if (userQuests && userQuests.length > 0) {
        await Promise.allSettled(
          userQuests.map((userQuest) =>
            sendCreatorMessageEmail(
              userQuest.profileId,
              quest.quest_name ?? 'a quest',
              quest.id,
              quest.creator_message!,
              quest.creator_id ?? undefined,
            ),
          ),
        )
      }
    } catch (err) {
      console.error(
        `Failed to send creator message for quest ${quest.id}:`,
        err,
      )
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Batch processing complete' }),
  }
}
