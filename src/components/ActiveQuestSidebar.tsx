import TaskInformationWindow from './TaskInformationWindow'
import TaskPreview from './TaskPreview'
import QuestProgressBar from './ActiveQuestSideBar/QuestProgressBar'
import { Task, UserQuest } from '@/types'

interface ActiveQuestSidebarProps {
  isOwner: boolean
  hasJoined: boolean
  questId: string
  tasks: Task[]
  joinedQuestEntry?: UserQuest
  completedTasks?: number
  totalTasks?: number
  onTasksUpdated: () => Promise<void>
}

export default function ActiveQuestSidebar({
  isOwner,
  hasJoined,
  questId,
  tasks,
  joinedQuestEntry,
  completedTasks = 0,
  totalTasks = 0,
  onTasksUpdated,
}: ActiveQuestSidebarProps) {
  if (isOwner || hasJoined) {
    return (
      <div className="lg:w-[450px] w-full bg-white/80 p-4 rounded-xl shadow flex flex-col gap-4">
        {/* Progress Bar (joined seekers only) */}
        {hasJoined && !isOwner && (
          <QuestProgressBar
            completedTasks={completedTasks}
            totalTasks={totalTasks}
          />
        )}

        {/* Task Window */}
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

  return <TaskPreview tasks={tasks} />
}
