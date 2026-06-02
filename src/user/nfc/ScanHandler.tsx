import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentUserProfile } from '@/hooks/userProfiles'

export default function ScanHandler() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Processing scan...')
  const { currentProfile } = useCurrentUserProfile()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const address = params.get('address')
    const lat = params.get('lat')
    const lng = params.get('lng')

    async function handleScan() {
      if (!address && !(lat && lng)) {
        setMessage('No address or coordinates found in the tag URL.')
        return
      }

      try {
        // NOTE: replace `/api/nfcAward` with the actual function URL or API Gateway path
        const profileId = currentProfile?.id

        if (!profileId) {
          setMessage('Please sign in to receive points')
          setTimeout(() => navigate('/user/account'), 1200)
          return
        }

        const resp = await fetch('/api/nfcAward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, lat, lng, profileId }),
          credentials: 'include',
        })

        const data = await resp.json().catch(() => null)

        if (resp.ok && data && data.awarded) {
          setMessage('+100 points awarded! Redirecting to map...')
        } else if (resp.ok && data && !data.awarded) {
          setMessage(
            data.message || 'Scan received. Redirecting to map...',
          )
        } else {
          setMessage('Scan processed. Redirecting to map...')
        }
      } catch (err) {
        console.error('Scan handler error:', err)
        setMessage('Network error — continuing to map...')
      }

      // Redirect to the user map with the same params so the map can highlight the location
      const targetParams = new URLSearchParams()
      if (lat && lng) {
        targetParams.set('lat', lat)
        targetParams.set('lng', lng)
      } else if (address) {
        targetParams.set('address', address)
      }

      setTimeout(() => {
        navigate(`/user/map?${targetParams.toString()}`)
      }, 1100)
    }

    handleScan()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow-md text-center">
        <h2 className="text-lg font-semibold">NFC Tag Scan</h2>
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
