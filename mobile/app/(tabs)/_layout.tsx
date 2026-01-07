import { Redirect } from 'expo-router'
import { Tabs } from 'expo-router'
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs'
import { View, StyleSheet, Platform, Pressable } from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { TodosProvider, useTodos } from '@/contexts/TodosContext'
import { FocusModeProvider, useFocusMode } from '@/contexts/FocusModeContext'
import { Svg, Path } from 'react-native-svg'
import * as Haptics from 'expo-haptics'

export default function TabLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner} />
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/login" />
  }

  if (!user.household) {
    return <Redirect href="/setup" />
  }

  return (
    <TodosProvider>
      <FocusModeProvider>
        <TabsWithBadge />
      </FocusModeProvider>
    </TodosProvider>
  )
}

function TabsWithBadge() {
  const { myTodos } = useTodos()
  const { isFocusMode, toggleFocusMode } = useFocusMode()
  const badgeCount = myTodos.length > 0 ? myTodos.length.toString() : undefined

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    toggleFocusMode()
  }

  // Use regular Tabs on web, NativeTabs on mobile
  if (Platform.OS === 'web') {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FF6B6B',
          tabBarInactiveTintColor: '#FFB5B5',
          tabBarStyle: {
            backgroundColor: '#FDF8F3',
            borderTopColor: 'rgba(255, 107, 107, 0.1)',
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
                <Path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </Svg>
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
                <Path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </Svg>
            ),
          }}
        />
        <Tabs.Screen
          name="mine"
          options={{
            tabBarBadge: badgeCount,
            tabBarBadgeStyle: { backgroundColor: '#FF6B6B' },
            tabBarIcon: ({ color, size }) => (
              <Pressable onLongPress={handleLongPress} delayLongPress={300}>
                {isFocusMode ? (
                  // Detective/spy icon for focus mode
                  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
                    <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </Svg>
                ) : (
                  // Person icon for list mode
                  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
                    <Path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </Svg>
                )}
              </Pressable>
            ),
          }}
        />
      </Tabs>
    )
  }

  return (
    <NativeTabs tintColor="#FF6B6B">
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'tray', selected: 'tray.full' }} />
        <Label hidden />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="create">
        <Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} />
        <Label hidden />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mine">
        <Icon
          sf={isFocusMode
            ? { default: 'eyeglasses', selected: 'eyeglasses' }
            : { default: 'person', selected: 'person.fill' }
          }
        />
        <Label hidden />
        {badgeCount && <Badge>{badgeCount}</Badge>}
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF8F3',
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderTopColor: 'transparent',
    borderRadius: 16,
  },
})
