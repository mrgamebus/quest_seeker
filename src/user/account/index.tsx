import bg from '@/assets/images/background_main.jpeg'
import UpdateAccount from '@/components/UpdateAccount'
import { useCurrentUserProfile, useUpdateProfile } from '@/hooks/userProfiles'
import { useLocation, useNavigate } from 'react-router-dom'
import { isProfileComplete } from '@/tools/profileValidation'
import { toProfileRole } from '@/hooks/toProfileTole'
import type { Profile } from '@/types'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Toolbar } from '@/components/Toolbar'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import SignOutButton from '@/components/SignOutButton'
import MyQuests from '@/components/MyQuests'
import CurrentUserStatus from '@/components/CurrentUserStatus'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import AdminPage from '@/components/AdminPage'
import { useToast } from '@/hooks/use-toast'

export default function AccountPage() {
  const { data: currentProfile, isLoading, refetch } = useCurrentUserProfile()
  const updateProfile = useUpdateProfile()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [activeTab, setActiveTab] = useState(
    location.state?.defaultTab || 'account',
  )

  useEffect(() => {
    if (location.state?.defaultTab) {
      // 1. Set the active tab from the navigation state
      setActiveTab(location.state.defaultTab)
      refetch()
      // 2. Immediately wipe the state from the browser history
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  // ✅ EARLY RETURN COMES AFTER ALL HOOKS
  if (isLoading || !currentProfile) return null

  const admin = currentProfile?.role === 'Admin'
  const isComplete = isProfileComplete(currentProfile)
  const forceNameUpdate = currentProfile?.full_name === currentProfile?.email
  const handleUpdate = async (updates: Partial<Profile>) => {
    const input: any = {
      id: currentProfile.id,
      ...updates,
    }

    if ('role' in updates && updates.role) {
      input.role = toProfileRole(updates.role)
    }

    try {
      await updateProfile.mutateAsync({ input })
      await refetch()

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      })
    } catch (err) {
      console.error('Failed to update profile:', err)
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to update your profile. Please try again.',
      })
    }
  }

  const handleClick = () => {
    if (!currentProfile) return
    setModalOpen(true)
  }

  const handleBecomeCreator = async () => {
    setLoading(true)
    try {
      setModalOpen(false)
      navigate('/user/account', { state: { defaultTab: 'status' } })
    } catch (err) {
      console.error('Failed to become creator:', err)
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Failed to update your account. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  let labelText = ''
  let accountStatus = ''
  if (currentProfile.role == 'creator') {
    labelText = 'Quest Creator'
    accountStatus = 'Update Account Details'
  }
  if (currentProfile.role == 'seeker') {
    labelText = 'Quest Seeker'
    accountStatus = 'Become a Creator'
  }
  if (currentProfile.role == 'pending') {
    labelText = 'Quest Seeker - Pending'
    accountStatus = 'Account Status'
  }
  if (currentProfile.role == 'Admin') {
    labelText = 'Admin'
    accountStatus = 'View Seeker Accounts'
  }

  return (
    <div
      className="relative h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <Card className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl max-w-5xl w-full h-full max-h-full flex flex-col overflow-hidden">
        <CardContent className="flex flex-col gap-4 flex-1 min-h-0 p-0">
          <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md p-4 shadow-sm border-b">
            <Toolbar>
              <Button
                variant="yellow"
                onClick={() => navigate('/user/region')}
                disabled={forceNameUpdate} // Disable
              >
                <Home />
              </Button>
              <Button
                variant={activeTab === 'account' ? 'default' : 'yellow'}
                onClick={() => setActiveTab('account')}
                disabled={forceNameUpdate} // Disable
              >
                My Account
              </Button>
              <Button
                variant={activeTab === 'my-quests' ? 'default' : 'yellow'}
                onClick={() => setActiveTab('my-quests')}
                disabled={forceNameUpdate} // Disable
              >
                My Quests
              </Button>
              <Button
                variant="yellow"
                onClick={() => navigate('/user/leader')}
                disabled={forceNameUpdate} // Disable
              >
                Leader Board
              </Button>
              <Button
                variant="yellow"
                onClick={() => navigate('/user/help')}
                disabled={forceNameUpdate} // Disable
              >
                About QS
              </Button>
              <SignOutButton /> {/* NOT disabled - this one stays active */}
            </Toolbar>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <div className="w-full max-w-3xl mx-auto">
              <div className="flex flex-col items-end mb-6 gap-1">
                <span className="px-3 py-1 text-sm font-bold text-gray-800 bg-yellow-100 border-2 border-yellow-400 rounded-lg shadow-lg">
                  {labelText}
                </span>
                <button
                  className="text-sm text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (currentProfile.role === 'seeker') {
                      handleClick()
                    } else {
                      setActiveTab('status')
                    }
                  }}
                  disabled={forceNameUpdate} // Disable account status link
                >
                  {accountStatus}
                </button>
              </div>

              {activeTab === 'status' && !admin && (
                <CurrentUserStatus
                  profile={currentProfile}
                  onUpdate={handleUpdate}
                  isProfileComplete={isComplete}
                />
              )}
              {activeTab === 'status' && admin && <AdminPage />}
              {activeTab === 'account' && (
                <UpdateAccount
                  profile={currentProfile}
                  onUpdate={handleUpdate}
                  isProfileComplete={isComplete}
                  forceNameUpdate={forceNameUpdate} // Pass the prop
                />
              )}
              {activeTab === 'my-quests' && (
                <MyQuests profile={currentProfile} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Become a Creator</DialogTitle>
            <DialogDescription>
              You are currently a Seeker. Only Creators may create quests. Would
              you like to upgrade your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBecomeCreator}
              disabled={loading || isLoading || !currentProfile}
            >
              {loading ? 'Updating...' : 'Become a Creator'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
