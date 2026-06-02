import { useState, useEffect } from 'react'
import { Button } from '@aws-amplify/ui-react'

interface InlineEditTextareaProps {
  label: string
  value: string
  onSave: (newValue: string) => void
  required?: boolean
  disabled?: boolean
}

export default function InlineEditTextarea({
  label,
  value,
  onSave,
  required = false,
  disabled = false,
}: InlineEditTextareaProps) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [error, setError] = useState('')

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleSave = () => {
    if (required && !inputValue.trim()) {
      setError(`${label} is required`)
      return
    }
    setError('')
    onSave(inputValue)
    setEditing(false)
  }

  const handleCancel = () => {
    setInputValue(value)
    setError('')
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <strong>{label}:</strong>
        <div className="flex flex-col flex-1 gap-1">
          <textarea
            className={`border p-1 rounded w-full ${error ? 'border-red-500' : ''} ${
              disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
            }`}
            rows={4}
            value={inputValue}
            disabled={disabled}
            onChange={(e) => {
              setInputValue(e.target.value)
              setEditing(true)
            }}
          />
          {editing && (
            <div className="flex gap-1 justify-end">
              <Button size="small" onClick={handleSave}>
                Save
              </Button>
              <Button size="small" variation="warning" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  )
}
