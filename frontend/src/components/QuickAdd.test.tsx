import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuickAdd } from './QuickAdd'

const mockCreateTodo = vi.fn()

vi.mock('@/contexts/TodosContext', () => ({
  useTodos: () => ({
    createTodo: mockCreateTodo,
  }),
}))

beforeEach(() => {
  mockCreateTodo.mockReset()
})

describe('QuickAdd', () => {
  it('renders floating add button', () => {
    render(<QuickAdd />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('opens dialog on click', async () => {
    const user = userEvent.setup()
    render(<QuickAdd />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByText(/neues to-do/i)).toBeInTheDocument()
  })
})
