import type { Handler } from 'aws-lambda'
import { sendSupportEmail } from '../shared/sendEmail'

// Lambda Function URL event type
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
  // For Function URLs, method is in event.requestContext.http.method
  const method = event.requestContext.http.method

  console.log('=== INCOMING REQUEST ===')
  console.log('Method:', method)
  console.log('Path:', event.requestContext.http.path)
  console.log('Body:', event.body)
  console.log('======================')

  const headers = {
    'Content-Type': 'application/json',
  }

  // Handle OPTIONS preflight
  if (method === 'OPTIONS') {
    console.log('✓ Handling OPTIONS preflight')
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  // Check the actual method
  if (method !== 'POST') {
    console.log('✗ Invalid method received:', method)
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

  console.log('✓ POST request received')

  try {
    console.log('Parsing request body')
    const { name, email, subject, message } = JSON.parse(event.body || '{}')

    console.log('Received data:', {
      name,
      email,
      subject,
      messageLength: message?.length,
    })

    if (!name || !email || !subject || !message) {
      console.log('Validation failed: missing fields')
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Validation failed: invalid email format')
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' }),
      }
    }

    console.log('Attempting to send email...')
    await sendSupportEmail(name, email, subject, message)
    console.log('✓ Email sent successfully')

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
