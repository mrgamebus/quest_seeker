import { useState, useEffect } from 'react'

const REGION = 'ap-southeast-2'
const BUCKET = 'amplify-amplifyvitereactt-amplifyquestseekerbucket-beyjfgpn1vr2'

export function useS3Image(path?: string | null) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }

    if (path.startsWith('http')) {
      setUrl(path)
      return
    }

    if (path.startsWith('public/')) {
      setUrl(`https://${BUCKET}.s3.${REGION}.amazonaws.com/${path}`)
      return
    }

    setUrl(null)
  }, [path])

  return url
}
