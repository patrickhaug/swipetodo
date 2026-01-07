import React from 'react'
import { render, act } from '@testing-library/react-native'
import { Text, Animated } from 'react-native'
import { FadeIn } from '../FadeIn'

describe('FadeIn', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders children correctly', () => {
    const { toJSON } = render(
      <FadeIn>
        <Text>Hello World</Text>
      </FadeIn>
    )

    // Verify component renders (children are inside the Animated.View)
    const tree = toJSON()
    expect(tree).toBeTruthy()
    expect(JSON.stringify(tree)).toContain('Hello World')
  })

  it('starts animation after delay', () => {
    const timingSpy = jest.spyOn(Animated, 'timing')

    render(
      <FadeIn delay={200}>
        <Text>Delayed Content</Text>
      </FadeIn>
    )

    // Animation should not start immediately
    expect(timingSpy).not.toHaveBeenCalled()

    // Fast-forward past the delay
    act(() => {
      jest.advanceTimersByTime(200)
    })

    // Animation should have started (called twice: once for opacity, once for scale)
    expect(timingSpy).toHaveBeenCalledTimes(2)

    timingSpy.mockRestore()
  })

  it('uses custom duration for animation', () => {
    const timingSpy = jest.spyOn(Animated, 'timing')

    render(
      <FadeIn duration={500}>
        <Text>Custom Duration</Text>
      </FadeIn>
    )

    // Trigger animation (no delay)
    act(() => {
      jest.advanceTimersByTime(0)
    })

    // Check that duration is passed to timing
    expect(timingSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ duration: 500 })
    )

    timingSpy.mockRestore()
  })

  it('animates opacity from 0 to 1', () => {
    const timingSpy = jest.spyOn(Animated, 'timing')

    render(
      <FadeIn>
        <Text>Test</Text>
      </FadeIn>
    )

    act(() => {
      jest.advanceTimersByTime(0)
    })

    // Verify opacity animation target
    expect(timingSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 1 })
    )

    timingSpy.mockRestore()
  })

  it('accepts className prop', () => {
    const { toJSON } = render(
      <FadeIn className="flex-1">
        <Text>With Class</Text>
      </FadeIn>
    )

    expect(toJSON()).toBeTruthy()
  })

  it('accepts style prop', () => {
    const { toJSON } = render(
      <FadeIn style={{ marginTop: 10 }}>
        <Text>With Style</Text>
      </FadeIn>
    )

    expect(toJSON()).toBeTruthy()
  })
})
