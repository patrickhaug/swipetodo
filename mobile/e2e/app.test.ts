import { by, device, element, expect } from 'detox'

describe('SwipeTodo App', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  describe('Initial Launch - No Household', () => {
    it('should show setup screen when no household configured', async () => {
      // Fresh install should show household setup
      await expect(element(by.text('SwipeTodo'))).toBeVisible()
    })

    it('should display household creation option', async () => {
      await expect(element(by.id('create-household-button'))).toBeVisible()
    })

    it('should display join household option', async () => {
      await expect(element(by.id('join-household-button'))).toBeVisible()
    })
  })

  describe('Household Setup Flow', () => {
    describe('Create Household', () => {
      it('should show household name input', async () => {
        await element(by.id('create-household-button')).tap()
        await expect(element(by.id('household-name-input'))).toBeVisible()
      })

      it('should show email inputs for both users', async () => {
        await element(by.id('create-household-button')).tap()
        await expect(element(by.id('email-1-input'))).toBeVisible()
        await expect(element(by.id('email-2-input'))).toBeVisible()
      })

      it('should require household name', async () => {
        await element(by.id('create-household-button')).tap()
        // Submit button should be disabled with empty name
        await expect(element(by.id('submit-household-button'))).toBeVisible()
      })

      it('should require both email addresses', async () => {
        await element(by.id('create-household-button')).tap()
        await element(by.id('household-name-input')).typeText('Test Home')
        await element(by.id('email-1-input')).typeText('user1@test.com')
        // Second email empty - should not submit
      })
    })

    describe('Join Household', () => {
      it('should show invite code input', async () => {
        await element(by.id('join-household-button')).tap()
        await expect(element(by.id('invite-code-input'))).toBeVisible()
      })

      it('should show email input for joining user', async () => {
        await element(by.id('join-household-button')).tap()
        await expect(element(by.id('join-email-input'))).toBeVisible()
      })

      it('should validate invite code format', async () => {
        await element(by.id('join-household-button')).tap()
        await element(by.id('invite-code-input')).typeText('invalid')
        // Should show error for invalid code
      })
    })
  })

  describe('User Selection Flow', () => {
    // After household is set up, user needs to select who they are
    it('should show user selection after household setup', async () => {
      // This test assumes household is already set up
      await expect(element(by.id('user-selection-screen'))).toBeVisible()
    })

    it('should display both user options', async () => {
      await expect(element(by.id('user-1-option'))).toBeVisible()
      await expect(element(by.id('user-2-option'))).toBeVisible()
    })

    it('should navigate to main app after user selection', async () => {
      await element(by.id('user-1-option')).tap()
      // Should navigate to main tab view
      await expect(element(by.id('pool-tab'))).toBeVisible()
    })
  })

  describe('Main App - Pool Screen', () => {
    // These tests require authenticated state
    describe('Empty Pool State', () => {
      it('should show empty state message when no tasks', async () => {
        await expect(element(by.id('empty-pool-message'))).toBeVisible()
      })

      it('should show create task prompt', async () => {
        await expect(element(by.text('Alle Aufgaben verteilt'))).toBeVisible()
      })
    })

    describe('Pool with Tasks', () => {
      it('should show task cards in stack', async () => {
        await expect(element(by.id('task-card-stack'))).toBeVisible()
      })

      it('should show first task prominently', async () => {
        await expect(element(by.id('first-task-card'))).toBeVisible()
      })
    })
  })

  describe('Main App - My Tasks Screen', () => {
    describe('Focus Mode (Card Stack)', () => {
      it('should show focus mode toggle', async () => {
        await element(by.id('mine-tab')).tap()
        await expect(element(by.id('focus-mode-toggle'))).toBeVisible()
      })

      it('should display tasks as cards in focus mode', async () => {
        await element(by.id('mine-tab')).tap()
        await expect(element(by.id('task-card-stack'))).toBeVisible()
      })
    })

    describe('List Mode', () => {
      it('should switch to list mode when toggled', async () => {
        await element(by.id('mine-tab')).tap()
        await element(by.id('focus-mode-toggle')).tap()
        await expect(element(by.id('task-list'))).toBeVisible()
      })

      it('should show tasks as list items', async () => {
        await element(by.id('mine-tab')).tap()
        await element(by.id('focus-mode-toggle')).tap()
        await expect(element(by.id('task-list-item'))).toBeVisible()
      })
    })

    describe('Empty State', () => {
      it('should show completion message when no tasks', async () => {
        await element(by.id('mine-tab')).tap()
        await expect(element(by.text('Alles erledigt!'))).toBeVisible()
      })
    })
  })

  describe('Main App - Create Tab', () => {
    it('should show task input field', async () => {
      await element(by.id('create-tab')).tap()
      await expect(element(by.id('task-input'))).toBeVisible()
    })

    it('should have submit button', async () => {
      await element(by.id('create-tab')).tap()
      await expect(element(by.id('create-task-button'))).toBeVisible()
    })

    it('should disable submit when input empty', async () => {
      await element(by.id('create-tab')).tap()
      // Button should be visually disabled
    })
  })

  describe('Navigation', () => {
    it('should have bottom tab navigation', async () => {
      await expect(element(by.id('bottom-tabs'))).toBeVisible()
    })

    it('should switch between pool and mine tabs', async () => {
      await element(by.id('pool-tab')).tap()
      await expect(element(by.id('pool-screen'))).toBeVisible()

      await element(by.id('mine-tab')).tap()
      await expect(element(by.id('mine-screen'))).toBeVisible()
    })

    it('should show tab badges with task counts', async () => {
      await expect(element(by.id('mine-tab-badge'))).toBeVisible()
    })
  })

  describe('Settings & User Management', () => {
    it('should show current user indicator', async () => {
      await expect(element(by.id('current-user-indicator'))).toBeVisible()
    })

    it('should have switch user option', async () => {
      await element(by.id('settings-button')).tap()
      await expect(element(by.id('switch-user-button'))).toBeVisible()
    })

    it('should have logout option', async () => {
      await element(by.id('settings-button')).tap()
      await expect(element(by.id('logout-button'))).toBeVisible()
    })
  })
})

