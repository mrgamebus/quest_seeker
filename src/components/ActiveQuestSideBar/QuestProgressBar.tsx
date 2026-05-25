interface QuestProgressBarProps {
  completedTasks: number
  totalTasks: number
}

export default function QuestProgressBar({
  completedTasks,
  totalTasks,
}: QuestProgressBarProps) {
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const getProgressColor = () => {
    if (progressPercent === 100) return 'bg-green-500'
    if (progressPercent >= 50) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const getProgressText = () => {
    if (progressPercent === 100) return 'All Tasks Complete! 🎉'
    if (progressPercent >= 75) return 'Almost there!'
    if (progressPercent >= 50) return 'Halfway done!'
    if (progressPercent >= 25) return 'Making progress!'
    return 'Just getting started'
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700">
          Quest Progress
        </span>
        <span className="text-sm text-gray-600">
          {completedTasks} / {totalTasks} tasks
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 ${getProgressColor()} transition-all duration-300 ease-out`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-gray-500">{getProgressText()}</p>
        <p className="text-xs text-gray-600 font-medium">{progressPercent}%</p>
      </div>
    </div>
  )
}
