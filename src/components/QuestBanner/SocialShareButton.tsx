import { FacebookShareButton, FacebookIcon } from 'react-share'

interface SocialShareButtonProps {
  questName: string
}

export default function SocialShareButton({
  questName,
}: SocialShareButtonProps) {
  const shareUrl = window.location.href
  const hashtag = `#${questName?.replace(/\s+/g, '')}`

  return (
    <div className="absolute top-2 left-2 z-20 md:top-auto md:left-10 md:bottom-[-60px] md:bg-white md:rounded-2xl md:shadow-xl md:border md:border-gray-200 md:p-3">
      <div className="flex items-center gap-2">
        <FacebookShareButton
          url={shareUrl}
          hashtag={hashtag}
          className="flex flex-col items-center gap-1"
        >
          <FacebookIcon size={32} round />
          <span className="text-sm font-medium text-gray-700">Share</span>
        </FacebookShareButton>
      </div>
    </div>
  )
}
