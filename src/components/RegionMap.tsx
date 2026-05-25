import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'

type MapCoordinates = {
  lat: number
  lng: number
}

type RegionMapProps = {
  coordinates?: MapCoordinates | null
  zoom?: number
  className?: string
  markerLabel?: string
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
        <CircleMarker
          center={center as [number, number]}
          radius={10}
          pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.7 }}
        >
          <Tooltip direction="top" offset={[0, -12]} opacity={0.9}>
            {markerLabel ?? (validCoordinates ? 'Selected coordinates' : 'New Zealand')}
          </Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  )
}
