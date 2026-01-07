import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, Pressable, Modal, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { useTodos } from '@/contexts/TodosContext'
import { Svg, Path } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import DateTimePicker from '@react-native-community/datetimepicker'

interface QuickAddProps {
  open: boolean
  onClose: () => void
  autoAssignToMe?: boolean
}

export function QuickAdd({ open, onClose, autoAssignToMe }: QuickAddProps) {
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const { user } = useAuth()
  const { createTodo, assignTo } = useTodos()

  useEffect(() => {
    if (open) {
      setText('')
      setDueDate(null)
      // Focus input after modal opens
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!text.trim()) return

    setIsLoading(true)
    try {
      const todoId = await createTodo(
        text,
        dueDate ? dueDate.toISOString().split('T')[0] : undefined
      )
      if (autoAssignToMe && user && todoId) {
        await assignTo(todoId, user.id)
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setDueDate(selectedDate)
    }
  }

  const handleBackdropPress = () => {
    Keyboard.dismiss()
    onClose()
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View className="flex-1 bg-black/40 items-center justify-center px-4">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-xl">
              <View className="flex-row items-center gap-2">
                <TextInput
                  ref={inputRef}
                  placeholder="Neue Aufgabe..."
                  value={text}
                  onChangeText={setText}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  className="flex-1 h-12 px-4 rounded-xl border border-border bg-surface text-charcoal text-base"
                  placeholderTextColor="#8E8A94"
                />

                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className={`w-12 h-12 rounded-xl border items-center justify-center ${
                    dueDate
                      ? 'border-coral bg-coral/10'
                      : 'border-border bg-surface'
                  }`}
                >
                  <Svg
                    width={20}
                    height={20}
                    fill="none"
                    stroke={dueDate ? '#FF6B6B' : '#8E8A94'}
                    viewBox="0 0 24 24"
                  >
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </Svg>
                </Pressable>

                <Pressable
                  onPress={handleSubmit}
                  disabled={isLoading || !text.trim()}
                  className={`w-12 h-12 rounded-xl bg-coral items-center justify-center ${
                    isLoading || !text.trim() ? 'opacity-50' : ''
                  }`}
                >
                  {isLoading ? (
                    <View className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Svg width={24} height={24} fill="none" stroke="white" viewBox="0 0 24 24">
                      <Path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </Svg>
                  )}
                </Pressable>
              </View>

              {dueDate && (
                <Text className="text-xs text-muted mt-2 ml-1">
                  Fällig: {dueDate.toLocaleDateString('de-DE')}
                </Text>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
