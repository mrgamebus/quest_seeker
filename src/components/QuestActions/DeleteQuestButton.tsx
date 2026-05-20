import { Button } from '../ui/button'
import { Quest } from '@/types'

interface DeleteQuestButtonProps {
  quest: Quest
  onDelete: (quest: Quest) => void
  deleting: boolean
  adminOverride?: boolean
}

export default function DeleteQuestButton({
  quest,
  onDelete,
  deleting,
  adminOverride = false,
}: DeleteQuestButtonProps) {
  const handleDelete = () => {
    const message = adminOverride
      ? `Are you sure you want to delete this quest as an admin?\n\nQuest: ${quest.quest_name}\n\nThis action cannot be undone.`
      : `Are you sure you want to delete "${quest.quest_name}"?\n\nThis action cannot be undone.`

    if (window.confirm(message)) {
      onDelete(quest)
    }
  }

  return (
    <Button
      onClick={handleDelete}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={deleting}
    >
      {deleting
        ? 'Deleting...'
        : adminOverride
          ? 'Admin Delete'
          : 'Delete Quest'}
    </Button>
  )
}
