import { generateClient, GraphQLResult } from 'aws-amplify/data'
import { getCurrentUser } from 'aws-amplify/auth'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useMutateQuest,
  useQuest,
  useQuestParticipants,
  useUserQuests,
} from '@/hooks/userQuests'
import { useProfile, useCurrentUserProfile } from '@/hooks/userProfiles'
import bg from '@/assets/images/background_main.jpeg'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { useEffect, useState } from 'react'
import {
  Prize,
  Sponsor,
  Task,
  Profile,
  UserQuest,
  Winner,
  MinimalQuestParticipant,
} from '@/types'
import RemoteImage from './RemoteImage'
import placeHold from '@/assets/images/placeholder_view_vector.svg'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog'
import TaskInformationWindow from './TaskInformationWindow'
import { Home } from 'lucide-react'
import { Toolbar } from './Toolbar'
import TaskPreview from './TaskPreview'
import { GetProfileQuery, MutateQuestAction, QuestStatus } from '@/graphql/API'
import { getProfile } from '@/graphql/queries'
import SignOutButton from './SignOutButton'
import { useQuestDeletion } from '@/hooks/useQuestDeletion'
import { format, toZonedTime } from 'date-fns-tz'
import { getUrl } from 'aws-amplify/storage'
import { ensureArray } from '@/tools/ensureArray'
import { joinQuest, createQuestEntrySession } from '@/graphql/mutations'
import { useToast } from '@/hooks/use-toast'

// Components
import QuestBanner from './QuestBanner'
import WinnerSelection from './WinnerSelection'
import WinnerDisplay from './WinnerDisplay'
import ExpiredQuestSidebar from './ExpiredQuestSidebar'

export default function QuestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [joining, setJoining] = useState(false)
  const [winners, setWinners] = useState<Winner[]>([])

  const [creatorMessage, setCreatorMessage] = useState('')

  const { mutate: updateQuestMutation, isPending: isUpdatingQuest } =
    useMutateQuest()

  const { deleteQuest, loading: deleting } = useQuestDeletion()

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

  const preparePdfTasks = async (participantId?: string): Promise<Task[]> => {
    const targetId = participantId || currentUserProfile?.id
    if (!targetId) return []

    let tasksToResolve: Task[]

    if (participantId) {
      const participantQuest = questParticipants?.find(
        (uq) => uq.profileId === participantId,
      )

      if (!participantQuest) {
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

          <QuestBanner
            questId={quest.id}
            questName={quest.quest_name ?? 'Untitled Quest'}
            questImage={quest.quest_image}
            questStatus={quest.status}
            sponsors={sponsors}
            canEdit={canEdit}
            isOwner={isOwner}
            participantCount={participantIds.length}
          />

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
                  {isOwner && isExpired && (
                    <WinnerSelection
                      prizes={prizes}
                      winners={winners}
                      completedParticipants={completedParticipants}
                      onSelectWinner={selectWinnerForPrize}
                      onRandomPick={pickWinnerForPrize}
                      isUpdating={isUpdatingQuest}
                    />
                  )}
                  {!isOwner && winners.length > 0 && (
                    <WinnerDisplay winners={winners} prizes={prizes} />
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
              <ExpiredQuestSidebar
                isOwner={isOwner}
                quest={quest}
                currentUserProfile={currentUserProfile}
                completedParticipants={completedParticipants}
                questParticipants={
                  questParticipants as MinimalQuestParticipant[]
                }
                tasks={tasks}
                seekerTasks={seekerTasks}
                joinedQuestEntry={joinedQuestEntry}
                completedTasks={completedTasks}
                totalTasks={totalTasks}
                onPreparePdf={preparePdfTasks}
                onTasksUpdated={async () => {
                  await refetch()
                  await refetchUserQuests()
                }}
              />
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
