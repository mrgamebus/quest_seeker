interface PaymentSuccessBannerProps {
  show: boolean
}

export default function PaymentSuccessBanner({
  show,
}: PaymentSuccessBannerProps) {
  if (!show) return null

  return (
    <div className="w-full bg-green-100 border border-green-300 text-green-800 rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <span className="text-lg">🎉</span>
      <span>Payment successful! You've joined the quest.</span>
    </div>
  )
}
