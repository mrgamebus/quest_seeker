import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip'
import RemoteImage from './RemoteImage'
import SocialShareButton from './QuestBanner/SocialShareButton'
import SponsorsCard from './QuestBanner/SponsorsCard'
import placeHold from '@/assets/images/placeholder_view_vector.svg'
import { QuestStatus } from '@/graphql/API'
import { Sponsor } from '@/types'

interface QuestBannerProps {
  questId: string | null | undefined
  questName: string
  questImage?: string | null
  questStatus: QuestStatus | null | undefined
  sponsors: Sponsor[]
  canEdit: boolean
  isOwner: boolean
  participantCount: number
}

export default function QuestBanner({
  questId,
  questName,
  questImage,
  questStatus,
  sponsors,
  canEdit,
  isOwner,
  participantCount,
}: QuestBannerProps) {
  const navigate = useNavigate()

  const getEditTooltip = () => {
    if (questStatus === QuestStatus.expired) {
      return 'Expired quests cannot be edited'
    }
    if (participantCount > 0) {
      return 'Quests with participants cannot be edited'
    }
    if (!canEdit) {
      return 'Only draft and published quests with no participants can be edited'
    }
    return 'Edit quest'
  }

  return (
    <div className="relative w-full mb-4 md:mb-20">
      {/* Banner Image */}
      <RemoteImage
        path={questImage || placeHold}
        fallback={placeHold}
        className="w-full h-[250px] md:h-[350px] object-cover rounded-t-2xl"
      />

      {/* Gradient overlay at bottom for contrast */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl" />

      {/* Quest Title (overlayed bottom-left) */}
      <div className="absolute bottom-8 left-6 z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
          {questName}
        </h1>
      </div>

      {/* Social Share Button (top-left on mobile, bottom-left on desktop) */}
      <SocialShareButton questName={questName} />

      {/* Sponsors Card (top-right on mobile, bottom-right on desktop) */}
      {sponsors.length > 0 && <SponsorsCard sponsors={sponsors} />}

      {/* Edit Button (top-right of banner) */}
      {isOwner && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate(`/user/quest/${questId}/edit`)}
                className={`absolute top-4 right-4 p-2 rounded-full bg-white/80 shadow z-20 ${
                  !canEdit
                    ? 'cursor-not-allowed opacity-50 hover:bg-white/80'
                    : 'hover:bg-white'
                }`}
                disabled={!canEdit}
                aria-label="Edit quest"
              >
                <Pencil className="w-5 h-5 text-gray-700" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg"
            >
              {getEditTooltip()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
