import { Task } from '@/types'
import { MapPin, Camera, FileText } from 'lucide-react'

interface TaskPreviewCardProps {
  task: Task
  index: number
}

export default function TaskPreviewCard({ task, index }: TaskPreviewCardProps) {
  const getTaskIcon = () => {
    if (task.isLocation) return <MapPin className="w-4 h-4" />
    if (task.isImage) return <Camera className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const getTaskType = () => {
    const types = []
    if (task.isLocation) types.push('Location')
    if (task.isImage) types.push('Photo')
    if (!task.isLocation && !task.isImage) types.push('Text')
    return types.join(' + ')
  }

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-yellow-400 transition-colors">
      <div className="flex items-start gap-3">
        {/* Task number badge */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
          <span className="text-sm font-bold text-yellow-700">{index + 1}</span>
        </div>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          {/* <h4 className="font-semibold text-sm text-gray-800 mb-1">
            {task.name || `Task ${index + 1}`}
          </h4> */}

          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {task.description || 'Complete this task to earn points'}
          </p>

          {/* Task type badge */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {getTaskIcon()}
            <span>{getTaskType()}</span>
          </div>
        </div>

        {/* Lock icon */}
        <div className="flex-shrink-0 text-gray-300">
          <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <span className="text-xs">🔒</span>
          </div>
        </div>
      </div>
    </div>
  )
}
