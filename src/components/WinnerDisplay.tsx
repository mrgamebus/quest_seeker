import { Prize } from '@/types'

interface Winner {
  place: number
  prize_id: string
  user_id: string
  username: string
  selected_at: string
}

interface WinnerDisplayProps {
  winners: Winner[]
  prizes: Prize[]
}

export default function WinnerDisplay({ winners, prizes }: WinnerDisplayProps) {
  if (winners.length === 0) return null

  const getMedal = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    return '🥉'
  }

  const sortedWinners = [...winners].sort((a, b) => a.place - b.place)

  return (
    <div className="mt-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-lg p-4">
      <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
        <span className="text-xl">🏆</span>
        Quest Winners
      </h4>

      <div className="flex flex-col gap-2">
        {sortedWinners.map((winner, index) => {
          const prize = prizes.find((p) => p.id === winner.prize_id)
          const medal = getMedal(index)

          return (
            <div
              key={winner.prize_id}
              className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm"
            >
              <span className="text-2xl">{medal}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">
                  {winner.username}
                </p>
                {prize && (
                  <p className="text-xs text-gray-600">Prize: {prize.name}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
