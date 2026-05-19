import { Task } from '@/types'

export function parseQuestTasks(quest_tasks?: string | null): Task[] {
  if (!quest_tasks) return []
  try {
    const parsed = JSON.parse(quest_tasks)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function serializeQuestTasks(tasks: Task[]): string {
  try {
    return JSON.stringify(tasks)
  } catch {
    return '[]'
  }
}
