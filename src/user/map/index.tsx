import { Card, CardContent } from '@/components/ui/card'
import bg from '@/assets/images/background_main.jpeg'
import RegionMap from '@/components/RegionMap'
import { Toolbar } from '@/components/Toolbar'
import SignOutButton from '@/components/SignOutButton'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCurrentUserProfile } from '@/hooks/userProfiles'
import RemoteImage from '@/components/RemoteImage'
import placeHold from '@/assets/images/placeholder_view_vector.svg'
import { useQuery } from '@tanstack/react-query'
import { generateClient } from 'aws-amplify/api'
import type { GraphQLResult } from 'aws-amplify/api'

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
  const [coordinates, setCoordinates] = useState<null | { lat: number; lng: number }>(null)
  const [markerLabel, setMarkerLabel] = useState<string | undefined>(undefined)
  const [highlightedTagId, setHighlightedTagId] = useState<string | undefined>(undefined)

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

  useEffect(() => {
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
            (tag: any) => Math.abs(tag.lat - latN) < 0.001 && Math.abs(tag.lng - lngN) < 0.001
          )
          setHighlightedTagId(matched?.id)
        }
        return
      }
    }

    if (address) {
      setMarkerLabel(address)
      setCoordinates(null)
      // Find and highlight the tag with this address
      if (tagLocationsData) {
        const matched = tagLocationsData.find(
          (tag: any) => tag.address?.toLowerCase() === address.toLowerCase()
        )
        setHighlightedTagId(matched?.id)
      }
      return
    }
  }, [location.search, tagLocationsData])

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
