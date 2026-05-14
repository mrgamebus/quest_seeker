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

export default function Help() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(
    location.state?.defaultTab || 'help',
  )
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // All useEffect hooks together
  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (location.state?.defaultTab) {
      setActiveTab(location.state.defaultTab)
    }
  }, [location.state])

  // Helper functions after hooks
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

  // Custom rendering for specific sections with styled layouts
  const renderSectionContent = (index: number) => {
    const section = helpSections[index]

    // "QuestSeeker in a Nutshell" section with card layout
    if (index === 0) {
      return (
        <div className="px-5 py-6 bg-white/50 text-gray-700 text-sm border-t border-gray-100">
          {/* Hero message with yellow border */}
          <div className="bg-white border-b-2 border-[#F0A800] rounded-lg p-6 mb-6 text-center">
            <p className="font-bold text-base mb-2">
              Adventure. Community. Purpose.
            </p>
            <p className="text-sm text-gray-600">
              QuestSeeker turns fundraising and marketing into real-world
              scavenger hunt adventures. Join a Quest, complete challenges,
              support a cause — and have a blast doing it.
            </p>
          </div>

          {/* What is a Quest heading */}
          <h3 className="font-bold text-[#3A2E1A] text-base mb-4">
            What is a Quest?
          </h3>

          {/* Three feature cards in a grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-[#FDF6E8] border border-[#E8D8A0] rounded-lg p-4">
              <p className="font-bold text-[#111111] text-sm mb-2">
                🗺️ Real-World Adventures
              </p>
              <p className="text-[#666666] text-xs">
                Quests are time-bound scavenger hunts played through the app.
                Complete challenges by snapping photos, answering riddles, or
                checking in at locations.
              </p>
            </div>
            <div className="bg-[#FDF6E8] border border-[#E8D8A0] rounded-lg p-4">
              <p className="font-bold text-[#111111] text-sm mb-2">
                🤝 Fun With Purpose
              </p>
              <p className="text-[#666666] text-xs">
                Whether it's raising money for a cause or promoting a brand,
                every Quest has a goal behind the game. Play, compete, and make
                a difference at the same time.
              </p>
            </div>
            <div className="bg-[#FDF6E8] border border-[#E8D8A0] rounded-lg p-4">
              <p className="font-bold text-[#111111] text-sm mb-2">
                👨‍👩‍👧 For Everyone
              </p>
              <p className="text-[#666666] text-xs">
                Family-friendly and flexible. Play solo or as a team, in your
                neighbourhood or anywhere in the world. All you need is your
                phone.
              </p>
            </div>
          </div>

          {/* How it Works heading */}
          <h3 className="font-bold text-[#3A2E1A] text-base mb-4">
            How it Works
          </h3>

          {/* Four step cards in a grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-[#FDF6E8] border border-[#E8D8A0] rounded-lg p-4">
              <p className="font-bold text-[#111111] text-sm mb-2">01 Join</p>
              <p className="text-[#666666] text-xs">
                Browse available Quests and tap Join. Pay a small entry fee if
                it's a fundraiser — your contribution goes straight to the
                cause.
              </p>
            </div>
            <div className="bg-[#FDF6E8] border border-[#E8D8A0] rounded-lg p-4">
              <p className="font-bold text-[#111111] text-sm mb-2">02 Seek</p>
              <p className="text-[#666666] text-xs">
                When the Quest begins, your challenges unlock. Solve clues, find
                locations, and submit photo evidence — in any order you like.
              </p>
            </div>
            <div className="bg-[#FDF6E8] border border-[#E8D8A0] rounded-lg p-4">
              <p className="font-bold text-[#111111] text-sm mb-2">
                03 Explore
              </p>
              <p className="text-[#666666] text-xs">
                Track your progress in the app. Check the live leaderboard,
                compete with other Seekers, and earn points with every task you
                complete.
              </p>
            </div>
            <div className="bg-[#FDF6E8] border border-[#E8D8A0] rounded-lg p-4">
              <p className="font-bold text-[#111111] text-sm mb-2">
                04 Quest Complete!
              </p>
              <p className="text-[#666666] text-xs">
                Finish all tasks before time runs out. Top finishers win prizes,
                and if it was a fundraiser — you helped make a real difference.
              </p>
            </div>
          </div>

          {/* Two role cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="bg-[#FDF6E8] border border-[#E8D8A0] rounded-lg p-4">
              <p className="font-bold text-[#111111] text-sm mb-2">
                🏃 For Quest Seekers
              </p>
              <p className="text-[#666666] text-xs">
                Join existing Quests, complete challenges, earn points on the
                global leaderboard, and win prizes. Your entry fee (if any) goes
                directly to the hosting cause. Every year, the top-ranked
                Seekers across all Quests win special prizes before the
                leaderboard resets.
              </p>
            </div>
            <div className="bg-[#FDF6E8] border border-[#E8D8A0] rounded-lg p-4">
              <p className="font-bold text-[#111111] text-sm mb-2">
                🗺️ For Quest Creators
              </p>
              <p className="text-[#666666] text-xs">
                Design your own scavenger hunt event for fundraising, marketing,
                or community engagement. Set your tasks, entry fee, and prizes —
                QuestSeeker handles the tech. Non-profits start from just $50.
                Businesses choose from flat-fee plans up to 3,000 participants.
              </p>
            </div>
          </div>

          {/* Footer quote */}
          <div className="text-center text-sm text-gray-600 italic">
            "A brilliant way to have some fun and support a cause." Get started
            at <span className="font-bold not-italic">questseeker.co.nz</span>
          </div>
        </div>
      )
    }

    // "Quick Step-by-Step Guide for Seekers" section with numbered steps
    if (index === 1) {
      return (
        <div className="px-5 py-6 bg-white/50 text-gray-700 text-sm border-t border-gray-100">
          <p className="text-center text-gray-600 italic text-sm mb-6">
            Everything you need to get started — whether you're joining an
            adventure or creating one.
          </p>

          <div className="border-b-2 border-[#F0A800] mb-6"></div>

          {/* FOR QUEST SEEKERS */}
          <h3 className="font-bold text-[#111111] text-lg mb-3">
            🧭 FOR QUEST SEEKERS
          </h3>
          <p className="text-[#555555] text-sm mb-4">
            Ready to join an adventure? Here's how to go from sign-up to Quest
            Complete in 7 easy steps:
          </p>

          {/* 7 steps for Seekers */}
          <div className="space-y-3 mb-8">
            {[
              {
                num: '1',
                title: 'Download & Sign Up',
                desc: 'Save the QuestSeeker app to your home screen via Chrome or Safari (iOS or Android). Create your free account — just your name, email, and a password.',
              },
              {
                num: '2',
                title: 'Browse & Choose a Quest',
                desc: 'Log in and explore available Quests. Browse by name or region, or sort by start date. Each listing shows the host organisation, dates, number of tasks, location, and any entry fee.',
              },
              {
                num: '3',
                title: 'Join & Pay',
                desc: "Tap the Join Quest button. If there's an entry fee (typically $10-$20 for fundraising Quests), pay securely via Stripe. Corporate-sponsored Quests are often free to enter.",
              },
              {
                num: '4',
                title: 'Complete the Tasks',
                desc: 'When the Quest starts, your task list unlocks. Complete challenges in any order — answer trivia, snap photos as proof, or check in at GPS locations. Work solo or with family and friends!',
              },
              {
                num: '5',
                title: 'Track Your Progress',
                desc: "The app shows which tasks you've finished and which remain. Keep an eye on the leaderboard to see how you rank overall in Quest Seeker. Stuck on a task? Skip it and come back later.",
              },
              {
                num: '6',
                title: 'Submit & Complete',
                desc: "Submit all tasks before the Quest's end date. The Creator will review submissions (especially photos). Finishers appear on the Completed Quest page — ranked by time and completion of the Quest.",
              },
              {
                num: '7',
                title: 'Collect Your Reward',
                desc: 'Winners are announced in the app. Prizes range from digital badges and certificates to gift cards and sponsored rewards. Keep your contact details updated so you can be contacted. And if it was a fundraiser — you helped make a real difference!',
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

          {/* FOR QUEST CREATORS */}
          <h3 className="font-bold text-[#111111] text-lg mb-3">
            🗺️ FOR QUEST CREATORS
          </h3>
          <p className="text-[#555555] text-sm mb-4">
            Want to run your own scavenger hunt event? Whether you're a charity,
            school, or business, here's how to launch a Quest from scratch:
          </p>

          {/* 7 steps for Creators */}
          <div className="space-y-3 mb-8">
            {[
              {
                num: '1',
                title: 'Register as a Creator',
                desc: 'From the app menu, select \'My Account.\' Under the "Quest Seeker" button, select "Become a Quest Creator". You\'ll be prompted to complete your organiser profile: organisation name, type, registration number (if applicable), description, and primary contact details.',
              },
              {
                num: '2',
                title: 'Your Plan is Based on "Business Type"',
                desc: 'Non-Profit / Personal Fundraiser: $50 flat fee + 15% service fee on entry fees collected. │ Small Business (up to 500 participants): $299 flat fee, no commission. │ Large Business / Enterprise (up to 3,000 participants): $950 flat fee, no commission.',
              },
              {
                num: '3',
                title: 'Set Up Your Quest',
                desc: 'Give your Quest a title, cover image, region, and a compelling description. Set start and end dates. Add details of any sponsors and add any prize details where applicable. Be clear about whether participants need to be in a specific Location/Region/Country or can play from anywhere.',
              },
              {
                num: '4',
                title: 'Build Your Task List',
                desc: 'Add challenges one by one. For each task, choose the type (text answer, photo upload, or GPS check-in), write the clue or instruction and set the answer for verification. Aim for a mix of easy and challenging tasks to keep it fun for all ages.',
              },
              {
                num: '5',
                title: 'Configure Fundraising & Prizes',
                desc: 'Set your entry fee (e.g. $15 per player) — the app handles collection via Stripe. Add prizes to attract participants: a grand prize for the winner, secondary prizes for runners-up. Points will be awarded to all those who complete Quests.',
              },
              {
                num: '6',
                title: 'Publish & Promote',
                desc: '"Finish & Create Quest" to go to Stripe payment gateway where you will be charged a flat-fee before returning to Quest Seeker where your Quest will be published. Spread the word via email newsletters, social media, community boards, and partner organisations. Your first "3 Tasks" will be visible to members browsing to build excitement before the start date!',
              },
              {
                num: '7',
                title: 'Review & Reward',
                desc: 'After the Quest Ends, you will be able to view Quests you Created via "My Quests". You can "Prepare PDF" to review submissions for each participant who has completed the Quest. "Select Winners by Prize" manually or "pick a random winner" for each prize available. Write and send all participants a thank-you message — and if it was a fundraiser, share the total raised!',
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
              businesses for sponsored rewards — many are happy to donate items
              or vouchers in exchange for visibility during your event.
            </p>
          </div>

          {/* Pricing table */}
          <h3 className="font-bold text-[#111111] text-base mb-3">
            💳 Creator Pricing at a Glance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Plan
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Flat Fee
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Participants
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Commission
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    Non-Profit / Personal
                  </td>
                  <td className="border border-gray-300 px-3 py-2">$50</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Unlimited
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    15% on entry fees
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    Small Business
                  </td>
                  <td className="border border-gray-300 px-3 py-2">$299</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Up to 500
                  </td>
                  <td className="border border-gray-300 px-3 py-2">None</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    Large Business / Enterprise
                  </td>
                  <td className="border border-gray-300 px-3 py-2">$950</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Up to 3,000
                  </td>
                  <td className="border border-gray-300 px-3 py-2">None</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // "Quick Step-by-Step Guide for Creators" section with numbered steps
    if (index === 3) {
      return (
        <div className="px-5 py-6 bg-white/50 text-gray-700 text-sm border-t border-gray-100">
          <div className="border-b-2 border-[#F0A800] mb-6"></div>

          {/* FOR QUEST CREATORS */}
          <h3 className="font-bold text-[#111111] text-lg mb-3">
            🗺️ FOR QUEST CREATORS
          </h3>
          <p className="text-[#555555] text-sm mb-4">
            Want to run your own scavenger hunt event? Whether you're a charity,
            school, or business, here's how to launch a Quest from scratch:
          </p>

          {/* 7 steps for Creators */}
          <div className="space-y-3 mb-8">
            {[
              {
                num: '1',
                title: 'Register as a Creator',
                desc: 'From the app menu, select \'My Account.\' Under the "Quest Seeker" button, select "Become a Quest Creator". You\'ll be prompted to complete your organiser profile: organisation name, type, registration number (if applicable), description, and primary contact details.',
              },
              {
                num: '2',
                title: 'Your Plan is Based on "Business Type"',
                desc: 'Non-Profit / Personal Fundraiser: $50 flat fee + 15% service fee on entry fees collected. │ Small Business (up to 500 participants): $299 flat fee, no commission. │ Large Business / Enterprise (up to 3,000 participants): $950 flat fee, no commission.',
              },
              {
                num: '3',
                title: 'Set Up Your Quest',
                desc: 'Give your Quest a title, cover image, region, and a compelling description. Set start and end dates. Add details of any sponsors and add any prize details where applicable. Be clear about whether participants need to be in a specific Location/Region/Country or can play from anywhere.',
              },
              {
                num: '4',
                title: 'Build Your Task List',
                desc: 'Add challenges one by one. For each task, choose the type (text answer, photo upload, or GPS check-in), write the clue or instruction and set the answer for verification. Aim for a mix of easy and challenging tasks to keep it fun for all ages.',
              },
              {
                num: '5',
                title: 'Configure Fundraising & Prizes',
                desc: 'Set your entry fee (e.g. $15 per player) — the app handles collection via Stripe. Add prizes to attract participants: a grand prize for the winner, secondary prizes for runners-up. Points will be awarded to all those who complete Quests.',
              },
              {
                num: '6',
                title: 'Publish & Promote',
                desc: '"Finish & Create Quest" to go to Stripe payment gateway where you will be charged a flat-fee before returning to Quest Seeker where your Quest will be published. Spread the word via email newsletters, social media, community boards, and partner organisations. Your first "3 Tasks" will be visible to members browsing to build excitement before the start date!',
              },
              {
                num: '7',
                title: 'Review & Reward',
                desc: 'After the Quest Ends, you will be able to view Quests you Created via "My Quests". You can "Prepare PDF" to review submissions for each participant who has completed the Quest. "Select Winners by Prize" manually or "pick a random winner" for each prize available. Write and send all participants a thank-you message — and if it was a fundraiser, share the total raised!',
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
              businesses for sponsored rewards — many are happy to donate items
              or vouchers in exchange for visibility during your event.
            </p>
          </div>
        </div>
      )
    }

    // "Quick Step-by-Step Guide for Seekers" section with numbered steps
    if (index === 5) {
      return (
        <div className="px-5 py-6 bg-white/50 text-gray-700 text-sm border-t border-gray-100">
          <div className="border-b-2 border-[#F0A800] mb-6"></div>

          {/* Pricing table */}
          <h3 className="font-bold text-[#111111] text-base mb-3">
            💳 Creator Pricing at a Glance
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Plan
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Flat Fee
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Participants
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">
                    Commission
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    Non-Profit / Personal
                  </td>
                  <td className="border border-gray-300 px-3 py-2">$50</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Unlimited
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    15% on entry fees
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    Small Business
                  </td>
                  <td className="border border-gray-300 px-3 py-2">$299</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Up to 500
                  </td>
                  <td className="border border-gray-300 px-3 py-2">None</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                    Large Business / Enterprise
                  </td>
                  <td className="border border-gray-300 px-3 py-2">$950</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Up to 3,000
                  </td>
                  <td className="border border-gray-300 px-3 py-2">None</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // Default rendering for other sections (original list format)
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

  // NOW you can do early returns
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
                  About QS
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
                adventure or creating one
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
