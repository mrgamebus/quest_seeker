import type { Handler } from 'aws-lambda'
import { sendSupportEmail } from '../shared/sendEmail'

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

  const headers = {
    'Content-Type': 'application/json',
  }

  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed',
        received: method,
        expected: 'POST',
      }),
    }
  }

  try {
    const { name, email, subject, message } = JSON.parse(event.body || '{}')

    if (!name || !email || !subject || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' }),
      }
    }

    await sendSupportEmail(name, email, subject, message)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully',
      }),
    }
  } catch (error) {
    console.error('✗ Support form error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : String(error),
      }),
    }
  }
}
