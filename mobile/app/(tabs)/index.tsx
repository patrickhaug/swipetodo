import { View, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { FadeIn } from '@/components/FadeIn'
import { SwipeStack } from '@/components/SwipeCard'
import { SwipeNavigator } from '@/components/SwipeNavigator'
import { useAuth } from '@/contexts/AuthContext'
import { useTodos } from '@/contexts/TodosContext'
import type { Todo } from '@/types'
import { Svg, Path } from 'react-native-svg'

export default function PoolScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user, partner } = useAuth()
  const { poolTodos, assignTo } = useTodos()

  const handleSwipeLeft = (todo: Todo) => {
    if (user) {
      assignTo(todo.id, user.id)
    }
  }

  const handleSwipeRight = (todo: Todo) => {
    if (partner) {
      assignTo(todo.id, partner.id)
    }
  }

  if (poolTodos.length === 0) {
    return (
      <SwipeNavigator onSwipeLeft={() => router.push('/mine')}>
        <View className="flex-1 bg-cream items-center justify-center" style={{ paddingTop: insets.top }}>
          <FadeIn>
            <View className="w-32 h-32 rounded-full bg-coral-light/20 items-center justify-center">
              <Svg width={64} height={64} fill="none" stroke="#FF8E8E" viewBox="0 0 24 24">
                <Path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </Svg>
            </View>
          </FadeIn>
        </View>
      </SwipeNavigator>
    )
  }

  return (
    <SwipeNavigator onSwipeLeft={() => router.push('/mine')}>
      <View className="flex-1 bg-cream items-center justify-center" style={{ paddingTop: insets.top, paddingBottom: 100 }}>
        <FadeIn className="flex-1 w-full items-center justify-center">
          <SwipeStack
              items={poolTodos}
              keyExtractor={(todo) => todo.id}
              renderItem={(todo) => (
                <View className="items-center px-4">
                  <Text className="text-2xl font-semibold text-charcoal text-center leading-relaxed">
                    {todo.text}
                  </Text>
                  {todo.due_date && (
                    <View className="flex-row items-center gap-2 mt-4 bg-gray-100 px-3 py-1.5 rounded-full">
                      <Svg width={14} height={14} fill="none" stroke="#666" viewBox="0 0 24 24">
                        <Path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </Svg>
                      <Text className="text-sm text-gray-600">
                        bis {new Date(todo.due_date).toLocaleDateString('de-DE')}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
          />
        </FadeIn>
      </View>
    </SwipeNavigator>
  )
}
