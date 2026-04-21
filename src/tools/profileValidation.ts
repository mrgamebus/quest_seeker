// utils/profileValidation.ts
import type { Profile } from '@/types'

export function isProfileComplete(profile: Profile) {
  // Base fields for everyone
  if (!profile.full_name?.trim()) return false
  if (!profile.phone?.trim()) return false

  // Specific requirements for Creators OR Seekers applying to be Creators
  if (profile.role === 'creator' || profile.role === 'seeker') {
    if (!profile.organization_name?.trim()) return false
    if (!profile.business_type?.trim()) return false
    if (!profile.organization_description?.trim()) return false
    if (!profile.primary_contact_name?.trim()) return false
    if (!profile.primary_contact_position?.trim()) return false
    if (!profile.primary_contact_phone?.trim()) return false

    // Conditional logic based on business type
    if (profile.business_type === 'Registered Company') {
      if (!profile.registration_number?.trim()) return false
    }

    if (profile.business_type === 'Registered Charity') {
      if (!profile.charity_number?.trim()) return false
    }
  }

  return true
}
