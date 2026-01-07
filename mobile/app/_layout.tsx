import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider } from '@/contexts/AuthContext'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="verify" />
          <Stack.Screen name="setup" />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
