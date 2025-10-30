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

  async updateJobOrder(jobOrderId: string, updates: { total_devices?: number; due_date?: string; status?: string }): Promise<boolean> {
    if (USE_MOCK) {
      await ensureGenerated()
      const idx = jobOrders.findIndex(j => j.id === jobOrderId)
      if (idx >= 0) {
        if (updates.total_devices !== undefined) jobOrders[idx].totalDevices = updates.total_devices
        if (updates.due_date !== undefined) jobOrders[idx].dueDate = updates.due_date
        if (updates.status !== undefined) jobOrders[idx].status = updates.status as any
        return true
      }
      return false
    }

    try {
      await apiRequest<any>(`/api/joborders.php?id=${jobOrderId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      return true
    } catch (error: any) {
      console.error('Update job order error:', error)
      throw error
    }
  },

  async deleteJobOrder(jobOrderId: string): Promise<boolean> {
    if (USE_MOCK) {
      await ensureGenerated()
      const idx = jobOrders.findIndex(j => j.id === jobOrderId)
      if (idx >= 0) {
        jobOrders.splice(idx, 1)
        return true
      }
      return false
    }

    try {
      await apiRequest<any>(`/api/joborders.php?id=${jobOrderId}`, {
        method: 'DELETE'
      })
      return true
    } catch (error: any) {
      console.error('Delete job order error:', error)
      throw error
    }
  },

  async getPlanningEngineerActivities(limit: number = 20): Promise<any> {
    if (USE_MOCK) {
      await ensureGenerated()
      return {
        activities: [],
        recentJobOrders: [],
        summary: {
          totalActivities: 0,
          recentJobOrdersCreated: 0,
          pendingJobOrders: 0
        }
      }
    }

    try {
      const response = await apiRequest<any>('/api/planning_activities.php?limit=' + limit)
      return response.data || response
    } catch (error) {
      console.error('Get planning engineer activities error:', error)
      return {
        activities: [],
        recentJobOrders: [],
        summary: {
          totalActivities: 0,
          recentJobOrdersCreated: 0,
          pendingJobOrders: 0
        }
      }
    }
  },

  async createJobOrder(jobOrder: { job_order_id: string; total_devices: number; due_date: string }): Promise<boolean> {
    if (USE_MOCK) {
      await ensureGenerated()
      const newJobOrder: JobOrder = {
        id: jobOrder.job_order_id,
        jobOrderNumber: jobOrder.job_order_id,
        title: `Job Order ${jobOrder.job_order_id}`,
        productModel: 'A300',
        totalDevices: jobOrder.total_devices,
        completedDevices: 0,
        dueDate: jobOrder.due_date,
        status: 'in_progress',
        priority: 'Medium',
        assignedSupervisor: '',
        assignedTo: [],
        devices: [],
        progress: 0,
        createdAt: new Date().toISOString()
      }
      jobOrders.unshift(newJobOrder)
      return true
    }

    try {
      await apiRequest<any>('/api/joborders.php', {
        method: 'POST',
        body: JSON.stringify(jobOrder)
      })
      return true
    } catch (error: any) {
      console.error('Create job order error:', error)
      throw error
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
    if (USE_MOCK) {
      await ensureGenerated()
      let logs = testLogs
      if (opts?.testPersonnelId) logs = logs.filter((l) => l.testPersonnelId === opts.testPersonnelId)
      if (opts?.last) logs = logs.slice(0, opts.last)
      return logs
    }

    // Backend doesn't have test logs endpoint yet, return empty array
    console.warn('Test logs endpoint not implemented in backend yet')
    return []
  },

  async submitTestLog(log: Omit<TestLog, 'id' | 'createdAt'>): Promise<TestLog> {
    if (USE_MOCK) {
      await ensureGenerated()
      const newLog: TestLog = {
        ...log,
        id: `tl-${testLogs.length + 1}`,
        createdAt: new Date().toISOString()
      }
      testLogs.unshift(newLog)
      return newLog
    }
    
    // Backend doesn't have test logs endpoint yet
    throw new Error('Test logs submission not implemented in backend yet')
  },

  // Quality Inspections (not implemented in backend yet, using mock)
  async getQualityInspections(opts?: { inspectorId?: string; last?: number }): Promise<QualityInspection[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      let inspections = qualityInspections
      if (opts?.inspectorId) inspections = inspections.filter((i) => i.inspectorId === opts.inspectorId)
      if (opts?.last) inspections = inspections.slice(0, opts.last)
      return inspections
    }

    // Backend doesn't have quality inspections endpoint yet, return empty array
    console.warn('Quality inspections endpoint not implemented in backend yet')
    return []
  },

  async getPendingInspections(): Promise<QualityInspection[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      return qualityInspections.filter((i) => i.result === 'pending')
    }
    return []
  },

  async submitQualityInspection(inspection: Omit<QualityInspection, 'id' | 'createdAt'>): Promise<QualityInspection> {
    if (USE_MOCK) {
      await ensureGenerated()
      const newInspection: QualityInspection = {
        ...inspection,
        id: `qi-${qualityInspections.length + 1}`,
        createdAt: new Date().toISOString()
      }
      qualityInspections.unshift(newInspection)
      return newInspection
    }
    
    // Backend doesn't have quality inspections endpoint yet
    throw new Error('Quality inspections submission not implemented in backend yet')
  },

  // Devices
  async getDevices(): Promise<Device[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      return devices
    }

    try {
      const backendDevices = await apiRequest<any>('/api/devices.php')
      // Handle both array response and wrapped response
      const devicesArray = Array.isArray(backendDevices) ? backendDevices : (backendDevices.data || [])
      
      return devicesArray.map((d: any) => {
        // Map operation_name to currentStage based on operation type
        let currentStage: Device['currentStage'] = 'installation'
        const operationName = d.operation_name?.toLowerCase() || ''
        
        if (operationName.includes('assemblage') || operationName.includes('assembly')) {
          currentStage = 'sub_assembly'
        } else if (operationName.includes('test') || operationName.includes('quality test')) {
          currentStage = 'testing'
        } else if (operationName.includes('final touch') || operationName.includes('cleaning') || operationName.includes('packing')) {
          currentStage = 'final_touch'
        } else if (operationName.includes('packaging')) {
          currentStage = 'packing'
        } else if (d.completion_date) {
          currentStage = 'completed'
        }
        
        return {
          id: String(d.device_id || d.id),
          serialNumber: d.serial_number || '',
          jobOrderId: String(d.job_order_id || ''),
          currentStage: currentStage,
          qualityStatus: d.status === 'completed' ? 'pass' : 'pending' as const,
          createdAt: d.completion_date || d.created_at || new Date().toISOString(),
          operationName: d.operation_name || '',
          technicianName: d.technician_name || ''
        }
      })
    } catch (error) {
      console.error('Get devices error:', error)
      return []
    }
  },

  async getPlanningAlerts(): Promise<any[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      return [
        {
          id: '1',
          type: 'supervisor_alert',
          message: 'Job Order JO-2024-001 experiencing delays - need additional resources',
          severity: 'warning',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          read: false,
          senderName: 'John Supervisor',
          senderRole: 'supervisor'
        },
        {
          id: '2',
          type: 'performance_issue',
          message: 'Performance below target in Assembly line - efficiency at 78%',
          severity: 'warning',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          read: false,
          senderName: 'System',
          senderRole: 'supervisor'
        }
      ]
    }

    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/api/planning_alerts.php')
      return response.data || []
    } catch (error) {
      console.error('Get planning alerts error:', error)
      return []
    }
  },

  async sendAlert(target: 'supervisor' | 'admin', message: string, alertType: string, severity: 'info' | 'warning' | 'critical' = 'info', jobOrderId?: string): Promise<boolean> {
    if (USE_MOCK) {
      return true
    }

    try {
      const response = await apiRequest<{ success: boolean; message: string }>('/api/planning_alerts.php', {
        method: 'POST',
        body: JSON.stringify({
          target,
          message,
          alert_type: alertType,
          severity,
          job_order_id: jobOrderId
        })
      })
      return true
    } catch (error: any) {
      console.error('Send alert error:', error)
      throw error // Re-throw to let the modal handle the specific error message
    }
  },

  async markAlertRead(alertId: string, read: boolean = true): Promise<boolean> {
    if (USE_MOCK) {
      return true
    }

    try {
      await apiRequest<any>('/api/planning_alerts.php', {
        method: 'PUT',
        body: JSON.stringify({
          alert_id: alertId,
          read_status: read
        })
      })
      return true
    } catch (error) {
      console.error('Mark alert read error:', error)
      return false
    }
  },

  async getPlanningMetrics(period: number = 30): Promise<any> {
    if (USE_MOCK) {
      await ensureGenerated()
      return {
        efficiencyTrends: [],
        productivityTrends: [],
        currentMetrics: {
          averageEfficiency: 75,
          totalProductivity: 85,
          utilizationRate: 70,
          onTimeDelivery: 80
        },
        bottleneckTasks: [],
        topPerformers: []
      }
    }

    try {
      const response = await apiRequest<any>(`/api/planning_metrics.php?period=${period}`)
      return response.data || response
    } catch (error) {
      console.error('Get planning metrics error:', error)
      return {
        efficiencyTrends: [],
        productivityTrends: [],
        currentMetrics: {
          averageEfficiency: 75,
          totalProductivity: 85,
          utilizationRate: 70,
          onTimeDelivery: 80
        },
        bottleneckTasks: [],
        topPerformers: []
      }
    }
  },

  async getOperations(): Promise<any[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      return [
        { operation_id: 1, operation_name: 'Assemblage I', standard_time: 32, description: 'Primary assembly operation' },
        { operation_id: 2, operation_name: 'Assemblage II', standard_time: 30, description: 'Secondary assembly operation' },
        { operation_id: 3, operation_name: 'Quality Test', standard_time: 18, description: 'Quality control testing' },
        { operation_id: 4, operation_name: 'Final Touch - Cleaning&Packing', standard_time: 10, description: 'Final cleaning and packing' },
        { operation_id: 5, operation_name: 'Packaging', standard_time: 8, description: 'Final packaging' }
      ]
    }

    try {
      const response = await apiRequest<any>('/api/operations.php')
      // The response might be the data directly or wrapped in a data property
      return Array.isArray(response) ? response : (response.data || [])
    } catch (error) {
      console.error('Get operations error:', error)
      return []
    }
  },

  async createOperation(operation: { operation_name: string; standard_time_minutes: number; description?: string; category?: string }): Promise<boolean> {
    if (USE_MOCK) {
      await ensureGenerated()
      return true
    }

    try {
      await apiRequest<any>('/api/operations_crud.php', {
        method: 'POST',
        body: JSON.stringify(operation)
      })
      return true
    } catch (error: any) {
      console.error('Create operation error:', error)
      throw error
    }
  },

  async updateOperation(operationId: string, updates: { operation_name?: string; standard_time_minutes?: number; description?: string }): Promise<boolean> {
    if (USE_MOCK) {
      await ensureGenerated()
      return true
    }

    try {
      await apiRequest<any>(`/api/operations_crud.php?id=${operationId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      return true
    } catch (error: any) {
      console.error('Update operation error:', error)
      throw error
    }
  },

  async deleteOperation(operationId: string): Promise<boolean> {
    if (USE_MOCK) {
      await ensureGenerated()
      return true
    }

    try {
      await apiRequest<any>(`/api/operations_crud.php?id=${operationId}`, {
        method: 'DELETE'
      })
      return true
    } catch (error: any) {
      console.error('Delete operation error:', error)
      throw error
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
  },

  // Admin Dashboard APIs
  async getAdminStats(): Promise<any> {
    if (USE_MOCK) {
      await ensureGenerated()
      return {
        totalUsers: users.length,
        activeJobOrders: jobOrders.filter(j => j.status === 'in_progress').length,
        completedJobOrders: jobOrders.filter(j => j.status === 'completed').length,
        pendingApprovals: 5,
        systemAlerts: 3,
        totalDevices: devices.length,
        completedDevices: devices.filter(d => d.currentStage === 'completed').length,
        averageEfficiency: 85
      }
    }

    try {
      return await apiRequest<any>('/api/admin_stats.php')
    } catch (error) {
      console.error('Get admin stats error:', error)
      throw error
    }
  },

  async getAlerts(resolved?: boolean): Promise<any[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      return [
        {
          id: '1',
          type: 'Low Performance',
          severity: 'High',
          message: 'Technician efficiency below 70% for 3 consecutive days',
          timestamp: new Date().toISOString(),
          resolved: false
        }
      ]
    }

    try {
      const params = resolved !== undefined ? `?resolved=${resolved}` : ''
      return await apiRequest<any[]>(`/api/admin_alerts.php${params}`)
    } catch (error) {
      console.error('Get alerts error:', error)
      return []
    }
  },

  async resolveAlert(alertId: string): Promise<boolean> {
    if (USE_MOCK) {
      return true
    }

    try {
      await apiRequest<any>(`/api/admin_alerts.php`, {
        method: 'PUT',
        body: JSON.stringify({ alert_id: alertId, resolved: true })
      })
      return true
    } catch (error) {
      console.error('Resolve alert error:', error)
      return false
    }
  },

  async deleteAlert(alertId: string): Promise<boolean> {
    if (USE_MOCK) {
      return true
    }

    try {
      await apiRequest<any>(`/api/admin_alerts.php?alert_id=${alertId}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error('Delete alert error:', error)
      return false
    }
  },

  async getSettings(): Promise<any> {
    if (USE_MOCK) {
      return {
        standard_work_hours: '8',
        alert_threshold_efficiency: '70'
      }
    }

    try {
      return await apiRequest<any>('/api/admin_settings.php')
    } catch (error) {
      console.error('Get settings error:', error)
      return {
        standard_work_hours: '8',
        alert_threshold_efficiency: '70'
      }
    }
  },

  async saveSettings(settings: Record<string, string>): Promise<boolean> {
    if (USE_MOCK) {
      return true
    }

    try {
      await apiRequest<any>('/api/admin_settings.php', {
        method: 'POST',
        body: JSON.stringify(settings)
      })
      return true
    } catch (error) {
      console.error('Save settings error:', error)
      return false
    }
  },

  async getRecentActivity(limit: number = 20): Promise<any[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      return [
        { action: 'New user created', user: 'John Doe', time: new Date().toISOString(), type: 'user' },
        { action: 'Job order completed', user: 'JO-00123', time: new Date().toISOString(), type: 'job' }
      ]
    }

    try {
      return await apiRequest<any[]>(`/api/admin_activity.php?limit=${limit}`)
    } catch (error) {
      console.error('Get activity error:', error)
      return []
    }
  },

  async exportAllData(): Promise<any> {
    if (USE_MOCK) {
      await ensureGenerated()
      return {
        users,
        jobOrders,
        taskEntries,
        devices,
        export_date: new Date().toISOString()
      }
    }

    try {
      return await apiRequest<any>('/api/admin_export.php')
    } catch (error) {
      console.error('Export data error:', error)
      throw error
    }
  },

  async clearOldLogs(days: number = 90): Promise<boolean> {
    if (USE_MOCK) {
      return true
    }

    try {
      await apiRequest<any>(`/api/admin_activity.php?days=${days}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error('Clear logs error:', error)
      return false
    }
  },

  // Supervisor Notifications
  async getSupervisorNotifications(): Promise<any[]> {
    if (USE_MOCK) {
      await ensureGenerated()
      return [
        {
          id: '1',
          jobOrderId: 'JO-2024-001',
          technicianId: '3',
          technicianName: 'John Technician',
          taskId: '1',
          type: 'task_completion',
          message: 'Task completion submitted by technician for Job Order JO-2024-001. Operation: Assemblage I, Devices: 2, Time: 30 minutes',
          status: 'pending',
          createdAt: new Date().toISOString(),
          operationName: 'Assemblage I',
          devicesCompleted: 2,
          actualTimeMinutes: 30,
          efficiencyPercentage: 106.7,
          serialNumbers: ['SN001', 'SN002'],
          notes: 'Completed successfully',
          totalDevices: 10
        }
      ]
    }

    try {
      return await apiRequest<any[]>('/api/supervisor_notifications.php')
    } catch (error) {
      console.error('Get supervisor notifications error:', error)
      return []
    }
  },

  async updateSupervisorNotification(notificationId: string, action: 'read' | 'approve' | 'reject', comments?: string): Promise<boolean> {
    if (USE_MOCK) {
      return true
    }

    try {
      await apiRequest<any>('/api/supervisor_notifications.php', {
        method: 'PUT',
        body: JSON.stringify({
          notification_id: notificationId,
          action: action,
          comments: comments || ''
        })
      })
      return true
    } catch (error) {
      console.error('Update supervisor notification error:', error)
      return false
    }
  }
}

export default api
