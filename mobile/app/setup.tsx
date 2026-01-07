import { useState } from 'react'
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { FadeIn } from '@/components/FadeIn'
import { pb } from '@/lib/pocketbase'
import { useAuth } from '@/contexts/AuthContext'
import { Svg, Path } from 'react-native-svg'
import * as Haptics from 'expo-haptics'

export default function SetupScreen() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return

    setIsLoading(true)
    setError('')

    try {
      // Create household
      const household = await pb.collection('households').create({
        name: name.trim(),
        members: [user!.id],
      })

      // Update user with household
      await pb.collection('users').update(user!.id, {
        household: household.id,
      })

      await refreshUser()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    } catch (err: any) {
      setError('Fehler beim Erstellen. Bitte versuche es erneut.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return

    setIsLoading(true)
    setError('')

    try {
      // Find household by invite code
      const households = await pb.collection('households').getList(1, 1, {
        filter: `invite_code = "${joinCode.trim().toUpperCase()}"`,
      })

      if (households.items.length === 0) {
        throw new Error('Haushalt nicht gefunden')
      }

      const household = households.items[0]

      // Add user to household members
      await pb.collection('households').update(household.id, {
        'members+': user!.id,
      })

      // Update user with household
      await pb.collection('users').update(user!.id, {
        household: household.id,
      })

      await refreshUser()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    } catch (err: any) {
      setError('Ungültiger Code oder Haushalt nicht gefunden.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setIsLoading(false)
    }
  }

  if (showJoin) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-cream"
      >
        <View className="flex-1 items-center justify-center px-6">
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
              Gib den Einladungscode ein
            </Text>
          </FadeIn>

          <FadeIn delay={100} className="w-full max-w-sm">
            <TextInput
              placeholder="ABCD1234"
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              autoCapitalize="characters"
              autoFocus
              className="h-14 px-4 rounded-2xl border border-border bg-white text-charcoal text-lg text-center tracking-widest font-mono"
              placeholderTextColor="#8E8A94"
            />

            {error ? (
              <Text className="text-coral text-sm mt-2 text-center">{error}</Text>
            ) : null}

            <Pressable
              onPress={handleJoin}
              disabled={isLoading || !joinCode.trim()}
              className={`h-14 rounded-2xl bg-mint items-center justify-center mt-4 ${
                isLoading || !joinCode.trim() ? 'opacity-50' : ''
              }`}
            >
              {isLoading ? (
                <View className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Text className="text-white font-semibold text-lg">Beitreten</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setShowJoin(false)
                setError('')
                setJoinCode('')
              }}
              className="mt-4 py-2"
            >
              <Text className="text-muted text-center">Zurück</Text>
            </Pressable>
          </FadeIn>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-cream"
    >
      <View className="flex-1 items-center justify-center px-6">
        <FadeIn>
          <View className="w-20 h-20 rounded-full bg-coral/20 items-center justify-center mb-6 self-center">
            <Svg width={40} height={40} fill="none" stroke="#FF6B6B" viewBox="0 0 24 24">
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </Svg>
          </View>

          <Text className="text-2xl font-bold text-charcoal text-center mb-2">
            Willkommen!
          </Text>
          <Text className="text-muted text-center mb-8">
            Erstelle einen neuen Haushalt{'\n'}oder tritt einem bestehenden bei
          </Text>
        </FadeIn>

        <FadeIn delay={200} className="w-full max-w-sm">
          <TextInput
            placeholder="Name eures Haushalts"
            value={name}
            onChangeText={setName}
            autoFocus
            className="h-14 px-4 rounded-2xl border border-border bg-white text-charcoal text-lg"
            placeholderTextColor="#8E8A94"
          />

          {error && !showJoin ? (
            <Text className="text-coral text-sm mt-2 text-center">{error}</Text>
          ) : null}

          <Pressable
            onPress={handleCreate}
            disabled={isLoading || !name.trim()}
            className={`h-14 rounded-2xl bg-coral items-center justify-center mt-4 ${
              isLoading || !name.trim() ? 'opacity-50' : ''
            }`}
          >
            {isLoading ? (
              <View className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            onPress={() => setShowJoin(true)}
            className="h-14 rounded-2xl border-2 border-mint items-center justify-center"
          >
            <Text className="text-mint font-semibold text-lg">Mit Code beitreten</Text>
          </Pressable>
        </FadeIn>
      </View>
    </KeyboardAvoidingView>
  )
}
