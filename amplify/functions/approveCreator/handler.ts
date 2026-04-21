import type { AppSyncResolverEvent } from 'aws-lambda'
import type { Schema } from '../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/approveCreator'
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  UserNotFoundException,
  CognitoIdentityProviderServiceException,
} from '@aws-sdk/client-cognito-identity-provider'

const cognitoClient = new CognitoIdentityProviderClient({})

let dataClient: ReturnType<typeof generateClient<Schema>>

async function initializeAmplify() {
  if (dataClient) return
  const { resourceConfig, libraryOptions } =
    await getAmplifyDataClientConfig(env)
  Amplify.configure(resourceConfig, libraryOptions)
  dataClient = generateClient<Schema>({ authMode: 'iam' })
}

type Args = {
  profileId: string
}

export const handler = async (event: AppSyncResolverEvent<Args>) => {
  console.log('=== approveCreator Lambda triggered ===')
  console.log('Profile ID:', event.arguments.profileId)

  await initializeAmplify()

  const userPoolId = process.env.AMPLIFY_USER_POOL_ID

  if (!userPoolId) {
    throw new Error('Missing User Pool ID')
  }

  // Verify caller is admin
  if (!event.identity || !('sub' in event.identity)) {
    throw new Error('Unauthorized')
  }

  const { profileId } = event.arguments

  // Fetch the pending user's profile
  const { data: profile, errors } = await dataClient.models.Profile.get({
    id: profileId,
  })

  if (errors || !profile) {
    console.error('Profile not found:', errors)
    throw new Error('Profile not found')
  }

  console.log('Profile found:', profile.email, 'Current role:', profile.role)

  // Verify the profile is actually pending
  if (profile.role !== 'pending') {
    throw new Error(`Profile is not pending. Current role: ${profile.role}`)
  }

  // Update profile role to creator in DynamoDB
  console.log('Updating profile role to creator...')
  const { errors: updateErrors } = await dataClient.models.Profile.update({
    id: profile.id,
    role: 'creator',
  })

  if (updateErrors) {
    console.error('Failed to update profile role:', updateErrors)
    throw new Error('Database update failed')
  }

  console.log('Profile role updated successfully')

  // Add user to Cognito Creator group
  console.log('Adding user to Cognito Creator group...')
  try {
    await cognitoClient.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: profileId, // The profile ID is the Cognito user sub
        GroupName: 'creator',
      }),
    )
    console.log('User added to Creator group successfully')
  } catch (err) {
    if (err instanceof UserNotFoundException) {
      console.error('User does not exist in Cognito.')
      throw err
    }
    if (err instanceof CognitoIdentityProviderServiceException) {
      if (err.name === 'ResourceNotFoundException') {
        throw new Error(`Cognito Group 'creator' does not exist.`)
      }
      console.warn(`Cognito note [${err.name}]: ${err.message}`)
    } else {
      throw err
    }
  }

  console.log('=== Approval complete ===')
  return { success: true, message: 'Creator approved successfully' }
}
