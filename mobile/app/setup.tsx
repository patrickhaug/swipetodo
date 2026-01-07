import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { FadeIn } from '@/components/FadeIn'
import { useAuth } from '@/contexts/AuthContext'
import { Svg, Path } from 'react-native-svg'
import * as Haptics from 'expo-haptics'

type SetupMode = 'create' | 'join'

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export default function SetupScreen() {
  const router = useRouter()
  const { setupHousehold, joinHousehold } = useAuth()

  const [mode, setMode] = useState<SetupMode>('create')
  const [householdName, setHouseholdName] = useState('')
  const [email1, setEmail1] = useState('')
  const [email2, setEmail2] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinEmail, setJoinEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const canCreate = useMemo(
    () =>
      householdName.trim() &&
      isValidEmail(email1) &&
      isValidEmail(email2) &&
      email1.trim().toLowerCase() !== email2.trim().toLowerCase(),
    [householdName, email1, email2]
  )

  const canJoin = useMemo(
    () => joinCode.trim().length >= 6 && isValidEmail(joinEmail),
    [joinCode, joinEmail]
  )

  const handleCreate = async () => {
    if (!canCreate) return

    setIsLoading(true)
    setError('')

    try {
      await setupHousehold(householdName, email1, email2)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    } catch (err: any) {
      console.error('Setup failed:', err)
      setError(err.message || 'Fehler beim Erstellen. Bitte versuche es erneut.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!canJoin) return

    setIsLoading(true)
    setError('')

    try {
      await joinHousehold(joinCode, joinEmail)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    } catch (err: any) {
      console.error('Join failed:', err)
      setError(err.message || 'Fehler beim Beitreten. Bitte überprüfe den Code.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setIsLoading(false)
    }
  }

  if (mode === 'join') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-cream"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 items-center justify-center px-6 py-12">
            <FadeIn>
              <View className="w-20 h-20 rounded-full bg-mint/20 items-center justify-center mb-6 self-center">
                <Svg width={40} height={40} fill="none" stroke="#4ECDC4" viewBox="0 0 24 24">
                  <Path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </Svg>
              </View>

              <Text className="text-2xl font-bold text-charcoal text-center mb-2">
                Haushalt beitreten
              </Text>
              <Text className="text-muted text-center mb-8">
                Gib den Einladungscode und deine E-Mail ein
              </Text>
            </FadeIn>

            <FadeIn delay={100} className="w-full max-w-sm">
              <Text className="text-charcoal font-medium mb-2">Einladungscode</Text>
              <TextInput
                testID="join-code-input"
                placeholder="ABC123"
                value={joinCode}
                onChangeText={(text) => setJoinCode(text.toUpperCase())}
                autoCapitalize="characters"
                autoFocus
                className="h-14 px-4 rounded-2xl border border-border bg-white text-charcoal text-lg text-center tracking-widest font-mono"
                placeholderTextColor="#8E8A94"
              />

              <Text className="text-charcoal font-medium mb-2 mt-4">Deine E-Mail</Text>
              <TextInput
                testID="join-email-input"
                placeholder="deine@email.de"
                value={joinEmail}
                onChangeText={setJoinEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className="h-14 px-4 rounded-2xl border border-border bg-white text-charcoal text-lg"
                placeholderTextColor="#8E8A94"
              />

              {error ? (
                <Text className="text-coral text-sm mt-2 text-center">{error}</Text>
              ) : null}

              <Pressable
                testID="join-button"
                onPress={handleJoin}
                disabled={isLoading || !canJoin}
                className={`h-14 rounded-2xl bg-mint items-center justify-center mt-6 ${
                  isLoading || !canJoin ? 'opacity-50' : ''
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-lg">Beitreten</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setMode('create')
                  setError('')
                }}
                className="mt-4 py-2"
              >
                <Text className="text-muted text-center">Zurück</Text>
              </Pressable>
            </FadeIn>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-cream"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 items-center justify-center px-6 py-12">
          <FadeIn>
            {/* Logo / Icon */}
            <View className="w-24 h-24 rounded-full bg-coral/20 items-center justify-center mb-6 self-center">
              <Svg width={48} height={48} fill="none" stroke="#FF6B6B" viewBox="0 0 24 24">
                <Path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </Svg>
            </View>

            <Text className="text-3xl font-bold text-charcoal text-center mb-2">SwipeTodo</Text>
            <Text className="text-muted text-center mb-8">
              Richte euren gemeinsamen Haushalt ein
            </Text>
          </FadeIn>

          <FadeIn delay={200} className="w-full max-w-sm">
            <Text className="text-charcoal font-medium mb-2">Name eures Haushalts</Text>
            <TextInput
              testID="household-name-input"
              placeholder="z.B. Zuhause"
              value={householdName}
              onChangeText={setHouseholdName}
              autoFocus
              className="h-14 px-4 rounded-2xl border border-border bg-white text-charcoal text-lg"
              placeholderTextColor="#8E8A94"
            />

            <Text className="text-charcoal font-medium mb-2 mt-4">Deine E-Mail</Text>
            <TextInput
              testID="email1-input"
              placeholder="du@email.de"
              value={email1}
              onChangeText={setEmail1}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              className="h-14 px-4 rounded-2xl border border-border bg-white text-charcoal text-lg"
              placeholderTextColor="#8E8A94"
            />

            <Text className="text-charcoal font-medium mb-2 mt-4">E-Mail deines Partners</Text>
            <TextInput
              testID="email2-input"
              placeholder="partner@email.de"
              value={email2}
              onChangeText={setEmail2}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              className="h-14 px-4 rounded-2xl border border-border bg-white text-charcoal text-lg"
              placeholderTextColor="#8E8A94"
            />

            {email1 && email2 && email1.trim().toLowerCase() === email2.trim().toLowerCase() && (
              <Text className="text-coral text-sm mt-2 text-center">
                Die E-Mail-Adressen müssen unterschiedlich sein
              </Text>
            )}

            {error ? (
              <Text className="text-coral text-sm mt-2 text-center">{error}</Text>
            ) : null}

            <Pressable
              testID="create-button"
              onPress={handleCreate}
              disabled={isLoading || !canCreate}
              className={`h-14 rounded-2xl bg-coral items-center justify-center mt-6 ${
                isLoading || !canCreate ? 'opacity-50' : ''
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-lg">Haushalt erstellen</Text>
              )}
            </Pressable>

            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-border" />
              <Text className="px-4 text-muted">oder</Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            <Pressable
              testID="switch-to-join-button"
              onPress={() => {
                setMode('join')
                setError('')
              }}
              className="h-14 rounded-2xl border-2 border-mint items-center justify-center"
            >
              <Text className="text-mint font-semibold text-lg">Mit Code beitreten</Text>
            </Pressable>
          </FadeIn>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
