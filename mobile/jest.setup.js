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

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5, 6])),
}))

// Mock PocketBase with reusable mock implementations for easier assertions
const mockCollectionMethods = {
  getList: jest.fn().mockResolvedValue({ items: [] }),
  getOne: jest.fn().mockResolvedValue({
    id: 'test-household-id',
    name: 'Test Household',
    invite_code: 'ABC123',
  }),
  subscribe: jest.fn().mockResolvedValue(jest.fn()),
  create: jest.fn().mockResolvedValue({
    id: 'new-id',
    name: 'Test',
    invite_code: 'XYZ789',
  }),
  update: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  authWithPassword: jest.fn().mockResolvedValue({
    token: 'test-token',
    record: {
      id: 'test-user-id',
      email: 'test@example.com',
      household: 'test-household-id',
    },
  }),
}

jest.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: jest.fn(() => mockCollectionMethods),
    filter: jest.fn((template, params) => template), // Mock parameterized filter
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
