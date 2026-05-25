import CompletedParticipantsList from './CompletedParticipantList'
import SeekerQuestSummary from './SeekerQuestSummary'
import {
  Profile,
  Task,
  Quest,
  UserQuest,
  MinimalQuestParticipant,
} from '@/types'

interface ExpiredQuestSidebarProps {
  isOwner: boolean
  quest: Quest
  currentUserProfile?: Profile
  completedParticipants: Profile[]
  questParticipants?: MinimalQuestParticipant[]
  tasks: Task[]
  seekerTasks: Task[]
  joinedQuestEntry?: UserQuest
  completedTasks: number
  totalTasks: number
  isReady: boolean
  onPreparePdf: (participantId?: string) => Promise<Task[]>
  onTasksUpdated: () => Promise<void>
}

export default function ExpiredQuestSidebar({
  isOwner,
  quest,
  currentUserProfile,
  completedParticipants,
  questParticipants,
  tasks,
  seekerTasks,
  isReady,
  completedTasks,
  totalTasks,
  onPreparePdf,
  // onTasksUpdated,
}: ExpiredQuestSidebarProps) {
  if (isOwner) {
    return (
      <>
        <CompletedParticipantsList
          quest={quest}
          completedParticipants={completedParticipants}
          questParticipants={questParticipants}
          tasks={tasks}
          // onPreparePdf={() => onPreparePdf()}
          isReady={isReady}
        />
      </>
    )
  }

  // Seeker view
  return currentUserProfile ? (
    <SeekerQuestSummary
      quest={quest}
      currentUserProfile={currentUserProfile}
      completedTasks={completedTasks}
      totalTasks={totalTasks}
      seekerTasks={seekerTasks}
      isReady={isReady}
      onPreparePdf={() => onPreparePdf()}
    />
  ) : null
}
