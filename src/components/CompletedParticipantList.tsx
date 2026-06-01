import { useMemo, useState } from 'react'
import { Profile, Task, Quest } from '@/types'
import { getUrl } from 'aws-amplify/storage'
// import { ensureArray } from '@/tools/ensureArray'
import ParticipantCard from './CompletedParticipantList/ParticipantCard'

interface MinimalQuestParticipant {
  profileId: string
  tasks?: Task[]
  // status?: any
  joinedAt?: string | null
  updatedAt?: string | null
}

interface CompletedParticipantsListProps {
  quest: Quest
  completedParticipants: Profile[]
  questParticipants?: MinimalQuestParticipant[]
  tasks: Task[]
}

export default function CompletedParticipantsList({
  quest,
  completedParticipants,
  questParticipants,
  tasks,
}: CompletedParticipantsListProps) {
  const [pdfTasksByParticipant, setPdfTasksByParticipant] = useState<
    Record<string, Task[]>
  >({})
  const [pdfLoadingById, setPdfLoadingById] = useState<Record<string, boolean>>(
    {},
  )

  const getCompletionDuration = (
    participantQuest?: MinimalQuestParticipant,
  ) => {
    if (!participantQuest) return Number.POSITIVE_INFINITY
    const joinedAt = participantQuest.joinedAt
    const updatedAt = participantQuest.updatedAt
    if (!joinedAt || !updatedAt) return Number.POSITIVE_INFINITY

    const joinedTime = new Date(joinedAt).getTime()
    const updatedTime = new Date(updatedAt).getTime()
    if (Number.isNaN(joinedTime) || Number.isNaN(updatedTime)) {
      return Number.POSITIVE_INFINITY
    }

    return Math.max(0, updatedTime - joinedTime)
  }

  const sortedCompletedParticipants = useMemo(() => {
    return [...completedParticipants].sort((a, b) => {
      const aQuest = questParticipants?.find((uq) => uq.profileId === a.id)
      const bQuest = questParticipants?.find((uq) => uq.profileId === b.id)

      const aDuration = getCompletionDuration(aQuest)
      const bDuration = getCompletionDuration(bQuest)

      if (aDuration !== bDuration) {
        return aDuration - bDuration
      }

      return a.full_name.localeCompare(b.full_name)
    })
  }, [completedParticipants, questParticipants])

  // This is the key logic that was lost in the refactor
  const handlePreparePdf = async (participantId: string) => {
    setPdfLoadingById((prev) => ({ ...prev, [participantId]: true }))

    try {
      const participantQuest = questParticipants?.find(
        (uq) => uq.profileId === participantId,
      )

      if (!participantQuest) {
        console.error('No quest entry found for participant:', participantId)
        setPdfLoadingById((prev) => ({ ...prev, [participantId]: false }))
        return
      }

      // Parse participant tasks - handles all formats from GraphQL
      const participantTasks = Array.isArray(participantQuest.tasks)
        ? participantQuest.tasks
        : (() => {
            try {
              return typeof participantQuest.tasks === 'string'
                ? JSON.parse(participantQuest.tasks)
                : []
            } catch {
              return []
            }
          })()

      // Merge quest tasks with participant answers
      const tasksWithAnswers: Task[] = tasks.map((task) => {
        const existingAnswer = participantTasks.find(
          (t: { id: string }) => t.id === task.id,
        )

        return {
          ...task,
          caption: existingAnswer?.caption || '',
          answer: existingAnswer?.answer || '',
          location: existingAnswer?.location || '',
        }
      })

      // Resolve any image URLs from S3
      const resolvedTasks = await Promise.all(
        tasksWithAnswers.map(async (task) => {
          if (!task.isImage || !task.answer) return task

          try {
            const { url } = await getUrl({
              path: task.answer,
            })
            return {
              ...task,
              answer: url.toString(),
            }
          } catch (err) {
            console.error('Failed to resolve image URL for task:', task.id, err)
            return task
          }
        }),
      )

      setPdfTasksByParticipant((prev) => ({
        ...prev,
        [participantId]: resolvedTasks,
      }))
    } catch (err) {
      console.error('Failed to prepare PDF tasks:', err)
    } finally {
      setPdfLoadingById((prev) => ({ ...prev, [participantId]: false }))
    }
  }

  if (completedParticipants.length === 0) {
    return (
      <div className="lg:w-[450px] w-full bg-white/70 p-4 rounded-xl shadow">
        <h3 className="text-lg font-bold mb-3">
          Participants Who Completed This Quest
        </h3>
        <p className="text-gray-500">
          No participants completed all tasks for this quest.
        </p>
      </div>
    )
  }

  return (
    <div className="lg:w-[450px] w-full bg-white/70 p-4 rounded-xl shadow">
      <h3 className="text-lg font-bold mb-3">
        Participants Who Completed This Quest (Fastest finishers first)
      </h3>

      <div className="flex flex-col gap-3 mb-4 max-h-72 overflow-y-auto pr-1">
        {sortedCompletedParticipants.map((profile) => {
          if (!profile?.id) return null

          const isLoading = pdfLoadingById[profile.id]
          const preparedTasks = pdfTasksByParticipant[profile.id]

          return (
            <ParticipantCard
              key={profile.id}
              profile={profile}
              quest={quest}
              preparedTasks={preparedTasks}
              isLoading={isLoading}
              onPreparePdf={() => handlePreparePdf(profile.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
