import { Card, CardContent } from '@/components/ui/card'
import bg from '@/assets/images/background_main.jpeg'
import RegionMap from '@/components/RegionMap'
import { Toolbar } from '@/components/Toolbar'
import SignOutButton from '@/components/SignOutButton'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCurrentUserProfile } from '@/hooks/userProfiles'
import { useToast } from '@/hooks/use-toast'
import RemoteImage from '@/components/RemoteImage'
import placeHold from '@/assets/images/placeholder_view_vector.svg'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { generateClient } from 'aws-amplify/api'
import type { GraphQLResult } from 'aws-amplify/api'
import { createTagLocation } from '@/graphql/mutations'
import type { CreateTagLocationInput } from '@/graphql/API'

let apiClient: any = null
const getApiClient = () => {
  if (!apiClient) apiClient = generateClient()
  return apiClient
}

const listTagLocations = /* GraphQL */ `query ListTagLocations {
  listTagLocations {
    items {
      id
      address
      lat
      lng
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}`

type TagLocation = {
  id: string
  address: string
  lat?: number | null
  lng?: number | null
  createdAt?: string
  updatedAt?: string
}

type ListTagLocationsResponse = {
  listTagLocations?: {
    items: TagLocation[]
    nextToken?: string
  }
}



export default function SeekerMap() {
  const navigate = useNavigate()
  const { currentProfile } = useCurrentUserProfile()
  const location = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [coordinates, setCoordinates] = useState<null | { lat: number; lng: number }>(null)
  const [markerLabel, setMarkerLabel] = useState<string | undefined>(undefined)
  const [highlightedTagId, setHighlightedTagId] = useState<string | undefined>(undefined)
  const [hasProcessedNfcScan, setHasProcessedNfcScan] = useState(false)
  const [newAddress, setNewAddress] = useState('')

  // Fetch all tag locations
  const { data: tagLocationsData } = useQuery({
    queryKey: ['tagLocations'],
    queryFn: async () => {
      const result = (await getApiClient().graphql({
        query: listTagLocations,
      })) as GraphQLResult<ListTagLocationsResponse>
      return result.data?.listTagLocations?.items || []
    },
  })

  const createTagLocationMutation = useMutation<TagLocation, Error, string>({
    mutationFn: async (addressToSave: string) => {
      const normalizedAddress = addressToSave.trim()
      const params = new URLSearchParams({
        format: 'json',
        limit: '1',
        q: normalizedAddress,
      })
      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`
      const response = await fetch(url)
      const results = (await response.json()) as Array<{ lat: string; lon: string }>
      const geo = results?.[0]
      const lat = geo ? Number(geo.lat) : undefined
      const lng = geo ? Number(geo.lon) : undefined

      const input: CreateTagLocationInput = {
        id: normalizedAddress,
        address: normalizedAddress,
        lat: lat && !Number.isNaN(lat) ? lat : undefined,
        lng: lng && !Number.isNaN(lng) ? lng : undefined,
      }

      const createResult = (await getApiClient().graphql({
        query: createTagLocation,
        variables: { input },
        authMode: 'userPool',
      })) as GraphQLResult<{
        createTagLocation?: TagLocation
      }>

      if (!createResult.data?.createTagLocation) {
        throw new Error('Failed to save address')
      }

      return createResult.data.createTagLocation
    },
    onSuccess: (savedLocation: TagLocation) => {
      queryClient.invalidateQueries({ queryKey: ['tagLocations'] })
      setHighlightedTagId(savedLocation.id)
      if (savedLocation.lat && savedLocation.lng) {
        setCoordinates({ lat: savedLocation.lat, lng: savedLocation.lng })
      }
      setMarkerLabel(savedLocation.address)
      toast({
        title: 'Address saved',
        description: 'This location is now available for NFC scans.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Save failed',
        description:
          error?.message || 'Unable to save this address.',
        variant: 'destructive',
      })
    },
  })

  const handleSaveAddress = async () => {
    const addressToSave = newAddress.trim()
    if (!addressToSave) {
      toast({ title: 'Enter an address', description: 'Please type an address first.' })
      return
    }

    const alreadySaved = tagLocationsData?.find(
      (tag) => tag.address?.toLowerCase().trim() === addressToSave.toLowerCase().trim(),
    )

    if (alreadySaved) {
      setHighlightedTagId(alreadySaved.id)
      if (alreadySaved.lat && alreadySaved.lng) {
        setCoordinates({ lat: alreadySaved.lat, lng: alreadySaved.lng })
      }
      setMarkerLabel(alreadySaved.address)
      toast({
        title: 'Already saved',
        description: 'This address is already in the database.',
      })
      return
    }

    await createTagLocationMutation.mutateAsync(addressToSave)
    setNewAddress('')
  }

  useEffect(() => {
    let active = true

    async function geocodeAddress(inputAddress: string) {
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search')
        url.searchParams.set('format', 'json')
        url.searchParams.set('limit', '1')
        url.searchParams.set('q', inputAddress)

        const response = await fetch(url.toString())
        const results = (await response.json()) as Array<{ lat: string; lon: string }>
        if (!active || !results.length) return null

        const { lat, lon } = results[0]
        const latN = Number(lat)
        const lngN = Number(lon)
        if (Number.isNaN(latN) || Number.isNaN(lngN)) return null

        return { lat: latN, lng: lngN }
      } catch (error) {
        console.error('Geocode error:', error)
        return null
      }
    }

    const params = new URLSearchParams(location.search)
    const lat = params.get('lat')
    const lng = params.get('lng')
    const address = params.get('address')

    if (lat && lng) {
      const latN = Number(lat)
      const lngN = Number(lng)
      if (!Number.isNaN(latN) && !Number.isNaN(lngN)) {
        setCoordinates({ lat: latN, lng: lngN })
        setMarkerLabel(undefined)
        // Find and highlight the tag with these coordinates
        if (tagLocationsData) {
          const matched = tagLocationsData.find(
            (tag: TagLocation) => Math.abs((tag.lat ?? 0) - latN) < 0.001 && Math.abs((tag.lng ?? 0) - lngN) < 0.001
          )
          setHighlightedTagId(matched?.id)
        }
        return
      }
    }

    if (address) {
      const matched = tagLocationsData?.find(
        (tag: TagLocation) => tag.address?.toLowerCase() === address.toLowerCase(),
      )

      setHighlightedTagId(matched?.id)

      if (matched?.lat && matched?.lng) {
        setCoordinates({ lat: matched.lat, lng: matched.lng })
        setMarkerLabel(address)
        return
      }

      setMarkerLabel(address)
      setCoordinates(null)

      geocodeAddress(address).then((result) => {
        if (!active || !result) return
        setCoordinates(result)
        setMarkerLabel(address)
      })

      return
    }

    return () => {
      active = false
    }
  }, [location.search, tagLocationsData])

  useEffect(() => {
    if (hasProcessedNfcScan) return
    if (!currentProfile?.id) return

    const params = new URLSearchParams(location.search)
    const nfc = params.get('nfc')
    const address = params.get('address')
    const lat = params.get('lat')
    const lng = params.get('lng')

    if (!nfc || nfc !== '1') return
    if (!address && !(lat && lng)) return

    setHasProcessedNfcScan(true)
    const profileId = currentProfile.id

    async function awardScan() {
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPPORT_FUNCTION_URL}nfcAward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, lat, lng, profileId }),
          credentials: 'include',
        })

        const data = await resp.json().catch(() => null)
        if (resp.ok && data) {
          if (data.awarded) {
            toast({
              title: 'NFC Scan successful',
              description: '+100 points have been added to your profile.',
            })
          } else {
            toast({
              title: 'NFC Scan noted',
              description: data.message ?? 'You have already scanned this location recently.',
            })
          }
        } else {
          // Log full response to console to aid debugging
          console.error('nfcAward response error', { status: resp.status, body: data })
          toast({
            title: 'NFC Scan failed',
            description:
              data?.error || data?.details || 'Unable to process tag points at this time.',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'NFC Scan error',
          description: 'Unable to reach the server. Please try again later.',
          variant: 'destructive',
        })
        console.error('Map NFC award error:', error)
      }
    }

    awardScan()
  }, [currentProfile?.id, location.search, hasProcessedNfcScan, toast])

  return (
    <div
      className="relative h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <Card className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl max-w-5xl w-full h-full max-h-full flex flex-col overflow-hidden">
        <CardContent className="flex flex-col gap-4 flex-1 min-h-0 p-0">
          <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md p-4 shadow-sm border-b">
            <Toolbar>
              <Button
                variant="yellow"
                onClick={() => navigate('/user/region')}
                aria-label="Home"
              >
                <Home />
              </Button>

              <Button
                variant="yellow"
                onClick={() => navigate('/user/account')}
              >
                My Account
              </Button>

              <Button
                variant="yellow"
                onClick={() =>
                  navigate('/user/account', {
                    state: { defaultTab: 'my-quests' },
                  })
                }
              >
                My Quests
              </Button>

              <Button variant="yellow" onClick={() => navigate('/user/leader')}>
                Leader Board
              </Button>

              <Button variant="yellow" onClick={() => navigate('/user/help')}>
                Help Guide
              </Button>

              <SignOutButton />
            </Toolbar>
          </div>

          {currentProfile && (
            <div className="px-4 py-4 border-b border-white/20 bg-white/80">
              <div className="max-w-3xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Add a QuestMark address for NFC scans
                  </label>
                  <Input
                    value={newAddress}
                    onChange={(event) => setNewAddress(event.target.value)}
                    placeholder="Enter an address to save for NFC scans"
                  />
                </div>
                <Button
                  className="mt-3 sm:mt-0 sm:ml-4"
                  variant="yellow"
                  onClick={handleSaveAddress}
                  disabled={createTagLocationMutation.isPending}
                >
                  {createTagLocationMutation.isPending ? 'Saving…' : 'Save Address'}
                </Button>
              </div>
            </div>
          )}

          <RegionMap
            className="mt-6 w-full max-w-xl mx-auto"
            coordinates={coordinates ?? undefined}
            markerLabel={markerLabel}
            tagLocations={tagLocationsData}
            highlightedTagId={highlightedTagId}
          />

          {currentProfile && (
            <div className="px-4">
              <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg w-full max-w-sm mx-auto">
                <RemoteImage
                  path={currentProfile.image_thumbnail || placeHold}
                  fallback={placeHold}
                  className="w-12 h-12 rounded-full object-cover"
                  alt={currentProfile.full_name || 'User avatar'}
                />
                <div>
                  <div className="font-semibold">{currentProfile.full_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {currentProfile.role} • {currentProfile.points ?? 0} pts
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
