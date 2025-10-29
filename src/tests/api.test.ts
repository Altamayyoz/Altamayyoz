import { describe, it, expect } from 'vitest'
import api from '../services/api'

describe('API mock', () => {
  it('returns a user when username exists (with correct password)', async () => {
    const users = await api.getUsers()
    expect(users.length).toBeGreaterThanOrEqual(1)
    const u = await api.login(users[0].username, 'password')
    expect(u).toBeTruthy()
    expect(u?.username).toBe(users[0].username)
  })

  it('generates job orders and task entries', async () => {
    const jos = await api.getJobOrders()
    expect(jos.length).toBeGreaterThanOrEqual(1)
    const tasks = await api.getTaskEntries({ last: 5 })
    expect(tasks.length).toBeLessThanOrEqual(5)
  })
})
