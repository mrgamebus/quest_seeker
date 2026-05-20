import { Button } from './ui/button'

interface StepNavigationProps {
  onBack?: () => void
  onNext?: () => void
  onSave?: () => void
  canEdit: boolean
  isPublished: boolean
  customButton?: React.ReactNode
}

export function StepNavigation({
  onBack,
  onNext,
  onSave,
  canEdit,
  isPublished,
  customButton,
}: StepNavigationProps) {
  return (
    <div className="flex justify-between mt-4">
      {onBack && <Button onClick={onBack}>Back</Button>}
      {onSave && (
        <Button variant="outline" disabled={!canEdit} onClick={onSave}>
          {isPublished ? 'Save Changes' : 'Save as Draft'}
        </Button>
      )}
      {customButton || (onNext && <Button onClick={onNext}>Next</Button>)}
    </div>
  )
}
