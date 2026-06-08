import RemoteImage from './RemoteImage'
import { StepHeader } from './StepHeader'
import { StepNavigation } from './StepNavigation'

interface QuestImageStepProps {
  previewImage: string
  questImage: string | null | undefined
  placeHold: string
  imageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  backQuest: () => void
  onNext: () => void
  onBack: () => void
  onSave: () => void
  canEdit: boolean
  isPublished: boolean
}

export function QuestImageStep({
  previewImage,
  questImage,
  placeHold,
  imageChange,
  backQuest,
  onNext,
  onBack,
  onSave,
  canEdit,
  isPublished,
}: QuestImageStepProps) {
  return (
    <>
      <StepHeader title="Name of the quest" onBack={backQuest} />
      {previewImage ? (
        <RemoteImage
          path={previewImage || questImage}
          fallback={placeHold}
          className="w-1/2 mx-auto rounded-lg"
        />
      ) : (
        <RemoteImage
          path={questImage || placeHold}
          fallback={placeHold}
          className="w-1/2 mx-auto rounded-lg"
        />
      )}
      <input type="file" accept="image/*" onChange={imageChange} />
      <StepNavigation
        onBack={onBack}
        onNext={onNext}
        onSave={onSave}
        canEdit={canEdit}
        isPublished={isPublished}
      />
    </>
  )
}
