import useEmblaCarousel from 'embla-carousel-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
  Portal,
} from '@radix-ui/react-dialog'
import RemoteImage from '../RemoteImage'
import { Sponsor } from '@/types'
import placeHold from '@/assets/images/placeholder_view_vector.svg'
import SponsorAvatar from './SponsorAvatar'

interface SponsorsCardProps {
  sponsors: Sponsor[]
}

export default function SponsorsCard({ sponsors }: SponsorsCardProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const displayedSponsors = sponsors.slice(0, 2)

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  return (
    <Dialog>
      <div
        className="
          absolute top-2 right-2 flex flex-col items-end gap-1 z-20
          md:top-auto md:right-10 md:bottom-[-60px]
          md:bg-white md:rounded-2xl md:shadow-xl md:border md:border-gray-200
          md:p-5 md:gap-3
        "
      >
        {sponsors.length >= 3 && (
          <div className="hidden md:block">
            <DialogTrigger asChild>
              <span className="text-sm text-blue-600 font-medium underline cursor-pointer hover:text-blue-800">
                Featured Sponsors
              </span>
            </DialogTrigger>
          </div>
        )}

        <DialogTrigger asChild>
          <div className="flex gap-2 md:gap-4 flex-wrap justify-end cursor-pointer hover:opacity-80 transition-opacity">
            {displayedSponsors.map((sponsor) => (
              <SponsorAvatar key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        </DialogTrigger>
        <Portal>
          <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
          <DialogContent className="fixed top-1/2 left-1/2 z-50 max-w-md w-full bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[90vh]">
            <DialogTitle className="text-lg font-bold mb-4">
              Featured Sponsors
            </DialogTitle>

            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {sponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="flex-[0_0_100%] flex flex-col items-center justify-center p-4"
                  >
                    <RemoteImage
                      path={sponsor.image || placeHold}
                      fallback={placeHold}
                      className="w-24 h-24 object-contain rounded-full mb-2"
                    />
                    <p className="font-semibold text-sm text-gray-700">
                      {sponsor.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={scrollPrev}
                className="text-sm text-blue-600 hover:underline"
              >
                Previous
              </button>
              <button
                onClick={scrollNext}
                className="text-sm text-blue-600 hover:underline"
              >
                Next
              </button>
            </div>

            <DialogClose asChild>
              <button className="mt-6 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded w-full">
                Close
              </button>
            </DialogClose>
          </DialogContent>
        </Portal>
      </div>
    </Dialog>
  )
}
