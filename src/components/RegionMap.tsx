import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'

type MapCoordinates = {
  lat: number
  lng: number
}

type TagLocation = {
  id: string
  address: string
  lat?: number | null
  lng?: number | null
}

type RegionMapProps = {
  coordinates?: MapCoordinates | null
  zoom?: number
  className?: string
  markerLabel?: string
  tagLocations?: TagLocation[]
  highlightedTagId?: string
}

const NZ_CENTER: MapCoordinates = {
  lat: -40.9006,
  lng: 174.8860,
}

function isLatitude(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value) <= 90
}

function isLongitude(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value) <= 180
}

export default function RegionMap({
  coordinates,
  zoom = 5,
  className,
  markerLabel,
  tagLocations,
  highlightedTagId,
}: RegionMapProps) {
  const validCoordinates =
    coordinates && isLatitude(coordinates.lat) && isLongitude(coordinates.lng)

  const center = validCoordinates
    ? [coordinates.lat, coordinates.lng]
    : [NZ_CENTER.lat, NZ_CENTER.lng]

  return (
    <div className={className}>
      <MapContainer
        center={center as [number, number]}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-72 w-full rounded-3xl overflow-hidden border border-slate-200"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render all tag locations as markers */}
        {tagLocations &&
          tagLocations.map((tag) => {
            if (!tag.lat || !tag.lng || !isLatitude(tag.lat) || !isLongitude(tag.lng)) {
              return null
            }
            const isHighlighted = highlightedTagId === tag.id
            return (
              <CircleMarker
                key={tag.id}
                center={[tag.lat, tag.lng]}
                radius={isHighlighted ? 12 : 8}
                pathOptions={{
                  color: isHighlighted ? '#dc2626' : '#10b981',
                  fillColor: isHighlighted ? '#ef4444' : '#34d399',
                  fillOpacity: isHighlighted ? 0.8 : 0.6,
                  weight: isHighlighted ? 3 : 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -12]} opacity={0.9}>
                  {tag.address}
                </Tooltip>
              </CircleMarker>
            )
          })}

        {/* Render primary marker (scanned address or custom coordinates) */}
        {(validCoordinates || markerLabel) && (
          <CircleMarker
            center={center as [number, number]}
            radius={10}
            pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.7 }}
          >
            <Tooltip direction="top" offset={[0, -12]} opacity={0.9}>
              {markerLabel ?? (validCoordinates ? 'Selected coordinates' : 'New Zealand')}
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  )
}
