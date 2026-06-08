import { StepHeader } from './StepHeader'
import { StepNavigation } from './StepNavigation'
import { Input } from './ui/input'

interface QuestNameStepProps {
  value: string
  onChange: (value: string) => void
  backQuest: () => void
  onNext: () => void
  onSave: () => void
  canEdit: boolean
  isPublished: boolean
}

export function QuestNameStep({
  value,
  onChange,
  backQuest,
  onNext,
  onSave,
  canEdit,
  isPublished,
}: QuestNameStepProps) {
  return (
    <>
      <StepHeader title="Name of the quest" onBack={backQuest} />
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
      <StepNavigation
        onNext={onNext}
        onSave={onSave}
        canEdit={canEdit}
        isPublished={isPublished}
      />
    </>
  )
}
