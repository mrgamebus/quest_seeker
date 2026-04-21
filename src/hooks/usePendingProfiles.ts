import { useQuery } from '@tanstack/react-query'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()

type Profile = Schema['Profile']['type']

export function usePendingUsers() {
  return useQuery({
    queryKey: ['pendingUsers'],
    queryFn: async (): Promise<Profile[]> => {
      const all: Profile[] = []
      let nextToken: string | null | undefined = undefined

      try {
        do {
          const res: Awaited<ReturnType<typeof client.models.Profile.list>> =
            await client.models.Profile.list({
              filter: {
                role: { eq: 'pending' },
              },
              nextToken,
            })
          all.push(...(res.data ?? []))
          nextToken = res.nextToken
        } while (nextToken)

        return all
      } catch (err) {
        console.error('Failed to fetch pending users:', err)
        throw new Error('Failed to load pending users')
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  })
}
