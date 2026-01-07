import { useEffect, useRef } from 'react'
import { Animated, ViewStyle } from 'react-native'

interface FadeInProps {
  children: React.ReactNode
  style?: ViewStyle
  className?: string
  delay?: number
  duration?: number
}

export function FadeIn({ children, style, className, delay = 0, duration = 400 }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start()
    }, delay)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
      // @ts-ignore - className supported by NativeWind
      className={className}
    >
      {children}
    </Animated.View>
  )
}
