import { Task } from '@/types'
import TaskPreviewCard from './ActiveQuestSideBar/TaskPreviewCard'

interface TaskPreviewProps {
  tasks: Task[]
}

export default function TaskPreview({ tasks }: TaskPreviewProps) {
  if (tasks.length === 0) {
    return (
      <div className="lg:w-[450px] w-full bg-white/80 p-4 rounded-xl shadow">
        <h3 className="text-lg font-bold mb-3">Quest Tasks</h3>
        <p className="text-gray-500">No tasks available for this quest.</p>
      </div>
    )
  }

  return (
    <div className="lg:w-[450px] w-full bg-white/80 p-4 rounded-xl shadow">
      <div className="mb-4">
        <h3 className="text-lg font-bold">Quest Tasks Preview</h3>
        <p className="text-sm text-gray-600">
          Join this quest to start completing tasks!
        </p>
      </div>

      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
        {tasks.map((task, index) => (
          <TaskPreviewCard key={task.id} task={task} index={index} />
        ))}
      </div>
    </div>
  )
}
