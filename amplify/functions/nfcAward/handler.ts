import type { Handler } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb'

const ddbClient = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false },
})

type FunctionUrlEvent = {
  version: string
  routeKey: string
  rawPath: string
  rawQueryString: string
  headers: Record<string, string>
  requestContext: {
    accountId: string
    apiId: string
    domainName: string
    domainPrefix: string
    http: {
      method: string
      path: string
      protocol: string
      sourceIp: string
      userAgent: string
    }
    requestId: string
    routeKey: string
    stage: string
    time: string
    timeEpoch: number
  }
  body?: string
  isBase64Encoded: boolean
}

type FunctionUrlResponse = {
  statusCode: number
  headers: Record<string, string>
  body: string
}

export const handler: Handler<FunctionUrlEvent, FunctionUrlResponse> = async (
  event,
) => {
  const method = event.requestContext.http.method


  const cors = {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
  }


  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: cors,
      body: ""
    }
  }

  if (method !== "POST") {
    return {
      statusCode: 405,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed", received: method })
    }
  }

  try {
    const payload = JSON.parse(event.body || "{}")
    const { address, lat, lng, profileId } = payload

    if (!profileId) {
      return {
        statusCode: 401,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing profileId (user not signed in)" })
      }
    }

    if (!address && !(lat && lng)) {
      return {
        statusCode: 400,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing address or coordinates" })
      }
    }

    const PROFILE_TABLE = process.env.PROFILE_TABLE_NAME!
    const TAG_TABLE = process.env.TAG_LOCATION_TABLE_NAME!
    const SCANS_TABLE = process.env.NFC_SCANS_TABLE_NAME!

    const addressKey = address ? String(address).trim() : `${lat},${lng}`

    const now = Math.floor(Date.now() / 1000)
    const WEEK = 7 * 24 * 60 * 60
    const cutoff = now - WEEK

    // Ensure TagLocation exists
    try {
      await ddb.send(
        new UpdateCommand({
          TableName: TAG_TABLE,
          Key: { id: addressKey },
          UpdateExpression:
            "SET address = if_not_exists(address, :address), lat = if_not_exists(lat, :lat), lng = if_not_exists(lng, :lng), createdAt = if_not_exists(createdAt, :now), updatedAt = :now",
          ExpressionAttributeValues: {
            ":address": addressKey,
            ":lat": lat ? Number(lat) : null,
            ":lng": lng ? Number(lng) : null,
            ":now": new Date().toISOString(),
          },
        })
      )
    } catch (err) {
      console.error("Failed to ensure TagLocation:", err)
    }

    const scanId = `${profileId}#${addressKey}`

    try {
      await ddb.send(
        new UpdateCommand({
          TableName: SCANS_TABLE,
          Key: { id: scanId },
          UpdateExpression:
            "SET profileId = :profileId, address = :address, lastScannedAt = :now",
          ConditionExpression:
            "attribute_not_exists(lastScannedAt) OR lastScannedAt <= :cutoff",
          ExpressionAttributeValues: {
            ":profileId": profileId,
            ":address": addressKey,
            ":now": now,
            ":cutoff": cutoff,
          },
        })
      )

      // Award points
      const AWARD = 100
      try {
        await ddb.send(
          new UpdateCommand({
            TableName: PROFILE_TABLE,
            Key: { id: profileId },
            UpdateExpression:
              "SET points = if_not_exists(points, :zero) + :pts, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":pts": AWARD,
              ":zero": 0,
              ":updatedAt": new Date().toISOString(),
            },
          })
        )
      } catch (err) {
        console.error("Failed to award points:", err)
      }

      return {
        statusCode: 200,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ awarded: true, message: "Awarded 100 points" })
      }
    } catch (err: any) {
      const isConditional =
        err && err.name === "ConditionalCheckFailedException"

      if (isConditional) {
        try {
          const getRes = await ddb.send(
            new GetCommand({ TableName: SCANS_TABLE, Key: { id: scanId } })
          )
          const last = getRes.Item?.lastScannedAt ?? null
          if (last) {
            const remaining = Math.max(0, WEEK - (now - Number(last)))
            return {
              statusCode: 200,
              headers: { ...cors, "Content-Type": "application/json" },
              body: JSON.stringify({
                awarded: false,
                secondsUntilNext: remaining,
                message: "Scan too soon",
              }),
            }
          }
        } catch (gerr) {
          console.error("Failed to fetch existing scan record:", gerr)
        }
      }

      console.error("Scan update error:", err)
      return {
        statusCode: 500,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Failed to process scan", details: String(err) })
      }
    }
  } catch (error) {
    console.error("nfcAward error:", error)
    return {
      statusCode: 500,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error", details: String(error) })
    }
  }
}
