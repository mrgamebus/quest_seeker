import { generateClient, GraphQLResult } from 'aws-amplify/data'
import { getCurrentUser } from 'aws-amplify/auth'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useMutateQuest,
  useQuest,
  useQuestParticipants,
  useUserQuests,
} from '@/hooks/userQuests'
import { FacebookShareButton, FacebookIcon } from 'react-share'
import { useProfile, useCurrentUserProfile } from '@/hooks/userProfiles'
import bg from '@/assets/images/background_main.jpeg'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { useEffect, useState } from 'react'
import { Prize, Sponsor, Task, Profile, UserQuest } from '@/types'
import RemoteImage from './RemoteImage'
import placeHold from '@/assets/images/placeholder_view_vector.svg'
import useEmblaCarousel from 'embla-carousel-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog'
import TaskInformationWindow from './TaskInformationWindow'
import { Pencil, Home } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip'
import { Toolbar } from './Toolbar'
import TaskPreview from './TaskPreview'
import { GetProfileQuery, MutateQuestAction, QuestStatus } from '@/graphql/API'
import { getProfile } from '@/graphql/queries'
import SignOutButton from './SignOutButton'
import { useQuestDeletion } from '@/hooks/useQuestDeletion'
import { PDFDownloadLink } from '@react-pdf/renderer'
import SeekerTaskPdfButton from '@/components/SeekerTaskPdfButton'
import { format, toZonedTime } from 'date-fns-tz'
import { getUrl } from 'aws-amplify/storage'
import { ensureArray } from '@/tools/ensureArray'
import { joinQuest, createQuestEntrySession } from '@/graphql/mutations'
import { useToast } from '@/hooks/use-toast'

