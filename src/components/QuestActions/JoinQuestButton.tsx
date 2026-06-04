interface JoinQuestButtonProps {
  hasJoined: boolean
  joining: boolean
  entryFee?: number | null
  isParticipationFull: boolean
  participantLimit: number | null
  currentParticipants: number
  onJoin: () => void
}

export default function JoinQuestButton({
  hasJoined,
  joining,
  entryFee = 0,
  isParticipationFull,
  participantLimit,
  currentParticipants,
  onJoin,
}: JoinQuestButtonProps) {
  if (isParticipationFull) {
    return (
      <p className="text-sm text-red-500">
        Quest full ({participantLimit?.toLocaleString()} participant limit
        reached)
      </p>
    )
  }
  if (hasJoined) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-300 rounded-lg">
        <span className="text-green-600 font-semibold text-sm">✅ Joined!</span>
      </div>
    )
  }

  const fee = entryFee || 0
  const isFreeQuest = fee === 0

  const isAlmostFull =
    participantLimit !== null && currentParticipants / participantLimit >= 0.75

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={onJoin}
        disabled={joining}
        className={`px-4 py-2 rounded text-white text-sm font-medium transition-colors ${
          joining
            ? 'bg-yellow-300 cursor-not-allowed'
            : 'bg-[#facc15] hover:bg-[#ca8a04]'
        }`}
      >
        {joining ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Joining...
          </span>
        ) : (
          <>{isFreeQuest ? '🎉 Join Free Quest!' : `💳 Join for $${fee}`}</>
        )}
      </button>

      {isAlmostFull && (
        <span className="text-sm text-orange-500 font-medium">
          🔥 Not many spaces left!
        </span>
      )}
    </div>
  )
}
