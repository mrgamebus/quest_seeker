import { Button } from '@/components/ui/button'

interface StepHeaderProps {
  title: string
  onBack: () => void
}

export function StepHeader({ title, onBack }: StepHeaderProps) {
  return (
    <div className="flex justify-between mt-4">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <Button variant="yellow" onClick={onBack}>
        <span>Back to Quests</span>
      </Button>
    </div>
  )
}
