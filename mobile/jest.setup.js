import '@testing-library/jest-native/extend-expect'

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}))

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

// Mock PocketBase
jest.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: jest.fn(() => ({
      getList: jest.fn().mockResolvedValue({ items: [] }),
      subscribe: jest.fn().mockResolvedValue(jest.fn()),
      create: jest.fn().mockResolvedValue({ id: 'new-todo-id' }),
      update: jest.fn().mockResolvedValue({}),
    })),
    authStore: {
      isValid: false,
      record: null,
      clear: jest.fn(),
      onChange: jest.fn(() => jest.fn()), // Returns unsubscribe function
    },
  },
  initAuth: jest.fn().mockResolvedValue(undefined),
}))

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
}
