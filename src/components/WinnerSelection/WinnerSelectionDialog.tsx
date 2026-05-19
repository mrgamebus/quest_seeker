import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from '@radix-ui/react-dialog'
import RemoteImage from '../RemoteImage'
import ParticipantSelectionList from './ParticipantSelectionList'
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

interface WinnerSelectionDialogProps {
  prize: Prize
  completedParticipants: Profile[]
  winners: Winner[]
  onSelectWinner: (profile: Profile) => void
  onRandomPick: () => void
  isUpdating: boolean
}

export default function WinnerSelectionDialog({
  prize,
  completedParticipants,
  winners,
  onSelectWinner,
  onRandomPick,
  isUpdating,
}: WinnerSelectionDialogProps) {
  return (
    <>
      <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
      <DialogContent className="fixed top-1/2 left-1/2 z-50 max-h-[80vh] w-full max-w-md bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
        <DialogTitle className="text-lg font-bold mb-4">
          Select Winner for {prize.name}
        </DialogTitle>

        {/* Prize Details */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <RemoteImage
            path={prize.image || placeHold}
            fallback={placeHold}
            className="w-16 h-16 object-contain rounded"
          />
          <div>
            <p className="font-semibold">{prize.name}</p>
          </div>
        </div>

        {/* Random Selection Button */}
        <button
          onClick={onRandomPick}
          disabled={isUpdating}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg shadow mb-4 disabled:opacity-50 transition-colors"
        >
          {isUpdating ? 'Selecting...' : '🎲 Pick Random Winner'}
        </button>

        {/* Manual Selection List */}
        <div className="border-t pt-4">
          <p className="text-sm font-semibold mb-2">Or select manually:</p>
          <ParticipantSelectionList
            participants={completedParticipants}
            winners={winners}
            onSelectParticipant={onSelectWinner}
            isUpdating={isUpdating}
          />
        </div>

        <DialogClose asChild>
          <button className="mt-4 w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded transition-colors">
            Close
          </button>
        </DialogClose>
      </DialogContent>
    </>
  )
}
