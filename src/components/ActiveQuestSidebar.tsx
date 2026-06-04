import TaskInformationWindow from './TaskInformationWindow'
import TaskPreview from './TaskPreview'
import QuestProgressBar from './ActiveQuestSideBar/QuestProgressBar'
import { Quest, Task, UserQuest } from '@/types'

interface ActiveQuestSidebarProps {
  quest: Quest
  isOwner: boolean
  hasJoined: boolean
  questId: string
  tasks: Task[]
  formatDateTime: (iso?: string | null) => string
  joinedQuestEntry?: UserQuest
  completedTasks?: number
  totalTasks?: number
  onTasksUpdated: () => Promise<void>
}

export default function ActiveQuestSidebar({
  quest,
  isOwner,
  hasJoined,
  questId,
  tasks,
  formatDateTime,
  joinedQuestEntry,
  completedTasks = 0,
  totalTasks = 0,
  onTasksUpdated,
}: ActiveQuestSidebarProps) {
  const tasksLocked = quest.quest_start_at
    ? new Date() < new Date(quest.quest_start_at)
    : false

  if (isOwner || hasJoined) {
    return (
      <div className="lg:w-[450px] w-full bg-white/80 p-4 rounded-xl shadow flex flex-col gap-4">
        {hasJoined && !isOwner && (
          <QuestProgressBar
            completedTasks={completedTasks}
            totalTasks={totalTasks}
          />
        )}

        {/* Show a notice if the quest hasn't started yet */}
        {hasJoined && !isOwner && tasksLocked && (
          <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-center">
            🔒 Tasks unlock on {formatDateTime(quest.quest_start_at)}
          </p>
        )}

        <TaskInformationWindow
          questId={questId}
          tasks={tasks}
          userTasks={joinedQuestEntry ? [joinedQuestEntry] : []}
          readOnly={isOwner}
          onTasksUpdated={onTasksUpdated}
        />
      </div>
    )
  }

  // Not joined — show preview of first 3 tasks only
  const previewTasks = tasks.slice(0, 3)
  const hiddenCount = tasks.length - previewTasks.length

  return (
    <div>
      <TaskPreview tasks={previewTasks} />
      {hiddenCount > 0 && (
        <p className="text-sm text-gray-500 text-center mt-2">
          +{hiddenCount} more task{hiddenCount > 1 ? 's' : ''} — join the quest
          to see all
        </p>
      )}
    </div>
  )
}
