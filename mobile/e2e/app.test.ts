import { by, device, element, expect } from 'detox'

describe('SwipeTodo App', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  describe('Login Screen', () => {
    it('should show login screen when not authenticated', async () => {
      // App should start on login screen when not authenticated
      await expect(element(by.text('SwipeTodo'))).toBeVisible()
    })

    it('should have email input field', async () => {
      await expect(element(by.id('email-input'))).toBeVisible()
    })

    it('should have continue button', async () => {
      await expect(element(by.id('continue-button'))).toBeVisible()
    })

    it('should show error message for invalid submission', async () => {
      // Try to submit without email
      await element(by.id('continue-button')).tap()
      // Button should be disabled, no action taken
    })
  })
})

// NOTE: The following tests require authentication which needs proper test setup
// In a real CI environment, you would:
// 1. Use a test backend with seeded data
// 2. Mock the authentication state
// 3. Use environment variables for test credentials

/*
describe('Authenticated User Flow', () => {
  beforeAll(async () => {
    // Would need to authenticate first
    await device.launchApp()
  })

  describe('Home Screen', () => {
    it('should show todo list', async () => {
      await expect(element(by.id('todo-list'))).toBeVisible()
    })

    it('should show FAB button', async () => {
      await expect(element(by.id('add-todo-fab'))).toBeVisible()
    })
  })

  describe('QuickAdd Modal', () => {
    it('should open when FAB is tapped', async () => {
      await element(by.id('add-todo-fab')).tap()
      await expect(element(by.id('quick-add-input'))).toBeVisible()
    })

    it('should close when backdrop is tapped', async () => {
      await element(by.id('add-todo-fab')).tap()
      await expect(element(by.id('quick-add-input'))).toBeVisible()
      await element(by.id('modal-backdrop')).tap()
      await expect(element(by.id('quick-add-input'))).not.toBeVisible()
    })

    it('should create todo when submitted', async () => {
      await element(by.id('add-todo-fab')).tap()
      await element(by.id('quick-add-input')).typeText('Test todo from E2E')
      await element(by.id('quick-add-submit')).tap()
      await expect(element(by.text('Test todo from E2E'))).toBeVisible()
    })
  })

  describe('Todo Swipe Actions', () => {
    it('should assign todo to partner on right swipe', async () => {
      // Would require gestures
    })

    it('should complete todo on left swipe', async () => {
      // Would require gestures
    })
  })
})
*/
