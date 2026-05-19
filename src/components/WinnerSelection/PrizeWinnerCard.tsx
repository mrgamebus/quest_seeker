import { Dialog, DialogTrigger } from '@radix-ui/react-dialog'
import RemoteImage from '../RemoteImage'
import WinnerSelectionDialog from './WinnerSelectionDialog'
import { Prize, Profile } from '@/types'
import placeHold from '@/assets/images/placeholder_view_vector.svg'

interface Winner {
  place: number
  prize_id: string
  user_id: string
  username: string
  email: string
  phone: string
  selected_at: string
}

interface PrizeWinnerCardProps {
  prize: Prize
  place: number
  winner?: Winner
  winnerProfile?: Profile | null
  completedParticipants: Profile[]
  winners: Winner[]
  onSelectWinner: (profile: Profile) => void
  onRandomPick: () => void
  isUpdating: boolean
}

export default function PrizeWinnerCard({
  prize,
  place,
  winner,
  winnerProfile,
  completedParticipants,
  winners,
  onSelectWinner,
  onRandomPick,
  isUpdating,
}: PrizeWinnerCardProps) {
  const getMedal = (position: number) => {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    return '🥉'
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
            winner
              ? 'bg-green-50 border-green-400 hover:bg-green-100'
              : 'bg-white border-gray-300 hover:border-yellow-400 hover:bg-yellow-50'
          }`}
        >
          <RemoteImage
            path={prize.image || placeHold}
            fallback={placeHold}
            className="w-12 h-12 object-contain rounded shrink-0"
          />

          <div className="flex-1 text-left">
            <p className="font-semibold text-sm">{prize.name}</p>

            {winner ? (
              <div>
                <p className="text-xs text-green-700 font-medium">
                  🎉 Winner: {winner.username}
                </p>

                {winnerProfile?.email && (
                  <p className="text-xs text-gray-600 mt-1">
                    📧 {winnerProfile.email}
                  </p>
                )}

                {winnerProfile?.phone && (
                  <p className="text-xs text-gray-600">
                    📱 {winnerProfile.phone}
                  </p>
                )}

                {!winnerProfile && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loading contact info...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Click to select winner</p>
            )}
          </div>

          <span className="text-2xl">{getMedal(place)}</span>
        </button>
      </DialogTrigger>

      <WinnerSelectionDialog
        prize={prize}
        completedParticipants={completedParticipants}
        winners={winners}
        onSelectWinner={onSelectWinner}
        onRandomPick={onRandomPick}
        isUpdating={isUpdating}
      />
    </Dialog>
  )
}
