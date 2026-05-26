import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { usePendingUsers } from '@/hooks/usePendingProfiles'
import { useAllUsers, useUpdateProfile } from '@/hooks/userProfiles'
import { Button } from './ui/button'
import { useApproveCreator } from '@/hooks/useApproveCreator'
import { Input } from './ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { useRejectCreator } from '@/hooks/useRejectCreator'
import type { GetProfileQuery } from '@/graphql/API'
import { Field } from './ProfileField'

export type Profile = NonNullable<GetProfileQuery['getProfile']>

export default function AdminPage() {
  const [view, setView] = useState<'pending' | 'seekers' | 'creators'>(
    'pending',
  )
  const [displayCount, setDisplayCount] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Profile>>({})
  const updateProfile = useUpdateProfile()
  const queryClient = useQueryClient()

  const {
    data: pendingUsers,
    isLoading: loadingPending,
    error: errorPending,
    refetch: refetchPending,
  } = usePendingUsers()
  const {
    data: allUsers,
    isLoading: loadingAll,
    error: errorAll,
    refetch: refetchAll,
  } = useAllUsers()
  const approveCreator = useApproveCreator()
  const rejectCreator = useRejectCreator()

  const handleApprove = async (userId: string, userName: string) => {
    if (!confirm(`Approve ${userName} as a Creator?`)) return
    try {
      await approveCreator.mutateAsync(userId)
      alert(`${userName} has been approved as a Creator!`)
    } catch (err) {
      console.error('Approval failed:', err)
      alert(
        `Failed to approve: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
    }
  }

  const handleReject = async (userId: string, userName: string) => {
    if (!confirm(`Reject ${userName} as a Creator?`)) return
    try {
      await rejectCreator.mutateAsync(userId)
      alert(`You have rejected ${userName} as a Creator!`)
    } catch (err) {
      console.error('Rejection failed:', err)
      alert(
        `Failed to reject: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const bottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50

    if (
      bottom &&
      view !== 'pending' &&
      filteredAndSearchedUsers &&
      displayCount < filteredAndSearchedUsers.length
    ) {
      setDisplayCount((prev) =>
        Math.min(prev + 10, filteredAndSearchedUsers.length),
      )
    }
  }

  const handleSelectUser = (user: Profile) => {
    setSelectedUser(user)
    setEditForm({
      full_name: user.full_name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      organization_name: user.organization_name ?? '',
      business_type: user.business_type ?? '',
      registration_number: user.registration_number ?? '',
      charity_number: user.charity_number ?? '',
      organization_description: user.organization_description ?? '',
      primary_contact_name: user.primary_contact_name ?? '',
      secondary_contact_name: user.secondary_contact_name ?? '',
      primary_contact_phone: user.primary_contact_phone ?? '',
      secondary_contact_phone: user.secondary_contact_phone ?? '',
      primary_contact_position: user.primary_contact_position ?? '',
      secondary_contact_position: user.secondary_contact_position ?? '',
    })
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!selectedUser) return

    try {
      await updateProfile.mutateAsync({
        input: { id: selectedUser.id, ...editForm },
      })
      setSelectedUser((prev) => (prev ? { ...prev, ...editForm } : null))
      await queryClient.invalidateQueries({ queryKey: ['profiles'] })
      setIsEditing(false)
    } catch (err) {
      alert(
        `Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
    }
  }

  const handleFieldChange = (field: keyof Profile, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  // const Field = ({ label, field }: { label: string; field: keyof Profile }) => (
  //   <div>
  //     <h3 className="font-semibold text-sm text-muted-foreground">{label}</h3>
  //     {isEditing ? (
  //       <Input
  //         value={(editForm[field] ?? '') as string}
  //         onChange={(e) =>
  //           setEditForm((prev) => ({ ...prev, [field]: e.target.value }))
  //         }
  //       />
  //     ) : (
  //       <p>{selectedUser?.[field] || 'N/A'}</p>
  //     )}
  //   </div>
  // )

  const filteredUsers =
    view === 'pending'
      ? pendingUsers
      : allUsers?.filter((user: Profile) => user.role === view.slice(0, -1))

  const filteredAndSearchedUsers = filteredUsers?.filter((user) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    const name = user.full_name?.toLowerCase() || ''
    const email = user.email?.toLowerCase() || ''
    return name.includes(search) || email.includes(search)
  })

  const isLoading = view === 'pending' ? loadingPending : loadingAll
  const error = view === 'pending' ? errorPending : errorAll
  const users =
    view === 'pending'
      ? filteredAndSearchedUsers
      : filteredAndSearchedUsers?.slice(0, displayCount)

  if (isLoading) return <div>Loading users...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        {view === 'pending' && 'Pending Creator Applications'}
        {view === 'seekers' && 'All Seekers'}
        {view === 'creators' && 'All Creators'}
      </h2>
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          {searchTerm && (
            <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
              Clear
            </Button>
          )}
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            onClick={() => {
              setView('pending')
              setDisplayCount(10)
            }}
            variant={view === 'pending' ? 'default' : 'outline'}
          >
            Pending
          </Button>
          <Button
            onClick={() => {
              setView('seekers')
              setDisplayCount(10)
            }}
            variant={view === 'seekers' ? 'default' : 'outline'}
          >
            Seekers
          </Button>
          <Button
            onClick={() => {
              setView('creators')
              setDisplayCount(10)
            }}
            variant={view === 'creators' ? 'default' : 'outline'}
          >
            Creators
          </Button>
          <Button
            onClick={() =>
              view === 'pending' ? refetchPending() : refetchAll()
            }
            variant="outline"
          >
            Refresh
          </Button>
        </div>
      </div>

      {!users || users.length === 0 ? (
        <div>
          {searchTerm
            ? `No ${view === 'pending' ? 'pending users' : view} matching "${searchTerm}".`
            : `No ${view === 'pending' ? 'pending' : view} found.`}
        </div>
      ) : (
        <div className="max-h-[600px] overflow-auto" onScroll={handleScroll}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                {view === 'pending' && (
                  <>
                    <TableHead>Organization</TableHead>
                    <TableHead>Business Type</TableHead>
                  </>
                )}
                {view !== 'pending' && <TableHead>Role</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSelectUser(user as Profile)}
                >
                  <TableCell className="font-medium">
                    {user.full_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  {view === 'pending' && (
                    <>
                      <TableCell>{user.organization_name}</TableCell>
                      <TableCell>{user.business_type}</TableCell>
                    </>
                  )}
                  {view !== 'pending' && (
                    <TableCell className="capitalize">{user.role}</TableCell>
                  )}
                  <TableCell className="text-right space-x-2">
                    {view === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          disabled={approveCreator.isPending}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApprove(user.id, user.full_name || 'User')
                          }}
                        >
                          {approveCreator.isPending
                            ? 'Approving...'
                            : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleReject(user.id, user.full_name || 'User')
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {view !== 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectUser(user as Profile)
                        }}
                      >
                        View Details
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {view !== 'pending' &&
            filteredAndSearchedUsers &&
            displayCount < filteredAndSearchedUsers.length && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Showing {displayCount} of {filteredAndSearchedUsers.length}{' '}
                users. Scroll down for more.
              </div>
            )}
        </div>
      )}

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Profile Details</DialogTitle>
            <DialogDescription>
              Complete profile information for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Field
                    isEditing={isEditing}
                    editForm={editForm}
                    selectedUser={selectedUser}
                    onChange={handleFieldChange}
                    label="Full Name"
                    field="full_name"
                  />
                </div>
                <div>
                  <Field
                    isEditing={isEditing}
                    editForm={editForm}
                    selectedUser={selectedUser}
                    onChange={handleFieldChange}
                    label="Email"
                    field="email"
                  />
                </div>
                <div>
                  <Field
                    isEditing={isEditing}
                    editForm={editForm}
                    selectedUser={selectedUser}
                    onChange={handleFieldChange}
                    label="Phone"
                    field="phone"
                  />
                </div>
              </div>

              {/* Creator-specific fields */}
              {(selectedUser.role === 'creator' ||
                selectedUser.role === 'pending') && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Organization Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Field
                          isEditing={isEditing}
                          editForm={editForm}
                          selectedUser={selectedUser}
                          onChange={handleFieldChange}
                          label="Organisation Name"
                          field="organization_name"
                        />
                      </div>
                      <div>
                        <Field
                          isEditing={isEditing}
                          editForm={editForm}
                          selectedUser={selectedUser}
                          onChange={handleFieldChange}
                          label="Business Type"
                          field="business_type"
                        />
                      </div>
                      <div>
                        <Field
                          isEditing={isEditing}
                          editForm={editForm}
                          selectedUser={selectedUser}
                          onChange={handleFieldChange}
                          label="Registration Number"
                          field="registration_number"
                        />
                      </div>
                      <div>
                        <Field
                          isEditing={isEditing}
                          editForm={editForm}
                          selectedUser={selectedUser}
                          onChange={handleFieldChange}
                          label="Charity Number"
                          field="charity_number"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">
                      Additional Information
                    </h3>

                    {/* Organization Description - Full Width */}
                    <div className="mb-4">
                      <Field
                        isEditing={isEditing}
                        editForm={editForm}
                        selectedUser={selectedUser}
                        onChange={handleFieldChange}
                        label="Organisation Description"
                        field="organization_description"
                      />
                    </div>

                    {/* Two Column Layout for Contact Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Field
                          isEditing={isEditing}
                          editForm={editForm}
                          selectedUser={selectedUser}
                          onChange={handleFieldChange}
                          label="Primary Contact"
                          field="primary_contact_name"
                        />
                      </div>
                      <div>
                        <Field
                          isEditing={isEditing}
                          editForm={editForm}
                          selectedUser={selectedUser}
                          onChange={handleFieldChange}
                          label="Secondary Contact Name"
                          field="secondary_contact_name"
                        />
                      </div>

                      <div>
                        <Field
                          isEditing={isEditing}
                          editForm={editForm}
                          selectedUser={selectedUser}
                          onChange={handleFieldChange}
                          label="Primary Contact Phone"
                          field="primary_contact_phone"
                        />
                      </div>
                      <div>
                        <Field
                          isEditing={isEditing}
                          editForm={editForm}
                          selectedUser={selectedUser}
                          onChange={handleFieldChange}
                          label="Secondary Contact Phone"
                          field="secondary_contact_phone"
                        />
                      </div>

                      <div>
                        <Field
                          isEditing={isEditing}
                          editForm={editForm}
                          selectedUser={selectedUser}
                          onChange={handleFieldChange}
                          label="Primary Contact Position"
                          field="primary_contact_position"
                        />
                      </div>
                      <div>
                        <Field
                          isEditing={isEditing}
                          editForm={editForm}
                          selectedUser={selectedUser}
                          onChange={handleFieldChange}
                          label="Secondary Contact Position"
                          field="secondary_contact_position"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Action buttons in modal */}
              <div className="flex gap-2 justify-end">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                  // i.e. onClick={() => setIsEditing(true)}
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
