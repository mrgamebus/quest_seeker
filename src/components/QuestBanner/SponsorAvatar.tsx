import RemoteImage from '../RemoteImage'
import { Sponsor } from '@/types'
import placeHold from '@/assets/images/placeholder_view_vector.svg'

interface SponsorAvatarProps {
  sponsor: Sponsor
}

export default function SponsorAvatar({ sponsor }: SponsorAvatarProps) {
  return (
    <div className="flex flex-col items-center w-10 md:w-20 text-center">
      <div className="p-[2px] md:p-[3px] bg-white/80 md:bg-gradient-to-b md:from-gray-100 md:to-gray-200 rounded-full shadow">
        <RemoteImage
          path={sponsor.image || placeHold}
          fallback={placeHold}
          className="w-8 h-8 md:w-14 md:h-14 object-contain rounded-full border border-gray-300 shadow-sm bg-white"
        />
      </div>
      <span className="hidden md:block text-xs mt-1 font-semibold text-gray-700">
        {sponsor.name}
      </span>
    </div>
  )
}
