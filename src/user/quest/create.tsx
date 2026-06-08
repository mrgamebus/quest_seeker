'use client'

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import TaskCreatorButton from '@/components/TaskCreatorButton'
import SponsorCreatorButton from '@/components/SponsorCreatorButton'
import PrizeCreatorButton from '@/components/PrizeCreatorButton'
import PickRegion from '@/components/PickRegion'
import placeHold from '@/assets/images/placeholder_view_vector.svg'
import bg from '@/assets/images/background_main.jpeg'
import {
  useMutateQuest,
  useQuest,
  useQuestParticipants,
} from '@/hooks/userQuests'
import { Prize, Sponsor, Task } from '@/types'
import { useCurrentUserProfile } from '@/hooks/userProfiles'
import { DialogTitle } from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@aws-amplify/ui-react'
import { remove, uploadData } from 'aws-amplify/storage'
import imageCompression from 'browser-image-compression'
import { MutateQuestAction, QuestStatus } from '@/graphql/API'
import { toZonedTime } from 'date-fns-tz'
import { ensureArray } from '@/tools/ensureArray'
import { generateClient } from 'aws-amplify/api'
import { Schema } from 'amplify/data/resource'
import { useToast } from '@/hooks/use-toast'
import { StepHeader } from '@/components/StepHeader'
import { QuestNameStep } from '@/components/QuestNameStep'
import { QuestImageStep } from '@/components/QuestImageStep'

const client = generateClient<Schema>()

