import { View, Text, Pressable, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { FadeIn } from '@/components/FadeIn'
import { Svg, Path } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import * as Clipboard from 'expo-clipboard'
import { useState } from 'react'

export default function SettingsScreen() {
  const router = useRouter()
  const { user, partner, household, switchUser, logout } = useAuth()
  const [isSwitching, setIsSwitching] = useState(false)

  const handleSwitchUser = async () => {
    if (!partner) return

    setIsSwitching(true)
    try {
      await switchUser()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      console.error('Switch failed:', err)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert(
        'Wechsel fehlgeschlagen',
        'Der Benutzerwechsel konnte nicht durchgeführt werden. Bitte versuche es erneut.'
      )
    } finally {
      setIsSwitching(false)
    }
  }

  const handleCopyInviteCode = async () => {
    if (!household?.invite_code) return

    await Clipboard.setStringAsync(household.invite_code)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Alert.alert('Kopiert!', 'Der Einladungscode wurde in die Zwischenablage kopiert.')
  }

  const handleLogout = () => {
    Alert.alert(
      'Haushalt verlassen?',
      'Du wirst ausgeloggt und musst dich erneut einrichten.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Verlassen',
          style: 'destructive',
          onPress: async () => {
            await logout()
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            router.replace('/setup')
          },
        },
      ]
    )
  }

  const getUserDisplayName = (u: typeof user) => {
    if (!u) return ''
    return u.display_name || u.name || u.email.split('@')[0]
  }

  return (
    <View className="flex-1 bg-cream">
      {/* Header */}
      <View className="pt-16 pb-4 px-6 border-b border-border">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <Svg width={24} height={24} fill="none" stroke="#2D2A32" viewBox="0 0 24 24">
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </Svg>
          </Pressable>
          <Text className="text-xl font-bold text-charcoal ml-2">Einstellungen</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Current User Section */}
        <FadeIn>
          <Text className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
            Aktueller Benutzer
          </Text>
          <View className="bg-white rounded-2xl p-4 border border-border mb-6">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-coral/20 items-center justify-center">
                <Text className="text-coral font-bold text-lg">
                  {getUserDisplayName(user).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-charcoal font-semibold text-lg">
                  {getUserDisplayName(user)}
                </Text>
                <Text className="text-muted text-sm">{user?.email}</Text>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Switch User Section */}
        {partner && (
          <FadeIn delay={100}>
            <Text className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
              Benutzer wechseln
            </Text>
            <Pressable
              onPress={handleSwitchUser}
              disabled={isSwitching}
              className={`bg-white rounded-2xl p-4 border border-border mb-6 ${
                isSwitching ? 'opacity-50' : ''
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-mint/20 items-center justify-center">
                  <Text className="text-mint font-bold text-lg">
                    {getUserDisplayName(partner).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-charcoal font-semibold text-lg">
                    {getUserDisplayName(partner)}
                  </Text>
                  <Text className="text-muted text-sm">{partner.email}</Text>
                </View>
                <View className="w-10 h-10 items-center justify-center">
                  <Svg width={20} height={20} fill="none" stroke="#4ECDC4" viewBox="0 0 24 24">
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </Svg>
                </View>
              </View>
            </Pressable>
          </FadeIn>
        )}

        {/* Household Section */}
        <FadeIn delay={200}>
          <Text className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
            Haushalt
          </Text>
          <View className="bg-white rounded-2xl border border-border mb-6 overflow-hidden">
            <View className="p-4 border-b border-border">
              <Text className="text-muted text-sm mb-1">Name</Text>
              <Text className="text-charcoal font-semibold text-lg">
                {household?.name || 'Unbekannt'}
              </Text>
            </View>
            <Pressable onPress={handleCopyInviteCode} className="p-4">
              <Text className="text-muted text-sm mb-1">Einladungscode</Text>
              <View className="flex-row items-center">
                <Text className="text-charcoal font-mono text-lg tracking-widest">
                  {household?.invite_code || '------'}
                </Text>
                <View className="ml-2">
                  <Svg width={16} height={16} fill="none" stroke="#8E8A94" viewBox="0 0 24 24">
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </Svg>
                </View>
              </View>
              <Text className="text-muted text-xs mt-1">Tippen zum Kopieren</Text>
            </Pressable>
          </View>
        </FadeIn>

        {/* Danger Zone */}
        <FadeIn delay={300}>
          <Text className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
            Gefahrenzone
          </Text>
          <Pressable
            onPress={handleLogout}
            className="bg-white rounded-2xl p-4 border border-coral/30"
          >
            <View className="flex-row items-center justify-center">
              <Svg width={20} height={20} fill="none" stroke="#FF6B6B" viewBox="0 0 24 24">
                <Path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </Svg>
              <Text className="text-coral font-semibold text-lg ml-2">Haushalt verlassen</Text>
            </View>
          </Pressable>
        </FadeIn>
      </ScrollView>
    </View>
  )
}
