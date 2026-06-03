import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
  Portal,
} from '@radix-ui/react-dialog'
import { Button } from '../ui/button'
import { Prize } from '@/types'
import PrizeCard from './PrizeCard'

interface PrizeInfoDialogProps {
  prizes: Prize[]
}

export default function PrizeInfoDialog({ prizes }: PrizeInfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex-shrink-0 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">
          Prize Info
        </Button>
      </DialogTrigger>
      <Portal>
        <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
        <DialogContent className="fixed top-1/2 left-1/2 z-50 max-w-md w-full bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[90vh]">
          <DialogTitle className="text-xl font-bold mb-4">
            Quest Prizes 🏆
          </DialogTitle>

          <div className="flex flex-col gap-4">
            {prizes.map((prize, index) => (
              <PrizeCard key={prize.id} prize={prize} place={index + 1} />
            ))}
          </div>

          <DialogClose asChild>
            <button className="mt-6 w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded transition-colors">
              Close
            </button>
          </DialogClose>
        </DialogContent>
      </Portal>
    </Dialog>
  )
}
