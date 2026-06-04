import { useState, useEffect } from 'react'
import { Task, UserQuest } from '@/types'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from '@radix-ui/react-dialog'
import { uploadData } from 'aws-amplify/storage'
import { useCurrentUserProfile, useUpdateProfile } from '@/hooks/userProfiles'
import { updateQuestProgressInProfile } from '@/hooks/updateQuestProgressInProfile'
import RemoteImage from './RemoteImage'
import placeHold from '@/assets/images/placeholder_view_vector.svg'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip'
import { useToast } from '@/hooks/use-toast'
import { Portal } from '@radix-ui/react-dialog'

interface TaskInformationWindowProps {
  questId: string
  tasks: Task[]
  userTasks?: UserQuest[]
  onTasksUpdated?: () => void
  readOnly?: boolean
}

export default function TaskInformationWindow({
  questId,
  tasks,
  userTasks,
  readOnly = false,
  onTasksUpdated,
}: TaskInformationWindowProps) {
  const { data: currentUserProfile } = useCurrentUserProfile()
  const { mutate: updateProfile } = useUpdateProfile()
  const { toast } = useToast()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editableTasks, setEditableTasks] = useState<Task[]>([])
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'loading' | 'success'
  >('idle')

  const getCurrentCoords = () => {
    setLocationStatus('loading')
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Geolocation not supported',
        description: 'Your device does not support geolocation.',
      })
      setLocationStatus('idle')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude},${pos.coords.longitude}`
        setLocation(coords)

        if (selectedTask) {
          handleLocationChange(selectedTask.id, coords)
        }

        setLocationStatus('success')

        setTimeout(() => setLocationStatus('idle'), 2000)
      },
      (err) => {
        toast({
          variant: 'destructive',
          title: 'Failed to get location',
          description: err.message,
        })
        setLocationStatus('idle')
      },
      { enableHighAccuracy: true },
    )
  }

  useEffect(() => {
    setEditableTasks(
      tasks.map((task) => {
        // UserQuest has tasks directly, not nested under quest_id
        const userQuest = userTasks?.[0]
        const userQuestTasks = Array.isArray(userQuest?.tasks)
          ? userQuest.tasks
          : (() => {
              try {
                return typeof userQuest?.tasks === 'string'
                  ? JSON.parse(userQuest.tasks)
                  : []
              } catch {
                return []
              }
            })()

        const existingAnswer = userQuestTasks.find(
          (t: Task) => t.id === task.id,
        )

        return {
          ...task,
          caption: existingAnswer?.caption || '',
          answer: existingAnswer?.answer || '',
          location: existingAnswer?.location || '',
          completed: existingAnswer?.completed ?? false,
        }
      }),
    )
  }, [tasks, userTasks, questId])

  useEffect(() => {
    if (!selectedTask) return

    const task = editableTasks.find((t) => t.id === selectedTask.id)

    setCaption(task?.caption || '')
    setPreviewUrl(task?.answer || '')
    setLocation(task?.location || '')
  }, [selectedTask, editableTasks])

  const handleCaptionChange = (taskId: string, value: string) => {
    setEditableTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, caption: value } : t)),
    )
  }

  const handleAnswerChange = (taskId: string, answer: string) => {
    setEditableTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, answer } : t)),
    )
  }

  const handleLocationChange = (taskId: string, location: string) => {
    setEditableTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, location } : t)),
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    const tempUrl = file ? URL.createObjectURL(file) : null
    setPreviewUrl(tempUrl) // show temporary preview immediately

    if (selectedTask && tempUrl) {
      handleAnswerChange(selectedTask.id, tempUrl)
    }
  }

  const uploadImage = async (file: File, isPublic = true): Promise<string> => {
    const prefix = isPublic ? 'public/' : 'private/'
    const path = `${prefix}${crypto.randomUUID()}-${file.name}`
    try {
      const { result } = await uploadData({
        path,
        data: file,
        options: { contentType: file.type },
      })
      return (await result).path
    } catch (err) {
      console.error('Error uploading file:', err)
      return ''
    }
  }

  const handleSave = async () => {
    if (!selectedTask || !currentUserProfile) return

    let uploadedPath = ''
    if (selectedTask.isImage && imageFile) {
      uploadedPath = await uploadImage(imageFile)
    }

    try {
      setSaving(true)

      const taskIsCompleted = (() => {
        if (selectedTask.isImage)
          return !!(
            uploadedPath ||
            editableTasks.find((t) => t.id === selectedTask.id)?.answer
          )
        if (selectedTask.requiresCaption) return caption.trim().length > 0
        if (selectedTask.isLocation) return location.trim().length > 0
        return true
      })()

      const previousTask = editableTasks.find((t) => t.id === selectedTask.id)

      const wasCompletedBefore = !!previousTask?.completed
      const shouldAwardPoints = !wasCompletedBefore && taskIsCompleted
      const pointsDelta = shouldAwardPoints ? 10 : 0

      const updatedTasksForUser = editableTasks.map((t) =>
        t.id === selectedTask.id
          ? {
              ...t,
              caption,
              answer: selectedTask.isImage
                ? uploadedPath || t.answer
                : t.answer,
              location,
              completed: taskIsCompleted,
            }
          : t,
      )

      const allCompleted = updatedTasksForUser.every((t) => t.completed)

      const wasQuestCompletedBefore = editableTasks.every((t) => t.completed)
      const questJustCompleted = !wasQuestCompletedBefore && allCompleted
      const questCompletionBonus = questJustCompleted ? 50 : 0

      const totalPointsDelta = pointsDelta + questCompletionBonus

      if (totalPointsDelta > 0 && currentUserProfile) {
        await updateProfile({
          input: {
            id: currentUserProfile.id,
            points: (currentUserProfile.points ?? 0) + totalPointsDelta,
          },
        })
      }

      await updateQuestProgressInProfile(
        questId,
        updatedTasksForUser,
        allCompleted,
      )

      toast({
        title: questJustCompleted ? '🎉 Quest Completed!' : 'Answer saved! ✅',
        description: questJustCompleted
          ? `You've completed all tasks and earned ${totalPointsDelta} points (including 20 bonus points)!`
          : 'Your task answer has been saved successfully.',
      })

      setEditableTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id ? { ...t, completed: taskIsCompleted } : t,
        ),
      )

      if (onTasksUpdated) await onTasksUpdated()

      setSelectedTask(null)
    } catch (err) {
      console.error('❌ Failed to save answer:', err)
      toast({
        variant: 'destructive',
        title: 'Failed to save',
        description: 'There was an error saving your answer. Please try again.',
      })
    } finally {
      setSaving(false)
      setImageFile(null)
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50 shadow-inner max-h-64 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-800">
        Your Quest Tasks
      </h2>

      <ul className="space-y-2">
        {editableTasks.map((task, index) => (
          <li
            key={index}
            onClick={() => setSelectedTask(task)}
            className="cursor-pointer p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-yellow-50 transition"
          >
            <p className="text-sm font-medium text-gray-700">
              {task.description || `Task ${index + 1}`}
            </p>
            {task.answer || task.caption || task.location ? (
              <p className="flex items-center text-sm text-green-600 mt-1">
                <span className="mr-1">✅</span> Task Answered
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Click to answer</p>
            )}
          </li>
        ))}
      </ul>

      {selectedTask && (
        <Dialog
          open={true}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        >
          <Portal>
            <DialogOverlay className="fixed inset-0 bg-black/30 z-40" />
            <DialogContent className="fixed top-1/2 left-1/2 z-50 max-w-md w-full bg-white rounded-xl p-6 shadow-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[90vh]">
              {/* Top row: Title + Close button */}
              <div className="flex justify-between items-center mb-4">
                <DialogTitle className="text-lg font-bold">
                  {selectedTask.description || 'Quest Task'}
                </DialogTitle>
                <DialogClose asChild>
                  <button
                    onClick={() => setSelectedTask(null)}
                    aria-label="Close"
                    className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                  >
                    ×
                  </button>
                </DialogClose>
              </div>
              {selectedTask.requiresCaption && (
                <label className="block mb-4 text-sm font-medium">
                  Caption:
                  <TooltipProvider>
                    <Tooltip>
                      {/* Only show tooltip if the button is disabled because of readOnly */}
                      <TooltipTrigger asChild>
                        <textarea
                          value={caption}
                          onChange={(e) => {
                            setCaption(e.target.value)
                            if (selectedTask)
                              handleCaptionChange(
                                selectedTask.id,
                                e.target.value,
                              )
                          }}
                          rows={5} // Controls the initial visible lines of text
                          className={`border p-1 rounded w-full resize-y ${readOnly ? 'bg-gray-100' : ''}`}
                          placeholder="Enter your caption..."
                          disabled={readOnly} // disables input for owner
                        />
                      </TooltipTrigger>
                      {readOnly && (
                        <TooltipContent
                          side="top"
                          className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg"
                        >
                          Owners cannot answer tasks on quests they have created
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </label>
              )}
              {selectedTask.isImage && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Upload Image:
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      {/* Only show tooltip if the button is disabled because of readOnly */}
                      <TooltipTrigger asChild>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className={`border p-1 rounded w-full ${readOnly ? 'bg-gray-100' : ''}`}
                          disabled={readOnly} // disables input for owner
                        />
                      </TooltipTrigger>
                      {readOnly && (
                        <TooltipContent
                          side="top"
                          className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg"
                        >
                          Owners cannot answer tasks on quests they have created
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  {previewUrl ? (
                    <RemoteImage
                      path={previewUrl}
                      fallback={placeHold}
                      className="h-20 w-20 rounded object-cover mb-2"
                    />
                  ) : (
                    <RemoteImage
                      path={previewUrl || placeHold}
                      fallback={placeHold}
                      className="h-20 w-20 rounded object-cover mb-2"
                    />
                  )}
                </div>
              )}
              {selectedTask.isLocation && (
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">
                    Location:
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => {
                        const value = e.target.value
                        setLocation(value)
                        if (selectedTask)
                          handleLocationChange(selectedTask.id, value)
                      }}
                      className={`border p-1 rounded w-full ${readOnly ? 'bg-gray-100' : ''}`}
                      placeholder="Press button to fill coordinates"
                      disabled={readOnly}
                    />

                    <button
                      onClick={getCurrentCoords}
                      disabled={readOnly || locationStatus === 'loading'}
                      className={`px-3 py-1 rounded text-white flex items-center gap-2 whitespace-nowrap ${
                        readOnly
                          ? 'bg-gray-400 cursor-not-allowed'
                          : locationStatus === 'success'
                            ? 'bg-green-600 hover:bg-green-700'
                            : locationStatus === 'loading'
                              ? 'bg-blue-400 cursor-wait'
                              : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {locationStatus === 'loading' && (
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      )}
                      {locationStatus === 'success' && <span>✓</span>}
                      {locationStatus === 'loading'
                        ? 'Getting Location...'
                        : locationStatus === 'success'
                          ? 'Location Set!'
                          : 'Use My Location'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <DialogClose asChild>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </DialogClose>
                <TooltipProvider>
                  <Tooltip>
                    {/* Only show tooltip if the button is disabled because of readOnly */}
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleSave}
                        disabled={saving || readOnly}
                        className={`px-4 py-2 rounded text-white ${
                          saving || readOnly
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </TooltipTrigger>
                    {readOnly && (
                      <TooltipContent
                        side="top"
                        className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg"
                      >
                        Owners cannot save tasks on quests they have created
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </DialogContent>
          </Portal>
        </Dialog>
      )}
    </div>
  )
}
