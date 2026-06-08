import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useCurrentUserProfile } from '@/hooks/userProfiles'
import { ProfileRole } from '@/graphql/API'
import { Plus } from 'lucide-react'
import outputs from '../../amplify_outputs.json'
import { toast } from '@/hooks/use-toast'

type AddQuestButtonProps = {
  to: string
}

export default function AddQuestButton({ to }: AddQuestButtonProps) {
  const navigate = useNavigate()
  const { data: currentProfile, isLoading } = useCurrentUserProfile()

  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const role = currentProfile?.role ?? ProfileRole.seeker

  const handleClick = () => {
    if (!currentProfile) return

    if (role === ProfileRole.creator || role === ProfileRole.Admin) {
      navigate(to)
    } else {
      setModalOpen(true)
    }
  }

  const handleBecomeCreator = async () => {
    setLoading(true)
    try {
      setModalOpen(false)

      const res = await fetch(outputs.custom.stripeIdentityFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: currentProfile?.id,
          email: currentProfile?.email,
        }),
      })

      if (!res.ok) throw new Error(`Lambda error: ${res.status}`)

      const { url } = await res.json()
      window.location.href = url // redirect to Stripe's hosted verification page
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Failed to start verification. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="yellow" onClick={handleClick} disabled={isLoading}>
              {/* Replace the icon with text */}
              <Plus />
              <span>Create a Quest</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg"
          >
            Create a quest
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Modal for becoming a creator */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Become a Creator</DialogTitle>
            <DialogDescription>
              You are currently a Seeker. Only Creators may create quests. Would
              you like to upgrade your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBecomeCreator}
              disabled={loading || isLoading || !currentProfile}
            >
              {loading ? 'Updating...' : 'Become a Creator'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
