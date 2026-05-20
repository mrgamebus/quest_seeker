import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog'
import RemoteImage from '../RemoteImage'
import { Profile } from '@/types'
import placeHold from '@/assets/images/placeholder_view_vector.svg'

interface ParticipantCountProps {
  participantIds: string[]
  participantProfiles: Profile[]
  onOpenParticipants: () => void
  isExpired: boolean
}

export default function ParticipantCount({
  participantIds,
  participantProfiles,
  onOpenParticipants,
  isExpired,
}: ParticipantCountProps) {
  if (participantIds.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        {isExpired ? 'People who joined: ' : 'People joined: '}
        <strong>0</strong>
      </div>
    )
  }

  const labelText = isExpired ? 'People who joined:' : 'People joined:'

  return (
    <div className="text-sm text-gray-500">
      {labelText}{' '}
      <Dialog onOpenChange={(open) => open && onOpenParticipants()}>
        <DialogTrigger asChild>
          <button className="text-blue-600 underline font-medium hover:text-blue-800">
            {participantIds.length} participant
            {participantIds.length > 1 ? 's' : ''}
          </button>
        </DialogTrigger>

        <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
        <DialogContent className="fixed top-1/2 left-1/2 z-50 max-h-[70vh] w-full max-w-md bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
          <DialogTitle className="text-lg font-bold mb-4">
            Participants
          </DialogTitle>

          <div className="flex flex-col gap-3">
            {participantProfiles.length > 0 ? (
              participantProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center gap-3">
                  <RemoteImage
                    path={profile.image_thumbnail || placeHold}
                    fallback={placeHold}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />

                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">
                      <strong>{profile.full_name || 'Unknown'}</strong>
                    </span>
                    <span className="text-xs text-gray-600 truncate">
                      {profile.about_me || ''}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Loading...</p>
            )}
          </div>

          <DialogClose asChild>
            <button className="mt-6 w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded transition-colors">
              Close
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}
