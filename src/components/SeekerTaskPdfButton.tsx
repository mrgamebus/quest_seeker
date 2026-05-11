import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import { Task, PdfUser } from '@/types'
import { Quest } from '@/graphql/API'
import { useEffect, useState } from 'react'

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 12, fontFamily: 'Helvetica' },
  header: { fontSize: 20, marginBottom: 12, fontWeight: 'bold' },
  subheader: { fontSize: 14, marginBottom: 8, marginTop: 12 },
  taskBlock: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 8,
  },
  taskTitle: { fontSize: 13, fontWeight: 'bold' },
  answerLabel: { marginTop: 4, fontSize: 11, fontWeight: 'bold' },
  answerText: { fontSize: 11, marginTop: 2 },
})

interface SeekerPdfProps {
  quest: Quest
  seekerTasks: Task[]
  user: PdfUser
}

type TaskWithNormalizedImage = Task & {
  normalizedAnswer?: string | null
  normalizedMapImage?: string | null
}

async function normalizeImage(url: string): Promise<string> {
  const img = new window.Image()
  img.crossOrigin = 'anonymous'
  img.src = url
  await img.decode()

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight

  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  return canvas.toDataURL('image/jpeg', 0.92)
}

// Create a visual map placeholder with coordinates
function createMapPlaceholder(lat: number, lng: number): string {
  const canvas = document.createElement('canvas')
  const size = 400
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, size)
  gradient.addColorStop(0, '#e8f4f8')
  gradient.addColorStop(1, '#b8d4e8')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  // Grid lines (to simulate map)
  ctx.strokeStyle = '#90b8d0'
  ctx.lineWidth = 1
  const gridSize = 40
  for (let i = 0; i <= size; i += gridSize) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }

  // Pin shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.beginPath()
  ctx.ellipse(size / 2, size / 2 + 65, 20, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  // Pin body (red marker)
  ctx.fillStyle = '#ff4444'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2 - 20, 25, 0, Math.PI * 2)
  ctx.fill()

  // Pin point
  ctx.beginPath()
  ctx.moveTo(size / 2, size / 2 + 5)
  ctx.lineTo(size / 2 - 15, size / 2 + 35)
  ctx.lineTo(size / 2 + 15, size / 2 + 35)
  ctx.closePath()
  ctx.fill()

  // Pin inner circle (white)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2 - 20, 10, 0, Math.PI * 2)
  ctx.fill()

  // Border
  ctx.strokeStyle = '#4a90a4'
  ctx.lineWidth = 3
  ctx.strokeRect(0, 0, size, size)

  // Text background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.fillRect(20, size - 100, size - 40, 80)
  ctx.strokeStyle = '#4a90a4'
  ctx.lineWidth = 2
  ctx.strokeRect(20, size - 100, size - 40, 80)

  // Text
  ctx.fillStyle = '#333'
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('📍 Location', size / 2, size - 70)

  ctx.font = '16px monospace'
  ctx.fillText(`${lat.toFixed(6)}°, ${lng.toFixed(6)}°`, size / 2, size - 45)

  ctx.font = '12px Arial'
  ctx.fillStyle = '#666'
  ctx.fillText('(Map preview unavailable)', size / 2, size - 25)

  return canvas.toDataURL('image/png')
}

