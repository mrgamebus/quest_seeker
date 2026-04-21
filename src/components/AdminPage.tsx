import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { usePendingUsers } from '@/hooks/usePendingProfiles'
import { Button } from './ui/button'
import { useApproveCreator } from '@/hooks/useApproveCreator'

export default function AdminPage() {
  const { data: pendingUsers, isLoading, error, refetch } = usePendingUsers()
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

  if (isLoading) return <div>Loading pending users...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!pendingUsers || pendingUsers.length === 0) {
    return <div>No pending users found.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pending Creator Applications</h2>
        <Button onClick={() => refetch()} variant="outline">
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Business Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.organization_name}</TableCell>
              <TableCell>{user.business_type}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  size="sm"
                  variant="default"
                  disabled={approveCreator.isPending}
                  onClick={() =>
                    handleApprove(user.id, user.full_name || 'User')
                  }
                >
                  {approveCreator.isPending ? 'Approving...' : 'Approve'}
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
