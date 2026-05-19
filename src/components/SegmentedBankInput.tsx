import { useRef, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface BankDetails {
  accountName: string
  accountNumber: string
}

interface BankInputProps {
  onComplete: (details: BankDetails) => void
  initialValue?: string
}

export const SegmentedBankInput = ({
  onComplete,
  initialValue,
}: BankInputProps) => {
  const [accountName, setAccountName] = useState('')
  const [segments, setSegments] = useState({
    bank: '',
    branch: '',
    account: '',
    suffix: '',
  })

  const refs = {
    bank: useRef<HTMLInputElement>(null),
    branch: useRef<HTMLInputElement>(null),
    account: useRef<HTMLInputElement>(null),
    suffix: useRef<HTMLInputElement>(null),
  }

  useEffect(() => {
    if (initialValue && initialValue.includes('|')) {
      const [name, fullNumber] = initialValue.split('|')
      setAccountName(name)
      const parts = fullNumber.split('-')
      setSegments({
        bank: parts[0] || '',
        branch: parts[1] || '',
        account: parts[2] || '',
        suffix: parts[3] || '',
      })
    }
  }, [initialValue])

  // Helper to sync changes back to the parent
  const emitChange = (
    currentName: string,
    currentSegments: typeof segments,
  ) => {
    onComplete({
      accountName: currentName,
      accountNumber: `${currentSegments.bank}-${currentSegments.branch}-${currentSegments.account}-${currentSegments.suffix}`,
    })
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setAccountName(newName)
    emitChange(newName, segments)
  }

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof segments,
    maxLength: number,
    nextKey: keyof typeof segments | null,
  ) => {
    const val = e.target.value.replace(/\D/g, '')
    const updatedSegments = { ...segments, [key]: val }
    setSegments(updatedSegments)

    if (val.length >= maxLength && nextKey) {
      refs[nextKey].current?.focus()
    }

    emitChange(accountName, updatedSegments)
  }

  return (
    <div className="flex flex-col gap-4">
      {' '}
      {/* Increased gap for layout */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Name of Account
        </label>
        <Input
          className="w-full max-w-sm"
          placeholder="e.g. J SMITH"
          value={accountName}
          onChange={handleNameChange}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Bank Account Number
        </label>
        <div className="flex items-center justify-between gap-0.5 md:gap-2 w-full max-w-full overflow-x-hidden">
          <Input
            ref={refs.bank}
            className="w-[12%] min-w-[38px] px-0 text-center text-sm md:text-base"
            placeholder="00"
            maxLength={2}
            inputMode="numeric"
            value={segments.bank}
            onChange={(e) => handleNumberChange(e, 'bank', 2, 'branch')}
          />
          <span className="text-gray-400">-</span>
          <Input
            ref={refs.branch}
            className="w-[18%] min-w-[50px] px-0 text-center text-sm md:text-base"
            placeholder="0000"
            maxLength={4}
            inputMode="numeric"
            value={segments.branch}
            onChange={(e) => handleNumberChange(e, 'branch', 4, 'account')}
          />
          <span className="text-gray-400">-</span>
          <Input
            ref={refs.account}
            className="flex-1 min-w-[80px] px-0 text-center text-sm md:text-base"
            placeholder="0000000"
            maxLength={7}
            inputMode="numeric"
            value={segments.account}
            onChange={(e) => handleNumberChange(e, 'account', 7, 'suffix')}
          />
          <span className="text-gray-400">-</span>
          <Input
            ref={refs.suffix}
            className="w-[15%] min-w-[42px] px-0 text-center text-sm md:text-base"
            placeholder="00"
            maxLength={3}
            inputMode="numeric"
            value={segments.suffix}
            onChange={(e) => handleNumberChange(e, 'suffix', 3, null)}
          />
        </div>
      </div>
    </div>
  )
}
