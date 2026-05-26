interface FundraisingInfoProps {
  entryFee: number
  participantCount: number
}

export default function FundraisingInfo({
  entryFee,
  participantCount,
}: FundraisingInfoProps) {
  const totalRaised = entryFee * participantCount

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 inline-block">
      <p className="text-sm text-green-700 font-semibold flex items-center gap-2">
        <span>💰</span>
        Funds Raised: ${totalRaised.toLocaleString()}
      </p>
    </div>
  )
}
