import { formatDistanceToNow } from 'date-fns'

interface CreatorMessageDisplayProps {
  message: string
  sentAt?: string | null
  creatorName?: string | null
}

export default function CreatorMessageDisplay({
  message,
  sentAt,
  creatorName,
}: CreatorMessageDisplayProps) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <span className="text-xl flex-shrink-0">📢</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-800">
              Message from Quest Creator
              {creatorName && (
                <span className="text-gray-600 font-normal ml-1">
                  ({creatorName})
                </span>
              )}
            </p>
            {sentAt && (
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(sentAt), { addSuffix: true })}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>
        </div>
      </div>
    </div>
  )
}
