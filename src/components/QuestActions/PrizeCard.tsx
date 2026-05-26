import RemoteImage from '../RemoteImage'
import { Prize } from '@/types'
import placeHold from '@/assets/images/placeholder_view_vector.svg'

interface PrizeCardProps {
  prize: Prize
  place: number
}

export default function PrizeCard({ prize, place }: PrizeCardProps) {
  const getMedal = (position: number) => {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return `#${position}`
  }

  const getBorderColor = (position: number) => {
    if (position === 1) return 'border-yellow-400 bg-yellow-50'
    if (position === 2) return 'border-gray-400 bg-gray-50'
    if (position === 3) return 'border-orange-400 bg-orange-50'
    return 'border-gray-300 bg-gray-50'
  }

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border-2 ${getBorderColor(place)}`}
    >
      <div className="flex-shrink-0">
        <span className="text-3xl">{getMedal(place)}</span>
      </div>

      <RemoteImage
        path={prize.image || placeHold}
        fallback={placeHold}
        className="w-20 h-20 object-contain rounded shrink-0"
      />

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-lg text-gray-800 mb-1">{prize.name}</h4>
      </div>
    </div>
  )
}