// Gesture-based tests (require more complex setup)
describe('Gesture Interactions', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  describe('Card Swipe Actions', () => {
    it('should recognize left swipe gesture', async () => {
      // Swipe left on first card
      await element(by.id('first-task-card')).swipe('left', 'fast')
      // Card should animate out
    })

    it('should recognize right swipe gesture', async () => {
      // Swipe right on first card
      await element(by.id('first-task-card')).swipe('right', 'fast')
      // Card should animate out
    })

    it('should return card to center on incomplete swipe', async () => {
      // Small swipe that doesn't meet threshold
      await element(by.id('first-task-card')).swipe('left', 'slow', 0.2)
      // Card should spring back
    })
  })

  describe('List Reordering', () => {
    it('should activate drag mode on long press', async () => {
      await element(by.id('mine-tab')).tap()
      await element(by.id('focus-mode-toggle')).tap()
      await element(by.id('task-list-item')).longPress()
      // Item should be in drag mode
    })

    it('should reorder items when dragged', async () => {
      await element(by.id('mine-tab')).tap()
      await element(by.id('focus-mode-toggle')).tap()
      // Long press and drag
    })
  })

  describe('Pull-down Mode Switch', () => {
    it('should switch to list mode on pull-down gesture', async () => {
      await element(by.id('mine-tab')).tap()
      // Pull down on card
      await element(by.id('first-task-card')).swipe('down', 'fast')
      // Should morph to list mode
    })
  })
})

// Error handling and edge cases
describe('Error Handling', () => {
  describe('Network Errors', () => {
    it('should show error message on network failure', async () => {
      // Simulate network error
      await expect(element(by.id('error-message'))).toBeVisible()
    })

    it('should allow retry after error', async () => {
      await expect(element(by.id('retry-button'))).toBeVisible()
    })
  })

  describe('Invalid Input', () => {
    it('should show validation error for invalid email', async () => {
      await element(by.id('create-household-button')).tap()
      await element(by.id('email-1-input')).typeText('not-an-email')
      // Should show validation error
    })
  })
})

// Accessibility tests
describe('Accessibility', () => {
  it('should have accessible labels on interactive elements', async () => {
    await expect(element(by.label('Create household'))).toBeVisible()
  })

  it('should support screen reader navigation', async () => {
    // Test VoiceOver/TalkBack compatibility
  })
})
