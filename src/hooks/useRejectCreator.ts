import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()

export function useRejectCreator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (profileId: string) => {
      const { data, errors } = await client.mutations.rejectCreator({
        profileId,
      })

      if (errors || !data) {
        throw new Error(errors?.[0]?.message || 'Failed to reject creator')
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] })
    },
  })
}
