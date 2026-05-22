import { useState } from 'react'
import { Profile, Task, Quest, MinimalQuestParticipant } from '@/types'
import ParticipantCard from './CompletedParticipantList/ParticipantCard'

interface CompletedParticipantsListProps {
  quest: Quest
  completedParticipants: Profile[]
  questParticipants?: MinimalQuestParticipant[]
  tasks: Task[]
  isReady: boolean
  onPreparePdf: (participantId?: string) => Promise<Task[]>
}

export default function CompletedParticipantsList({
  quest,
  completedParticipants,
  isReady,
  onPreparePdf,
}: CompletedParticipantsListProps) {
  const [pdfTasksByParticipant, setPdfTasksByParticipant] = useState<
    Record<string, Task[]>
  >({})
  const [pdfLoadingById, setPdfLoadingById] = useState<Record<string, boolean>>(
    {},
  )

  const handlePreparePdf = async (participantId: string) => {
    setPdfLoadingById((prev) => ({ ...prev, [participantId]: true }))

    try {
      const resolvedTasks = await onPreparePdf(participantId)
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
        Participants Who Completed This Quest
      </h3>

      {/* Scrollable participant list */}
      <div className="flex flex-col gap-3 mb-4 max-h-72 overflow-y-auto pr-1">
        {completedParticipants.map((profile) => {
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
              isReady={isReady}
              onPreparePdf={() => handlePreparePdf(profile.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
