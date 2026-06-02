import type { Profile } from '@/types'

type ProfileProps = {
  profile: Profile
}

export default function SeekerRank({ profile }: ProfileProps) {
  let rank = ''
  switch (profile.seeker_rank) {
    case 'wanderer':
      rank = '/badges/badge_wanderer.png'
      break
    case 'scout':
      rank = '/badges/badge_scout.png'
      break
    case 'tracker':
      rank = '/badges/badge_tracker.png'
      break
    case 'trailblazer':
      rank = '/badges/badge_trailblazer.png'
      break
    case 'navigator':
      rank = '/badges/badge_navigator.png'
      break
    default:
      rank = '/badges/badge_wanderer.png'
  }

  return (
    <div className="absolute top-0 left-0 group">
      <img
        src={rank}
        alt={profile.seeker_rank}
        className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm transition-transform duration-200 group-hover:scale-125"
      />
      {/* Rank label on hover */}
      <span className="absolute left-1/2 -translate-x-1/2 top-9 hidden group-hover:block bg-black/75 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap capitalize z-10">
        {profile.seeker_rank}
      </span>
    </div>
  )
}
