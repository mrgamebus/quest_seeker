import RemoteImage from './RemoteImage'
import { StepHeader } from './StepHeader'
import { StepNavigation } from './StepNavigation'

interface QuestImageStepProps {
  previewImage: string
  questImage: string | null | undefined
  placeHold: string
  imageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBack: () => void
  onNext: () => void
  onSave: () => void
  canEdit: boolean
  isPublished: boolean
}

export function QuestImageStep({
  previewImage,
  questImage,
  placeHold,
  imageChange,
  onBack,
  onNext,
  onSave,
  canEdit,
  isPublished,
}: QuestImageStepProps) {
  return (
    <>
      <StepHeader title="Name of the quest" onBack={onBack} />
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
        onNext={onNext}
        onSave={onSave}
        canEdit={canEdit}
        isPublished={isPublished}
      />
    </>
  )
}