async function generateMapImage(location: string): Promise<string | null> {
  try {
    console.log('🗺️ Generating map for location:', location)

    if (!location || location.trim() === '') {
      console.log('❌ No location provided')
      return null
    }

    // Parse the location string
    let lat: number, lng: number

    if (location.includes(',')) {
      const [latStr, lngStr] = location.split(',')
      lat = parseFloat(latStr.trim())
      lng = parseFloat(lngStr.trim())
    } else {
      try {
        const parsed = JSON.parse(location)
        lat = parsed.lat || parsed.latitude
        lng = parsed.lng || parsed.longitude
      } catch {
        console.error('❌ Could not parse location as JSON:', location)
        return null
      }
    }

    if (isNaN(lat) || isNaN(lng)) {
      console.error('❌ Invalid coordinates:', { lat, lng, original: location })
      return null
    }

    console.log('✅ Parsed coordinates:', { lat, lng })

    // Try fetching an OSM tile via fetch (to avoid CORS on img element)
    try {
      const zoom = 15
      const tileX = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom))
      const tileY = Math.floor(
        ((1 -
          Math.log(
            Math.tan((lat * Math.PI) / 180) +
              1 / Math.cos((lat * Math.PI) / 180),
          ) /
            Math.PI) /
          2) *
          Math.pow(2, zoom),
      )

      const tileUrl = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`
      console.log('🔍 Fetching OSM tile:', tileUrl)

      const response = await fetch(tileUrl)
      if (!response.ok) throw new Error('Tile fetch failed')

      const blob = await response.blob()
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      console.log('✅ OSM tile converted successfully')
      return base64
    } catch (tileError) {
      console.log('⚠️ Tile fetch failed, using placeholder:', tileError)
      // Always fall back to placeholder - it's reliable and looks professional
      return createMapPlaceholder(lat, lng)
    }
  } catch (error) {
    console.error('❌ Map generation failed:', error)
    return null
  }
}

export default function SeekerTaskPdfButton({
  quest,
  seekerTasks,
  user,
}: SeekerPdfProps) {
  const [tasks, setTasks] = useState<TaskWithNormalizedImage[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let mounted = true
    setIsReady(false)

    console.log('📋 Starting to process tasks:', seekerTasks)
    ;(async () => {
      const normalized = await Promise.all(
        seekerTasks.map(
          async (task, index): Promise<TaskWithNormalizedImage> => {
            console.log(`\n🔍 Processing task ${index + 1}:`, {
              id: task.id,
              description: task.description,
              isImage: task.isImage,
              isLocation: task.isLocation,
              location: task.location,
              answer: task.answer,
            })

            const result: TaskWithNormalizedImage = { ...task }

            // Normalize image tasks
            if (task.isImage && task.answer) {
              console.log(`  📸 Normalizing image for task ${index + 1}`)
              result.normalizedAnswer = await normalizeImage(task.answer)
              console.log(`  ✅ Image normalized for task ${index + 1}`)
            }

            // Generate map image for location tasks
            if (task.isLocation && task.location) {
              console.log(`  🗺️ Generating map for task ${index + 1}`)
              result.normalizedMapImage = await generateMapImage(task.location)
              console.log(
                `  ${result.normalizedMapImage ? '✅' : '❌'} Map generation ${result.normalizedMapImage ? 'succeeded' : 'failed'} for task ${index + 1}`,
              )
            }

            return result
          },
        ),
      )

      console.log('\n✅ All tasks processed:', normalized)

      if (mounted) {
        setTasks(normalized)
        setIsReady(true)
      }
    })()

    return () => {
      mounted = false
    }
  }, [seekerTasks])

  console.log('Seeker tasks: ', tasks)
  console.log('Is ready: ', isReady)

  // ✅ Wait for normalization to complete before rendering
  if (!isReady || !tasks.length) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>Loading tasks...</Text>
        </Page>
      </Document>
    )
  }

  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.header}>{quest.quest_name}</Text>
        <Text>Completed by: {user.full_name}</Text>
        <Text>Date: {new Date().toLocaleDateString()}</Text>

        <Text style={styles.subheader}>Your Task Answers</Text>

        {tasks.map((task, index) => (
          <View key={task.id} style={styles.taskBlock}>
            <Text style={styles.taskTitle}>
              Task {index + 1}: {task.description}
            </Text>

            {task.requiresCaption && (
              <>
                <Text style={styles.answerLabel}>Caption:</Text>
                <Text style={styles.answerText}>
                  {task.caption || 'No caption provided'}
                </Text>
              </>
            )}

            {task.isImage && (
              <>
                <Text style={styles.answerLabel}>Image:</Text>
                {task.normalizedAnswer && (
                  <Image
                    src={task.normalizedAnswer}
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: 'cover',
                      marginTop: 6,
                    }}
                  />
                )}
              </>
            )}

            {task.isLocation && (
              <>
                <Text style={styles.answerLabel}>Location:</Text>
                {task.location && (
                  <Text style={styles.answerText}>{task.location}</Text>
                )}
                {task.normalizedMapImage && (
                  <Image
                    src={task.normalizedMapImage}
                    style={{
                      width: 200,
                      height: 200,
                      marginTop: 6,
                    }}
                  />
                )}
              </>
            )}
          </View>
        ))}
      </Page>
    </Document>
  )
}
