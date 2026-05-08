import { Card, CardContent } from '@/components/ui/card'
import { useState } from 'react'
import bg from '@/assets/images/background_main.jpeg'

const SUPPORT_FUNCTION_URL = import.meta.env.VITE_SUPPORT_FUNCTION_URL

export default function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    try {
      const functionUrl = SUPPORT_FUNCTION_URL

      if (!functionUrl) {
        throw new Error(
          'Support function URL not configured. Add VITE_SUPPORT_FUNCTION_URL to .env',
        )
      }

      console.log('Sending to:', functionUrl)

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      setStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setStatus('idle'), 5000)
    } catch (error) {
      console.error('Failed to send support message:', error)
      setStatus('error')
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to send your message. Please try again.',
      )
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center px-4 py-8"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <Card className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl max-w-3xl w-full">
        <CardContent className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Contact Support
            </h1>

            <a
              href="/user"
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-medium rounded transition-colors"
            >
              ← Back to Login
            </a>
          </div>

          {status === 'success' && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              Your message has been sent successfully! We'll get back to you
              soon.
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={status === 'sending'}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={status === 'sending'}
              />
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={status === 'sending'}
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                disabled={status === 'sending'}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-black font-medium rounded transition-colors"
            >
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          <div className="text-sm text-gray-600 border-t pt-4">
            <p>You can also reach us directly at:</p>
            <p className="mt-2">
              <strong>Email:</strong>{' '}
              <a
                href="mailto:questseekernz@gmail.com"
                className="text-yellow-600 hover:underline"
              >
                questseekernz@gmail.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
