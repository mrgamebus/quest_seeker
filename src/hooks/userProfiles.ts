import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query'
import {
  UpdateProfileMutation,
  UpdateProfileMutationVariables,
  GetProfileQuery,
  CreateProfileMutation,
} from '@/graphql/API'
import type { GraphQLResult } from '@aws-amplify/api'
import { generateClient } from 'aws-amplify/api'
import { listProfiles, getProfile } from '@/graphql/queries'
import { updateProfile, createProfile } from '@/graphql/mutations'
import { getCurrentUser } from 'aws-amplify/auth'
import { profileKeys } from '@/queryKeys'

const client = generateClient()

export const useProfileList = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const result = await client.graphql({ query: listProfiles })
      return result.data.listProfiles.items
    },
  })
}

export const useProfile = (
  id: string,
  options?: Omit<
    UseQueryOptions<GetProfileQuery['getProfile'] | null, Error>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<GetProfileQuery['getProfile'] | null, Error>({
    queryKey: ['profiles', id],
    queryFn: async () => {
      if (!id) return null

      const result = await client.graphql<GraphQLResult<GetProfileQuery>>({
        query: getProfile,
        variables: { id },
        authMode: 'userPool',
      })

      if ('data' in result) {
        return result.data?.getProfile ?? null
      }
      return null
    },
    enabled: !!id,
    ...options,
  })
}

export const useCurrentUserProfile = () => {
  const query = useQuery({
    queryKey: profileKeys.current,
    queryFn: async () => {
      const { userId, signInDetails } = await getCurrentUser()

      const res = await client.graphql<GetProfileQuery>({
        query: getProfile,
        variables: { id: userId },
        authMode: 'userPool',
      })

      let profile = 'data' in res ? (res.data?.getProfile ?? null) : null

      if (!profile) {
        const createRes = await client.graphql<CreateProfileMutation>({
          query: createProfile,
          variables: {
            input: {
              id: userId,
              full_name: signInDetails?.loginId ?? 'New User',
              email: signInDetails?.loginId,
              role: 'seeker',
              seeker_rank: 'wanderer',
            },
          },
          authMode: 'userPool',
        })

        profile =
          'data' in createRes ? (createRes.data?.createProfile ?? null) : null
      }

      return profile
    },
    staleTime: 1000 * 60 * 5,
  })

  return {
    currentProfile: query.data,
    currentError: query.error,
    ...query,
  }
}

export const useUpdateProfile = (
  options?: UseMutationOptions<
    UpdateProfileMutation['updateProfile'],
    unknown,
    UpdateProfileMutationVariables
  >,
) => {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateProfileMutation['updateProfile'],
    unknown,
    UpdateProfileMutationVariables
  >({
    mutationFn: async (variables) => {
      const result = (await client.graphql<UpdateProfileMutation>({
        query: updateProfile,
        variables,
        authMode: 'userPool',
      })) as { data: UpdateProfileMutation }

      const updated = result.data.updateProfile

      return updated
    },

    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current })

      if (variables?.input?.id) {
        queryClient.invalidateQueries({
          queryKey: profileKeys.byId(variables.input.id),
        })
      }

      options?.onSuccess?.(data, variables, onMutateResult, context)
    },

    ...options,
  })
}

export const useUpdateSeeker = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: UpdateProfileMutationVariables) => {
      const result = (await client.graphql<UpdateProfileMutation>({
        query: updateProfile,
        variables,
      })) as { data: UpdateProfileMutation }

      return result.data.updateProfile
    },
    onSuccess: (_, { input }) => {
      if (input?.id) {
        queryClient.invalidateQueries({ queryKey: ['profiles'] })
        queryClient.invalidateQueries({ queryKey: ['profiles', input.id] })
      }
    },
  })
}

export const useAllUsers = () => {
  return useQuery({
    queryKey: ['profiles', 'all'],
    queryFn: async () => {
      const result = await client.graphql({
        query: listProfiles,
        authMode: 'userPool',
      })
      return result.data.listProfiles.items
    },
  })
}