export default function QuestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [joining, setJoining] = useState(false)
  const [winners, setWinners] = useState<any[]>([])
  const [winnerProfiles, setWinnerProfiles] = useState<Record<string, Profile>>(
    {},
  )
  const [creatorMessage, setCreatorMessage] = useState('')

  const { mutate: updateQuestMutation, isPending: isUpdatingQuest } =
    useMutateQuest()

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const { deleteQuest, loading: deleting } = useQuestDeletion()

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev()
  const scrollNext = () => emblaApi && emblaApi.scrollNext()
  const navigate = useNavigate()

  const { data: quest, isLoading, error, refetch } = useQuest(id)
  const questCreatorProfile = useProfile(quest?.creator_id || '')
  const { data: currentUserProfile, refetch: refetchProfile } =
    useCurrentUserProfile()

  const { data: userQuests, refetch: refetchUserQuests } = useUserQuests(
    currentUserProfile?.id,
  )
  const { data: questParticipants } = useQuestParticipants(quest?.id)
  const participantIds = questParticipants?.map((uq) => uq.profileId) ?? []
  const [participantProfiles, setParticipantProfiles] = useState<Profile[]>([])
  const [participantsLoaded, setParticipantsLoaded] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])

  const [pdfTasksByParticipant, setPdfTasksByParticipant] = useState<
    Record<string, Task[]>
  >({})
  const [pdfLoadingById, setPdfLoadingById] = useState<Record<string, boolean>>(
    {},
  )

  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const isExpired = quest?.status === QuestStatus.expired
  const NZ_TZ = 'Pacific/Auckland'

  useEffect(() => {
    if (!quest) return
    setTasks(ensureArray<Task>(quest.quest_tasks))

    try {
      const parsedWinners = quest.quest_winners
        ? JSON.parse(quest.quest_winners)
        : []
      setWinners(parsedWinners)
    } catch {
      setWinners([])
    }
  }, [quest])

  useEffect(() => {
    if (isExpired && !participantsLoaded && participantIds.length > 0) {
      handleOpenParticipants()
    }
  }, [isExpired, participantsLoaded, participantIds])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    if (!sessionId) return

    setPaymentSuccess(true)

    // Clean up the URL without triggering a reload
    const cleanUrl = window.location.pathname
    window.history.replaceState({}, '', cleanUrl)
  }, [])

  // Parse winners when quest loads
  useEffect(() => {
    if (!quest) return
    setTasks(ensureArray<Task>(quest.quest_tasks))

    try {
      const parsedWinners = quest.quest_winners
        ? JSON.parse(quest.quest_winners)
        : []
      setWinners(parsedWinners)
    } catch {
      setWinners([])
    }
  }, [quest])

  useEffect(() => {
    if (quest?.creator_message) {
      setCreatorMessage(quest.creator_message)
    }
  }, [quest])

  useEffect(() => {
    const fetchWinnerProfiles = async () => {
      if (winners.length === 0) return

      const winnerIds = winners.map((w: any) => w.user_id)
      const uniqueIds = [...new Set(winnerIds)] // Remove duplicates

      try {
        const profiles = await Promise.all(
          uniqueIds.map(async (id) => {
            const res = await client.graphql<GraphQLResult<GetProfileQuery>>({
              query: getProfile,
              variables: { id },
              authMode: 'userPool',
            })
            return 'data' in res ? res.data?.getProfile : null
          }),
        )

        const profileMap: Record<string, Profile> = {}
        profiles.forEach((profile) => {
          if (profile) {
            profileMap[profile.id] = profile as Profile
          }
        })

        setWinnerProfiles(profileMap)
      } catch (err) {
        console.error('Failed to fetch winner profiles:', err)
      }
    }

    fetchWinnerProfiles()
  }, [winners]) // Re-fetch whenever winners change

  const client = generateClient()

  if (isLoading) return <p>Loading quest...</p>
  if (error) return <p>Failed to fetch quest.</p>
  if (!quest) return <p>Quest not found.</p>

  function formatNzDateTime(iso?: string | null) {
    if (!iso) return '—'

    const nzDate = toZonedTime(new Date(iso), NZ_TZ)

    return format(nzDate, 'd MMM yyyy, h:mm a', {
      timeZone: 'Pacific/Auckland',
    })
  }

  const preparePdfTasks = async (participantId?: string) => {
    const targetId = participantId || currentUserProfile?.id
    if (!targetId) return []

    setPdfLoadingById((prev) => ({ ...prev, [targetId]: true }))

    // Determine which tasks to prepare
    let tasksToResolve: Task[]

    if (participantId) {
      const participantQuest = questParticipants?.find(
        (uq) => uq.profileId === participantId,
      )

      if (!participantQuest) {
        setPdfLoadingById((prev) => ({ ...prev, [targetId]: false }))
        return []
      }

      const participantTasks = Array.isArray(participantQuest.tasks)
        ? participantQuest.tasks
        : (() => {
            try {
              return typeof participantQuest.tasks === 'string'
                ? JSON.parse(participantQuest.tasks)
                : []
            } catch {
              return []
            }
          })()

      tasksToResolve = tasks.map((task) => {
        const existingAnswer = participantTasks.find(
          (t: { id: string }) => t.id === task.id,
        )
        return {
          ...task,
          caption: existingAnswer?.caption || '',
          answer: existingAnswer?.answer || '',
          location: existingAnswer?.location || '',
        }
      })
    } else {
      tasksToResolve = seekerTasks
    }

    // Resolve image URLs
    const resolved = await Promise.all(
      tasksToResolve.map(async (task) => {
        if (!task.isImage || !task.answer) return task

        try {
          const { url } = await getUrl({
            path: task.answer,
          })

          return {
            ...task,
            answer: url.toString(),
          }
        } catch (err) {
          console.error('Failed to resolve image URL:', err)
          return task
        }
      }),
    )

    setPdfTasksByParticipant((prev) => ({ ...prev, [targetId]: resolved }))
    setPdfLoadingById((prev) => ({ ...prev, [targetId]: false }))
    return resolved
  }

  const completedParticipants = participantProfiles.filter((profile) => {
    const userQuest = questParticipants?.find(
      (uq) => uq.profileId === profile.id,
    )
    if (!userQuest) return false
    if (userQuest.status === 'COMPLETED') return true

    // Fallback: check if all tasks are completed
    const participantTasks = ensureArray<Task>(
      Array.isArray(userQuest.tasks)
        ? userQuest.tasks
        : typeof userQuest.tasks === 'string'
          ? JSON.parse(userQuest.tasks)
          : [],
    )

    if (participantTasks.length === 0) return false

    return (
      participantTasks.filter((t) => t.completed).length ===
      participantTasks.length
    )
  })

  // Random winner selection for a specific prize
  const pickWinnerForPrize = (prizeId: string, place: number) => {
    const availableParticipants = completedParticipants.filter(
      (p) => !winners.some((w) => w.user_id === p.id),
    )

    if (availableParticipants.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No participants available',
        description: 'All eligible participants have already won a prize.',
      })
      return
    }

    const randomIndex = Math.floor(Math.random() * availableParticipants.length)
    const selected = availableParticipants[randomIndex]

    selectWinnerForPrize(prizeId, place, selected)
  }

  const selectWinnerForPrize = (
    prizeId: string,
    place: number,
    profile: Profile,
  ) => {
    const filteredWinners = winners.filter((w) => w.prize_id !== prizeId)

    const newWinner = {
      place,
      prize_id: prizeId,
      user_id: profile.id,
      username: profile.full_name || 'Unknown',
      email: profile.email || '',
      phone: profile.phone || '',
      selected_at: new Date().toISOString(),
    }

    const updatedWinners = [...filteredWinners, newWinner].sort(
      (a, b) => a.place - b.place,
    )

    updateQuestMutation(
      {
        action: MutateQuestAction.UPDATE_COMPLETED,
        questId: quest.id,
        quest_winners: JSON.stringify(updatedWinners),
        creator_message: quest.creator_message,
      },
      {
        onSuccess: () => {
          setWinners(updatedWinners)
          toast({
            title: 'Winner Selected! 🎉',
            description: `${profile.full_name} has been selected as the winner!`,
          })
          refetch()
        },
        onError: (err) => {
          console.error('Failed to save winner:', err)
          toast({
            variant: 'destructive',
            title: 'Failed to save winner',
            description:
              'There was an error saving the winner to the database.',
          })
        },
      },
    )
  }

  const handleJoinQuest = async () => {
    if (!quest?.id || !currentUserProfile?.id) return
    setJoining(true)
    try {
      const entryFee = quest.quest_entry ?? 0

      if (entryFee > 0) {
        const returnUrl = `${window.location.origin}/user/quest/${quest.id}`

        const result = await client.graphql({
          query: createQuestEntrySession,
          variables: {
            questId: quest.id,
            profileId: currentUserProfile.id,
            questName: quest.quest_name ?? 'Quest',
            entryFee,
            returnUrl,
          },
        })

        const sessionUrl = result.data?.createQuestEntrySession
        if (!sessionUrl) throw new Error('No session URL returned')

        window.location.href = sessionUrl
      } else {
        await client.graphql({
          query: joinQuest,
          variables: {
            questId: quest.id,
            profileId: currentUserProfile.id,
          },
        })

        toast({
          title: 'Quest Joined! ✅',
          description: 'The quest has been added to your profile.',
        })

        await refetch()
        await refetchProfile()
        await refetchUserQuests()
      }
    } catch (err) {
      console.error('❌ Failed to join quest:', err)
      toast({
        variant: 'destructive',
        title: 'Failed to join quest',
        description: 'There was an error joining the quest. Please try again.',
      })
    } finally {
      setJoining(false)
    }
  }

  const handleRestartQuest = async () => {
    if (!quest?.id) return

    const confirmed = window.confirm(
      'Are you sure you want to restart this quest? This will:\n\n' +
        '• Change the status back to Published\n' +
        '• Extend the end date by 7 days from today\n' +
        '• Allow new participants to join\n\n' +
        'Existing participant data will be preserved.',
    )

    if (!confirmed) return

    try {
      const NZ_TZ = 'Pacific/Auckland'
      const nowNz = toZonedTime(new Date(), NZ_TZ)
      const newEndDate = new Date(nowNz)
      newEndDate.setDate(newEndDate.getDate() + 7)
      newEndDate.setHours(17, 0, 0, 0) // 5 PM NZT

      const newEndIso = newEndDate.toISOString()

      await updateQuestMutation(
        {
          action: MutateQuestAction.UPDATE_COMPLETED,
          questId: quest.id,
          status: QuestStatus.published,
          endAt: newEndIso,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Quest Restarted! 🔄',
              description: `The quest is now active again until ${formatNzDateTime(newEndIso)}.`,
            })
            refetch()
          },
          onError: (err) => {
            console.error('Failed to restart quest:', err)
            toast({
              variant: 'destructive',
              title: 'Failed to restart quest',
              description:
                'There was an error restarting the quest. Please try again.',
            })
          },
        },
      )
    } catch (err) {
      console.error('Error restarting quest:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      })
    }
  }

  const isOwner =
    currentUserProfile?.id === quest.creator_id &&
    (currentUserProfile?.role === 'creator' ||
      currentUserProfile.role === 'Admin')

  const isAdmin = currentUserProfile?.role === 'Admin'

  const joinedQuestEntry = userQuests?.find((uq) => uq.questId === quest.id)
  const hasJoined = !!joinedQuestEntry
  const joinedTasks = Array.isArray(joinedQuestEntry?.tasks)
    ? joinedQuestEntry.tasks
    : (() => {
        try {
          return typeof joinedQuestEntry?.tasks === 'string'
            ? JSON.parse(joinedQuestEntry.tasks)
            : []
        } catch {
          return []
        }
      })()

  const totalTasks = joinedTasks.length

  const completedTasks = joinedTasks.filter(
    (t: { completed: boolean }) => t.completed,
  ).length
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const seekerTasks = tasks.map((task) => {
    const existingAnswer = joinedTasks.find(
      (t: { id: string }) => t.id === task.id,
    )
    return {
      ...task,
      caption: existingAnswer?.caption || '',
      answer: existingAnswer?.answer || '',
      location: existingAnswer?.location || '',
    }
  })

  const sponsors: Sponsor[] = (() => {
    try {
      return quest.quest_sponsor ? JSON.parse(quest.quest_sponsor) : []
    } catch {
      return []
    }
  })()

  const prizes: Prize[] = (() => {
    try {
      return quest.quest_prize_info ? JSON.parse(quest.quest_prize_info) : []
    } catch {
      return []
    }
  })()

  const displayedSponsors = sponsors.slice(0, 2)

  const handleOpenParticipants = async () => {
    if (participantsLoaded) return

    try {
      const { signInDetails } = await getCurrentUser()
      const currentEmail = signInDetails?.loginId ?? ''

      const profiles = await Promise.all(
        participantIds.map(async (id) => {
          const res = await client.graphql<GraphQLResult<GetProfileQuery>>({
            query: getProfile,
            variables: { id },
            authMode: 'userPool',
          })

          const profile = 'data' in res ? (res.data?.getProfile ?? null) : null

          if (profile && id === currentUserProfile?.id) {
            return { ...profile, email: currentEmail }
          }
          return profile
        }),
      )

      setParticipantProfiles(profiles.filter(Boolean) as Profile[])
      setParticipantsLoaded(true)
    } catch (err) {
      console.error('Failed to fetch participant profiles:', err)
    }
  }

  const handleSaveMessage = async () => {
    if (!quest?.id) return

    try {
      await updateQuestMutation(
        {
          action: MutateQuestAction.UPDATE_COMPLETED,
          questId: quest.id,
          creator_message: creatorMessage,
          quest_winners: quest.quest_winners,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Message Saved! 💬',
              description: 'Your message has been sent to all participants.',
            })
            refetch() // Refresh quest data
          },
          onError: (err) => {
            console.error('Failed to save message:', err)
            toast({
              variant: 'destructive',
              title: 'Failed to save message',
              description:
                'There was an error saving your message. Please try again.',
            })
          },
        },
      )
    } catch (err) {
      console.error('Error saving message:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      })
    }
  }

  const canEdit =
    quest.status === QuestStatus.draft ||
    (quest.status === QuestStatus.published && participantIds.length === 0)

  const currentUserId = currentUserProfile?.id
  const seekerPreparedTasks = currentUserId
    ? pdfTasksByParticipant[currentUserId]
    : undefined
  const seekerLoading = currentUserId ? pdfLoadingById[currentUserId] : false

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <Card className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl max-w-5xl w-full flex flex-col">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md p-2 rounded-md shadow-md">
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
                About QS
              </Button>
              <SignOutButton />
            </Toolbar>
          </div>

          {/* Banner Image with overlayed quest title */}
          <div className="relative w-full mb-4 md:mb-20">
            {/* Banner Image */}
            <RemoteImage
              path={quest.quest_image || placeHold}
              fallback={placeHold}
              className="w-full h-[250px] md:h-[350px] object-cover rounded-t-2xl"
            />

            {/* Gradient overlay at bottom for contrast */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl" />

            {/* Overlayed quest name (left) */}
            <div className="absolute bottom-8 left-6 z-10">
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                {quest.quest_name}
              </h1>
            </div>

            {/* Social Share Button Card - positioned like sponsors */}
            <div className="absolute top-2 left-2 z-20 md:top-auto md:left-10 md:bottom-[-60px] md:bg-white md:rounded-2xl md:shadow-xl md:border md:border-gray-200 md:p-5">
              <div className="flex items-center gap-2">
                {/* <span className="hidden md:inline text-sm font-semibold text-gray-700">
                  
                </span> */}
                <FacebookShareButton
                  url={window.location.href}
                  hashtag={`#${quest.quest_name?.replace(/\s+/g, '')}`}
                >
                  <FacebookIcon size={32} round />
                </FacebookShareButton>
              </div>
            </div>

            {/* Sponsors card */}
            {displayedSponsors.length > 0 && (
              <Dialog>
                {' '}
                {/* Moved Dialog here to wrap the whole card */}
                <div
                  className="
        absolute top-2 right-2 flex flex-col items-end gap-1 z-20
        md:top-auto md:right-10 md:bottom-[-60px]
        md:bg-white md:rounded-2xl md:shadow-xl md:border md:border-gray-200
        md:p-5 md:gap-3
      "
                >
                  {/* Featured Sponsors link — desktop only */}
                  {sponsors.length >= 3 && (
                    <div className="hidden md:block">
                      <DialogTrigger asChild>
                        <span className="text-sm text-blue-600 font-medium underline cursor-pointer hover:text-blue-800">
                          Featured Sponsors
                        </span>
                      </DialogTrigger>
                    </div>
                  )}

                  {/* Sponsor Avatars - Now Clickable */}
                  <DialogTrigger asChild>
                    <div className="flex gap-2 md:gap-4 flex-wrap justify-end cursor-pointer hover:opacity-80 transition-opacity">
                      {displayedSponsors.map((sponsor) => (
                        <div
                          key={sponsor.id}
                          className="flex flex-col items-center w-10 md:w-20 text-center"
                        >
                          <div className="p-[2px] md:p-[3px] bg-white/80 md:bg-gradient-to-b md:from-gray-100 md:to-gray-200 rounded-full shadow">
                            <RemoteImage
                              path={sponsor.image || placeHold}
                              fallback={placeHold}
                              className="w-8 h-8 md:w-14 md:h-14 object-contain rounded-full border border-gray-300 shadow-sm bg-white"
                            />
                          </div>
                          <span className="hidden md:block text-xs mt-1 font-semibold text-gray-700">
                            {sponsor.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </DialogTrigger>

                  {/* Modal Content remains the same */}
                  <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
                  <DialogContent className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-full max-w-lg bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
                    <DialogTitle className="text-lg font-bold mb-4">
                      Featured Sponsors
                    </DialogTitle>
                    <div className="overflow-hidden" ref={emblaRef}>
                      <div className="flex">
                        {sponsors.map((sponsor) => (
                          <div
                            key={sponsor.id}
                            className="flex-[0_0_100%] flex flex-col items-center justify-center p-4"
                          >
                            <RemoteImage
                              path={sponsor.image || placeHold}
                              fallback={placeHold}
                              className="w-24 h-24 object-contain rounded-full mb-2"
                            />
                            <p className="font-semibold text-sm text-gray-700">
                              {sponsor.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <button
                        onClick={scrollPrev}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Previous
                      </button>
                      <button
                        onClick={scrollNext}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Next
                      </button>
                    </div>
                    <DialogClose asChild>
                      <button className="mt-6 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">
                        Close
                      </button>
                    </DialogClose>
                  </DialogContent>
                </div>
              </Dialog>
            )}

            {/* Edit Button (top right of banner) */}

            {isOwner && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate(`/user/quest/${id}/edit`)}
                      className={`absolute top-4 right-4 p-2 rounded-full bg-white/80 shadow z-20 ${
                        !canEdit
                          ? 'cursor-not-allowed opacity-50 hover:bg-white/80'
                          : 'hover:bg-white'
                      }`}
                      disabled={!canEdit}
                    >
                      <Pencil className="w-5 h-5 text-gray-700" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg"
                  >
                    {quest.status === QuestStatus.expired
                      ? 'Expired quests cannot be edited'
                      : participantIds.length > 0
                        ? 'Quests with participants cannot be edited'
                        : !canEdit
                          ? 'Only draft and published quests with no participants can be edited'
                          : 'Edit quest'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6 mt-2 w-full">
            {/* ---------------- LEFT SIDE ---------------- */}
            <div className="flex-1">
              {isExpired ? (
                /* ---------- EXPIRED VERSION: Show only the 4 fields ---------- */
                <>
                  <p className="text-gray-700 mb-2">{quest.quest_details}</p>

                  <p className="text-sm text-gray-500 mb-1">
                    Region: <strong>{quest.region}</strong>
                  </p>

                  {/* Changed from <p> to <div> */}
                  <div className="text-sm mb-1">
                    Organisation:{' '}
                    {questCreatorProfile?.data?.organization_name ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <span className="text-blue-600 underline cursor-pointer">
                            {questCreatorProfile.data.organization_name}
                          </span>
                        </DialogTrigger>
                        <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
                        <DialogContent className="fixed top-1/2 left-1/2 z-50 max-h-[70vh] w-full max-w-md bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
                          <RemoteImage
                            path={
                              questCreatorProfile.data.image_thumbnail ||
                              placeHold
                            }
                            fallback={placeHold}
                            className="w-32 h-32 rounded-full object-cover"
                          />
                          <DialogTitle className="text-lg font-bold mb-4">
                            {questCreatorProfile.data.organization_name}
                          </DialogTitle>
                          <p className="text-gray-700">
                            {questCreatorProfile.data
                              .organization_description || 'N/A'}
                          </p>
                          <DialogClose asChild>
                            <button className="mt-6 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">
                              Close
                            </button>
                          </DialogClose>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </div>

                  {/* Changed from <p> to <div> */}
                  <div className="text-sm text-gray-500">
                    Ended on:{' '}
                    <strong>{formatNzDateTime(quest.quest_end_at)}</strong>
                  </div>

                  {/* Changed from <p> to <div> */}
                  <div className="text-sm text-gray-500">
                    People who joined:
                    {participantIds.length > 0 && (
                      <Dialog
                        onOpenChange={(open) =>
                          open && handleOpenParticipants()
                        }
                      >
                        <DialogTrigger asChild>
                          <button className="text-blue-600 underline font-medium text-sm">
                            {participantIds.length} participant
                            {participantIds.length > 1 ? 's' : ''}
                          </button>
                        </DialogTrigger>

                        <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
                        <DialogContent className="fixed top-1/2 left-1/2 z-50 max-h-[70vh] w-full max-w-md bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
                          <DialogTitle className="text-lg font-bold mb-4">
                            Participants
                          </DialogTitle>

                          <div className="flex flex-col gap-3">
                            {participantProfiles.map((profile) => (
                              <div
                                key={profile.id}
                                className="flex items-center gap-3"
                              >
                                <RemoteImage
                                  path={profile.image_thumbnail || placeHold}
                                  fallback={placeHold}
                                  className="w-32 h-32 rounded-full object-cover"
                                />

                                {/* Text stacked vertically */}
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    <strong>
                                      {profile.full_name || 'Unknown'}
                                    </strong>
                                  </span>

                                  <span className="text-xs text-gray-600">
                                    {profile.about_me || ''}
                                  </span>
                                </div>
                              </div>
                            ))}

                            {participantProfiles.length === 0 && (
                              <p className="text-gray-500">Loading...</p>
                            )}
                          </div>

                          <DialogClose asChild>
                            <button className="mt-6 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">
                              Close
                            </button>
                          </DialogClose>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  {/* 🏆 WINNERS DISPLAY - For Seekers */}
                  {!isOwner && winners.length > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-lg p-4">
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                        <span className="text-xl">🏆</span>
                        Quest Winners
                      </h4>
                      <div className="flex flex-col gap-2">
                        {winners
                          .sort((a: any, b: any) => a.place - b.place)
                          .map((winner: any, index: number) => {
                            const prize = prizes.find(
                              (p) => p.id === winner.prize_id,
                            )
                            const medal =
                              index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'

                            return (
                              <div
                                key={winner.prize_id}
                                className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm"
                              >
                                <span className="text-2xl">{medal}</span>
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-gray-800">
                                    {winner.username}
                                  </p>
                                  {prize && (
                                    <p className="text-xs text-gray-600">
                                      Prize: {prize.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  {isOwner && (
                    <div className="lg:w-[450px] w-full bg-white/70 p-4 rounded-xl shadow">
                      <h4 className="text-md font-bold mb-3">
                        Select Winners by Prize
                      </h4>
                      {prizes.length > 0 ? (
                        <div className="mt-6 border-t pt-4">
                          <div className="flex flex-col gap-3">
                            {prizes.map((prize, index) => {
                              const prizeWinner = winners.find(
                                (w: any) => w.prize_id === prize.id,
                              )

                              const winnerProfile = prizeWinner
                                ? winnerProfiles[prizeWinner.user_id]
                                : null

                              return (
                                <Dialog key={prize.id}>
                                  <DialogTrigger asChild>
                                    <button
                                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                        prizeWinner
                                          ? 'bg-green-50 border-green-400 hover:bg-green-100'
                                          : 'bg-white border-gray-300 hover:border-yellow-400 hover:bg-yellow-50'
                                      }`}
                                    >
                                      <RemoteImage
                                        path={prize.image || placeHold}
                                        fallback={placeHold}
                                        className="w-12 h-12 object-contain rounded shrink-0"
                                      />
                                      <div className="flex-1 text-left">
                                        <p className="font-semibold text-sm">
                                          {prize.name}
                                        </p>
                                        {prizeWinner ? (
                                          <div>
                                            <p className="text-xs text-green-700 font-medium">
                                              🎉 Winner: {prizeWinner.username}
                                            </p>
                                            {/* ✅ Use winnerProfile for contact info */}
                                            {winnerProfile?.email && (
                                              <p className="text-xs text-gray-600 mt-1">
                                                📧 {winnerProfile.email}
                                              </p>
                                            )}
                                            {winnerProfile?.phone && (
                                              <p className="text-xs text-gray-600">
                                                📱 {winnerProfile.phone}
                                              </p>
                                            )}
                                            {/* ✅ Show loading state if profile not yet fetched */}
                                            {!winnerProfile && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                Loading contact info...
                                              </p>
                                            )}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-gray-500">
                                            Click to select winner
                                          </p>
                                        )}
                                      </div>
                                      <span className="text-2xl">
                                        {index === 0
                                          ? '🥇'
                                          : index === 1
                                            ? '🥈'
                                            : '🥉'}
                                      </span>
                                    </button>
                                  </DialogTrigger>

                                  <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
                                  <DialogContent className="fixed top-1/2 left-1/2 z-50 max-h-[80vh] w-full max-w-md bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
                                    <DialogTitle className="text-lg font-bold mb-4">
                                      Select Winner for {prize.name}
                                    </DialogTitle>

                                    {/* Prize Details */}
                                    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                      <RemoteImage
                                        path={prize.image || placeHold}
                                        fallback={placeHold}
                                        className="w-16 h-16 object-contain rounded"
                                      />
                                      <div>
                                        <p className="font-semibold">
                                          {prize.name}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Random Selection Button */}
                                    <button
                                      onClick={() =>
                                        pickWinnerForPrize(prize.id, index + 1)
                                      }
                                      disabled={isUpdatingQuest}
                                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg shadow mb-4 disabled:opacity-50"
                                    >
                                      {isUpdatingQuest
                                        ? 'Selecting...'
                                        : '🎲 Pick Random Winner'}
                                    </button>

                                    {/* Manual Selection List */}
                                    <div className="border-t pt-4">
                                      <p className="text-sm font-semibold mb-2">
                                        Or select manually:
                                      </p>
                                      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                                        {completedParticipants.map(
                                          (profile) => {
                                            const alreadyWon = winners.some(
                                              (w: any) =>
                                                w.user_id === profile.id,
                                            )

                                            return (
                                              <button
                                                key={profile.id}
                                                onClick={() =>
                                                  selectWinnerForPrize(
                                                    prize.id,
                                                    index + 1,
                                                    profile,
                                                  )
                                                }
                                                disabled={
                                                  alreadyWon || isUpdatingQuest
                                                }
                                                className={`flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
                                                  alreadyWon
                                                    ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                                                    : 'bg-white hover:bg-yellow-50 border border-gray-200 hover:border-yellow-400'
                                                }`}
                                              >
                                                <RemoteImage
                                                  path={
                                                    profile.image_thumbnail ||
                                                    placeHold
                                                  }
                                                  fallback={placeHold}
                                                  className="w-10 h-10 rounded-full object-cover shrink-0"
                                                />
                                                <div className="flex-1">
                                                  <p className="font-medium text-sm">
                                                    {profile.full_name}
                                                  </p>
                                                  {alreadyWon && (
                                                    <p className="text-xs text-gray-500">
                                                      Already won a prize
                                                    </p>
                                                  )}
                                                </div>
                                              </button>
                                            )
                                          },
                                        )}
                                      </div>
                                    </div>

                                    <DialogClose asChild>
                                      <button className="mt-4 w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">
                                        Close
                                      </button>
                                    </DialogClose>
                                  </DialogContent>
                                </Dialog>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          No prizes chosen for this quest.
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* ---------- NORMAL VERSION (NOT EXPIRED) ---------- */
                <>
                  <p className="text-gray-700 mb-2">{quest.quest_details}</p>

                  <p className="text-sm text-gray-500 mb-1">
                    Region: <strong>{quest.region}</strong>
                  </p>

                  <div className="text-sm mb-1">
                    Organisation:{' '}
                    {questCreatorProfile?.data?.organization_name ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <span className="text-blue-600 underline cursor-pointer">
                            {questCreatorProfile.data.organization_name}
                          </span>
                        </DialogTrigger>

                        <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
                        <DialogContent className="fixed top-1/2 left-1/2 z-50 max-h-[70vh] w-full max-w-md bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
                          <RemoteImage
                            path={
                              questCreatorProfile.data.image_thumbnail ||
                              placeHold
                            }
                            fallback={placeHold}
                            className="w-32 h-32 rounded-full object-cover"
                          />
                          <DialogTitle className="text-lg font-bold mb-4">
                            {questCreatorProfile.data.organization_name}
                          </DialogTitle>
                          <p className="text-gray-700">
                            {questCreatorProfile.data
                              .organization_description || 'N/A'}
                          </p>
                          <DialogClose asChild>
                            <button className="mt-6 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">
                              Close
                            </button>
                          </DialogClose>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mb-1">
                    Start:{' '}
                    <strong>{formatNzDateTime(quest.quest_start_at)}</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    End: <strong>{formatNzDateTime(quest.quest_end_at)}</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Number of tasks in this quest:{' '}
                    <strong>{ensureArray<Task>(tasks).length}</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Entry: <strong>${quest.quest_entry}</strong>
                  </p>

                  {/* Add fundraised amount here */}
                  {quest.quest_entry &&
                    quest.quest_entry > 0 &&
                    participantIds.length > 0 && (
                      <p className="text-sm text-green-600 font-semibold">
                        Funds Raised: $
                        {(
                          quest.quest_entry * participantIds.length
                        ).toLocaleString()}
                      </p>
                    )}

                  {/* Participant count block remains */}
                  <div className="text-sm text-gray-500">
                    People joined:
                    {participantIds.length > 0 && (
                      <Dialog
                        onOpenChange={(open) =>
                          open && handleOpenParticipants()
                        }
                      >
                        <DialogTrigger asChild>
                          <button className="text-blue-600 underline font-medium text-sm">
                            {participantIds.length} participant
                            {participantIds.length > 1 ? 's' : ''}
                          </button>
                        </DialogTrigger>

                        <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
                        <DialogContent className="fixed top-1/2 left-1/2 z-50 max-h-[70vh] w-full max-w-md bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
                          <DialogTitle className="text-lg font-bold mb-4">
                            Participants
                          </DialogTitle>

                          <div className="flex flex-col gap-3">
                            {participantProfiles.map((profile) => (
                              <div
                                key={profile.id}
                                className="flex items-center gap-3"
                              >
                                <RemoteImage
                                  path={profile.image_thumbnail || placeHold}
                                  fallback={placeHold}
                                  className="w-32 h-32 rounded-full object-cover"
                                />

                                {/* Text stacked vertically */}
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    <strong>
                                      {profile.full_name || 'Unknown'}
                                    </strong>
                                  </span>

                                  <span className="text-xs text-gray-600">
                                    {profile.about_me || ''}
                                  </span>
                                </div>
                              </div>
                            ))}

                            {participantProfiles.length === 0 && (
                              <p className="text-gray-500">Loading...</p>
                            )}
                          </div>

                          <DialogClose asChild>
                            <button className="mt-6 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">
                              Close
                            </button>
                          </DialogClose>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ---------------- RIGHT SIDE ---------------- */}

            {isExpired ? (
              <div className="lg:w-[450px] w-full bg-white/70 p-4 rounded-xl shadow">
                {isOwner ? (
                  <>
                    <h3 className="text-lg font-bold mb-3">
                      Participants Who Completed This Quest
                    </h3>

                    {!participantsLoaded && participantIds.length === 0 ? (
                      <p className="text-gray-500">
                        No participants joined this quest.
                      </p>
                    ) : !participantsLoaded ? (
                      <p className="text-gray-500">Loading participants...</p>
                    ) : completedParticipants.length === 0 ? (
                      <p className="text-gray-500">
                        No participants completed all tasks for this quest.
                      </p>
                    ) : (
                      <>
                        {/* Scrollable participant list */}
                        <div className="flex flex-col gap-3 mb-4 max-h-72 overflow-y-auto pr-1">
                          {completedParticipants.map((profile) => {
                            if (!profile?.id) return null

                            const isLoading = pdfLoadingById[profile.id]
                            const preparedTasks =
                              pdfTasksByParticipant[profile.id]

                            return (
                              <div
                                key={profile.id}
                                className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm hover:bg-yellow-50 transition border border-gray-100"
                              >
                                <RemoteImage
                                  path={profile.image_thumbnail || placeHold}
                                  fallback={placeHold}
                                  className="w-12 h-12 rounded-full object-cover shrink-0"
                                />

                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-semibold text-gray-800 truncate">
                                    {profile.full_name || 'Unknown User'}
                                  </span>
                                  <span className="text-xs text-gray-500 truncate">
                                    {profile.email || ''}
                                  </span>
                                </div>

                                {preparedTasks && preparedTasks.length > 0 ? (
                                  <PDFDownloadLink
                                    document={
                                      <SeekerTaskPdfButton
                                        quest={quest}
                                        seekerTasks={preparedTasks}
                                        user={profile}
                                      />
                                    }
                                    fileName={`${quest.quest_name}-${profile.full_name ?? 'participant'}.pdf`}
                                  >
                                    {({ loading }) => (
                                      <span className="text-xs text-blue-600 font-medium shrink-0 cursor-pointer">
                                        {loading
                                          ? 'Generating...'
                                          : '⬇ Download PDF'}
                                      </span>
                                    )}
                                  </PDFDownloadLink>
                                ) : (
                                  <button
                                    onClick={() => preparePdfTasks(profile.id)}
                                    disabled={isLoading}
                                    className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                                  >
                                    {isLoading ? 'Preparing...' : 'Prepare PDF'}
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        {/* 🧩 Task Window */}
                        <TaskInformationWindow
                          questId={quest.id}
                          tasks={seekerTasks}
                          userTasks={
                            joinedQuestEntry
                              ? [joinedQuestEntry as UserQuest]
                              : []
                          }
                          readOnly={isOwner}
                          onTasksUpdated={async () => {
                            await refetch()
                            await refetchUserQuests()
                          }}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold mb-3">
                      Your Completed Quest
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      This quest has ended. See your completed quest details
                      below.
                    </p>

                    {currentUserProfile && (
                      <div className="flex flex-col gap-3">
                        {completedTasks === totalTasks && totalTasks > 0 ? (
                          seekerPreparedTasks &&
                          seekerPreparedTasks.length > 0 ? (
                            <PDFDownloadLink
                              document={
                                <SeekerTaskPdfButton
                                  quest={quest}
                                  seekerTasks={seekerPreparedTasks}
                                  user={currentUserProfile}
                                />
                              }
                              fileName={`${quest.quest_name}-your-answers.pdf`}
                            >
                              {({ loading }) => (
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full">
                                  {loading
                                    ? 'Generating PDF...'
                                    : '⬇ Download My Quest PDF'}
                                </button>
                              )}
                            </PDFDownloadLink>
                          ) : (
                            <button
                              onClick={() => preparePdfTasks()}
                              disabled={seekerLoading}
                              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg w-full transition-colors"
                            >
                              {seekerLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                  Preparing Tasks...
                                </span>
                              ) : (
                                'Prepare PDF'
                              )}
                            </button>
                          )
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                            <p className="text-sm font-semibold text-yellow-800 mb-1">
                              ⚠️ Quest Incomplete
                            </p>
                            <p className="text-sm text-yellow-700">
                              You completed {completedTasks} out of {totalTasks}{' '}
                              tasks.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              // ... non-expired TSX unchanged
              <>
                {(isOwner || hasJoined) && (
                  <div className="lg:w-[450px] w-full bg-white/80 p-4 rounded-xl shadow flex flex-col gap-4">
                    {/* 🔵 Progress Bar (joined seekers only) */}
                    {hasJoined && !isOwner && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Quest Progress
                          </span>
                          <span className="text-sm text-gray-600">
                            {completedTasks} / {totalTasks} tasks
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 bg-green-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        <p className="text-xs text-gray-500 mt-1 text-right">
                          {progressPercent}% complete
                        </p>
                      </div>
                    )}

                    {/* 🧩 Task Window */}
                    <TaskInformationWindow
                      questId={quest.id}
                      tasks={seekerTasks}
                      userTasks={
                        joinedQuestEntry ? [joinedQuestEntry as UserQuest] : []
                      }
                      readOnly={isOwner}
                      onTasksUpdated={async () => {
                        await refetch()
                        await refetchUserQuests()
                      }}
                    />
                  </div>
                )}

                {!isOwner && !hasJoined && (
                  <TaskPreview tasks={ensureArray(tasks)} />
                )}
              </>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 w-full">
            {/* Payment success banner */}
            {paymentSuccess && (
              <div className="w-full bg-green-100 border border-green-300 text-green-800 rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2">
                🎉 Payment successful! You've joined the quest.
              </div>
            )}

            {/* Bottom action row - now stacks on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
              {/* Left: Delete / Restart / Join */}
              <div className="flex flex-wrap items-center gap-2">
                {isOwner && isExpired && completedParticipants.length === 0 && (
                  <Button
                    onClick={handleRestartQuest}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                    disabled={isUpdatingQuest}
                  >
                    {isUpdatingQuest ? 'Restarting...' : '🔄 Restart Quest'}
                  </Button>
                )}

                {isOwner && participantIds.length < 1 && !isExpired && (
                  <Button
                    onClick={() => deleteQuest(quest)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete Quest'}
                  </Button>
                )}

                {!isOwner &&
                  (hasJoined ? (
                    <p className="text-green-600 font-semibold text-sm">
                      ✅ Joined!
                    </p>
                  ) : (
                    <button
                      onClick={handleJoinQuest}
                      disabled={joining}
                      className={`px-4 py-2 rounded text-white text-sm ${
                        joining
                          ? 'bg-yellow-300'
                          : 'bg-[#facc15] hover:bg-[#ca8a04]'
                      }`}
                    >
                      {joining
                        ? 'Joining...'
                        : quest.quest_entry && quest.quest_entry > 0
                          ? `Join for $${quest.quest_entry}`
                          : 'Join the quest!'}
                    </button>
                  ))}
              </div>

              {/* Right: Back + Prize Info - now wraps on mobile */}
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <Button
                  onClick={() => navigate('/user/home?region=')}
                  variant="yellow"
                  className="flex-shrink-0 text-sm px-4 py-2"
                >
                  Back to Quests
                </Button>

                {prizes.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex-shrink-0 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">
                        Prize Info
                      </Button>
                    </DialogTrigger>
                    {/* ... rest of dialog unchanged ... */}
                  </Dialog>
                )}
              </div>
            </div>

            {/* Creator Message Section */}
            {isOwner && isExpired && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">
                  📢 Message to Participants
                </h4>
                <textarea
                  value={creatorMessage}
                  onChange={(e) => setCreatorMessage(e.target.value)}
                  placeholder="Write a message to all participants..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
                <Button
                  onClick={handleSaveMessage}
                  disabled={isUpdatingQuest}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-sm"
                >
                  {isUpdatingQuest ? 'Saving...' : 'Save & Send Message'}
                </Button>
              </div>
            )}

            {/* Display creator message */}
            {quest.creator_message && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-xl">📢</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      Message from Quest Creator
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {quest.creator_message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isAdmin && (
              <Button
                onClick={() => deleteQuest(quest)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Quest'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
