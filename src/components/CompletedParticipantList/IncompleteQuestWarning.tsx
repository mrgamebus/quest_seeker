interface IncompleteQuestWarningProps {
  completedTasks: number
  totalTasks: number
}

export default function IncompleteQuestWarning({
  completedTasks,
  totalTasks,
}: IncompleteQuestWarningProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
      <p className="text-sm font-semibold text-yellow-800 mb-1">
        ⚠️ Quest Incomplete
      </p>
      <p className="text-sm text-yellow-700">
        You completed {completedTasks} out of {totalTasks} tasks.
      </p>
    </div>
  )
}
