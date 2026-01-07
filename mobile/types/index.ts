export interface User {
  id: string
  email: string
  name: string
  household: string
  created: string
  updated: string
}

export interface Household {
  id: string
  name: string
  invite_code: string
  created: string
  updated: string
}

export interface Todo {
  id: string
  text: string
  due_date: string | null
  status: 'pool' | 'assigned' | 'done'
  assigned_to: string | null
  household: string
  created_by: string
  sort_order: number
  created: string
  updated: string
}
