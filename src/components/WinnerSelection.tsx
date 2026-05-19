import { useState, useEffect } from 'react'
import { Prize, Profile, Winner } from '@/types'
import { generateClient, GraphQLResult } from 'aws-amplify/data'
import { getProfile } from '@/graphql/queries'
import { GetProfileQuery } from '@/graphql/API'
import PrizeWinnerCard from './WinnerSelection/PrizeWinnerCard'

interface WinnerSelectionProps {
  prizes: Prize[]
  winners: Winner[]
  completedParticipants: Profile[]
  onSelectWinner: (prizeId: string, place: number, profile: Profile) => void
  onRandomPick: (prizeId: string, place: number) => void
  isUpdating?: boolean
}

export default function WinnerSelection({
  prizes,
  winners,
  completedParticipants,
  onSelectWinner,
  onRandomPick,
  isUpdating = false,
}: WinnerSelectionProps) {
  const [winnerProfiles, setWinnerProfiles] = useState<Record<string, Profile>>(
    {},
  )
  const client = generateClient()

  useEffect(() => {
    const fetchWinnerProfiles = async () => {
      if (winners.length === 0) return

      const winnerIds = winners.map((w) => w.user_id)
      const uniqueIds = [...new Set(winnerIds)]

      try {
        const profiles = await Promise.all(
          uniqueIds.map(async (id) => {
            const res = await client.graphql<GraphQLResult<GetProfileQuery>>({
              query: getProfile,
              variables: { id },
              authMode: 'userPool',
            })
            return 'data' in res ? res.data?.getProfile : null
          }),
        )

        const profileMap: Record<string, Profile> = {}
        profiles.forEach((profile) => {
          if (profile) {
            profileMap[profile.id] = profile as Profile
          }
        })

        setWinnerProfiles(profileMap)
      } catch (err) {
        console.error('Failed to fetch winner profiles:', err)
      }
    }

    fetchWinnerProfiles()
  }, [winners])

  if (prizes.length === 0) {
    return (
      <div className="lg:w-[450px] w-full bg-white/70 p-4 rounded-xl shadow">
        <h4 className="text-md font-bold mb-3">Select Winners by Prize</h4>
        <p className="text-gray-500">No prizes chosen for this quest.</p>
      </div>
    )
  }

  return (
    <div className="lg:w-[450px] w-full bg-white/70 p-4 rounded-xl shadow">
      <h4 className="text-md font-bold mb-3">Select Winners by Prize</h4>

      <div className="mt-6 border-t pt-4">
        <div className="flex flex-col gap-3">
          {prizes.map((prize, index) => {
            const prizeWinner = winners.find((w) => w.prize_id === prize.id)
            const winnerProfile = prizeWinner
              ? winnerProfiles[prizeWinner.user_id]
              : null

            return (
              <PrizeWinnerCard
                key={prize.id}
                prize={prize}
                place={index + 1}
                winner={prizeWinner}
                winnerProfile={winnerProfile}
                completedParticipants={completedParticipants}
                winners={winners}
                onSelectWinner={(profile) =>
                  onSelectWinner(prize.id, index + 1, profile)
                }
                onRandomPick={() => onRandomPick(prize.id, index + 1)}
                isUpdating={isUpdating}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
