import { UserModel } from '../../models/UserModel'
import { createTables, clearTables } from '../helpers/db'

const model = new UserModel()

describe('UserModel', () => {
  beforeAll(async () => {
    await createTables()
  })

  beforeEach(async () => {
    await clearTables()
  })

  afterAll(async () => {
    await clearTables()
  })

  it('creates a user without returning password_digest', async () => {
    const user = await model.create({
      firstname: 'Ada',
      lastname: 'Lovelace',
      password: 'password123'
    })

    expect(user.id).toBe(1)
    expect(user.firstname).toBe('Ada')
    expect(Object.prototype.hasOwnProperty.call(user, 'password_digest')).toBeFalse()
  })

  it('indexes and shows users', async () => {
    await model.create({ firstname: 'Grace', lastname: 'Hopper', password: 'pass' })

    const users = await model.index()
    const user = await model.show('1')

    expect(users.length).toBe(1)
    expect(user.lastname).toBe('Hopper')
  })

  it('authenticates valid credentials and rejects bad credentials', async () => {
    await model.create({ firstname: 'Katherine', lastname: 'Johnson', password: 'orbit' })

    const validUser = await model.authenticate('Katherine', 'orbit')
    const invalidUser = await model.authenticate('Katherine', 'wrong')

    expect(validUser?.firstname).toBe('Katherine')
    expect(invalidUser).toBeNull()
  })

  it('updates and deletes a user', async () => {
    await model.create({ firstname: 'Old', lastname: 'Name', password: 'pass' })

    const updated = await model.update('1', {
      firstname: 'New',
      lastname: 'Name',
      password: 'pass'
    })
    const deleted = await model.delete('1')

    expect(updated.firstname).toBe('New')
    expect(deleted.id).toBe(1)
  })
})
