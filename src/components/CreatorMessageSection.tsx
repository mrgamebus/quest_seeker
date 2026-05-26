import { useState } from 'react'
import { Button } from './ui/button'

interface CreatorMessageSectionProps {
  message: string
  onMessageChange: (message: string) => void
  onSave: () => void
  isSaving?: boolean
}

export default function CreatorMessageSection({
  message,
  onMessageChange,
  onSave,
  isSaving = false,
}: CreatorMessageSectionProps) {
  const [charCount, setCharCount] = useState(message.length)
  const maxChars = 500

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value
    if (newMessage.length <= maxChars) {
      onMessageChange(newMessage)
      setCharCount(newMessage.length)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <span>📢</span>
          Message to Participants
        </h4>
        <span className="text-xs text-gray-500">
          {charCount}/{maxChars}
        </span>
      </div>

      <textarea
        value={message}
        onChange={handleChange}
        placeholder="Write a message to all participants (e.g., thank you message, winner announcement, next steps)..."
        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={4}
        maxLength={maxChars}
      />

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          This message will be visible to all participants
        </p>

        <Button
          onClick={onSave}
          disabled={isSaving || !message.trim()}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            'Save & Send Message'
          )}
        </Button>
      </div>
    </div>
  )
}
