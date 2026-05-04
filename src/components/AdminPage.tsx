import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { usePendingUsers } from '@/hooks/usePendingProfiles'
import { useAllUsers } from '@/hooks/userProfiles'
import { Button } from './ui/button'
import { useApproveCreator } from '@/hooks/useApproveCreator'
import { Input } from './ui/input'

export default function AdminPage() {
  const [view, setView] = useState<'pending' | 'seekers' | 'creators'>(
    'pending',
  )
  const [displayCount, setDisplayCount] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

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

  // Filter users based on view
  const filteredUsers =
    view === 'pending'
      ? pendingUsers
      : allUsers?.filter((user) => user.role === view.slice(0, -1)) // 'seekers' -> 'seeker', 'creators' -> 'creator'

  // Apply search filter
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
          <div className="h-4 w-px bg-border mx-1" /> {/* Visual separator */}
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
                <TableRow key={user.id}>
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
                          onClick={() =>
                            handleApprove(user.id, user.full_name || 'User')
                          }
                        >
                          {approveCreator.isPending
                            ? 'Approving...'
                            : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            // TODO: Reject user - change role back to 'seeker'
                            console.log('Reject', user.id)
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
                        onClick={() => console.log('View details', user.id)}
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
    </div>
  )
}
