import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    authStore: {
      model: null,
      onChange: vi.fn(() => () => {}),
    },
  },
}))

describe('App', () => {
  it('redirects to login when not authenticated', () => {
    render(<App />)
    expect(screen.getByText(/swipetodo/i)).toBeInTheDocument()
  })
})
