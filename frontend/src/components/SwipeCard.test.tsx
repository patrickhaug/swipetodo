import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SwipeCard } from './SwipeCard'
import { Todo } from '@/types'

const mockTodo: Todo = {
  id: '1',
  text: 'Test Todo',
  due_date: '2026-01-15',
  status: 'pool',
  household: 'h1',
  assigned_to: null,
  created_by: 'u1',
  created: '2026-01-06',
  updated: '2026-01-06',
}

describe('SwipeCard', () => {
  it('renders todo text', () => {
    render(
      <SwipeCard
        todo={mockTodo}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
      />
    )
    expect(screen.getByText('Test Todo')).toBeInTheDocument()
  })

  it('renders due date when present', () => {
    render(
      <SwipeCard
        todo={mockTodo}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
      />
    )
    expect(screen.getByText(/15.1.2026/)).toBeInTheDocument()
  })

  it('renders swipe labels', () => {
    render(
      <SwipeCard
        todo={mockTodo}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
        leftLabel="Patrick"
        rightLabel="Lisa"
      />
    )
    expect(screen.getByText('Patrick')).toBeInTheDocument()
    expect(screen.getByText('Lisa')).toBeInTheDocument()
  })
})
