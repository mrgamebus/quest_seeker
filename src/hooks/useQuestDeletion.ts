import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteS3Object } from '@/tools/deleteS3Object'
import { useDeleteQuest } from '@/hooks/userQuests'
import { Quest } from '@/types'
import { generateClient as generateDataClient } from 'aws-amplify/data'
import { Schema } from 'amplify/data/resource'

const dataClient = generateDataClient<Schema>()

interface UseDeleteQuestOptions {
  onSuccess?: () => void
  onError?: (err: unknown) => void
}

export function useQuestDeletion(options?: UseDeleteQuestOptions) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const deleteQuestMutation = useDeleteQuest()

  const deleteQuest = async (quest: Quest, opts?: { stayHere?: boolean }) => {
    if (!quest) return
    if (!window.confirm('Are you sure you want to delete this quest?')) return

    setLoading(true)
    try {
      // 1. Delete quest images
      if (quest.quest_image) {
        await deleteS3Object(quest.quest_image)
      }
      if (quest.quest_image_thumb) {
        await deleteS3Object(quest.quest_image_thumb)
      }

      // 2. Delete sponsor images
      const sponsors = Array.isArray(quest.quest_sponsor)
        ? quest.quest_sponsor
        : JSON.parse(quest.quest_sponsor || '[]')
      for (const sponsor of sponsors) {
        if (sponsor.image) {
          await deleteS3Object(sponsor.image)
        }
      }

      // 3. Delete prize images
      const prizes = Array.isArray(quest.quest_prize_info)
        ? quest.quest_prize_info
        : JSON.parse(quest.quest_prize_info || '[]')
      for (const prize of prizes) {
        if (prize.image) {
          await deleteS3Object(prize.image)
        }
      }

      // 4. Delete all UserQuests for this quest and their task images
      await deleteUserQuestsAndTaskImages(quest.id)

      // 5. Delete quest record
      await deleteQuestMutation.mutateAsync(quest.id)

      window.alert('Quest and associated images deleted successfully!')
      options?.onSuccess?.()

      if (!opts?.stayHere) {
        navigate(-1)
      }
    } catch (err) {
      console.error('Failed to delete quest:', err)
      window.alert('Failed to delete quest.')
      options?.onError?.(err)
    } finally {
      setLoading(false)
    }
  }

  return { deleteQuest, loading }
}

// Helper function to delete UserQuests and their task images
async function deleteUserQuestsAndTaskImages(questId: string) {
  try {
    // Fetch all UserQuests for this quest
    const { data, errors } = await dataClient.models.UserQuest.list({
      filter: { questId: { eq: questId } },
    })

    if (errors?.length) {
      throw new Error(errors[0].message)
    }

    const userQuests = data ?? []

    // Process each UserQuest
    for (const userQuest of userQuests) {
      // Delete task images from S3
      if (userQuest.tasks) {
        let tasks
        try {
          tasks =
            typeof userQuest.tasks === 'string'
              ? JSON.parse(userQuest.tasks)
              : userQuest.tasks
        } catch (err) {
          console.error(
            'Failed to parse tasks for UserQuest:',
            userQuest.id,
            err,
          )
          tasks = []
        }

        for (const task of tasks) {
          const taskData = task.M || task

          const isImage = taskData.isImage?.BOOL ?? taskData.isImage
          const answer = taskData.answer?.S ?? taskData.answer

          // Delete image if this is an image task with an answer
          if (isImage && answer) {
            await deleteS3Object(answer)
          }
        }
      }

      // Delete the UserQuest record
      const { errors: deleteErrors } = await dataClient.models.UserQuest.delete(
        {
          id: userQuest.id,
        },
      )

      if (deleteErrors?.length) {
        console.error('Error deleting UserQuest:', deleteErrors)
      }
    }
  } catch (err) {
    console.error('Failed to delete UserQuests:', err)
  }
}
