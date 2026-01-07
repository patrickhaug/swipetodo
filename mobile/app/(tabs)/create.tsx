import { useState, useRef } from 'react'
import { View, Text, TextInput, Pressable, Keyboard, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTodos } from '@/contexts/TodosContext'
import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

export default function CreateScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { createTodo } = useTodos()
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed || isSubmitting) return

    setIsSubmitting(true)
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }

    try {
      await createTodo(trimmed)
      setText('')
      Keyboard.dismiss()
      router.push('/')
    } catch (err) {
      console.error('Failed to create todo:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <Text style={styles.title}>New Task</Text>

      <TextInput
        ref={inputRef}
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="What needs to be done?"
        placeholderTextColor="#999"
        multiline
        autoFocus
        returnKeyType="done"
        blurOnSubmit
        onSubmitEditing={handleSubmit}
      />

      <Pressable
        style={[
          styles.button,
          (!text.trim() || isSubmitting) && styles.buttonDisabled
        ]}
        onPress={handleSubmit}
        disabled={!text.trim() || isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Adding...' : 'Add to Pool'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F3',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    color: '#2D3436',
    minHeight: 120,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#FFB5B5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
})
