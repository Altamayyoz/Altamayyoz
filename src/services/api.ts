import usersData from '../data/users.json'
import type { User, JobOrder, TaskEntry, ProductionWorkLog, TestLog, QualityInspection, Device, Role } from '../types'

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'false') === 'true'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '' // Empty because endpoints already include /api

// Helper function to make API requests
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = USE_MOCK ? '' : `${API_BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for session
    ...options,
  }

  try {
    const response = await fetch(url, defaultOptions)
    
    // Handle 404 specifically
    if (response.status === 404) {
      throw new Error(`API endpoint not found: ${endpoint}. Check that the backend server is running and the file exists at the expected path.`)
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch {
        // If response isn't JSON, use the text or default message
        if (errorText) errorMessage = errorText
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'API request failed')
    }

    return data.data || data as T
  } catch (error) {
    console.error(`API request error [${endpoint}]:`, error)
    throw error
  }
}

// Map backend role to frontend role
function mapRole(backendRole: string): Role {
  const roleMap: Record<string, Role> = {
    'engineer': 'PlanningEngineer',
    'technician': 'ProductionWorker',
    'supervisor': 'Supervisor',
    'admin': 'Admin',
    'test_personnel': 'TestPersonnel',
    'quality_inspector': 'QualityInspector',
  }
  return roleMap[backendRole.toLowerCase()] || 'ProductionWorker'
}

// Map frontend role to backend role
function mapRoleToBackend(frontendRole: string): string {
  const roleMap: Record<string, string> = {
    'PlanningEngineer': 'engineer',
    'ProductionWorker': 'technician',
    'Supervisor': 'supervisor',
    'Admin': 'engineer', // Admin maps to engineer in database (admin username distinguishes it)
    'TestPersonnel': 'technician', // Map to technician as database doesn't have test_personnel
    'QualityInspector': 'technician', // Map to technician as database doesn't have quality_inspector
    'Technician': 'technician', // Handle both variants
    'ProductionManager': 'supervisor', // Map ProductionManager to supervisor
  }
  return roleMap[frontendRole] || 'technician'
}

// Map backend user to frontend user
function mapUser(backendUser: any): User {
  // Special case: admin username should map to Admin role
  let role = mapRole(backendUser.role)
  if (backendUser.username === 'admin' || backendUser.username?.toLowerCase() === 'admin') {
    role = 'Admin'
  }
  
  return {
    id: String(backendUser.user_id || backendUser.id),
    name: backendUser.name,
    username: backendUser.username,
    role: role,
    avatar: backendUser.avatar,
  }
}

// Map backend job order to frontend job order
function mapJobOrder(backendJobOrder: any): JobOrder {
  return {
    id: String(backendJobOrder.job_order_id || backendJobOrder.id),
    title: backendJobOrder.job_order_id || `Job Order ${backendJobOrder.job_order_id}`,
    status: mapJobOrderStatus(backendJobOrder.status),
    progress: backendJobOrder.progress_percentage || backendJobOrder.progress || 0,
    assignedTo: backendJobOrder.assigned_to ? JSON.parse(backendJobOrder.assigned_to) : [],
    devices: [],
    createdAt: backendJobOrder.created_date || backendJobOrder.createdAt || new Date().toISOString(),
    updatedAt: backendJobOrder.updated_at,
    dueDate: backendJobOrder.due_date,
    totalDevices: backendJobOrder.total_devices,
    completedDevices: backendJobOrder.completed_devices || 0,
  }
}

function mapJobOrderStatus(status: string): 'open' | 'in_progress' | 'completed' | 'on_hold' {
  const statusMap: Record<string, 'open' | 'in_progress' | 'completed' | 'on_hold'> = {
    'active': 'in_progress',
    'completed': 'completed',
    'overdue': 'on_hold',
    'due_soon': 'in_progress',
    'open': 'open',
    'on_hold': 'on_hold',
  }
  return statusMap[status?.toLowerCase()] || 'open'
}

// Map backend task to frontend task entry
function mapTaskEntry(backendTask: any): TaskEntry {
  return {
    id: String(backendTask.task_id || backendTask.id),
    jobOrderId: String(backendTask.job_order_id),
    operationId: backendTask.operation_name || backendTask.operation_id,
    technicianId: String(backendTask.technician_id || backendTask.user_id),
    serialNumbers: backendTask.serial_numbers || [],
    startTime: backendTask.date || backendTask.start_time || backendTask.created_at,
    endTime: backendTask.end_time,
    standardTime: backendTask.standard_time_minutes || backendTask.standard_time || 0,
    actualTime: backendTask.actual_time_minutes || backendTask.actual_time,
    notes: backendTask.notes || '',
    status: mapTaskStatus(backendTask.status),
  }
}

function mapTaskStatus(status: string): 'draft' | 'submitted' | 'approved' | 'rejected' {
  const statusMap: Record<string, 'draft' | 'submitted' | 'approved' | 'rejected'> = {
    'pending': 'submitted',
    'approved': 'approved',
    'rejected': 'rejected',
    'draft': 'draft',
    'submitted': 'submitted',
  }
  return statusMap[status?.toLowerCase()] || 'draft'
}

// Mock data fallback (keeping existing implementation)
let users: User[] = (usersData as User[])
let jobOrders: JobOrder[] = []
let taskEntries: TaskEntry[] = []
let productionWorkLogs: ProductionWorkLog[] = []
let testLogs: TestLog[] = []
let qualityInspections: QualityInspection[] = []
let devices: Device[] = []

async function ensureGenerated() {
  if (jobOrders.length === 0) {
    jobOrders = Array.from({ length: 30 }).map((_, i) => ({
      id: `jo-${i + 1}`,
      title: `Job Order #${i + 1}`,
      status: ['open', 'in_progress', 'completed', 'on_hold'][Math.floor(Math.random() * 4)] as any,
      progress: Math.floor(Math.random() * 100),
      assignedTo: users.slice(0, 3).map((u) => u.id),
      devices: [`dev-${i + 1}`, `dev-${i + 100}`],
      createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString()
    }))
  }
  if (taskEntries.length === 0) {
    const entries: TaskEntry[] = []
    for (let i = 0; i < 500; i++) {
      const tech = users.filter((u) => u.role === 'ProductionWorker')[(i % 15) || 0]
      entries.push({
        id: `te-${i + 1}`,
        jobOrderId: jobOrders[Math.floor(Math.random() * jobOrders.length)].id,
        operationId: `op-${(i % 100) + 1}`,
        technicianId: tech.id,
        serialNumbers: [`SN${i + 1000}`],
        startTime: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
        standardTime: 300,
        actualTime: 200 + Math.floor(Math.random() * 400),
        notes: 'Auto generated task',
        status: ['draft', 'submitted', 'approved'][Math.floor(Math.random() * 3)] as any
      })
    }
    taskEntries = entries
  }
  
  if (productionWorkLogs.length === 0) {
    const logs: ProductionWorkLog[] = []
    for (let i = 0; i < 200; i++) {
      const worker = users.filter((u) => u.role === 'ProductionWorker')[(i % 10) || 0]
      logs.push({
        id: `pwl-${i + 1}`,
        jobOrderId: jobOrders[Math.floor(Math.random() * jobOrders.length)].id,
        workerId: worker.id,
        stage: ['sub_assembly', 'installation', 'final_touch', 'packing'][Math.floor(Math.random() * 4)] as any,
        taskName: `Production Task ${i + 1}`,
        deviceId: `dev-${i + 1}`,
        serialNumber: `SN${i + 2000}`,
        startTime: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
        standardTime: 180,
        actualTime: 150 + Math.floor(Math.random() * 200),
        notes: 'Production work completed',
        status: ['draft', 'submitted', 'approved'][Math.floor(Math.random() * 3)] as any,
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString()
      })
    }
    productionWorkLogs = logs
  }
  
  if (testLogs.length === 0) {
    const logs: TestLog[] = []
    for (let i = 0; i < 150; i++) {
      const testPersonnel = users.filter((u) => u.role === 'TestPersonnel')[(i % 4) || 0]
      logs.push({
        id: `tl-${i + 1}`,
        jobOrderId: jobOrders[Math.floor(Math.random() * jobOrders.length)].id,
        testPersonnelId: testPersonnel.id,
        deviceId: `dev-${i + 1}`,
        serialNumber: `SN${i + 3000}`,
        testType: ['nitrogen', 'immersion', 'ess', 'control_unit', 'adjustment'][Math.floor(Math.random() * 5)] as any,
        testResult: ['pass', 'fail', 'needs_review'][Math.floor(Math.random() * 3)] as any,
        measurements: { pressure: Math.random() * 100, temperature: Math.random() * 50 },
        notes: 'Test completed',
        testDate: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString()
      })
    }
    testLogs = logs
  }
  
  if (qualityInspections.length === 0) {
    const inspections: QualityInspection[] = []
    for (let i = 0; i < 100; i++) {
      const inspector = users.filter((u) => u.role === 'QualityInspector')[(i % 3) || 0]
      inspections.push({
        id: `qi-${i + 1}`,
        jobOrderId: jobOrders[Math.floor(Math.random() * jobOrders.length)].id,
        inspectorId: inspector.id,
        deviceId: `dev-${i + 1}`,
        serialNumber: `SN${i + 4000}`,
        inspectionPoint: ['after_sub_assembly', 'after_installation', 'after_test', 'final'][Math.floor(Math.random() * 4)] as any,
        result: ['pass', 'fail', 'rework_required'][Math.floor(Math.random() * 3)] as any,
        defectsFound: Math.random() > 0.7 ? ['Minor scratch', 'Alignment issue'] : [],
        notes: 'Quality inspection completed',
        inspectionDate: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString()
      })
    }
    qualityInspections = inspections
  }
  
  if (devices.length === 0) {
    devices = Array.from({ length: 200 }).map((_, i) => ({
      id: `dev-${i + 1}`,
      serialNumber: `SN${i + 5000}`,
      jobOrderId: jobOrders[Math.floor(Math.random() * jobOrders.length)].id,
      currentStage: ['sub_assembly', 'installation', 'testing', 'final_touch', 'packing', 'completed'][Math.floor(Math.random() * 6)] as any,
      qualityStatus: ['pending', 'pass', 'fail', 'under_review'][Math.floor(Math.random() * 4)] as any,
      assignedTo: users.slice(0, 3).map((u) => u.id),
      createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString()
    }))
  }
}

