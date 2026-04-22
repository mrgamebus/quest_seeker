import type { Schema } from '../../data/resource'
import {
  getEmailFromCognito,
  sendBankUpdateEmail,
  sendCreatorApplicationEmail,
  sendSeekerConfirmationEmail,
} from '../shared/sendEmail'
import { updateUserRole } from './updateRole'

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
  const { type, userId, accountName, bankAccount, profileData } =
    event.arguments

  // ✅ Parse the JSON string
  const parsedProfileData =
    typeof profileData === 'string' ? JSON.parse(profileData) : profileData

  const isProfile = (data: unknown): data is Profile => {
    return data !== null && typeof data === 'object' && 'role' in data
  }

  try {
    if (type === 'CREATOR_APPLICATION' && isProfile(parsedProfileData)) {
      if (parsedProfileData.role === 'seeker') {
        await updateUserRole(userId, 'pending', process.env.PROFILE_TABLE_NAME!)
      }
      // Get user email for confirmation
      const userEmail = await getEmailFromCognito(userId)
      const userName = parsedProfileData.full_name ?? 'User'

      // Replace the sequential await calls with:
      await Promise.all([
        sendCreatorApplicationEmail(
          userId,
          accountName,
          bankAccount,
          parsedProfileData,
        ),
        userEmail
          ? sendSeekerConfirmationEmail(userId, userName, userEmail)
          : Promise.resolve(),
      ])
    } else if (type === 'BANK_ACCOUNT_UPDATE') {
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

    return { success: true, message: 'Application submitted successfully' }
  } catch (error) {
    console.error('=== Error in becomePending ===', error)
    throw error
  }
}
