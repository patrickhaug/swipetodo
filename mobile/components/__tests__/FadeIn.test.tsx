import React from 'react'
import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { FadeIn } from '../FadeIn'

describe('FadeIn', () => {
  it('renders children correctly', () => {
    const { toJSON } = render(
      <FadeIn>
        <Text>Hello World</Text>
      </FadeIn>
    )

    expect(toJSON()).toBeTruthy()
  })

  it('accepts custom delay prop', () => {
    const { toJSON } = render(
      <FadeIn delay={200}>
        <Text>Delayed Content</Text>
      </FadeIn>
    )

    expect(toJSON()).toBeTruthy()
  })

  it('accepts custom duration prop', () => {
    const { toJSON } = render(
      <FadeIn duration={500}>
        <Text>Custom Duration</Text>
      </FadeIn>
    )

    expect(toJSON()).toBeTruthy()
  })

  it('accepts className prop', () => {
    const { toJSON } = render(
      <FadeIn className="flex-1">
        <Text>With Class</Text>
      </FadeIn>
    )

    expect(toJSON()).toBeTruthy()
  })
})