const api = {
  async createUser(name: string, username: string, email: string, password: string, role: string): Promise<User | null> {
    if (USE_MOCK) {
      await ensureGenerated()
      const newUser: User = {
        id: `user-${users.length + 1}`,
        name,
        username,
        role: role as Role,
      }
      users.push(newUser)
      return newUser
    }

    try {
      const backendRole = mapRoleToBackend(role)
      const response = await apiRequest<any>('/api/users.php', {
        method: 'POST',
        body: JSON.stringify({
          name,
          username,
          email: email || `${username}@company.com`,
          password,
          role: backendRole,
        }),
      })

      // Fetch the created user to return full data
      const backendUsers = await apiRequest<any[]>('/api/users.php')
      const allUsers = backendUsers.map(mapUser)
      const createdUser = allUsers.find(u => u.username === username)
      
      return createdUser || {
        id: String(response.data?.user_id || response.user_id || ''),
        name,
        username,
        role: role as Role,
      }
    } catch (error: any) {
      console.error('Create user error:', error)
      throw error
    }
  },

  async updateUser(userId: string, name: string, username: string, email: string, role: string): Promise<User | null> {
    if (USE_MOCK) {
      await ensureGenerated()
      const idx = users.findIndex(u => u.id === userId)
      if (idx >= 0) {
        users[idx] = { ...users[idx], name, username, role: role as Role }
        return users[idx]
      }
      return null
    }

    try {
      const backendRole = mapRoleToBackend(role)
      await apiRequest<any>(`/api/users.php?id=${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name,
          username,
          email,
          role: backendRole,
        }),
      })

      // Fetch updated user
      const backendUsers = await apiRequest<any[]>('/api/users.php')
      const allUsers = backendUsers.map(mapUser)
      return allUsers.find(u => u.id === userId) || null
    } catch (error: any) {
      console.error('Update user error:', error)
      throw error
    }
  },

  async deleteUser(userId: string): Promise<boolean> {
    if (USE_MOCK) {
      await ensureGenerated()
      const idx = users.findIndex(u => u.id === userId)
      if (idx >= 0) {
        users.splice(idx, 1)
        return true
      }
      return false
    }

    try {
      await apiRequest<any>(`/api/users.php?id=${userId}`, {
        method: 'DELETE',
      })
      return true
    } catch (error: any) {
      console.error('Delete user error:', error)
      throw error
    }
  },

  async register(name: string, username: string, email: string, password: string, role: string): Promise<User | null> {
    if (USE_MOCK) {
      await ensureGenerated()
      // In mock mode, just simulate success
      const newUser: User = {
        id: `user-${users.length + 1}`,
        name,
        username,
        role: role as Role,
      }
      users.push(newUser)
      return newUser
    }

    try {
      const backendRole = mapRoleToBackend(role)
      const response = await apiRequest<any>('/api/users.php', {
        method: 'POST',
        body: JSON.stringify({
          name,
          username,
          email: email || `${username}@example.com`, // Generate email if not provided
          password,
          role: backendRole,
          isRegistration: true, // Flag to allow public registration
        }),
      })

      // After successful registration, return the created user
      // We need to fetch the user or construct it
      return {
        id: String(response.user_id || response.data?.user_id || ''),
        name,
        username,
        role: role as Role,
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      throw new Error(error.message || 'Registration failed')
    }
  },

  async login(username: string, password?: string, role?: string): Promise<User | null> {
    if (USE_MOCK) {
      await ensureGenerated()
      if (!password || password !== 'password') return null
      let u = users.find((x) => x.username === username)
      if (!u && role) u = users.find((x) => x.role === role as Role)
      return u || null
    }

    try {
      const response = await apiRequest<any>('/api/auth.php', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      
      // apiRequest already returns data.data, so response should be the user object
      return mapUser(response)
    } catch (error: any) {
      console.error('Login error:', error)
      // Show more detailed error message
      if (error.message) {
        console.error('Error message:', error.message)
      }
      return null
    }
  },

  async getUsers(): Promise<User[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      return users
    }

    try {
      const backendUsers = await apiRequest<any[]>('/api/users.php')
      return backendUsers.map(mapUser)
    } catch (error) {
      console.error('Get users error:', error)
      return []
    }
  },

  async getJobOrders(): Promise<JobOrder[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      return jobOrders
    }

    try {
      const backendJobOrders = await apiRequest<any[]>('/api/joborders.php')
      return backendJobOrders.map(mapJobOrder)
    } catch (error) {
      console.error('Get job orders error:', error)
      return []
    }
  },

  async getTaskEntries(opts?: { technicianId?: string; last?: number }): Promise<TaskEntry[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      let entries = taskEntries
      if (opts?.technicianId) entries = entries.filter((e) => e.technicianId === opts.technicianId)
      if (opts?.last) entries = entries.slice(0, opts.last)
      return entries
    }

    try {
      const params = new URLSearchParams()
      if (opts?.technicianId) params.append('technician_id', opts.technicianId)
      
      const backendTasks = await apiRequest<any[]>(`/api/tasks.php?${params.toString()}`)
      let entries = backendTasks.map(mapTaskEntry)
      
      if (opts?.last) entries = entries.slice(0, opts.last)
      return entries
    } catch (error) {
      console.error('Get task entries error:', error)
      return []
    }
  },

  async submitTaskEntry(entry: TaskEntry): Promise<TaskEntry> {
    if (USE_MOCK) {
      await ensureGenerated()
      const idx = taskEntries.findIndex((t) => t.id === entry.id)
      if (idx >= 0) taskEntries[idx] = entry
      else taskEntries.unshift({ ...entry, id: `te-${taskEntries.length + 1}` })
      return entry
    }

    try {
      const payload = {
        date: entry.startTime.split('T')[0],
        job_order_id: entry.jobOrderId,
        operation_name: entry.operationId,
        devices_completed: entry.serialNumbers?.length || 1,
        actual_time_minutes: entry.actualTime || 0,
        notes: entry.notes || '',
        serial_numbers: entry.serialNumbers || [],
      }

      const result = await apiRequest<any>('/api/tasks.php', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return {
        ...entry,
        id: String(result.task_id || entry.id),
      }
    } catch (error) {
      console.error('Submit task entry error:', error)
      throw error
    }
  },

  async bulkApprove(ids: string[]): Promise<{ approved: number }> {
    if (USE_MOCK) {
      await ensureGenerated()
      let approved = 0
      taskEntries = taskEntries.map((t) => {
        if (ids.includes(t.id) && t.status === 'submitted') {
          approved++
          return { ...t, status: 'approved' }
        }
        return t
      })
      return { approved }
    }

    try {
      let approved = 0
      for (const id of ids) {
        try {
          await apiRequest<any>('/api/approvals.php', {
            method: 'POST',
            body: JSON.stringify({ task_id: id, action: 'approve' }),
          })
          approved++
        } catch (error) {
          console.error(`Failed to approve task ${id}:`, error)
        }
      }
      return { approved }
    } catch (error) {
      console.error('Bulk approve error:', error)
      return { approved: 0 }
    }
  },

  async searchDevices(q: string): Promise<any[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      return Array.from({ length: 5 }).map((_, i) => ({ id: `dev-${i + 1}`, name: `Device ${q} ${i + 1}`, location: 'Floor 1' }))
    }

    try {
      const devices = await apiRequest<any[]>('/api/devices.php')
      return devices
        .filter((d) => d.serial_number?.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 5)
        .map((d) => ({
          id: String(d.device_id || d.id),
          name: d.serial_number,
          location: 'Floor 1',
        }))
    } catch (error) {
      console.error('Search devices error:', error)
      return []
    }
  },

  // Production Work Logs (using tasks API for now)
  async getProductionWorkLogs(opts?: { workerId?: string; last?: number }): Promise<ProductionWorkLog[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      let logs = productionWorkLogs
      if (opts?.workerId) logs = logs.filter((l) => l.workerId === opts.workerId)
      if (opts?.last) logs = logs.slice(0, opts.last)
      return logs
    }

    try {
      const params = new URLSearchParams()
      if (opts?.workerId) params.append('technician_id', opts.workerId)
      
      const backendTasks = await apiRequest<any[]>(`/api/tasks.php?${params.toString()}`)
      let logs = backendTasks.map((t) => ({
        id: String(t.task_id),
        jobOrderId: String(t.job_order_id),
        workerId: String(t.technician_id),
        stage: 'sub_assembly' as const,
        taskName: t.operation_name || 'Production Task',
        deviceId: String(t.device_id || ''),
        serialNumber: t.serial_numbers?.[0] || '',
        startTime: t.date || t.created_at,
        standardTime: t.standard_time_minutes || 0,
        actualTime: t.actual_time_minutes,
        notes: t.notes || '',
        status: mapTaskStatus(t.status),
        createdAt: t.created_at || new Date().toISOString(),
      }))

      if (opts?.last) logs = logs.slice(0, opts.last)
      return logs
    } catch (error) {
      console.error('Get production work logs error:', error)
      return []
    }
  },

  async submitProductionWorkLog(log: Omit<ProductionWorkLog, 'id' | 'createdAt'>): Promise<ProductionWorkLog> {
    if (USE_MOCK) {
      await ensureGenerated()
      const newLog: ProductionWorkLog = {
        ...log,
        id: `pwl-${productionWorkLogs.length + 1}`,
        createdAt: new Date().toISOString()
      }
      productionWorkLogs.unshift(newLog)
      return newLog
    }

    try {
      const payload = {
        date: log.startTime.split('T')[0],
        job_order_id: log.jobOrderId,
        operation_name: log.taskName,
        devices_completed: 1,
        actual_time_minutes: log.actualTime || 0,
        notes: log.notes || '',
        serial_numbers: [log.serialNumber],
      }

      const result = await apiRequest<any>('/api/tasks.php', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return {
        ...log,
        id: String(result.task_id),
        createdAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Submit production work log error:', error)
      throw error
    }
  },

  // Test Logs (not implemented in backend yet, using mock)
  async getTestLogs(opts?: { testPersonnelId?: string; last?: number }): Promise<TestLog[]> {
    await ensureGenerated()
    let logs = testLogs
    if (opts?.testPersonnelId) logs = logs.filter((l) => l.testPersonnelId === opts.testPersonnelId)
    if (opts?.last) logs = logs.slice(0, opts.last)
    return logs
  },

  async submitTestLog(log: Omit<TestLog, 'id' | 'createdAt'>): Promise<TestLog> {
    await ensureGenerated()
    const newLog: TestLog = {
      ...log,
      id: `tl-${testLogs.length + 1}`,
      createdAt: new Date().toISOString()
    }
    testLogs.unshift(newLog)
    return newLog
  },

  // Quality Inspections (not implemented in backend yet, using mock)
  async getQualityInspections(opts?: { inspectorId?: string; last?: number }): Promise<QualityInspection[]> {
    await ensureGenerated()
    let inspections = qualityInspections
    if (opts?.inspectorId) inspections = inspections.filter((i) => i.inspectorId === opts.inspectorId)
    if (opts?.last) inspections = inspections.slice(0, opts.last)
    return inspections
  },

  async getPendingInspections(): Promise<QualityInspection[]> {
    await ensureGenerated()
    return qualityInspections.filter((i) => i.result === 'pending')
  },

  async submitQualityInspection(inspection: Omit<QualityInspection, 'id' | 'createdAt'>): Promise<QualityInspection> {
    await ensureGenerated()
    const newInspection: QualityInspection = {
      ...inspection,
      id: `qi-${qualityInspections.length + 1}`,
      createdAt: new Date().toISOString()
    }
    qualityInspections.unshift(newInspection)
    return newInspection
  },

  // Devices
  async getDevices(): Promise<Device[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      return devices
    }

    try {
      const backendDevices = await apiRequest<any[]>('/api/devices.php')
      return backendDevices.map((d) => ({
        id: String(d.device_id || d.id),
        serialNumber: d.serial_number || '',
        jobOrderId: String(d.job_order_id || ''),
        currentStage: 'installation' as const,
        qualityStatus: 'pending' as const,
        createdAt: d.completion_date || d.created_at || new Date().toISOString(),
      }))
    } catch (error) {
      console.error('Get devices error:', error)
      return []
    }
  },

  async getDevice(id: string): Promise<Device | null> {
    if (USE_MOCK) {
      await ensureGenerated()
      return devices.find((d) => d.id === id) || null
    }

    try {
      const allDevices = await this.getDevices()
      return allDevices.find((d) => d.id === id) || null
    } catch (error) {
      console.error('Get device error:', error)
      return null
    }
  },

  async updateDeviceStage(deviceId: string, stage: Device['currentStage']): Promise<Device | null> {
    if (USE_MOCK) {
      await ensureGenerated()
      const device = devices.find((d) => d.id === deviceId)
      if (device) {
        device.currentStage = stage
        device.updatedAt = new Date().toISOString()
      }
      return device || null
    }

    // Backend doesn't have device update endpoint yet
    console.warn('Device stage update not implemented in backend')
    return null
  }
}

export default api
