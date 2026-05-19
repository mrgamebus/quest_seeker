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
import { useEffect, useState, useMemo } from 'react'

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

async function normalizeImage(url: string): Promise<string | null> {
  try {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'

    const loadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = url
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Image load timeout')), 10000),
    )

    await Promise.race([loadPromise, timeoutPromise])

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context failed')

    ctx.drawImage(img, 0, 0)

    return canvas.toDataURL('image/jpeg', 0.92)
  } catch (error) {
    console.error('❌ Image normalization failed:', url, error)
    return null
  }
}

function createMapPlaceholder(lat: number, lng: number): string {
  const canvas = document.createElement('canvas')
  const size = 400
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const gradient = ctx.createLinearGradient(0, 0, 0, size)
  gradient.addColorStop(0, '#e8f4f8')
  gradient.addColorStop(1, '#b8d4e8')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

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

  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.beginPath()
  ctx.ellipse(size / 2, size / 2 + 65, 20, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ff4444'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2 - 20, 25, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(size / 2, size / 2 + 5)
  ctx.lineTo(size / 2 - 15, size / 2 + 35)
  ctx.lineTo(size / 2 + 15, size / 2 + 35)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2 - 20, 10, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#4a90a4'
  ctx.lineWidth = 3
  ctx.strokeRect(0, 0, size, size)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.fillRect(20, size - 100, size - 40, 80)
  ctx.strokeStyle = '#4a90a4'
  ctx.lineWidth = 2
  ctx.strokeRect(20, size - 100, size - 40, 80)

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
    if (!location || location.trim() === '') {
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

      const response = await fetch(tileUrl)
      if (!response.ok) throw new Error('Tile fetch failed')

      const blob = await response.blob()
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      return base64
    } catch (tileError) {
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
  const [error, setError] = useState<string | null>(null)

  const tasksKey = useMemo(() => {
    return seekerTasks.map((t) => t.id).join('-')
  }, [seekerTasks])

  useEffect(() => {
    let mounted = true
    setIsReady(false)
    setError(null)

    const processTimeout = setTimeout(() => {
      if (mounted) {
        console.error('⏱️ Processing timeout - forcing ready state')
        setError('Some images failed to load')
        setIsReady(true)
      }
    }, 30000) // 30 second overall timeout

    ;(async () => {
      try {
        const normalized = await Promise.all(
          seekerTasks.map(
            async (task, index): Promise<TaskWithNormalizedImage> => {
              const result: TaskWithNormalizedImage = { ...task }

              if (task.isImage && task.answer) {
                result.normalizedAnswer = await normalizeImage(task.answer)
              }

              // Generate map image for location tasks
              if (task.isLocation && task.location) {
                result.normalizedMapImage = await generateMapImage(
                  task.location,
                )
              }

              return result
            },
          ),
        )

        if (mounted) {
          setTasks(normalized)
          setIsReady(true)
          clearTimeout(processTimeout)
        }
      } catch (err) {
        console.error('❌ Error processing tasks:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setIsReady(true)
          clearTimeout(processTimeout)
        }
      }
    })()

    return () => {
      mounted = false
      clearTimeout(processTimeout)
    }
  }, [tasksKey])

  if (!isReady) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>Preparing PDF...</Text>
        </Page>
      </Document>
    )
  }

  if (error && tasks.length === 0) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>Error loading tasks: {error}</Text>
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
                {task.normalizedAnswer ? (
                  <Image
                    src={task.normalizedAnswer}
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: 'cover',
                      marginTop: 6,
                    }}
                  />
                ) : (
                  <Text style={styles.answerText}>(Image failed to load)</Text>
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

        {error && (
          <Text style={{ marginTop: 12, fontSize: 10, color: '#666' }}>
            Note: Some images may not have loaded properly
          </Text>
        )}
      </Page>
    </Document>
  )
}
