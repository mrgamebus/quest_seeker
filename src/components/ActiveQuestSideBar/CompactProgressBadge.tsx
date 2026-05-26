interface CompactProgressBadgeProps {
  completedTasks: number
  totalTasks: number
}

export default function CompactProgressBadge({
  completedTasks,
  totalTasks,
}: CompactProgressBadgeProps) {
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const isComplete = completedTasks === totalTasks && totalTasks > 0

  return (
    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 rounded-full border border-blue-200">
      <div className="relative w-10 h-10">
        <svg className="transform -rotate-90 w-10 h-10">
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 16}`}
            strokeDashoffset={`${2 * Math.PI * 16 * (1 - progressPercent / 100)}`}
            className={isComplete ? 'text-green-500' : 'text-blue-500'}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
          {progressPercent}%
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-700">
          {completedTasks}/{totalTasks}
        </span>
        <span className="text-xs text-gray-500">tasks done</span>
      </div>
    </div>
  )
}
