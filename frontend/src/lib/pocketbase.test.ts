import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock environment variable
vi.stubEnv('VITE_PB_URL', 'http://test:8090')

describe('PocketBase Client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('creates client with env URL', async () => {
    const { pb } = await import('./pocketbase')
    expect(pb.baseUrl).toBe('http://test:8090')
  })

  it('exports pb instance', async () => {
    const { pb } = await import('./pocketbase')
    expect(pb).toBeDefined()
    expect(pb.collection).toBeDefined()
  })

  it('defaults to localhost when no env', async () => {
    vi.stubEnv('VITE_PB_URL', '')
    vi.resetModules()
    const { pb } = await import('./pocketbase')
    expect(pb.baseUrl).toBe('http://localhost:8090')
  })
})
