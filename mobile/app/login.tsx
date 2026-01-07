import { useState } from 'react'
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { FadeIn } from '@/components/FadeIn'
import { pb } from '@/lib/pocketbase'
import { useAuth } from '@/contexts/AuthContext'
import { Svg, Path } from 'react-native-svg'
import * as Haptics from 'expo-haptics'

const DEV_MODE = __DEV__

export default function LoginScreen() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email.trim()) return

    setIsLoading(true)
    setError('')

    try {
      await pb.collection('users').requestOTP(email.trim().toLowerCase())
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.push({
        pathname: '/verify',
        params: { email: email.trim().toLowerCase() },
      })
    } catch (err: any) {
      setError('Fehler beim Senden. Bitte versuche es erneut.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDevLogin = async (user: 'user1' | 'user2') => {
    setIsLoading(true)
    setError('')

    // Dev credentials from environment variables (set in .env, not committed)
    const credentials = {
      user1: {
        email: process.env.EXPO_PUBLIC_DEV_USER1_EMAIL,
        password: process.env.EXPO_PUBLIC_DEV_USER1_PASSWORD,
      },
      user2: {
        email: process.env.EXPO_PUBLIC_DEV_USER2_EMAIL,
        password: process.env.EXPO_PUBLIC_DEV_USER2_PASSWORD,
      },
    }

    const cred = credentials[user]
    if (!cred.email || !cred.password) {
      setError('Dev credentials not configured. See .env.example')
      setIsLoading(false)
      return
    }

    try {
      await pb.collection('users').authWithPassword(cred.email, cred.password)
      await refreshUser()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    } catch (err: any) {
      setError(`Dev login failed. Check credentials.`)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-cream"
    >
      <View className="flex-1 items-center justify-center px-6">
        <FadeIn>
          {/* Logo / Icon */}
          <View className="w-24 h-24 rounded-full bg-coral/20 items-center justify-center mb-8 self-center">
            <Svg width={48} height={48} fill="none" stroke="#FF6B6B" viewBox="0 0 24 24">
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </Svg>
          </View>

          <Text className="text-3xl font-bold text-charcoal text-center mb-2">
            SwipeTodo
          </Text>
          <Text className="text-muted text-center mb-8">
            Teilt eure Aufgaben mit einem Swipe
          </Text>
        </FadeIn>

        <FadeIn delay={200} className="w-full max-w-sm">
          <TextInput
            testID="email-input"
            placeholder="deine@email.de"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
            className="h-14 px-4 rounded-2xl border border-border bg-white text-charcoal text-lg"
            placeholderTextColor="#8E8A94"
          />

          {error ? (
            <Text className="text-coral text-sm mt-2 text-center">{error}</Text>
          ) : null}

          <Pressable
            testID="continue-button"
            onPress={handleSubmit}
            disabled={isLoading || !email.trim()}
            className={`h-14 rounded-2xl bg-coral items-center justify-center mt-4 ${
              isLoading || !email.trim() ? 'opacity-50' : ''
            }`}
          >
            {isLoading ? (
              <View className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Text className="text-white font-semibold text-lg">Weiter</Text>
            )}
          </Pressable>

          {DEV_MODE && (
            <>
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-border" />
                <Text className="px-4 text-muted text-sm">DEV</Text>
                <View className="flex-1 h-px bg-border" />
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => handleDevLogin('user1')}
                  disabled={isLoading}
                  className={`flex-1 h-12 rounded-xl border-2 border-coral/50 items-center justify-center ${
                    isLoading ? 'opacity-50' : ''
                  }`}
                >
                  <Text className="text-coral font-medium">User 1</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDevLogin('user2')}
                  disabled={isLoading}
                  className={`flex-1 h-12 rounded-xl border-2 border-mint/50 items-center justify-center ${
                    isLoading ? 'opacity-50' : ''
                  }`}
                >
                  <Text className="text-mint font-medium">User 2</Text>
                </Pressable>
              </View>
            </>
          )}
        </FadeIn>
      </View>
    </KeyboardAvoidingView>
  )
}
