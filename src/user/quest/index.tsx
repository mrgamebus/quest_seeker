import { useLocation, useNavigate } from 'react-router-dom'
import QuestListItem from '@/components/QuestListItem'
import {
  useAllUserQuests,
  useQuestList,
  useUserQuests,
} from '@/hooks/userQuests'
import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import bg from '@/assets/images/background_main.jpeg'
import type { Profile, Quest } from '@/types'
import AddQuestButton from '@/components/AddQuestButton'
import { useCurrentUserProfile, useProfileList } from '@/hooks/userProfiles'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Toolbar } from '@/components/Toolbar'
import { Home } from 'lucide-react'
import SignOutButton from '@/components/SignOutButton'
import { Button } from '@/components/ui/button'
import { QuestStatus } from '@/graphql/API'

export default function QuestPage() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const selectedRegion = searchParams.get('region') || 'Browse all'
  const { data: quests, error, isLoading } = useQuestList()
  const allQuests: Quest[] = quests ?? []
  const { data: profiles } = useProfileList()
  const { data: currentProfile } = useCurrentUserProfile()
  const { data: userQuests } = useUserQuests(currentProfile?.id)
  const { data: allUserQuests = [] } = useAllUserQuests()

  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState('title')
  const [showJoined, setShowJoined] = useState(false)

  const profileMap: Record<string, Profile> = useMemo(() => {
    const map: Record<string, Profile> = {}

    profiles?.forEach((p) => {
      if (!p?.id) return

      map[p.id] = {
        id: p.id,
        full_name: p.full_name ?? '',
        email: p.email ?? '',
        phone: p.phone ?? '',
        organization_name: p.organization_name ?? '',
        registration_number: p.registration_number ?? '',
        charity_number: p.charity_number ?? '',
        business_type: p.business_type ?? '',
        organization_description: p.organization_description ?? '',
        primary_contact_name: p.primary_contact_name ?? '',
        primary_contact_position: p.primary_contact_position ?? '',
        primary_contact_phone: p.primary_contact_phone ?? '',
        about_me: p.about_me ?? '',
        secondary_contact_name: p.secondary_contact_name ?? '',
        secondary_contact_position: p.secondary_contact_position ?? '',
        secondary_contact_phone: p.secondary_contact_phone ?? '',
        image: p.image ?? '',
        image_thumbnail: p.image_thumbnail ?? '',
        role: p.role ?? 'seeker',
        points: p.points ?? 0,
        seeker_rank: p.seeker_rank ?? 'wanderer',
      }
    })

    return map
  }, [profiles])

  const validQuests = useMemo(() => {
    const now = new Date()

    return allQuests.filter((quest) => {
      if (!quest.quest_end_at) return false

      const questEnd = new Date(quest.quest_end_at)

      const matchesRegion =
        selectedRegion === 'Browse all' || quest.region === selectedRegion

      const isPublished = quest.status === QuestStatus.published
      const isOwner = quest.creator_id === currentProfile?.id

      return matchesRegion && questEnd >= now && (isPublished || isOwner)
    })
  }, [allQuests, selectedRegion, currentProfile?.id])

  const filteredQuests = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return validQuests.filter((q) => {
      if (!q.creator_id) return false

      const creatorOrg = profileMap[q.creator_id]?.organization_name ?? ''

      return (
        q.quest_name?.toLowerCase().includes(term) ||
        q.region?.toLowerCase().includes(term) ||
        creatorOrg.toLowerCase().includes(term)
      )
    })
  }, [validQuests, searchTerm, profileMap])

  const joinedFilteredQuests = useMemo(() => {
    if (!showJoined) return filteredQuests
    return filteredQuests.filter((q) =>
      userQuests?.some((uq) => uq.questId === q.id),
    )
  }, [filteredQuests, showJoined, userQuests])

  const sortedQuests = useMemo(() => {
    const sorted = [...joinedFilteredQuests]

    switch (sortOption) {
      case 'title':
        sorted.sort((a, b) =>
          (a.quest_name || '').localeCompare(b.quest_name || ''),
        )
        break
      case 'newest':
        sorted.sort(
          (a, b) =>
            new Date(b.quest_start_at || '').getTime() -
            new Date(a.quest_start_at || '').getTime(),
        )
        break
      case 'oldest':
        sorted.sort(
          (a, b) =>
            new Date(a.quest_start_at || '').getTime() -
            new Date(b.quest_start_at || '').getTime(),
        )
        break
      case 'recently-added':
        sorted.sort((a, b) => (b.id > a.id ? 1 : -1))
        break
      case 'expiry-soonest':
        sorted.sort(
          (a, b) =>
            new Date(a.quest_end_at || '').getTime() -
            new Date(b.quest_end_at || '').getTime(),
        )
        break
      case 'expiry-furthest':
        sorted.sort(
          (a, b) =>
            new Date(b.quest_end_at || '').getTime() -
            new Date(a.quest_end_at || '').getTime(),
        )
        break
      default:
        break
    }

    return sorted
  }, [joinedFilteredQuests, sortOption])

  const pageSize = 12
  const [visibleCount, setVisibleCount] = useState(pageSize)

  const visibleQuests = sortedQuests.slice(0, visibleCount)

  const fetchMoreQuests = () => {
    setTimeout(() => {
      setVisibleCount((prev) => prev + pageSize)
    }, 500)
  }

  const participantCounts = useMemo(() => {
    return allUserQuests.reduce(
      (acc, uq) => {
        if (uq.questId) {
          acc[uq.questId] = (acc[uq.questId] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )
  }, [allUserQuests])

  return (
    <div
      className="relative h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <Card className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl max-w-5xl w-full h-full max-h-full flex flex-col overflow-hidden">
        <CardContent className="flex flex-col gap-4 flex-1 min-h-0 p-0">
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

              <Button variant="yellow" onClick={() => navigate('/user/leader')}>
                Leader Board
              </Button>

              <Button variant="yellow" onClick={() => navigate('/user/help')}>
                Help Guide
              </Button>

              <SignOutButton />
            </Toolbar>
          </div>
          {/* Search + Sort Controls */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <div className="w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
              {/* Search */}
              <input
                type="text"
                placeholder="Search quests..."
                className="w-full sm:w-1/2 p-2 border border-gray-300 rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {/* Add the Joined Already checkbox here */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showJoined}
                  onChange={(e) => setShowJoined(e.target.checked)}
                />
                <span className="text-sm">Show only quests I've joined</span>
              </label>

              {/* Sort Dropdown */}
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full sm:w-auto p-2 border border-gray-300 rounded-lg"
              >
                <option value="title">Title A–Z</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="recently-added">Recently Added</option>
                <option value="expiry-soonest">Expiry — Soonest First</option>
                <option value="expiry-furthest">Expiry — Furthest First</option>
              </select>
              <AddQuestButton to="/user/quest/create" />
            </div>

            {/* Loading / error / empty states */}
            {isLoading && <p>Loading quests...</p>}
            {error && <p>Failed to fetch quests.</p>}
            {!isLoading && !error && sortedQuests.length === 0 && (
              <p>No quests match your search or filters.</p>
            )}

            <InfiniteScroll
              dataLength={visibleQuests.length}
              next={fetchMoreQuests}
              hasMore={visibleCount < sortedQuests.length}
              loader={
                <p className="text-center py-3">Loading more quests...</p>
              }
              scrollThreshold={0.9}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-10">
                {visibleQuests.map((quest: Quest) => (
                  <QuestListItem
                    key={quest.id}
                    quest={{
                      ...quest,
                      quest_name: quest.quest_name ?? 'Untitled Quest',
                      quest_image: quest.quest_image ?? undefined,
                      quest_start_at: quest.quest_start_at ?? undefined,
                      quest_end_at: quest.quest_end_at ?? undefined,
                      region: quest.region ?? 'Unknown',
                    }}
                    userQuests={userQuests}
                    participantCount={participantCounts[quest.id] || 0}
                  />
                ))}
              </div>
            </InfiniteScroll>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
