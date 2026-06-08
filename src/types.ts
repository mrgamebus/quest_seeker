import { Dispatch, SetStateAction, ImgHTMLAttributes } from 'react'
import { QuestStatus } from './graphql/API'
import { Schema } from 'amplify/data/resource'

// ---------------- Quests ----------------
export type Status =
  | 'draft'
  | 'published'
  | 'expired'
  | 'archived'
  | 'upcoming'
  | 'occurring'
  | 'completed'

export type Quest = {
  __typename: 'Quest'
  id: string
  quest_name?: string | null
  quest_details?: string | null
  quest_start_at?: string | null
  quest_end_at?: string | null
  quest_image?: string | null
  quest_image_thumb?: string | null
  quest_entry?: number | null
  region?: string | null
  creator_id?: string | null
  status?: QuestStatus | null
  quest_sponsor?: string | null
  quest_prize_info?: string | null
  quest_tasks?: string | null
  createdAt: string
  updatedAt: string
}

// ---------------- Profiles ----------------
export type Role = 'seeker' | 'creator' | 'pending' | 'Admin'

export type Rank =
  | 'wanderer'
  | 'scout'
  | 'tracker'
  | 'trailblazer'
  | 'navigator'

export type Profile = {
  __typename?: 'Profile'
  id: string
  createdAt?: string
  updatedAt?: string
  owner?: string | null
  full_name?: string | null
  email?: string | null
  phone?: string | null
  organization_name?: string | null
  registration_number?: string | null
  charity_number?: string | null
  business_type?: string | null
  organization_description?: string | null
  primary_contact_name?: string | null
  primary_contact_position?: string | null
  primary_contact_phone?: string | null
  secondary_contact_name?: string | null
  secondary_contact_position?: string | null
  secondary_contact_phone?: string | null
  about_me?: string | null
  image?: string | null
  image_thumbnail?: string | null
  role?: Role | null
  points?: number | null
  seeker_rank?: Rank | null
  stripeAccountId?: string | null
  stripeOnboarded?: boolean | null
}

export interface MinimalQuestParticipant {
  profileId: string
  tasks: Task[] | undefined
  status?: string | null
}

// ---------------- Tasks ----------------
export type Task = {
  id: string
  description: string
  isImage: boolean
  requiresCaption: boolean
  isLocation: boolean
  caption: string
  answer: string
  location: string
  completed: boolean
}

export interface TaskModalProps {
  tasks: Task[]
  setTasks: Dispatch<SetStateAction<Task[]>>
  setTask: Dispatch<SetStateAction<string>>
  setEditIndex: Dispatch<SetStateAction<number>>
  visible: boolean
  onClose: () => void
  onNewTask: OnNewTaskFunction
}

export interface TaskCreatorButtonProps {
  questUpdates: Task[]
  onNewTask: OnNewTaskFunction
}

export type OnNewTaskFunction = (updatedTasks: Task[]) => void

// ---------------- Remote Image ----------------
export type RemoteImageProps = {
  path?: string | null
  fallback: string
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>

// ---------------- Sponsors ----------------
export type Sponsor = {
  id: string
  name: string
  sponsorImage: boolean
  image: string
}

export interface SponsorCreatorButtonProps {
  sponsorUpdates: Sponsor[]
  onNewSponsor: OnNewSponsorFunction
}

export type OnNewSponsorFunction = (updatedSponsors: Sponsor[]) => void

// ---------------- Prizes ----------------
export type Prize = {
  id: string
  name: string
  prizeImage: boolean
  image: string
  contributor: string
}

export interface PrizeCreatorButtonProps {
  prizeUpdates: Prize[]
  onNewPrize: OnNewPrizeFunction
  prizeContributor: string
}

export type OnNewPrizeFunction = (updatedPrizes: Prize[]) => void

export type PdfUser = {
  full_name?: string | null
  email?: string | null
  image_thumbnail?: string | null
}

export type UserQuest = Schema['UserQuest']['type'] & { tasks: Task[] }

export type Winner = {
  place: number
  prize_id: string
  user_id: string
  username: string
  email: string
  phone: string
  selected_at: string
}
