import { Quest, Profile, Task } from '@/types'
import { ensureArray } from '@/tools/ensureArray'
import OrganizationLink from './QuestBasicInfo/OrganizationLink'
import ParticipantCount from './QuestBasicInfo/ParticipantCount'
import FundraisingInfo from './QuestBasicInfo/FundaraisingInfo'

interface QuestBasicInfoProps {
  quest: Quest
  organizationName?: string | null
  organizationDescription?: string | null
  imageThumbnail?: string | null
  isExpired: boolean
  formatDateTime: (iso?: string | null) => string
  participantIds: string[]
  participantProfiles: Profile[]
  onOpenParticipants: () => void
  tasks?: Task[]
}

export default function QuestBasicInfo({
  quest,
  organizationName,
  organizationDescription,
  imageThumbnail,
  isExpired,
  formatDateTime,
  participantIds,
  participantProfiles,
  onOpenParticipants,
  tasks,
}: QuestBasicInfoProps) {
  const taskCount = tasks ? ensureArray(tasks).length : 0
  const entryFee = quest.quest_entry || 0

  return (
    <div className="space-y-2">
      {/* Quest Description */}
      <p className="text-gray-700 mb-2">{quest.quest_details}</p>

      {/* Region */}
      <p className="text-sm text-gray-500">
        Region: <strong>{quest.region}</strong>
      </p>

      {/* Organization */}
      <OrganizationLink
        organizationName={organizationName}
        organizationDescription={organizationDescription}
        imageThumbnail={imageThumbnail}
      />

      {/* Dates - Show different info based on expired status */}
      {isExpired ? (
        <p className="text-sm text-gray-500">
          Ended on: <strong>{formatDateTime(quest.quest_end_at)}</strong>
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Start: <strong>{formatDateTime(quest.quest_start_at)}</strong>
          </p>
          <p className="text-sm text-gray-500">
            End: <strong>{formatDateTime(quest.quest_end_at)}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Number of tasks in this quest: <strong>{taskCount}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Entry: <strong>${entryFee}</strong>
          </p>

          {/* Fundraising Info */}
          {entryFee > 0 && participantIds.length > 0 && (
            <FundraisingInfo
              entryFee={entryFee}
              participantCount={participantIds.length}
            />
          )}
        </>
      )}

      {/* Participant Count */}
      <ParticipantCount
        participantIds={participantIds}
        participantProfiles={participantProfiles}
        onOpenParticipants={onOpenParticipants}
        isExpired={isExpired}
      />
    </div>
  )
}
