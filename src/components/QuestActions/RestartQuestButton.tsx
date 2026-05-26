import { Button } from '../ui/button'

interface RestartQuestButtonProps {
  onRestart: () => void
  isRestarting?: boolean
}

export default function RestartQuestButton({
  onRestart,
  isRestarting = false,
}: RestartQuestButtonProps) {
  const handleRestart = () => {
    const confirmed = window.confirm(
      'Are you sure you want to restart this quest? This will:\n\n' +
        '• Change the status back to Published\n' +
        '• Extend the end date by 7 days from today\n' +
        '• Allow new participants to join\n\n' +
        'Existing participant data will be preserved.',
    )

    if (confirmed) {
      onRestart()
    }
  }

  return (
    <Button
      onClick={handleRestart}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isRestarting}
    >
      {isRestarting ? 'Restarting...' : '🔄 Restart Quest'}
    </Button>
  )
}
