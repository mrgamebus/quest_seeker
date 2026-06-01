import { Input } from './ui/input'
import type { GetProfileQuery } from '@/graphql/API'

export type Profile = NonNullable<GetProfileQuery['getProfile']>

export const Field = ({
  label,
  field,
  isEditing,
  editForm,
  selectedUser,
  onChange,
}: {
  label: string
  field: keyof Profile
  isEditing: boolean
  editForm: Partial<Profile>
  selectedUser: Profile | null
  onChange: (field: keyof Profile, value: string) => void
}) => (
  <div>
    <h3 className="font-semibold text-sm text-muted-foreground">{label}</h3>
    {isEditing ? (
      <Input
        value={(editForm[field] ?? '') as string}
        onChange={(e) => onChange(field, e.target.value)}
      />
    ) : (
      <p>{selectedUser?.[field] ?? 'N/A'}</p>
    )}
  </div>
)
