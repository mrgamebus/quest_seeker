import type { Schema } from '../../data/resource'
import { updateUserRole } from './updateRole'
import { sendCreatorApplicationEmail, sendBankUpdateEmail } from './sendEmail'

type Role = 'seeker' | 'creator' | 'pending'

type Profile = {
  id: string
  full_name: string
  email: string
  phone: string
  organization_name: string
  registration_number: string
  charity_number: string
  business_type: string
  organization_description: string
  primary_contact_name: string
  primary_contact_position: string
  primary_contact_phone: string
  secondary_contact_name: string
  secondary_contact_position: string
  secondary_contact_phone: string
  about_me: string
  image: string
  image_thumbnail: string
  role: Role
  points: number
}

export const handler: Schema['becomePending']['functionHandler'] = async (
  event,
) => {
  console.log('=== becomePending Lambda triggered ===')
  console.log('Event arguments:', JSON.stringify(event.arguments, null, 2))

  const { type, userId, accountName, bankAccount, profileData } =
    event.arguments

  // ✅ Parse the JSON string
  const parsedProfileData =
    typeof profileData === 'string' ? JSON.parse(profileData) : profileData

  console.log(
    'Parsed profile data:',
    JSON.stringify(parsedProfileData, null, 2),
  )
  console.log('Type:', type)
  console.log('User ID:', userId)

  const isProfile = (data: unknown): data is Profile => {
    return data !== null && typeof data === 'object' && 'role' in data
  }

  console.log('Is profile valid?', isProfile(parsedProfileData))

  try {
    if (type === 'CREATOR_APPLICATION' && isProfile(parsedProfileData)) {
      console.log('Processing CREATOR_APPLICATION')
      console.log('Profile role:', parsedProfileData.role)

      if (parsedProfileData.role === 'seeker') {
        console.log('Updating user role to pending...')
        await updateUserRole(userId, 'pending', process.env.PROFILE_TABLE_NAME!)
        console.log('Role update complete')
      } else {
        console.log(
          'Role is not seeker, skipping role update. Current role:',
          parsedProfileData.role,
        )
      }

      console.log('Sending creator application email...')
      await sendCreatorApplicationEmail(
        userId,
        accountName,
        bankAccount,
        parsedProfileData,
      )
      console.log('Email sent successfully')
    } else if (type === 'BANK_ACCOUNT_UPDATE') {
      console.log('Processing BANK_ACCOUNT_UPDATE')
      await sendBankUpdateEmail(
        userId,
        accountName,
        bankAccount,
        process.env.PROFILE_TABLE_NAME!,
      )
    } else {
      console.log(
        'No matching condition. Type:',
        type,
        'isProfile:',
        isProfile(parsedProfileData),
      )
    }

    console.log('=== Lambda completed successfully ===')
    return { success: true, message: 'Application submitted successfully' }
  } catch (error) {
    console.error('=== Error in becomePending ===', error)
    throw error
  }
}
