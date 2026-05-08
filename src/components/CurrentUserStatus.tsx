import type { Profile } from '@/types'
import { Button } from './ui/button'
import { useState } from 'react'
import { SegmentedBankInput } from './SegmentedBankInput'
import InlineEditField from './InlineEditField'
import InlineEditTextarea from './InlineEditTextarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { useBecomePending } from '@/hooks/useBecomePending'
import { useCurrentUserProfile } from '@/hooks/userProfiles'
import { useNavigate } from 'react-router-dom'

type ProfileProps = {
  profile: Profile
  onUpdate: (updates: Partial<Profile>) => void
  isProfileComplete: boolean
}

export default function CurrentUserStatus({
  profile,
  onUpdate,
  isProfileComplete,
}: ProfileProps) {
  const [showBankForm, setShowBankForm] = useState(false)

  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
  })
  const { submitApplication, isSending } = useBecomePending()
  const { refetch } = useCurrentUserProfile() // ✅ Get refetch from the hook
  const navigate = useNavigate() // ✅ Import from react-router-dom

  const isBankValid =
    bankDetails.accountName.trim() !== '' &&
    bankDetails.accountNumber.replace(/-/g, '').length >= 15

  const canSubmitApplication = isProfileComplete && isBankValid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanAccountNumber = bankDetails.accountNumber.replace(/-/g, '')

    if (!bankDetails.accountName || cleanAccountNumber.length < 15) {
      alert('Please enter both the account name and a valid account number.')
      return
    }

    const result = await submitApplication(
      profile,
      bankDetails,
      isProfileComplete,
      onUpdate,
      async () => void (await refetch()),
    )

    if (result.success) {
      alert(
        isProfileComplete
          ? 'Bank details sent to admin for verification!'
          : 'Application submitted successfully!',
      )

      // ✅ Navigate back to account page
      navigate('/user/account', { replace: true })
    } else {
      alert(`Failed to send: ${result.error}`)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto mb-2">
      {/* Pending-only fields */}
      {profile.role === 'pending' && (
        <>
          <div>
            <p>
              Thanks, your application is under review and you will be notified
              when it is reviewed as soon as possible.
            </p>
          </div>
        </>
      )}
      {/* Creator-only fields */}
      {profile.role === 'creator' && (
        <div className="space-y-4">
          {/* 2. Show the "Update" button if the form is closed */}
          {!showBankForm ? (
            <Button
              onClick={() => setShowBankForm(true)}
              variant="outline"
              className="w-full"
            >
              Update Bank Details
            </Button>
          ) : (
            /* 3. Show the form when showBankForm is true */
            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-4 border rounded-lg"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Bank Information</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBankForm(false)}
                >
                  Cancel
                </Button>
              </div>

              <SegmentedBankInput
                onComplete={setBankDetails}
                initialValue={''}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={!isProfileComplete || isSending || !isBankValid}
                variant={!isProfileComplete ? 'outline' : 'default'}
              >
                {isSending ? 'Sending...' : 'Submit Bank Details'}
              </Button>
            </form>
          )}
        </div>
      )}
      {profile.role === 'seeker' && (
        <div className="mb-3 rounded bg-red-100 p-4 text-sm text-red-700 space-y-4">
          <p className="font-bold text-lg">Creator Application Details</p>
          <div className="flex flex-col gap-6 w-full max-w-md mx-auto px-1">
            {/* Basic Info Section */}
            <section className="space-y-4">
              <InlineEditField
                label="Organisation Name"
                value={profile.organization_name || ''}
                onSave={(newValue) => onUpdate({ organization_name: newValue })}
                required
              />
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">
                  Business Type
                </label>
                <Select
                  key={profile.business_type ?? 'empty'}
                  value={profile.business_type || ''}
                  onValueChange={(newValue) =>
                    onUpdate({ business_type: newValue })
                  }
                >
                  <SelectTrigger className="w-full h-12 text-base">
                    {' '}
                    {/* Larger height for mobile taps */}
                    <SelectValue placeholder="Select Business Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Registered Company">
                      Registered Company
                    </SelectItem>
                    <SelectItem value="Small Business">
                      Small Business
                    </SelectItem>
                    <SelectItem value="Charitable Trust">
                      Charitable Trust
                    </SelectItem>
                    <SelectItem value="Not for Profit">
                      Not for Profit
                    </SelectItem>
                    <SelectItem value="Whanau Fund Raising">
                      Whanau Fund Raising
                    </SelectItem>
                    <SelectItem value="Registered Charity">
                      Registered Charity
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(profile.business_type === 'Registered Company' ||
                profile.business_type === 'Registered Charity') && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 animate-in fade-in duration-300">
                  <InlineEditField
                    label="Registration Number"
                    value={profile.registration_number || ''}
                    onSave={(newValue) =>
                      onUpdate({ registration_number: newValue })
                    }
                    required
                  />
                </div>
              )}
            </section>
            {profile.business_type === 'Registered Charity' && (
              <InlineEditField
                label="Registered Charity Number"
                value={profile.charity_number || ''}
                onSave={(newValue) => onUpdate({ charity_number: newValue })}
                required
              />
            )}

            <InlineEditTextarea
              label="Organisation Description"
              value={profile.organization_description || ''}
              onSave={(newValue) =>
                onUpdate({ organization_description: newValue })
              }
              required
            />
            <section className="bg-gray-50/50 p-4 rounded-xl space-y-4 border border-gray-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
                Primary Contact
              </h3>

              <InlineEditField
                label="Primary Contact Name"
                value={profile.primary_contact_name || ''}
                onSave={(newValue) =>
                  onUpdate({ primary_contact_name: newValue })
                }
                required
              />
              <InlineEditField
                label="Primary Contact Position"
                value={profile.primary_contact_position || ''}
                onSave={(newValue) =>
                  onUpdate({ primary_contact_position: newValue })
                }
                required
              />
              <InlineEditField
                label="Primary Contact Phone"
                value={profile.primary_contact_phone || ''}
                onSave={(newValue) =>
                  onUpdate({ primary_contact_phone: newValue })
                }
                required
              />
            </section>
            <section className="bg-gray-50/50 p-4 rounded-xl space-y-4 border border-gray-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
                Secondary Contact (Optional)
              </h3>

              <InlineEditField
                label="Secondary Contact Name"
                value={profile.secondary_contact_name || ''}
                onSave={(newValue) =>
                  onUpdate({ secondary_contact_name: newValue })
                }
              />
              <InlineEditField
                label="Secondary Contact Position"
                value={profile.secondary_contact_position || ''}
                onSave={(newValue) =>
                  onUpdate({ secondary_contact_position: newValue })
                }
              />
              <InlineEditField
                label="Secondary Contact Phone"
                value={profile.secondary_contact_phone || ''}
                onSave={(newValue) =>
                  onUpdate({ secondary_contact_phone: newValue })
                }
              />
            </section>
          </div>
          <hr className="border-red-200" />
          {/* Integrated Bank Section */}
          <div className="space-y-2">
            <label className="text-base font-bold text-black">
              Payout Details
            </label>
            <p className="text-xs text-red-600 mb-2 italic">
              * Bank details are not stored and are sent securely to admin for
              verification.
            </p>

            <div className="bg-white/50 p-3 rounded-lg border border-red-200">
              <SegmentedBankInput
                onComplete={setBankDetails}
                initialValue={''}
              />
            </div>
          </div>

          {/* Final Submission Button */}
          <div className="pt-4">
            <Button
              className="w-full"
              size="lg"
              disabled={!canSubmitApplication || isSending}
              onClick={handleSubmit}
            >
              {isSending ? 'Sending...' : 'Submit Application'}
            </Button>

            {!canSubmitApplication && !isSending && (
              <p className="text-[10px] text-center mt-2 text-red-500">
                {!isProfileComplete
                  ? 'Please fill in all required organisation fields.'
                  : 'Please provide valid bank account details.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
