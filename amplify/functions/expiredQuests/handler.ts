import type { Handler } from 'aws-lambda'
import type { Schema } from '../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/expiredQuests'
import {
  sendQuestExpiredEmail,
  sendSeekerQuestExpiredEmail,
} from '../shared/sendEmail'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)
Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

export const handler: Handler = async () => {
  const now = new Date().toISOString()

  const { data: quests } = await client.models.Quest.list({
    filter: {
      quest_end_at: { lt: now },
      status: { ne: 'expired' },
    },
  })

  for (const quest of quests) {
    await client.models.Quest.update({
      id: quest.id,
      status: 'expired',
    })

    // ✅ Notify creator that quest has expired
    if (quest.creator_id) {
      try {
        await sendQuestExpiredEmail(
          quest.creator_id,
          quest.quest_name ?? 'your quest',
          quest.id,
        )
      } catch (err) {
        console.error(
          `Failed to send expired email to creator for quest ${quest.id}:`,
          err,
        )
      }
    }

    // ✅ Notify all participants (seekers) that the quest has expired
    try {
      const { data: userQuests } = await client.models.UserQuest.list({
        filter: {
          questId: { eq: quest.id },
        },
      })

      if (userQuests && userQuests.length > 0) {
        // Send emails to all participants
        await Promise.allSettled(
          userQuests.map((userQuest) =>
            sendSeekerQuestExpiredEmail(
              userQuest.profileId,
              quest.quest_name ?? 'a quest',
              quest.id,
            ),
          ),
        )

        console.log(
          `Sent ${userQuests.length} seeker notification(s) for quest ${quest.id}`,
        )
      }
    } catch (err) {
      console.error(
        `Failed to send seeker notifications for quest ${quest.id}:`,
        err,
      )
    }
  }

  return { updated: quests.length }
}
