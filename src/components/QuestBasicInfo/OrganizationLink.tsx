import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog'
import RemoteImage from '../RemoteImage'
import placeHold from '@/assets/images/placeholder_view_vector.svg'
import { Portal } from '@radix-ui/react-dialog'

interface OrganizationLinkProps {
  organizationName?: string | null
  organizationDescription?: string | null
  imageThumbnail?: string | null
}

export default function OrganizationLink({
  organizationName,
  organizationDescription,
  imageThumbnail,
}: OrganizationLinkProps) {
  if (!organizationName) {
    return (
      <div className="text-sm">
        Organisation: <span className="text-gray-500">N/A</span>
      </div>
    )
  }

  return (
    <div className="text-sm">
      Organisation:{' '}
      <Dialog>
        <DialogTrigger asChild>
          <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">
            {organizationName}
          </span>
        </DialogTrigger>
        <Portal>
          <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
          <DialogContent className="fixed top-1/2 left-1/2 z-50 max-w-md w-full bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[90vh]">
            <div className="flex flex-col items-center">
              <RemoteImage
                path={imageThumbnail || placeHold}
                fallback={placeHold}
                className="w-32 h-32 rounded-full object-cover mb-4"
              />
              <DialogTitle className="text-lg font-bold mb-4 text-center">
                {organizationName}
              </DialogTitle>
              <p className="text-gray-700 text-center">
                {organizationDescription || 'No description available'}
              </p>
            </div>
            <DialogClose asChild>
              <button className="mt-6 w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded transition-colors">
                Close
              </button>
            </DialogClose>
          </DialogContent>
        </Portal>
      </Dialog>
    </div>
  )
}