export default function CreateQuestPage() {
  const navigate = useNavigate()
  const params = useParams()
  const { toast } = useToast()
  const questId = params.id
  const isUpdating = !!questId
  const { data: profile, isLoading: isProfileLoading } = useCurrentUserProfile()
  const [createdQuestId, setCreatedQuestId] = useState<string | null>(null)

  const isAdmin = profile?.role === 'Admin'

  const { data: questParticipants } = useQuestParticipants(questId ?? undefined)
  const participantIds = questParticipants?.map((uq) => uq.profileId) ?? []

  const effectiveQuestId = questId ?? createdQuestId

  const currencyExp = /^\d*\.?\d{0,2}$/

  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [terms, setTerms] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [oldImagePath, setOldImagePath] = useState<string>('')
  const [oldImageThumbPath, setOldImageThumbPath] = useState<string>('')
  const [startDateTime, setStartDateTime] = useState<string>('')
  const [endDateTime, setEndDateTime] = useState<string>('')
  const [sponsorsEnabled, setSponsorsEnabled] = useState(false)
  const [prizeEnabled, setPrizeEnabled] = useState(false)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [currencyValue, setCurrencyValue] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [errors, setErrors] = useState<string>('')
  const [openStart, setOpenStart] = useState(false)
  const [openEnd, setOpenEnd] = useState(false)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(isUpdating)
  const [modalOpen, setModalOpen] = useState(false)
  const [isZeroAllowed, setIsZeroAllowed] = useState(false)

  const next = () => setStep((s) => s + 1)
  const prev = () => setStep((s) => Math.max(0, s - 1))

  const { mutateAsync: mutateQuest } = useMutateQuest()

  const { data: updatingQuest } = useQuest(questId)

  useEffect(() => {
    if (!isUpdating) return
    if (!updatingQuest) return

    setOldImagePath(updatingQuest.quest_image ?? '')
    setOldImageThumbPath(updatingQuest.quest_image_thumb ?? '')
    setName(updatingQuest.quest_name ?? '')
    setDetails(updatingQuest.quest_details ?? '')
    setTerms(updatingQuest.quest_terms ?? '')
    setPreviewImage(updatingQuest.quest_image ?? '')
    setStartDateTime(updatingQuest.quest_start_at ?? startDateTime)
    setEndDateTime(updatingQuest.quest_end_at ?? endDateTime)
    setPrizeEnabled(!!updatingQuest.quest_prize)
    setPrizes(
      updatingQuest.quest_prize_info
        ? JSON.parse(updatingQuest.quest_prize_info)
        : [],
    )
    setSponsors(
      updatingQuest.quest_sponsor
        ? JSON.parse(updatingQuest.quest_sponsor)
        : [],
    )
    setSelectedRegion(updatingQuest.region ?? '')
    setCurrencyValue(updatingQuest.quest_entry?.toString() ?? '')
    setTasks(ensureArray<Task>(updatingQuest?.quest_tasks))

    setLoading(false)
  }, [updatingQuest])

  if (isUpdating && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading quest data...
      </div>
    )
  }

  const canEdit =
    isAdmin ||
    !isUpdating ||
    updatingQuest?.status === QuestStatus.draft ||
    (updatingQuest?.status === QuestStatus.published &&
      participantIds.length === 0)

  const isDraftBeingPublished =
    isUpdating && updatingQuest?.status === QuestStatus.draft

  const NZ_TZ = 'Pacific/Auckland'

  const nzToUtcIso = (date: Date) => {
    const nzDate = toZonedTime(date, NZ_TZ)
    return nzDate.toISOString()
  }

  const utcIsoToNzDate = (iso: string) => {
    return toZonedTime(new Date(iso), NZ_TZ)
  }

  const utcIsoToNzTime = (iso: string) =>
    utcIsoToNzDate(iso).toLocaleTimeString('en-NZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

  function getTodayInNZ() {
    const nowNz = toZonedTime(new Date(), NZ_TZ)
    nowNz.setHours(0, 0, 0, 0)
    return nowNz
  }

  const getMinEndNzDate = (startUtcIso: string) => {
    const startNz = utcIsoToNzDate(startUtcIso)
    const minEnd = new Date(startNz)
    minEnd.setHours(minEnd.getHours() + 1)
    return minEnd
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setPreviewImage(URL.createObjectURL(file))
  }

  const validateInput = () => {
    setErrors('')
    if (!name) return (setErrors('Name is required'), false)
    if (!details) return (setErrors('Details are required'), false)
    if (!startDateTime) return (setErrors('Start date required'), false)
    if (!endDateTime) return (setErrors('End date required'), false)
    return true
  }

  const uploadImage = async (file: File) => {
    const fullPath = `public/${crypto.randomUUID()}-${file.name}`
    const thumbPath = `public/thumbnails/${crypto.randomUUID()}-${file.name}`

    try {
      const compressedFullFile = await imageCompression(file, {
        maxWidthOrHeight: 1400,
        maxSizeMB: 1, // ~1MB max
        fileType: 'image/webp',
        useWebWorker: true,
      })

      await uploadData({
        path: fullPath,
        data: compressedFullFile,
        options: {
          contentType: 'image/webp',
        },
      })

      const compressedThumbFile = await imageCompression(file, {
        maxWidthOrHeight: 300,
        maxSizeMB: 0.2,
        fileType: 'image/webp',
        useWebWorker: true,
      })

      await uploadData({
        path: thumbPath,
        data: compressedThumbFile,
        options: {
          contentType: 'image/webp',
        },
      })
      return { fullPath, thumbPath }
    } catch (err) {
      console.error('Error uploading file:', err)
      return { fullPath: '', thumbPath: '' }
    }
  }

  const handlePayAndPublish = async () => {
    try {
      const questId = await saveQuest(QuestStatus.published)

      if (!questId) {
        toast({
          variant: 'destructive',
          title: 'Save Failed',
          description: 'Please check your validation or image upload.',
        })
        return
      }

      if (!profile?.id) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Profile ID is missing. Are you logged in?',
        })
        return
      }

      const response = await client.mutations.createStripeSession({
        questId: questId,
        profileId: profile.id,
        returnUrl: window.location.origin + '/user/account?payment=success',
      })

      if (response.data) {
        window.location.href = response.data
      } else if (response.errors) {
        console.error('GraphQL Errors:', response.errors)
        toast({
          variant: 'destructive',
          title: 'Mutation Error',
          description: response.errors[0].message,
        })
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('CRITICAL ERROR:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'An unexpected error occurred',
      })
    }
  }

  const handleClick = () => {
    setModalOpen(true)
  }
  const saveQuest = async (status: QuestStatus) => {
    if (status === QuestStatus.published && !validateInput()) return null

    try {
      setLoading(true)
      const imagePaths = imageFile
        ? await uploadImage(imageFile)
        : {
            fullPath: previewImage,
            thumbPath: updatingQuest?.quest_image_thumb ?? '',
          }

      if (
        imageFile &&
        oldImagePath &&
        !oldImagePath.startsWith('http') &&
        oldImagePath !== imagePaths.fullPath
      ) {
        try {
          const cleanFull = oldImagePath.startsWith('/')
            ? oldImagePath.slice(1)
            : oldImagePath
          const cleanThumb = oldImageThumbPath?.startsWith('/')
            ? oldImageThumbPath.slice(1)
            : oldImageThumbPath
          if (cleanFull) await remove({ path: cleanFull })
          if (cleanThumb) await remove({ path: cleanThumb })
        } catch (err) {
          console.error('Error deleting old quest images:', err)
        }
      }

      const basePayload = {
        name,
        details,
        imagePath: imagePaths.fullPath,
        imageThumbPath: imagePaths.thumbPath,
        startAt: startDateTime,
        endAt: endDateTime,
        region: selectedRegion,
        entryFee: currencyValue ? Number(currencyValue) : null,
        prizes: prizes?.length ? JSON.stringify(prizes) : null,
        sponsors: sponsors?.length ? JSON.stringify(sponsors) : null,
        tasks: tasks?.length ? JSON.stringify(tasks) : null,
        terms,
      }

      let currentQuestId = effectiveQuestId

      if (!currentQuestId) {
        const draftResult = await mutateQuest({
          action: MutateQuestAction.CREATE_DRAFT,
          ...basePayload,
        })
        currentQuestId = draftResult?.questId
        setCreatedQuestId(currentQuestId)
      } else if (updatingQuest?.status === QuestStatus.published) {
        await mutateQuest({
          action: MutateQuestAction.UPDATE_PUBLISHED,
          questId: currentQuestId,
          ...basePayload,
        })
        navigate(-1)
        return null
      } else {
        await mutateQuest({
          action: MutateQuestAction.UPDATE_DRAFT,
          questId: currentQuestId,
          ...basePayload,
        })
      }

      if (status === QuestStatus.draft) {
        navigate('/user/account')
        return null
      }

      return currentQuestId
    } catch (err) {
      console.error('saveQuest failed:', err)
      setErrors('Failed to save quest. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="w-full max-w-3xl p-6 bg-white/80 rounded-lg shadow-md">
        {/* --- Multi-step UI --- */}
        {step === 0 && (
          <>
            <QuestNameStep
              value={name}
              onChange={setName}
              backQuest={handleClick}
              onNext={next}
              onSave={() => saveQuest(QuestStatus.draft)}
              canEdit={canEdit}
              isPublished={updatingQuest?.status === QuestStatus.published}
            />
          </>
        )}

        {/* Step 1: Image */}
        {step === 1 && (
          <>
            <QuestImageStep
              previewImage={previewImage}
              questImage={updatingQuest?.quest_image}
              placeHold={placeHold}
              imageChange={handleImageChange}
              backQuest={handleClick}
              onBack={prev}
              onNext={next}
              onSave={() => saveQuest(QuestStatus.draft)}
              canEdit={canEdit}
              isPublished={updatingQuest?.status === QuestStatus.published}
            />
          </>
        )}

        {/* Step 2: Region */}
        {step === 2 && (
          <>
            <StepHeader title="Select Region" onBack={handleClick} />
            <PickRegion value={selectedRegion} onChange={setSelectedRegion} />
            <div className="flex justify-between mt-4">
              <Button onClick={prev}>Back</Button>
              <Button
                variant="outline"
                disabled={!canEdit}
                onClick={() => saveQuest(QuestStatus.draft)}
              >
                {updatingQuest?.status === QuestStatus.published
                  ? 'Save Changes'
                  : 'Save as Draft'}
              </Button>
              <Button onClick={next}>Next</Button>
            </div>
          </>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <>
            <StepHeader title="Quest Details" onBack={handleClick} />
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="border rounded p-2 w-full"
            />
            <div className="flex justify-between mt-4">
              <Button onClick={prev}>Back</Button>
              <Button
                variant="outline"
                disabled={!canEdit}
                onClick={() => saveQuest(QuestStatus.draft)}
              >
                {updatingQuest?.status === QuestStatus.published
                  ? 'Save Changes'
                  : 'Save as Draft'}
              </Button>
              <Button onClick={next}>Next</Button>
            </div>
          </>
        )}

        {/* Step 4: Entry Fee */}
        {step === 4 && (
          <>
            <StepHeader
              title="Entry Fee (minimum of $5.00)"
              onBack={handleClick}
            />
            <label>
              <input
                type="checkbox"
                checked={isZeroAllowed}
                onChange={(e) => {
                  const checked = e.target.checked
                  setIsZeroAllowed(checked)
                  if (checked) setCurrencyValue('0.00') // Instantly set to 0
                }}
              />
              Free Entry
            </label>
            <Input
              inputMode="decimal"
              type="text"
              disabled={isZeroAllowed} // Prevents typing when checkbox is active
              value={currencyValue}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || currencyExp.test(val)) setCurrencyValue(val)
              }}
              onBlur={() => {
                if (currencyValue !== '') {
                  const numValue = parseFloat(currencyValue)
                  // If checkbox is checked, allow 0. Otherwise, enforce minimum of 5.
                  const minLimit = isZeroAllowed ? 0 : 5
                  const finalValue = numValue < minLimit ? minLimit : numValue
                  setCurrencyValue(finalValue.toFixed(2))
                }
              }}
            />
            <div className="flex justify-between mt-4">
              <Button onClick={prev}>Back</Button>
              <Button
                variant="outline"
                disabled={!canEdit}
                onClick={() => saveQuest(QuestStatus.draft)}
              >
                {updatingQuest?.status === QuestStatus.published
                  ? 'Save Changes'
                  : 'Save as Draft'}
              </Button>
              <Button onClick={next}>Next</Button>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <StepHeader title="Quest Dates" onBack={handleClick} />
            {/* --- Start Date Picker --- */}
            <Dialog open={openStart} onOpenChange={setOpenStart}>
              <DialogTrigger asChild>
                <Button>
                  {`Start Date: ${
                    startDateTime
                      ? new Date(startDateTime).toLocaleDateString('en-NZ', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Not set'
                  }`}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>
                  <VisuallyHidden>Choose Start Date</VisuallyHidden>
                </DialogTitle>
                <Calendar
                  mode="single"
                  selected={
                    startDateTime ? utcIsoToNzDate(startDateTime) : undefined
                  }
                  disabled={(date) => date < getTodayInNZ()}
                  onSelect={(date) => {
                    if (!date) return

                    date.setHours(9, 0, 0, 0)

                    setStartDateTime(nzToUtcIso(date))
                  }}
                />
                <input
                  type="time"
                  value={
                    startDateTime ? utcIsoToNzTime(startDateTime) : '09:00'
                  }
                  onChange={(e) => {
                    if (!startDateTime) return

                    const [h, m] = e.target.value.split(':').map(Number)

                    const nzDate = utcIsoToNzDate(startDateTime)
                    nzDate.setHours(h, m, 0, 0)

                    setStartDateTime(nzToUtcIso(nzDate))
                  }}
                />

                <DialogClose asChild>
                  <Button>Confirm</Button>
                </DialogClose>
              </DialogContent>
            </Dialog>

            {/* --- End Date Picker --- */}
            <Dialog open={openEnd} onOpenChange={setOpenEnd}>
              <DialogTrigger asChild>
                <Button>
                  {`End Date: ${
                    endDateTime
                      ? (() => {
                          const endNz = utcIsoToNzDate(endDateTime)
                          const displayDate = new Date(endNz.getTime() + 1000)
                          return displayDate.toLocaleDateString('en-NZ', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        })()
                      : 'Not set'
                  }`}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>
                  <VisuallyHidden>Choose End Date</VisuallyHidden>
                </DialogTitle>
                <Calendar
                  mode="single"
                  selected={
                    endDateTime ? utcIsoToNzDate(endDateTime) : undefined
                  }
                  disabled={(date) => {
                    if (!startDateTime) {
                      return date < getTodayInNZ()
                    }
                    const minEndNz = getMinEndNzDate(startDateTime)
                    const minEndDay = new Date(minEndNz)
                    minEndDay.setHours(0, 0, 0, 0)
                    return date < minEndDay
                  }}
                  onSelect={(date) => {
                    if (!date || !startDateTime) return
                    const minEndNz = getMinEndNzDate(startDateTime)
                    const newEndNz = new Date(date)
                    if (endDateTime) {
                      const currentEnd = utcIsoToNzDate(endDateTime)
                      newEndNz.setHours(currentEnd.getHours(), 59, 59, 0)
                    } else {
                      newEndNz.setHours(17, 59, 59, 0)
                    }
                    if (newEndNz < minEndNz) {
                      newEndNz.setTime(minEndNz.getTime())
                    }
                    setEndDateTime(nzToUtcIso(newEndNz))
                  }}
                />
                <input
                  type="time"
                  value={
                    endDateTime
                      ? (() => {
                          const endNz = utcIsoToNzDate(endDateTime)
                          const displayTime = new Date(endNz.getTime() + 1000)
                          return `${String(displayTime.getHours()).padStart(2, '0')}:00`
                        })()
                      : '18:00'
                  }
                  onChange={(e) => {
                    if (!startDateTime) return
                    const [h] = e.target.value.split(':').map(Number)
                    const endNz = endDateTime
                      ? utcIsoToNzDate(endDateTime)
                      : utcIsoToNzDate(startDateTime)
                    const actualHour = h === 0 ? 23 : h - 1
                    endNz.setHours(actualHour, 59, 59, 0)
                    const minEndNz = getMinEndNzDate(startDateTime)
                    if (endNz < minEndNz) {
                      setEndDateTime(nzToUtcIso(minEndNz))
                      return
                    }
                    setEndDateTime(nzToUtcIso(endNz))
                  }}
                  className="mt-2"
                />
                <DialogClose asChild>
                  <Button>Confirm</Button>
                </DialogClose>
              </DialogContent>
            </Dialog>

            <div className="flex justify-between mt-4">
              <Button onClick={prev}>Back</Button>
              <Button
                variant="outline"
                disabled={!canEdit}
                onClick={() => saveQuest(QuestStatus.draft)}
              >
                {updatingQuest?.status === QuestStatus.published
                  ? 'Save Changes'
                  : 'Save as Draft'}
              </Button>
              <Button onClick={next}>Next</Button>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <StepHeader title="Any Sponsors?" onBack={handleClick} />

            <div className="flex justify-between items-center mt-6">
              <Button onClick={prev}>Back</Button>
              <Button
                variant="outline"
                disabled={!canEdit}
                onClick={() => saveQuest(QuestStatus.draft)}
              >
                {updatingQuest?.status === QuestStatus.published
                  ? 'Save Changes'
                  : 'Save as Draft'}
              </Button>
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setSponsorsEnabled(false)
                    setSponsors([])
                    setStep(8)
                  }}
                >
                  No
                </Button>

                <Button
                  onClick={() => {
                    setSponsorsEnabled(true)
                    setStep(7)
                  }}
                >
                  Yes
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 7 && (
          <>
            <SponsorCreatorButton
              sponsorUpdates={sponsors}
              onNewSponsor={setSponsors}
            />

            <div className="flex justify-between mt-4">
              <Button onClick={() => setStep(6)}>Back</Button>
              <Button
                variant="outline"
                disabled={!canEdit}
                onClick={() => saveQuest(QuestStatus.draft)}
              >
                {updatingQuest?.status === QuestStatus.published
                  ? 'Save Changes'
                  : 'Save as Draft'}
              </Button>
              <Button onClick={next}>Next</Button>
            </div>
          </>
        )}

        {step === 8 && (
          <>
            <StepHeader title="Any Prizes?" onBack={handleClick} />

            {/* Button row */}
            <div className="flex justify-between items-center mt-6">
              {/* Back button – far left */}
              <Button
                onClick={() => {
                  if (sponsorsEnabled) {
                    setStep(7)
                  } else {
                    setStep(6)
                  }
                }}
              >
                Back
              </Button>
              <Button
                variant="outline"
                disabled={!canEdit}
                onClick={() => saveQuest(QuestStatus.draft)}
              >
                {updatingQuest?.status === QuestStatus.published
                  ? 'Save Changes'
                  : 'Save as Draft'}
              </Button>
              {/* Yes / No buttons – grouped on right */}
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setPrizeEnabled(false)
                    setPrizes([])
                    setStep(10)
                  }}
                >
                  No
                </Button>

                <Button
                  onClick={() => {
                    setPrizeEnabled(true)
                    setStep(9)
                  }}
                >
                  Yes
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 9 && (
          <>
            <PrizeCreatorButton
              onNewPrize={setPrizes}
              prizeUpdates={prizes}
              prizeContributor={''}
            />
            <div className="flex justify-between mt-4">
              <Button onClick={prev}>Back</Button>
              <Button
                variant="outline"
                disabled={!canEdit}
                onClick={() => saveQuest(QuestStatus.draft)}
              >
                {updatingQuest?.status === QuestStatus.published
                  ? 'Save Changes'
                  : 'Save as Draft'}
              </Button>
              <Button onClick={next}>Next</Button>
            </div>
          </>
        )}

        {step === 10 && (
          <>
            <TaskCreatorButton questUpdates={tasks} onNewTask={setTasks} />

            <div className="flex justify-between mt-4">
              <Button
                onClick={() => {
                  if (prizeEnabled) {
                    setStep(9)
                  } else {
                    setStep(8)
                  }
                }}
              >
                Back
              </Button>
              <Button
                variant="outline"
                disabled={!canEdit}
                onClick={() => saveQuest(QuestStatus.draft)}
              >
                {updatingQuest?.status === QuestStatus.published
                  ? 'Save Changes'
                  : 'Save as Draft'}
              </Button>
              <Button onClick={next}>Next</Button>
            </div>
          </>
        )}

        {step === 11 && (
          <>
            <StepHeader
              title="Quest Terms and Conditions"
              onBack={handleClick}
            />
            <Textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="border rounded p-2 w-full"
            />
            <div className="flex justify-between mt-4">
              <Button onClick={prev}>Back</Button>
              {updatingQuest?.status !== QuestStatus.published && (
                <Button
                  variant="outline"
                  disabled={!canEdit}
                  onClick={() => saveQuest(QuestStatus.draft)}
                >
                  Save as Draft
                </Button>
              )}
              <Button
                variant="yellow"
                disabled={loading || isProfileLoading || !canEdit}
                onClick={
                  updatingQuest?.status === QuestStatus.published
                    ? () => saveQuest(QuestStatus.published)
                    : handlePayAndPublish
                }
              >
                {loading
                  ? 'Processing...'
                  : updatingQuest?.status === QuestStatus.published
                    ? 'Save Changes'
                    : isDraftBeingPublished
                      ? 'Pay and Publish Quest'
                      : isUpdating
                        ? 'Save and Publish Changes'
                        : 'Finish & Create Quest'}
              </Button>
            </div>
          </>
        )}

        {errors && <p className="text-red-600 mt-2">{errors}</p>}
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Back to Quests</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this page? Any unsaved changes will
              be lost
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                navigate(-1)
              }}
            >
              {loading ? 'Updating...' : 'Back'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
