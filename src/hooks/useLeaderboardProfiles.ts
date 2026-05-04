// hooks/useLeaderboard.ts
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()

type LeaderboardProfile = Schema['Profile']['type']

type UseLeaderboardResult = {
  topTen: LeaderboardProfile[]
  userRank: number | null
  loading: boolean
  error: string | null
}

type LeaderboardListResult = {
  data?: LeaderboardProfile[]
  nextToken?: string | null
}

/**
 * Fetch ALL profiles ordered by points DESC
 * Used only to compute the current user's rank
 * Filters out admin users
 */
async function fetchAllProfilesByPoints(): Promise<LeaderboardProfile[]> {
  const all: LeaderboardProfile[] = []
  let nextToken: string | null | undefined = undefined

  do {
    const res: LeaderboardListResult =
      await client.models.Profile.listLeaderboard(
        { leaderboard: 'GLOBAL' },
        { sortDirection: 'DESC', nextToken },
      )
    // Filter out admin users
    const nonAdminProfiles = (res.data ?? []).filter(
      (profile) => profile.role !== 'Admin',
    )
    all.push(...nonAdminProfiles)
    nextToken = res.nextToken
  } while (nextToken)

  return all
}

export function useLeaderboardProfiles(
  currentUserId?: string,
): UseLeaderboardResult {
  const [topTen, setTopTen] = useState<LeaderboardProfile[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUserId) return

    let cancelled = false
    const safeUserId = currentUserId

    async function run() {
      setLoading(true)
      setError(null)

      try {
        // 1) Global Top 10 (excluding admins)
        const topRes: LeaderboardListResult =
          await client.models.Profile.listLeaderboard(
            { leaderboard: 'GLOBAL' },
            { sortDirection: 'DESC', limit: 20 }, // Fetch more to ensure we get 10 non-admins
          )

        if (cancelled) return

        // Filter out admins and take top 10
        const nonAdminTop = (topRes.data ?? [])
          .filter((profile) => profile.role !== 'Admin')
          .slice(0, 10)

        setTopTen(nonAdminTop)

        // 2) Compute global rank (excluding admins)
        const allProfiles = await fetchAllProfilesByPoints()
        if (cancelled) return

        const rankIndex = allProfiles.findIndex((p) => p.id === safeUserId)
        setUserRank(rankIndex >= 0 ? rankIndex + 1 : null)
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setError('Failed to load leaderboard')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [currentUserId])

  return { topTen, userRank, loading, error }
}
