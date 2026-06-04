import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import PrizeInfoDialog from './QuestActions/PrizeInfoDialog'
import JoinQuestButton from './QuestActions/JoinQuestButton'
import DeleteQuestButton from './QuestActions/DeleteQuestButton'
import RestartQuestButton from './QuestActions/RestartQuestButton'
import { Quest, Prize } from '@/types'

interface QuestActionsProps {
  quest: Quest
  isOwner: boolean
  isAdmin?: boolean
  hasJoined: boolean
  isExpired: boolean
  prizes: Prize[]
  participantCount: number
  completedParticipantCount?: number
  creatorBusinessType?: string
  joining?: boolean
  deleting?: boolean
  onJoin: () => Promise<void>
  onDelete: (quest: Quest) => Promise<void>
  onRestart: () => Promise<void>
}

const PARTICIPANT_LIMITS: Record<string, number | null> = {
  'Not for Profit': null,
  'Charitable Trust': null,
  'Individual Business': 500,
  'Local Quest': 500,
  'National Quest': 2000,
}

export default function QuestActions({
  quest,
  isOwner,
  isAdmin = false,
  hasJoined,
  isExpired,
  prizes,
  participantCount,
  completedParticipantCount = 0,
  creatorBusinessType,
  joining = false,
  deleting = false,
  onJoin,
  onDelete,
  onRestart,
}: QuestActionsProps) {
  const navigate = useNavigate()

  const canDelete = participantCount < 1 && !isExpired
  const canRestart = isExpired && completedParticipantCount === 0

  const participantLimit = creatorBusinessType
    ? (PARTICIPANT_LIMITS[creatorBusinessType] ?? null)
    : null
  const isParticipationFull =
    participantLimit !== null && participantCount >= participantLimit

  return (
    <div className="mt-4 flex flex-col gap-3 w-full">
      {/* Bottom action row - stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        {/* Left: Delete / Restart / Join */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Owner actions */}
          {isOwner && canRestart && (
            <RestartQuestButton onRestart={onRestart} />
          )}

          {isOwner && canDelete && (
            <DeleteQuestButton
              quest={quest}
              onDelete={onDelete}
              deleting={deleting}
            />
          )}

          {/* Admin override delete */}
          {isAdmin && !isOwner && (
            <DeleteQuestButton
              quest={quest}
              onDelete={onDelete}
              deleting={deleting}
              adminOverride
            />
          )}

          {/* Seeker actions */}
          {!isOwner && (
            <JoinQuestButton
              hasJoined={hasJoined}
              joining={joining}
              entryFee={quest.quest_entry}
              isParticipationFull={isParticipationFull}
              participantLimit={participantLimit}
              currentParticipants={participantCount}
              onJoin={onJoin}
            />
          )}
        </div>

        {/* Right: Back + Prize Info */}
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Button
            onClick={() => navigate('/user/home?region=')}
            variant="yellow"
            className="flex-shrink-0 text-sm px-4 py-2"
          >
            Back to Quests
          </Button>

          {prizes.length > 0 && <PrizeInfoDialog prizes={prizes} />}
        </div>
      </div>
    </div>
  )
}
