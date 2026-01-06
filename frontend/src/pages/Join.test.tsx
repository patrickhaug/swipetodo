import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { Join } from './Join'

const mockGetList = vi.fn()
const mockUpdate = vi.fn()
const mockAuthRefresh = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      getList: mockGetList,
      update: mockUpdate,
      authRefresh: mockAuthRefresh,
    }),
    authStore: {
      model: { id: 'user-1', household: null },
      onChange: vi.fn(() => () => {}),
    },
  },
}))

beforeEach(() => {
  mockGetList.mockReset()
  mockUpdate.mockReset()
  mockAuthRefresh.mockReset()
  mockNavigate.mockReset()
  localStorage.clear()
})

describe('Join', () => {
  it('shows loading state initially', () => {
    mockGetList.mockResolvedValue({ items: [{ id: 'household-1' }] })

    render(
      <MemoryRouter initialEntries={['/join/ABC123']}>
        <AuthProvider>
          <Routes>
            <Route path="/join/:code" element={<Join />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/trete bei/i)).toBeInTheDocument()
  })
})
