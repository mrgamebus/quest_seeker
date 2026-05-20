import { PDFDownloadLink } from '@react-pdf/renderer'
import RemoteImage from '../RemoteImage'
import SeekerTaskPdfButton from '../SeekerTaskPdfButton'
import { Profile, Task, Quest } from '@/types'
import placeHold from '@/assets/images/placeholder_view_vector.svg'

interface ParticipantCardProps {
  profile: Profile
  quest: Quest
  preparedTasks?: Task[]
  isLoading: boolean
  onPreparePdf: () => void
}

export default function ParticipantCard({
  profile,
  quest,
  preparedTasks,
  isLoading,
  onPreparePdf,
}: ParticipantCardProps) {
  return (
    <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm hover:bg-yellow-50 transition border border-gray-100">
      <RemoteImage
        path={profile.image_thumbnail || placeHold}
        fallback={placeHold}
        className="w-12 h-12 rounded-full object-cover shrink-0"
      />

      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-semibold text-gray-800 truncate">
          {profile.full_name || 'Unknown User'}
        </span>
        <span className="text-xs text-gray-500 truncate">
          {profile.email || ''}
        </span>
      </div>

      {preparedTasks && preparedTasks.length > 0 ? (
        <PDFDownloadLink
          document={
            <SeekerTaskPdfButton
              quest={quest}
              seekerTasks={preparedTasks}
              user={profile}
            />
          }
          fileName={`${quest.quest_name}-${profile.full_name ?? 'participant'}.pdf`}
        >
          {({ loading }) => (
            <span className="text-xs text-blue-600 font-medium shrink-0 cursor-pointer hover:underline">
              {loading ? 'Generating...' : '⬇ Download PDF'}
            </span>
          )}
        </PDFDownloadLink>
      ) : (
        <button
          onClick={onPreparePdf}
          disabled={isLoading}
          className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Preparing...' : 'Prepare PDF'}
        </button>
      )}
    </div>
  )
}
