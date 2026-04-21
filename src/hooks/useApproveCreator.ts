import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()

export function useApproveCreator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (profileId: string) => {
      const { data, errors } = await client.mutations.approveCreator({
        profileId,
      })

      if (errors || !data) {
        throw new Error(errors?.[0]?.message || 'Failed to approve creator')
      }

      return data
    },
    onSuccess: () => {
      // Refetch the pending users list
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] })
    },
  })
}
