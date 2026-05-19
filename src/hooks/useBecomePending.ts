import { useState } from 'react'
import type { Profile } from '@/types'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()

interface BankDetails {
  accountName: string
  accountNumber: string
}

export function useBecomePending() {
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitApplication = async (
    profile: Profile,
    bankDetails: BankDetails,
    _isProfileComplete: boolean,
    onProfileUpdate: (updates: Partial<Profile>) => void,
    refetchProfile?: () => Promise<void>,
  ) => {
    setIsSending(true)
    setError(null)

    try {
      const type =
        profile.role === 'seeker'
          ? 'CREATOR_APPLICATION'
          : 'BANK_ACCOUNT_UPDATE'

      const profileFields = {
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        organization_name: profile.organization_name,
        business_type: profile.business_type,
        organization_description: profile.organization_description,
        primary_contact_name: profile.primary_contact_name,
        primary_contact_position: profile.primary_contact_position,
        primary_contact_phone: profile.primary_contact_phone,
        secondary_contact_name: profile.secondary_contact_name,
        secondary_contact_position: profile.secondary_contact_position,
        secondary_contact_phone: profile.secondary_contact_phone,
        about_me: profile.about_me,
        role: profile.role,
        ...(profile.registration_number && {
          registration_number: profile.registration_number,
        }),
        ...(profile.charity_number && {
          charity_number: profile.charity_number,
        }),
      }

      const cleanProfile = Object.fromEntries(
        Object.entries(profileFields).filter(
          ([_, value]) => value != null && value !== '',
        ),
      )

      const { data, errors } = await client.mutations.becomePending({
        type,
        userId: profile.id,
        accountName: bankDetails.accountName,
        bankAccount: bankDetails.accountNumber,
        profileData: JSON.stringify(cleanProfile),
      })

      if (errors || !data) {
        throw new Error(errors?.[0]?.message || 'Failed to submit')
      }

      if (type === 'CREATOR_APPLICATION') {
        onProfileUpdate({ role: 'pending' })
        if (refetchProfile) {
          await refetchProfile()
        }
      }

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsSending(false)
    }
  }

  return { submitApplication, isSending, error }
}
