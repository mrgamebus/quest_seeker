import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { DynamoDBStreamEvent } from 'aws-lambda'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))

const RANKS = [
  { rank: 'navigator', minPercentile: 80 },
  { rank: 'trailblazer', minPercentile: 60 },
  { rank: 'tracker', minPercentile: 40 },
  { rank: 'scout', minPercentile: 20 },
  { rank: 'wanderer', minPercentile: 0 },
]

export const handler = async (event: DynamoDBStreamEvent) => {
  // Only proceed if a points field actually changed
  const pointsChanged = event.Records.some((record) => {
    const oldPoints = record.dynamodb?.OldImage?.points?.N
    const newPoints = record.dynamodb?.NewImage?.points?.N
    return oldPoints !== newPoints
  })

  if (!pointsChanged) return

  // Fetch all users' points
  const result = await client.send(
    new ScanCommand({
      TableName: process.env.PROFILE_TABLE_NAME!,
      ProjectionExpression: 'id, points, seeker_rank',
    }),
  )

  const users = result.Items ?? []
  const allPoints = users
    .map((u) => Number(u.points?.N ?? 0))
    .sort((a, b) => a - b) // ascending

  const total = allPoints.length

  // Recalculate rank for every user
  for (const user of users) {
    const userPoints = Number(user.points?.N ?? 0)
    const countBelow = allPoints.filter((p) => p < userPoints).length
    const percentile = total > 1 ? (countBelow / (total - 1)) * 100 : 100

    const newRank =
      RANKS.find((r) => percentile >= r.minPercentile)?.rank ?? 'wanderer'

    if (newRank !== user.seeker_rank?.S) {
      await client.send(
        new UpdateCommand({
          TableName: process.env.PROFILE_TABLE_NAME!,
          Key: { id: user.id?.S },
          UpdateExpression: 'SET seeker_rank = :rank',
          ExpressionAttributeValues: { ':rank': newRank },
        }),
      )
      console.log(`Updated ${user.id?.S}: ${user.seeker_rank?.S} → ${newRank}`)
    }
  }
}
