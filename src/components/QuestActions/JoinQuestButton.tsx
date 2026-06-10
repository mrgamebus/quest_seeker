'use client'

import { useState } from 'react'

interface JoinQuestButtonProps {
  hasJoined: boolean
  joining: boolean
  entryFee?: number | null
  isParticipationFull: boolean
  participantLimit: number | null
  currentParticipants: number
  onJoin: () => void
  termsContent?: string
}

export default function JoinQuestButton({
  hasJoined,
  joining,
  entryFee = 0,
  isParticipationFull,
  participantLimit,
  currentParticipants,
  onJoin,
  termsContent,
}: JoinQuestButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  console.log('termsContent', termsContent)
  if (isParticipationFull) {
    return (
      <p className="text-sm text-red-500">
        Quest full ({participantLimit?.toLocaleString()} participant limit
        reached)
      </p>
    )
  }

  if (hasJoined) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-300 rounded-lg">
        <span className="text-green-600 font-semibold text-sm">✅ Joined!</span>
      </div>
    )
  }

  const fee = entryFee || 0
  const isFreeQuest = fee === 0
  const isAlmostFull =
    participantLimit !== null && currentParticipants / participantLimit >= 0.75

  const handleConfirm = () => {
    setShowModal(false)
    setShowTerms(false)
    onJoin()
  }

  const handleClose = () => {
    setShowModal(false)
    setShowTerms(false)
  }

  const defaultTerms = `1. Eligibility\nYou must be 18 years or older to participate in quests.

2. Entry & Fees\nEntry fees are non-refundable once you have joined a quest, except where required by law.

3. Conduct\nParticipants must behave respectfully. Any abusive, fraudulent, or disruptive behaviour may result in disqualification without refund.

4. Results & Rewards\nRewards are distributed at the end of the quest period. Results are final once verified.

5. Privacy\nYour participation data is handled in accordance with our Privacy Policy.

6. Changes\nWe reserve the right to modify or cancel a quest at any time. Affected participants will be notified and refunded where applicable.`

  return (
    <>
      {/* Join Button */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => setShowModal(true)}
          disabled={joining}
          className={`px-4 py-2 rounded text-white text-sm font-medium transition-colors ${
            joining
              ? 'bg-yellow-300 cursor-not-allowed'
              : 'bg-[#facc15] hover:bg-[#ca8a04]'
          }`}
        >
          {joining ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Joining...
            </span>
          ) : (
            <>{isFreeQuest ? '🎉 Join Free Quest!' : `💳 Join for $${fee}`}</>
          )}
        </button>
        {isAlmostFull && (
          <span className="text-sm text-orange-500 font-medium">
            🔥 Not many spaces left!
          </span>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col">
            {showTerms ? (
              /* ── Terms view ── */
              <>
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setShowTerms(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Back"
                  >
                    ←
                  </button>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Terms & Conditions
                  </h2>
                </div>
                <div className="overflow-y-auto max-h-72 text-sm text-gray-600 whitespace-pre-line leading-relaxed pr-1">
                  {termsContent || defaultTerms}
                </div>
                <button
                  onClick={() => setShowTerms(false)}
                  className="mt-5 w-full px-4 py-2 rounded text-sm font-medium text-white bg-[#facc15] hover:bg-[#ca8a04] transition-colors"
                >
                  Got it
                </button>
              </>
            ) : (
              /* ── Confirm view ── */
              <>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Before you join…
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  By joining this quest
                  {!isFreeQuest ? ` and paying $${fee}` : ''}, you agree to our{' '}
                  <button
                    onClick={() => setShowTerms(true)}
                    className="text-blue-600 underline hover:text-blue-800 transition-colors"
                  >
                    Terms & Conditions
                  </button>
                  .
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-2 rounded text-sm font-medium text-white bg-[#facc15] hover:bg-[#ca8a04] transition-colors"
                  >
                    Agree & Join
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
