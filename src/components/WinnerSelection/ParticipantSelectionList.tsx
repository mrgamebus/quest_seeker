import RemoteImage from '../RemoteImage'
import { Profile } from '@/types'
import placeHold from '@/assets/images/placeholder_view_vector.svg'

interface Winner {
  user_id: string
}

interface ParticipantSelectionListProps {
  participants: Profile[]
  winners: Winner[]
  onSelectParticipant: (profile: Profile) => void
  isUpdating: boolean
}

export default function ParticipantSelectionList({
  participants,
  winners,
  onSelectParticipant,
  isUpdating,
}: ParticipantSelectionListProps) {
  if (participants.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-4">
        No participants have completed all tasks yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
      {participants.map((profile) => {
        const alreadyWon = winners.some((w) => w.user_id === profile.id)

        return (
          <button
            key={profile.id}
            onClick={() => onSelectParticipant(profile)}
            disabled={alreadyWon || isUpdating}
            className={`flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
              alreadyWon
                ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                : 'bg-white hover:bg-yellow-50 border border-gray-200 hover:border-yellow-400'
            }`}
          >
            <RemoteImage
              path={profile.image_thumbnail || placeHold}
              fallback={placeHold}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">{profile.full_name}</p>
              {alreadyWon && (
                <p className="text-xs text-gray-500">Already won a prize</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
