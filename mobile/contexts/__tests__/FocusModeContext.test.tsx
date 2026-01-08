import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import { FocusModeProvider, useFocusMode } from '../FocusModeContext'

describe('FocusModeContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FocusModeProvider>{children}</FocusModeProvider>
  )

  it('throws error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useFocusMode())
    }).toThrow('useFocusMode must be used within a FocusModeProvider')

    consoleSpy.mockRestore()
  })

  it('provides initial state with isFocusMode=true', () => {
    const { result } = renderHook(() => useFocusMode(), { wrapper })

    expect(result.current.isFocusMode).toBe(true)
    expect(typeof result.current.toggleFocusMode).toBe('function')
    expect(typeof result.current.setFocusMode).toBe('function')
  })

  it('toggleFocusMode inverts the state', () => {
    const { result } = renderHook(() => useFocusMode(), { wrapper })

    expect(result.current.isFocusMode).toBe(true)

    act(() => {
      result.current.toggleFocusMode()
    })

    expect(result.current.isFocusMode).toBe(false)

    act(() => {
      result.current.toggleFocusMode()
    })

    expect(result.current.isFocusMode).toBe(true)
  })

  it('setFocusMode sets specific value', () => {
    const { result } = renderHook(() => useFocusMode(), { wrapper })

    act(() => {
      result.current.setFocusMode(false)
    })

    expect(result.current.isFocusMode).toBe(false)

    act(() => {
      result.current.setFocusMode(true)
    })

    expect(result.current.isFocusMode).toBe(true)
  })

  it('setFocusMode is idempotent', () => {
    const { result } = renderHook(() => useFocusMode(), { wrapper })

    act(() => {
      result.current.setFocusMode(false)
    })
    act(() => {
      result.current.setFocusMode(false)
    })
    act(() => {
      result.current.setFocusMode(false)
    })

    expect(result.current.isFocusMode).toBe(false)
  })

  it('handles rapid toggles correctly', () => {
    const { result } = renderHook(() => useFocusMode(), { wrapper })

    // Start: true
    // Toggle 5 times: false, true, false, true, false
    act(() => {
      result.current.toggleFocusMode() // false
      result.current.toggleFocusMode() // true
      result.current.toggleFocusMode() // false
      result.current.toggleFocusMode() // true
      result.current.toggleFocusMode() // false
    })

    expect(result.current.isFocusMode).toBe(false)
  })
})
