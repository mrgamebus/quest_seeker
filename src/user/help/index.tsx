import { Card, CardContent } from '@/components/ui/card'
import bg from '@/assets/images/background_main.jpeg'
import logo from '@/assets/images/no_ordinary.png'
import { helpSections } from '@/assets/helpSections'
import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation, useNavigate } from 'react-router-dom'
import { Toolbar } from '@/components/Toolbar'
import SignOutButton from '@/components/SignOutButton'
import { fetchAuthSession } from 'aws-amplify/auth'

const SUPPORT_FUNCTION_URL = import.meta.env.VITE_SUPPORT_FUNCTION_URL

export default function Help() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(
    location.state?.defaultTab || 'help',
  )
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const [formStatus, setFormStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (location.state?.defaultTab) {
      setActiveTab(location.state.defaultTab)
    }
  }, [location.state])

  const checkAuthStatus = async () => {
    try {
      const session = await fetchAuthSession()
      setIsAuthenticated(!!session.tokens)
    } catch (error) {
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormStatus('sending')
    setErrorMessage('')

    try {
      const functionUrl = SUPPORT_FUNCTION_URL

      if (!functionUrl) {
        throw new Error(
          'Support function URL not configured. Add VITE_SUPPORT_FUNCTION_URL to .env',
        )
      }

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

      setFormStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setFormStatus('idle'), 5000)
    } catch (error) {
      console.error('Failed to send support message:', error)
      setFormStatus('error')
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to send your message. Please try again.',
      )
    }
  }

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const renderSectionContent = (index: number) => {
    const section = helpSections[index]

    if (index === 0) {
      return (
        <div className="px-5 py-6 bg-white/50 text-gray-700 text-sm border-t border-gray-100">
          <p className="text-center text-gray-600 italic text-sm mb-6">
            Everything you need to get started — whether you’re joining an
            adventure or creating one. This guide covers the full experience for
            Quest Seekers participating in Quests, and for Quest Creators
            hosting them.
          </p>

          <div className="border-b-2 border-[#F0A800] mb-6"></div>

          {/* FOR QUEST SEEKERS */}
          <h3 className="font-bold text-[#111111] text-lg mb-3">
            🧭 FOR QUEST SEEKERS
          </h3>
          <p className="text-[#555555] text-sm mb-4">
            Ready to start your adventure? Follow these seven steps to go from
            sign-up to Quest Complete.
          </p>

          {/* 7 steps for Seekers */}
          <div className="space-y-3 mb-8">
            {[
              {
                num: '1',
                title: 'Download & Sign Up',
                desc: 'Save the QuestSeeker app to your home screen via Chrome or Safari on iOS or Android. Create your free account using your name, email address, and a password.',
              },
              {
                num: '2',
                title: 'Browse & Choose a Quest',
                desc: 'Log in and explore available Quests. Browse by name or region, or sort by start date. Each listing shows the host organisation, dates, number of tasks, location, and any entry fee.',
              },
              {
                num: '3',
                title: 'Join & Pay',
                desc: 'Tap the Join Quest button. If there is an entry fee (typically $10–20 for fundraising Quests), pay securely via Stripe. Business-hosted Quests are often free to enter where no fundraising component is involved.',
              },
              {
                num: '4',
                title: 'Complete the Tasks',
                desc: 'When the Quest starts, your task list unlocks. Complete challenges in any order — answer questions, upload photos as proof, or check in at GPS locations. Tackle them solo or together with family and friends!',
              },
              {
                num: '5',
                title: 'Track Your Progress',
                desc: 'The app shows which tasks you have completed and which remain. Keep an eye on the leaderboard to see how you rank. Stuck on a task? Skip it and come back later',
              },
              {
                num: '6',
                title: 'Submit & Complete',
                desc: 'Submit all tasks before the Quest’s end date. The Quest Creator will review submissions, particularly photo uploads. Finishers appear on the Completed Quest page, ranked by time and completion.',
              },
              {
                num: '7',
                title: 'Collect Your Reward',
                desc: 'Winners are announced in the app. Prizes range from digital badges and certificates to gift cards and sponsored rewards. Keep your contact details updated so you can be reached. And if it was a fundraiser — you helped make a real difference!',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="flex gap-3 border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="bg-[#F0A800] px-4 py-3 flex items-center justify-center min-w-[60px]">
                  <span className="font-bold text-[#111111] text-lg">
                    {step.num}
                  </span>
                </div>
                <div className="py-3 pr-4 flex-1">
                  <p className="font-bold text-[#111111] text-sm mb-1">
                    {step.title}
                  </p>
                  <p className="text-[#555555] text-xs">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tip box for Seekers */}
          <div className="bg-yellow-50 border-l-4 border-[#F0A800] p-4 mb-8">
            <p className="text-sm">
              <span className="font-bold">💡 Tip:</span> Playing with family or
              friends? Everyone needs their own account if submitting tasks
              individually. But you can absolutely explore and tackle clues
              together — the more the merrier!
            </p>
          </div>
          <h3 className="font-bold text-[#111111] text-base mb-3">
            📡 QuestMarks — Locate ‘Quest Stops’ on the Map
          </h3>

          <p className="text-[#555555] text-sm mb-4">
            QuestMarks are NFC-enabled stickers placed at real-world locations —
            businesses, community landmarks, and other points of interest. When
            you tap a QuestMark with your phone, your QuestSeeker profile is
            credited with 100 points.
          </p>
          <p className="text-[#555555] text-sm mb-4">
            QuestMark locations appear as pins on the Seeker map. Some are part
            of an active Quest; others are simply Quest Stops — annual community
            waypoints that you can tap any time to earn points throughout the
            year.
          </p>

          <h3 className="font-bold text-[#111111] text-base mb-3">
            🏅 Points, Badges & the Leaderboard
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            Points accumulate throughout the Matariki year — from one Matariki
            celebration to the next. Your points total at any time determines
            your current Seeker badge tier.
          </p>
          <h3 className="font-bold text-[#111111] text-base mb-3">
            How Points Are Earned
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Action
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Points Earned
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    Join A Quest
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    10 points
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    Each Task completed
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    10 points per task
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    Quest completed
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    50 points
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    QuestMark tap
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    100 points
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="font-bold text-[#111111] text-base mb-3">
              Annual Badge Tiers
            </h3>

            <p className="text-[#555555] text-sm mb-4">
              All new users begin as Wanderers. As the community grows, your
              badge tier reflects where your points place you relative to all
              seekers on the platform. The badge you hold at the Matariki reset
              is permanently recorded on your profile as recognition of that
              year’s achievement — you then return to Wanderer and begin earning
              again for the new year.
            </p>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Badge
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Who Earns It
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    🧭 Wanderer
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    First 20% of new users
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    Starting badge for all new seekers
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    🔭 Scout
                  </td>
                  <td className="border border-gray-300 px-3 py-2">Next 20%</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Earning through consistent participation
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    👣 Tracker
                  </td>
                  <td className="border border-gray-300 px-3 py-2">Next 20%</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Growing presence on the leaderboard
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    🌿Trailblazer
                  </td>
                  <td className="border border-gray-300 px-3 py-2">Next 20%</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Recognised contributor to the community
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    🧲 Navigator
                  </td>
                  <td className="border border-gray-300 px-3 py-2">Top 20%</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Elite tier — most active seekers on the platform
                  </td>
                </tr>
              </tbody>
            </table>
            <h3 className="font-bold text-[#111111] text-base mb-3">
              Premium Matariki Badges
            </h3>

            <p className="text-[#555555] text-sm mb-4">
              At each Matariki reset, seekers who place in the top 10 on the
              leaderboard receive a permanent premium badge on their profile.
              These badges are a lasting record of your contribution and can
              never be removed. New premium badges can be added each year.
            </p>

            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Premium Badge
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Leaderboard Position
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Recognition
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    ⭐ Grand Explorer
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    Positions 6-10
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    Permanent badge on profile
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    🌟 Legendary Seeker
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    Postions 2-5
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    Permanent badge on profile
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    👑 Quest Master
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    Position 1
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    Permanent badge — champion of the year
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="bg-yellow-50 border-l-4 border-[#F0A800] p-4 mb-6">
              <p className="text-sm">
                <span className="font-bold">💡 Tip:</span> Both your annual
                badge tier and any premium badges stay on your profile forever —
                building a visible history of your participation and achievement
                year after year.
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (index === 1) {
      return (
        <div className="px-5 py-6 bg-white/50 text-gray-700 text-sm border-t border-gray-100">
          <div className="border-b-2 border-[#F0A800] mb-6"></div>

          <h3 className="font-bold text-[#111111] text-lg mb-3">
            🗺️ FOR QUEST CREATORS
          </h3>
          <p className="text-[#555555] text-sm mb-4">
            Quest Creators are the hosts of Quests on QuestSeeker. Creators may
            be community organisations, non-profits, businesses of any size, or
            individuals. Here’s how to launch a Quest from scratch in seven
            steps
          </p>

          <div className="space-y-3 mb-8">
            {[
              {
                num: '1',
                title: 'Register as a Creator',
                desc: 'From the app menu, select My Account. Under the QuestSeeker section, tap Become a Quest Creator. Complete your host profile: organisation or trading name, type, registration number (if applicable), description, primary contact details and account details for fundraising payouts.',
              },
              {
                num: '2',
                title: 'Choose Your Plan',
                desc: 'Your pricing plan is based on your organisation type and the scale of your Quest. See the Creator Pricing section below for a full breakdown. Your flat fee is charged via Stripe before your Quest is published.',
              },
              {
                num: '3',
                title: 'Set Up Your Quest',
                desc: 'Give your Quest a title, cover image, region, and a compelling description. Set start and end dates. Add details of any sponsors and prizes. Be clear about whether participants need to be in a specific location or can join from anywhere in New Zealand.',
              },
              {
                num: '4',
                title: 'Build Your Task List',
                desc: 'Add challenges one by one. For each task, choose the type — text answer, photo upload, or GPS check-in — then write the clue or instruction and set the verification answer. Aim for a mix of easy and challenging tasks to keep it engaging for all ages.',
              },
              {
                num: '5',
                title: 'Configure Entry Fees & Prizes',
                desc: 'Decide whether your Quest will have an entry fee. Business-hosted Quests may be offered free to participants, or an entry fee can be set if the Quest is raising funds for a cause (for example, a national business fundraising for a charity partner). Non-Profit and Individual Quest plans must charge an entry fee. Set your entry fee amount if applicable — collection is handled securely via Stripe. Add prizes to attract participants: a grand prize for the winner and secondary prizes for runners-up. All participants who complete the Quest earn points toward the annual leaderboard.',
              },
              {
                num: '6',
                title: 'Publish & Promote',
                desc: 'Tap Finish & Create Quest to proceed to Stripe payment. Once your flat fee is paid, your Quest is published on the platform. The first three tasks are visible to browsing members before the start date to build interest. Spread the word via email, social media, community boards, and partner organisations.',
              },
              {
                num: '7',
                title: 'Review & Reward',
                desc: 'After the Quest ends, access completed entries via My Quests. Use Prepare PDF to review each participant’s submissions. Select Winners by Prize manually, or use Pick a Random Winner for each available prize. Send all participants a thank-you message — and if it was a fundraiser, share the total raised!',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="flex gap-3 border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="bg-[#F0A800] px-4 py-3 flex items-center justify-center min-w-[60px]">
                  <span className="font-bold text-[#111111] text-lg">
                    {step.num}
                  </span>
                </div>
                <div className="py-3 pr-4 flex-1">
                  <p className="font-bold text-[#111111] text-sm mb-1">
                    {step.title}
                  </p>
                  <p className="text-[#555555] text-xs">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tip box for Creators */}
          <div className="bg-yellow-50 border-l-4 border-[#F0A800] p-4 mb-6">
            <p className="text-sm">
              <span className="font-bold">💡 Tip:</span> Quests with prizes
              attract significantly more participants. Reach out to local
              businesses for sponsored rewards — many are happy to contribute
              items or vouchers in exchange for visibility during your Quest
            </p>
          </div>
        </div>
      )
    }

    if (index === 2) {
      return (
        <div className="px-5 py-6 bg-white/50 text-gray-700 text-sm border-t border-gray-100">
          <div className="border-b-2 border-[#F0A800] mb-6"></div>

          {/* Pricing table */}
          <h3 className="font-bold text-[#111111] text-base mb-3">
            💳 Creator Pricing at a Glance
          </h3>

          <p className="text-[#555555] text-sm mb-4">
            All prices are in NZD. Flat fees are charged once at time of
            publishing via Stripe.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Plan
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Fee
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Participants
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Commission
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Entry Fee
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Free Entry
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    Non-Profit Quest
                  </td>
                  <td className="border border-gray-300 px-3 py-2">$50</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Unlimited
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    15% on entry fees
                  </td>
                  <td>Required</td>
                  <td>No</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    Individual Quest
                  </td>
                  <td className="border border-gray-300 px-3 py-2">$149</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Up to 500
                  </td>
                  <td className="border border-gray-300 px-3 py-2">None</td>
                  <td>Optional</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    Local Business Quest
                  </td>
                  <td className="border border-gray-300 px-3 py-2">$299</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Up to 500
                  </td>
                  <td className="border border-gray-300 px-3 py-2">None</td>
                  <td>Optional</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    National Business Quest
                  </td>
                  <td className="border border-gray-300 px-3 py-2">$950</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Up to 2,000
                  </td>
                  <td className="border border-gray-300 px-3 py-2">None</td>
                  <td>Optional</td>
                  <td>Yes</td>
                </tr>
              </tbody>
            </table>
            <p className="text-[#555555] text-sm mb-4">
              Note: Non-Profit Quests must charge an entry fee — free-entry
              Quests are not available for this plan type. A 15% service fee
              applies to all entry fees collected by Non-Profit and Individual
              Quest hosts. Local and National Business Quest hosts do not pay
              commission on entry fees collected.
            </p>

            <h3 className="font-bold text-[#111111] text-lg mb-3">
              📌 QuestMarks
            </h3>
            <p className="text-[#555555] text-sm mb-4">
              QuestMarks are NFC-enabled stickers, each programmed uniquely to a
              specific physical location. When a seeker taps a QuestMark, their
              profile is credited with 100 points.
            </p>
            <h4 className="font-bold text-[#111111] text-lg mb-3">
              QuestMarks for Quest Creators
            </h4>
            <p className="text-[#555555] text-sm mb-4">
              Quest Creators receive QuestMarks as part of their plan. The
              number included varies by plan type, and additional QuestMarks can
              be purchased at $50.00 each. Each QuestMark represents a single
              location pin on the Seeker map — multiple locations require
              individual QuestMarks, each delivering its own analytics.
            </p>
            <h4 className="font-bold text-[#111111] text-lg mb-3">
              Quest Stops — QuestMarks Without a Creator Account
            </h4>
            <p className="text-[#555555] text-sm mb-4">
              Any business or location can participate in the QuestSeeker
              community by registering as a Quest Stop — without needing to
              become a full Quest Creator. Quest Stops purchase QuestMarks to
              place at their location, appearing on the Seeker map as permanent
              community waypoints. This is designed to encourage broad local
              participation and make more of your community discoverable to
              seekers.
            </p>
            <p className="text-[#555555] text-sm mb-4">
              Quest Stop analytics — including tap counts and peak visit times —
              are accessed through My Account for verified Quest Stop holders.
            </p>
            <h4 className="font-bold text-[#111111] text-lg mb-3">
              QuestMarks as a Sponsor Benefit (Non-Profits)
            </h4>
            <p className="text-[#555555] text-sm mb-4">
              Non-profit Quest Creators can offer QuestMark placement as a
              sponsor benefit. Sponsors gain visibility on the Seeker map and
              their location earns points for seekers who visit, creating a
              genuine community fundraising loop that rewards both sponsors and
              participants.
            </p>
            <h3 className="font-bold text-[#111111] text-lg mb-3">
              ✅ Task Types
            </h3>
            <p className="text-[#555555] text-sm mb-4">
              When building your Quest, you can use three types of tasks:
            </p>
            <ul>
              <li>
                Image Upload — Participants submit a photo as evidence of
                completing the task.
              </li>
              <li>
                Caption / Text — Participants type a response to a question or
                prompt.
              </li>
              <li>
                Map Co-ordinates — Participants check in at a specific GPS
                location.
              </li>
            </ul>
          </div>
        </div>
      )
    }

    if (index === 3) {
      return (
        <div className="px-5 py-6 bg-white/50 text-gray-700 border-t border-gray-100">
          <p className="text-sm text-gray-700 mb-8">
            So you've decided to host a Quest — here's a fuller picture of what
            the experience is like as a Quest Creator, from setting up your
            profile through to rewarding your participants.
          </p>

          {/* Becoming a Quest Creator */}
          <h4 className="font-bold text-[#111111] text-base mb-3">
            👤 Becoming a Quest Creator
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            Everyone who joins QuestSeeker starts as a Seeker. To host your own
            Quest, you'll need to register as a Quest Creator. In the app, go to
            My Account and select Become a Quest Creator. You'll be asked to
            complete your host profile:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-1 text-sm text-gray-700 mb-3">
            <li>Organisation or trading name</li>
            <li>Organisation type (non-profit, business, individual, etc.)</li>
            <li>
              Registration number, if applicable (for charities or registered
              companies)
            </li>
            <li>A short description of your organisation or purpose</li>
            <li>Primary contact name, position, and phone number</li>
          </ul>
          <p className="text-sm text-gray-700 mb-3">
            Once your profile is complete, you'll choose the plan that fits your
            organisation type and expected Quest scale. Your flat fee is charged
            via Stripe when you publish your Quest — not at registration.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-sm">
              <span className="font-bold">💡 Tip:</span> Not ready to publish
              yet? You can save your Quest as a draft at any stage and return to
              it before going live.
            </p>
          </div>

          {/* Setting Up Your Quest */}
          <h4 className="font-bold text-[#111111] text-base mb-3">
            🛠️ Setting Up Your Quest
          </h4>
          <p className="text-sm text-gray-700 mb-4">
            Building a Quest is straightforward. You'll work through a series of
            setup screens covering:
          </p>

          <p className="font-bold text-sm text-gray-800 mb-2">Basic Details</p>
          <p className="text-sm text-gray-700 mb-4">
            Give your Quest a title, a cover image, and a region or location.
            Write a description that tells potential participants what to expect
            — what the Quest involves, what cause or goal it supports, and what
            prizes or incentives are on offer. Set your start and end dates. The
            Quest will display as Upcoming until it opens, then Active during
            the event window, and Closed once the end date passes.
          </p>
          <p className="text-sm text-gray-700 mb-5">
            If your Quest has location requirements — for example, participants
            need to be physically present in a particular town or area — make
            that clear in your description. If tasks can be completed from
            anywhere, note that too so participants know what to expect before
            joining.
          </p>

          <p className="font-bold text-sm text-gray-800 mb-3">
            Building Your Task List
          </p>
          <p className="text-sm text-gray-700 mb-3">
            Tasks are added one at a time. For each task you'll set:
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex gap-3 border border-gray-200 rounded-lg p-3">
              <div className="text-xl">📝</div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-800 mb-1">
                  Text / Caption Answer
                </p>
                <p className="text-xs text-gray-600">
                  Write a question or prompt and set the correct answer. The app
                  can accept exact matches or multiple acceptable responses to
                  account for variations.
                </p>
              </div>
            </div>
            <div className="flex gap-3 border border-gray-200 rounded-lg p-3">
              <div className="text-xl">📷</div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-800 mb-1">
                  Photo Upload
                </p>
                <p className="text-xs text-gray-600">
                  Write an instruction for what participants need to photograph
                  or document. These are reviewed manually by you after the
                  Quest closes.
                </p>
              </div>
            </div>
            <div className="flex gap-3 border border-gray-200 rounded-lg p-3">
              <div className="text-xl">📍</div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-800 mb-1">
                  GPS Check-In
                </p>
                <p className="text-xs text-gray-600">
                  Pin a specific location on the map. Participants must
                  physically visit and check in via their device's GPS.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-5">
            Aim for a mix of task types and difficulty levels to keep things
            engaging for a range of ages and abilities. Consider including tasks
            that reflect your organisation's story, cause, or location — these
            tend to resonate most with participants and make the Quest feel
            purposeful rather than generic.
          </p>

          <p className="font-bold text-sm text-gray-800 mb-2">
            Entry Fees & Fundraising
          </p>
          <p className="text-sm text-gray-700 mb-3">
            If your Quest is a fundraiser, set an entry fee that participants
            will pay when they join (for example, $15 per person). The app
            collects payments securely via Stripe. For Non-Profit and Individual
            Quest plans, an entry fee is required — free entry is not available
            for these plan types. A 15% service fee applies to all entry fees
            collected.
          </p>
          <p className="text-sm text-gray-700 mb-3">
            Business-hosted Quests (Local and National) can choose to offer free
            entry or charge a fee if fundraising for a partner cause — for
            example, a business raising funds for a charity it supports. No
            commission applies to business Quest entry fees.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-5">
            <p className="text-sm">
              <span className="font-bold">💡 Tip:</span> Let participants know
              exactly what their entry fee supports — for example, 'Your $15
              entry will provide a school kit for one child in need.' People are
              more likely to join and recommend the Quest when they can see the
              direct impact of their contribution.
            </p>
          </div>

          <p className="font-bold text-sm text-gray-800 mb-2">
            Prizes & Incentives
          </p>
          <p className="text-sm text-gray-700 mb-2">
            Adding prizes significantly increases participation. You can
            configure:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-1 text-sm text-gray-700 mb-3">
            <li>A grand prize for the overall winner or top finishers</li>
            <li>
              Secondary prizes for runners-up or random draw winners from all
              finishers
            </li>
            <li>
              A completion reward for everyone who finishes — such as a discount
              code or acknowledgement from a sponsor
            </li>
          </ul>
          <p className="text-sm text-gray-700 mb-3">
            If you don't have a budget for prizes, consider approaching local
            businesses for sponsored rewards. Many are happy to contribute items
            or vouchers in exchange for visibility during the Quest. You can
            acknowledge sponsors on your Quest listing page and build tasks that
            naturally draw participants to sponsor locations.
          </p>
          <p className="text-sm text-gray-700 mb-6">
            You decide how winners are determined: fastest completion, highest
            points, or a random draw from all finishers. QuestSeeker provides
            the data — timestamps, completion records, and scores — and you
            select winners manually or use the random selection tool.
          </p>

          {/* Publishing & Promoting */}
          <h4 className="font-bold text-[#111111] text-base mb-3">
            🚀 Publishing & Promoting
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            When you're happy with your Quest, tap Finish & Create Quest to
            proceed to Stripe payment. Your flat fee is charged at this point,
            and your Quest is published on the platform once payment is
            confirmed. If you're not quite ready, Save as Draft lets you return
            and finalise everything before going live.
          </p>
          <p className="text-sm text-gray-700 mb-3">
            Once published, your Quest appears in the app's Quest browser. The
            first three tasks are visible to browsing members before the start
            date — a useful way to build curiosity and encourage early sign-ups.
          </p>
          <p className="text-sm text-gray-700 mb-2">
            Getting the word out is the single biggest factor in participation
            numbers. Some approaches that work well:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-1 text-sm text-gray-700 mb-3">
            <li>
              Email newsletters to your existing supporters or customer base
            </li>
            <li>
              Social media posts — share the Quest link and encourage followers
              to tag friends
            </li>
            <li>Community boards, local press, and partner organisations</li>
            <li>
              In-store signage or printed flyers if your Quest is location-based
            </li>
            <li>Cross-promotion with any sponsors or prize partners</li>
          </ul>
          <p className="text-sm text-gray-700 mb-6">
            As the start date approaches, a reminder post or teaser can help
            boost last-minute sign-ups. The Quest listing itself does a lot of
            the selling — make sure your description, cover image, and prize
            details are compelling from the outset.
          </p>

          {/* Reviewing & Rewarding */}
          <h4 className="font-bold text-[#111111] text-base mb-3">
            📋 Reviewing & Rewarding
          </h4>
          <p className="text-sm text-gray-700 mb-4">
            Once the Quest closes, it's time to review submissions and wrap
            things up.
          </p>

          <p className="font-bold text-sm text-gray-800 mb-2">
            Reviewing Submissions
          </p>
          <p className="text-sm text-gray-700 mb-5">
            Access completed entries through My Quests in the app. Use Prepare
            PDF to review each participant's submission in full. For photo
            tasks, check that entries meet the criteria — for example, that a
            photo shows the correct location or subject. This is your chance to
            confirm valid completions and ensure fairness before announcing
            results.
          </p>

          <p className="font-bold text-sm text-gray-800 mb-2">
            Selecting Winners
          </p>
          <p className="text-sm text-gray-700 mb-5">
            The Quest dashboard shows all participants who completed every task,
            along with their finishing times and points. Use this data to
            identify your winners based on your chosen criteria. You can select
            winners manually by prize tier, or use Pick a Random Winner for
            draw-based prizes. Once confirmed, winners are notified through the
            app.
          </p>

          <p className="font-bold text-sm text-gray-800 mb-2">
            Thanking Participants
          </p>
          <p className="text-sm text-gray-700 mb-3">
            Send all participants a thank-you message through the app. If your
            Quest was a fundraiser, share the total raised and what it will be
            used for — closing the loop between the fun experience participants
            had and the real-world impact it created. This kind of
            follow-through builds goodwill and makes participants far more
            likely to join your next Quest.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-5">
            <p className="text-sm">
              <span className="font-bold">💡 Tip:</span> Quests that share their
              fundraising outcomes openly tend to attract stronger participation
              the second time around. A well-run Quest can become an annual
              community tradition.
            </p>
          </div>

          <p className="font-bold text-sm text-gray-800 mb-2">
            Participant Souvenir PDFs
          </p>
          <p className="text-sm text-gray-700 mb-6">
            Every participant who completes your Quest receives a downloadable
            souvenir PDF — a personal record of their completed Quest. This is
            generated automatically by the platform and is a great finishing
            touch, particularly for family events, school fundraisers, or
            charity Quests where participants want a keepsake of their
            involvement.
          </p>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="font-bold text-sm mb-1">Need help? We're here.</p>
            <p className="text-sm text-gray-600 mb-2">
              questseeker.co.nz · support@questseeker.co.nz
            </p>
            <p className="text-xs text-gray-500 italic">
              ❖ Proudly New Zealand made · Launching 2026 ❖
            </p>
          </div>
        </div>
      )
    }

    if (index === 4) {
      return (
        <div className="px-5 py-6 bg-white/50 text-gray-700 border-t border-gray-100">
          <p className="text-center text-sm italic text-gray-600 mb-4">
            Tips for Non-Profits & Community Organisations
          </p>
          <p className="text-sm text-gray-700 mb-8">
            QuestSeeker is built with non-profit fundraising in mind. These tips
            are designed to help charities and community organisations get the
            most out of the platform — from setting entry fees thoughtfully to
            turning participants into long-term supporters.
          </p>

          {/* 01 Make Your Entry Fee Work Hard */}
          <h4 className="font-bold text-[#111111] text-base mb-3">
            01 Make Your Entry Fee Work Hard
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            At $50 to create a Quest, the platform cost is low — which means
            almost everything raised through entry fees goes directly to your
            cause. Setting a reasonable entry fee of $10–20 per participant
            means you recoup the setup cost quickly and build genuine
            fundraising from there.
          </p>
          <p className="text-sm text-gray-700 mb-3">
            The key is communicating exactly what a participant's entry fee
            achieves. People are far more willing to contribute when they can
            see the direct impact of their money.
          </p>
          <div className="bg-yellow-50 border-l-4 border-[#F0A800] p-4 mb-3">
            <p className="text-sm italic">
              <strong>Example:</strong> 'Your $15 entry will provide a school
              kit for one child in need.' or 'Joining at $20 feeds a rescue
              animal for a month.'
            </p>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            When participants feel their entry fee is doing something real,
            they're not just paying to play — they're investing in your cause.
            That framing also makes them more likely to recommend the Quest to
            others.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-sm">
              <span className="font-bold">💡 Tip:</span> A 15% service fee
              applies to all entry fees collected through QuestSeeker for
              Non-Profit Quests. Factor this into your fee-setting so your
              fundraising target is met after the fee is deducted.
            </p>
          </div>

          {/* 02 Design Tasks That Tell Your Story */}
          <h4 className="font-bold text-[#111111] text-base mb-3">
            02 Design Tasks That Tell Your Story
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            A Quest isn't just a fundraising mechanism — it's an opportunity to
            bring your cause to life for participants in an engaging, memorable
            way. Weaving your organisation's mission into the tasks themselves
            means participants leave knowing more about what you do and why it
            matters.
          </p>
          <p className="text-sm text-gray-700 mb-2">
            Consider including tasks that:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-1 text-sm text-gray-700 mb-3">
            <li>
              Share a fact or statistic about your cause as part of a question
            </li>
            <li>
              Direct participants to a location that's meaningful to your work
            </li>
            <li>
              Ask participants to photograph something that connects to your
              mission
            </li>
            <li>
              Introduce your team, volunteers, or beneficiaries through a clue
              or story
            </li>
          </ul>
          <div className="bg-yellow-50 border-l-4 border-[#F0A800] p-4 mb-3">
            <p className="text-sm italic">
              <strong>Example:</strong> If your charity supports environmental
              conservation: 'What year was our nature reserve established?
              (Hint: the answer is on the entrance sign.)' or 'Take a photo of
              something in nature you'd like to protect.'
            </p>
          </div>
          <p className="text-sm text-gray-700 mb-6">
            When participants engage with your cause through the Quest itself —
            not just as a backdrop — they're more likely to remember it, talk
            about it, and support it again in the future.
          </p>

          {/* 03 Use Sponsored Prizes */}
          <h4 className="font-bold text-[#111111] text-base mb-3">
            03 Use Sponsored Prizes to Boost Participation
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            Quests with prizes attract significantly more participants. If your
            organisation doesn't have a prize budget, sponsored prizes are the
            answer — and they cost you nothing while making your Quest more
            appealing.
          </p>
          <p className="text-sm text-gray-700 mb-3">
            Approach local businesses, supporters, or community partners and ask
            if they'd be willing to contribute a prize in exchange for
            acknowledgement on your Quest listing. Many are happy to donate
            items or vouchers for the visibility and goodwill it generates.
          </p>
          <p className="text-sm font-semibold text-gray-800 mb-2">
            Prize ideas that work well:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-1 text-sm text-gray-700 mb-3">
            <li>Restaurant vouchers or a dinner for two from a local eatery</li>
            <li>Gift cards from a local retailer or service provider</li>
            <li>
              Experiences — event tickets, activity passes, or behind-the-scenes
              tours
            </li>
            <li>
              A grand prize contributed by a major sponsor — electronics, a
              hamper, or similar
            </li>
            <li>
              A completion acknowledgement for all finishers — a digital badge
              or a thank-you from a sponsor
            </li>
          </ul>
          <p className="text-sm text-gray-700 mb-3">
            You can also build sponsors meaningfully into your Quest by
            designing tasks that bring participants to their location or engage
            with their brand. This adds genuine value for the sponsor and keeps
            the Quest experience feeling purposeful rather than transactional.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-sm">
              <span className="font-bold">💡 Tip:</span> Acknowledge all
              sponsors clearly on your Quest listing page. Participants notice —
              and so do future sponsors when they see their peers involved.
            </p>
          </div>

          {/* 04 Make It Accessible */}
          <h4 className="font-bold text-[#111111] text-base mb-3">
            04 Make It Accessible & Family-Friendly
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            QuestSeeker Quests are well suited to a wide range of ages and
            abilities. The more accessible and inclusive your Quest, the broader
            your potential participant base — and the more entry fees you can
            raise.
          </p>
          <p className="text-sm text-gray-700 mb-3">
            When designing your tasks, aim for a mix of difficulty levels so the
            Quest feels achievable for families with children, older
            participants, and those less familiar with technology. Avoid tasks
            that require specialist knowledge, physical fitness, or equipment
            unless your audience specifically calls for it.
          </p>
          <p className="text-sm text-gray-700 mb-2">
            In your promotions, be explicit that the Quest is open to everyone:
          </p>
          <div className="bg-yellow-50 border-l-4 border-[#F0A800] p-4 mb-3">
            <p className="text-sm italic">
              <strong>Example:</strong> 'This Quest is perfect for families,
              friends, or anyone who loves exploring — no special skills
              required. Just curiosity and a smartphone!'
            </p>
          </div>
          <p className="text-sm text-gray-700 mb-6">
            Broader participation means more funds raised, more community
            engagement, and a stronger event overall.
          </p>

          {/* 05 Promote Early */}
          <h4 className="font-bold text-[#111111] text-base mb-3">
            05 Promote Early & Keep the Momentum Going
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            The single biggest factor in how many participants join your Quest
            is how well you promote it. QuestSeeker lists your Quest in the app
            browser, but personal outreach makes the real difference.
          </p>
          <p className="text-sm font-semibold text-gray-800 mb-2">
            Effective promotion channels for non-profits:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-1 text-sm text-gray-700 mb-3">
            <li>
              Email newsletters to your existing supporter base — include a
              direct link to the Quest
            </li>
            <li>
              Social media — post the Quest link and encourage followers to
              share it with friends and family
            </li>
            <li>Community boards, local press, and partner organisations</li>
            <li>
              Outreach to schools, clubs, or community groups who might want to
              participate together
            </li>
          </ul>
          <p className="text-sm text-gray-700 mb-3">
            The first three tasks of your Quest are visible to browsing members
            before the start date — use this to your advantage by making your
            opening tasks intriguing and representative of the experience ahead.
          </p>
          <p className="text-sm text-gray-700 mb-6">
            As the start date approaches, a reminder post or a teaser about the
            prizes on offer can drive a meaningful uplift in last-minute
            sign-ups. Don't assume people will remember — a well-timed nudge
            goes a long way.
          </p>

          {/* 06 Close the Loop */}
          <h4 className="font-bold text-[#111111] text-base mb-3">
            06 Close the Loop — Share Your Impact
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            After your Quest ends, let every participant know what their
            involvement achieved. This step is often skipped, but it's one of
            the most powerful things you can do for future fundraising.
          </p>
          <p className="text-sm text-gray-700 mb-2">
            Share the total raised and what it will go towards in a thank-you
            message sent through the app, on social media, and in your email
            newsletter.
          </p>
          <div className="bg-yellow-50 border-l-4 border-[#F0A800] p-4 mb-3">
            <p className="text-sm italic">
              <strong>Example:</strong> 'Thanks to our 150 Quest participants,
              we raised $3,000 for the shelter — enough to feed every rescue
              animal in our care for the next three months. Thank you for being
              part of it.'
            </p>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            When participants see the real-world outcome of their contribution,
            it validates their decision to join and makes them far more likely
            to return for your next Quest. It also builds credibility with
            people who didn't participate this time — they see the impact, and
            they're more inclined to join next time.
          </p>
          <p className="text-sm text-gray-700 mb-3">
            If your Quest was well received, consider making it a regular or
            annual event. A consistent, well-run fundraising Quest can become a
            cornerstone of your calendar — one that participants look forward to
            and recommend to others year after year.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-sm">
              <span className="font-bold">💡 Tip:</span> Share photos from the
              Quest (with participant consent) on social media or in a local
              press release. Celebrating the event publicly builds your
              organisation's profile and sets up momentum for next time.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="font-bold text-sm mb-1">Need help? We're here.</p>
            <p className="text-sm text-gray-600 mb-2">
              questseeker.co.nz · support@questseeker.co.nz
            </p>
            <p className="text-xs text-gray-500 italic">
              ❖ Proudly New Zealand made · Launching 2026 ❖
            </p>
          </div>
        </div>
      )
    }

    if (index === 5) {
      return (
        <div className="px-5 py-6 bg-white/50 text-gray-700 border-t border-gray-100">
          <p className="text-sm text-gray-700 mb-6">
            Need help? Have a question? We're here to assist you. Send us a
            message and we'll get back to you as soon as possible.
          </p>

          {formStatus === 'success' && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded mb-6">
              Your message has been sent successfully! We'll get back to you
              soon.
            </div>
          )}

          {formStatus === 'error' && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSupportSubmit} className="space-y-4">
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
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F0A800] bg-white"
                disabled={formStatus === 'sending'}
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
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F0A800] bg-white"
                disabled={formStatus === 'sending'}
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
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F0A800] bg-white"
                disabled={formStatus === 'sending'}
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
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F0A800] resize-none bg-white"
                disabled={formStatus === 'sending'}
              />
            </div>

            <button
              type="submit"
              disabled={formStatus === 'sending'}
              className="w-full px-6 py-3 bg-[#F0A800] hover:bg-[#D89600] disabled:bg-gray-400 disabled:cursor-not-allowed text-black font-medium rounded transition-colors"
            >
              {formStatus === 'sending' ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="font-bold text-sm mb-1">Alternative Contact</p>
            <p className="text-sm text-gray-600 mb-2">
              questseeker.co.nz · support@questseeker.co.nz
            </p>
            <p className="text-xs text-gray-500 italic">
              ❖ Proudly New Zealand made · Launching 2026 ❖
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="px-5 py-4 bg-white/50 text-gray-700 text-sm border-t border-gray-100">
        <ul className="flex flex-col gap-3 list-disc list-outside pl-5">
          {section.paragraphs.map((para, i) => (
            <li key={i}>{para}</li>
          ))}
        </ul>
      </div>
    )
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div
      className="relative h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <Card className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl max-w-5xl w-full h-full max-h-full flex flex-col overflow-hidden">
        <CardContent className="flex flex-col gap-4 flex-1 min-h-0 p-0">
          {!isAuthenticated ? (
            <div className="p-4">
              <Button variant="outline" onClick={() => navigate('/user/auth')}>
                ← Back to Login
              </Button>
            </div>
          ) : (
            <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md p-4 shadow-sm border-b">
              <Toolbar>
                <Button
                  variant="yellow"
                  onClick={() => navigate('/user/region')}
                  aria-label="Home"
                >
                  <Home />
                </Button>

                <Button
                  variant="yellow"
                  onClick={() => navigate('/user/account')}
                >
                  My Account
                </Button>

                <Button
                  variant="yellow"
                  onClick={() =>
                    navigate('/user/account', {
                      state: { defaultTab: 'my-quests' },
                    })
                  }
                >
                  My Quests
                </Button>

                <Button
                  variant="yellow"
                  onClick={() => navigate('/user/leader')}
                >
                  Leader Board
                </Button>

                <Button
                  variant={activeTab === 'help' ? 'default' : 'yellow'}
                  onClick={() => navigate('/user/help')}
                >
                  Help Guide
                </Button>
                <SignOutButton />
              </Toolbar>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <div className="w-full max-w-3xl mx-auto">
              <img
                src={logo}
                alt="logo"
                className="w-full h-auto object-cover"
              />

              <h1 className="text-sm">
                Everything you need to get started — whether you're joining an
                adventure or creating one. This guide covers the full experience
                for Quest Seekers participating in Quests, and for Quest
                Creators hosting them.
              </h1>

              <ul className="flex flex-col gap-2 mt-4">
                {helpSections.map((section, index) => (
                  <li
                    key={index}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggle(index)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left bg-white/70 hover:bg-yellow-50 transition-colors"
                    >
                      <h2 className="text-lg font-semibold text-gray-800">
                        {section.title}
                      </h2>
                      {openIndex === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                      )}
                    </button>

                    {openIndex === index && renderSectionContent(index)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
