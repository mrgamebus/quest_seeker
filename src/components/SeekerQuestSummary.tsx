import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import SeekerTaskPdfButton from './SeekerTaskPdfButton'
import { Profile, Task, Quest } from '@/types'
import IncompleteQuestWarning from './CompletedParticipantList/IncompleteQuestWarning'

interface SeekerQuestSummaryProps {
  quest: Quest
  currentUserProfile: Profile
  completedTasks: number
  totalTasks: number
  seekerTasks: Task[]
  // isReady: boolean
  onPreparePdf: () => Promise<Task[]>
}

export default function SeekerQuestSummary({
  quest,
  currentUserProfile,
  completedTasks,
  totalTasks,
  // isReady,
  onPreparePdf,
}: SeekerQuestSummaryProps) {
  const [preparedTasks, setPreparedTasks] = useState<Task[] | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const handlePreparePdf = async () => {
    setIsLoading(true)
    try {
      const resolved = await onPreparePdf()
      setPreparedTasks(resolved)
    } catch (err) {
      console.error('Failed to prepare PDF:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const isQuestComplete = completedTasks === totalTasks && totalTasks > 0

  return (
    <div className="lg:w-[450px] w-full bg-white/70 p-4 rounded-xl shadow">
      <h3 className="text-lg font-bold mb-3">Your Completed Quest</h3>
      <p className="text-sm text-gray-600 mb-4">
        This quest has ended. See your completed quest details below.
      </p>

      <div className="flex flex-col gap-3">
        {isQuestComplete ? (
          preparedTasks && preparedTasks.length > 0 ? (
            <PDFDownloadLink
              document={
                <SeekerTaskPdfButton
                  quest={quest}
                  seekerTasks={preparedTasks}
                  user={currentUserProfile}
                />
              }
              fileName={`${quest.quest_name}-your-answers.pdf`}
            >
              {({ loading }) => (
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full transition-colors">
                  {loading ? 'Generating PDF...' : '⬇ Download My Quest PDF'}
                </button>
              )}
            </PDFDownloadLink>
          ) : (
            <button
              onClick={handlePreparePdf}
              disabled={isLoading}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg w-full transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Preparing Tasks...
                </span>
              ) : (
                'Prepare PDF'
              )}
            </button>
          )
        ) : (
          <IncompleteQuestWarning
            completedTasks={completedTasks}
            totalTasks={totalTasks}
          />
        )}
      </div>
    </div>
  )
}
