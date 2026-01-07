import '@testing-library/jest-native/extend-expect'

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Path: 'Path',
}))

// Setup react-native-reanimated for testing (official v4.x approach)
require('react-native-reanimated').setUpTests()

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

// Mock PocketBase with reusable mock implementations for easier assertions
const mockCollectionMethods = {
  getList: jest.fn().mockResolvedValue({ items: [] }),
  getOne: jest.fn().mockResolvedValue({ id: 'test-id' }),
  subscribe: jest.fn().mockResolvedValue(jest.fn()),
  create: jest.fn().mockResolvedValue({ id: 'new-todo-id' }),
  update: jest.fn().mockResolvedValue({}),
  authWithPassword: jest.fn().mockResolvedValue({}),
}

jest.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: jest.fn(() => mockCollectionMethods),
    authStore: {
      isValid: false,
      record: null,
      clear: jest.fn(),
      onChange: jest.fn(() => jest.fn()), // Returns unsubscribe function
    },
  },
  initAuth: jest.fn().mockResolvedValue(undefined),
  loadHouseholdConfig: jest.fn().mockResolvedValue(null),
  saveHouseholdConfig: jest.fn().mockResolvedValue(undefined),
  clearHouseholdConfig: jest.fn().mockResolvedValue(undefined),
  loginOrCreateUser: jest.fn().mockResolvedValue(undefined),
  DEFAULT_USER_PASSWORD: 'test-password',
}))

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
}
