import { describe, it, expectTypeOf } from 'vitest'
import type { Todo, Household, User } from './index'

describe('Types', () => {
  it('Todo has correct shape', () => {
    expectTypeOf<Todo>().toMatchTypeOf<{
      id: string
      text: string
      status: 'pool' | 'assigned' | 'done'
      household: string
    }>()
  })

  it('Todo status is union type', () => {
    const status: Todo['status'] = 'pool'
    expectTypeOf(status).toEqualTypeOf<'pool' | 'assigned' | 'done'>()
  })

  it('Household has correct shape', () => {
    expectTypeOf<Household>().toMatchTypeOf<{
      id: string
      name: string
      invite_code: string
    }>()
  })

  it('User has correct shape', () => {
    expectTypeOf<User>().toMatchTypeOf<{
      id: string
      email: string
    }>()
  })
})
