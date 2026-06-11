import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ScanHandler() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Processing scan...')
  const [profileId, setProfileId] = useState<string | null | undefined>(
    undefined,
  )
  const [authChecked, setAuthChecked] = useState(false)

  // Load Amplify auth
  useEffect(() => {
    let cancelled = false

    async function loadAuth() {
      try {
        const amplifyModule = await import('aws-amplify')
        const Auth = (amplifyModule as any).Auth
        const user = await Auth.currentAuthenticatedUser()
        if (!cancelled) setProfileId(user?.username ?? null)
      } catch {
        if (!cancelled) setProfileId(null)
      } finally {
        if (!cancelled) setAuthChecked(true)
      }
    }

    loadAuth()
    return () => {
      cancelled = true
    }
  }, [])

  // Handle scan once auth is known
  useEffect(() => {
    if (!authChecked) return

    const params = new URLSearchParams(window.location.search)
    const address = params.get('address')
    const lat = params.get('lat')
    const lng = params.get('lng')

    async function handleScan() {
      if (!address && !(lat && lng)) {
        setMessage('No address or coordinates found in the tag URL.')
        return
      }

      const targetParams = new URLSearchParams()
      if (lat && lng) {
        targetParams.set('lat', lat)
        targetParams.set('lng', lng)
      } else if (address) {
        targetParams.set('address', address)
      }

      if (!profileId) {
        setMessage(
          'Not signed in — redirecting to the map. Sign in to earn points.',
        )
        setTimeout(() => {
          navigate(`/user/map?${targetParams.toString()}`)
        }, 1100)
        return
      }

      try {
        const resp = await fetch(
          `${import.meta.env.VITE_NFC_AWARD_FUNCTION_URL}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, lat, lng, profileId }),
            credentials: 'include',
          },
        )

        const data = await resp.json().catch(() => null)

        if (resp.ok && data?.awarded) {
          setMessage('+100 points awarded! Redirecting to map...')
        } else if (resp.ok) {
          setMessage(data?.message || 'Scan received. Redirecting to map...')
        } else {
          console.error('nfcAward response error', {
            status: resp.status,
            body: data,
          })
          setMessage(
            data?.error ||
              data?.details ||
              'Scan processed. Redirecting to map...',
          )
        }
      } catch (err) {
        console.error('Scan handler error:', err)
        setMessage('Network error — continuing to map...')
      }

      setTimeout(() => {
        navigate(`/user/map?${targetParams.toString()}`)
      }, 1100)
    }

    handleScan()
  }, [navigate, authChecked, profileId])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow-md text-center">
        <h2 className="text-lg font-semibold">NFC Tag Scan</h2>
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
