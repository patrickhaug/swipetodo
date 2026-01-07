import { useState, useRef } from 'react'
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { FadeIn } from '@/components/FadeIn'
import { pb } from '@/lib/pocketbase'
import { useAuth } from '@/contexts/AuthContext'
import { Svg, Path } from 'react-native-svg'
import * as Haptics from 'expo-haptics'

export default function VerifyScreen() {
  const router = useRouter()
  const { email } = useLocalSearchParams<{ email: string }>()
  const { refreshUser } = useAuth()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<TextInput>(null)

  const handleVerify = async () => {
    if (code.length < 6) return

    setIsLoading(true)
    setError('')

    try {
      await pb.collection('users').authWithOTP(email!, code)
      await refreshUser()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    } catch (err: any) {
      setError('Ungültiger Code. Bitte versuche es erneut.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setCode('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6)
    setCode(cleaned)
    if (cleaned.length === 6) {
      inputRef.current?.blur()
    }
  }

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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </Svg>
          </View>

          <Text className="text-2xl font-bold text-charcoal text-center mb-2">
            Check deine E-Mail
          </Text>
          <Text className="text-muted text-center mb-8">
            Wir haben einen Code an{'\n'}
            <Text className="text-charcoal font-medium">{email}</Text>
            {'\n'}gesendet
          </Text>
        </FadeIn>

        <FadeIn delay={200} className="w-full max-w-sm">
          {/* Code input display */}
          <Pressable
            onPress={() => inputRef.current?.focus()}
            className="flex-row justify-center gap-2 mb-4"
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                className={`w-12 h-14 rounded-xl border-2 items-center justify-center ${
                  code[i] ? 'border-coral bg-coral/10' : 'border-border bg-white'
                }`}
              >
                <Text className="text-2xl font-bold text-charcoal">
                  {code[i] || ''}
                </Text>
              </View>
            ))}
          </Pressable>

          {/* Hidden input */}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            autoFocus
            className="absolute opacity-0"
          />

          {error ? (
            <Text className="text-coral text-sm mt-2 text-center">{error}</Text>
          ) : null}

          <Pressable
            onPress={handleVerify}
            disabled={isLoading || code.length < 6}
            className={`h-14 rounded-2xl bg-coral items-center justify-center mt-4 ${
              isLoading || code.length < 6 ? 'opacity-50' : ''
            }`}
          >
            {isLoading ? (
              <View className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Text className="text-white font-semibold text-lg">Bestätigen</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="mt-4 py-2"
          >
            <Text className="text-muted text-center">Andere E-Mail verwenden</Text>
          </Pressable>
        </FadeIn>
      </View>
    </KeyboardAvoidingView>
  )
}
