import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
  Portal,
} from '@radix-ui/react-dialog'
import RemoteImage from '../RemoteImage'
import { Profile } from '@/types'
import placeHold from '@/assets/images/placeholder_view_vector.svg'
import SeekerRank from '../SeekerRank'

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
        <Portal>
          <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
          <DialogContent className="fixed top-1/2 left-1/2 z-50 max-w-md w-full bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[90vh]">
            <DialogTitle className="text-lg font-bold mb-4">
              Participants
            </DialogTitle>

            <div className="flex flex-col gap-3 max-h-[240px] overflow-y-auto pr-1">
              {participantProfiles.length > 0 ? (
                participantProfiles.map((profile) => (
                  <div key={profile.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 shrink-0">
                      <RemoteImage
                        path={profile.image_thumbnail || placeHold}
                        fallback={placeHold}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="flex items-center gap-1 text-sm font-medium min-w-0">
                        <strong>{profile.full_name || 'Unknown'}</strong>
                        <SeekerRank
                          profile={profile}
                          className="relative w-5 h-5 shrink-0 group z-60"
                          imgName="w-5 h-5 rounded-full border-2 border-white object-cover shadow-sm transition-transform duration-200 group-hover:scale-125"
                          rankName="absolute left-1/2 -translate-x-1/2 top-6 hidden group-hover:block bg-black/75 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap capitalize z-60"
                        />
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
        </Portal>
      </Dialog>
    </div>
  )
}
