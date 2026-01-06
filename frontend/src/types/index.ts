export interface Todo {
  id: string
  text: string
  due_date: string | null
  status: 'pool' | 'assigned' | 'done'
  household: string
  assigned_to: string | null
  created_by: string
  created: string
  updated: string
}

export interface Household {
  id: string
  name: string
  invite_code: string
  created_by: string
  created: string
  updated: string
}

export interface User {
  id: string
  email: string
  display_name: string | null
  household: string | null
  created: string
  updated: string
}
