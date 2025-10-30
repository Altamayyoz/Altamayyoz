export type Role = 'Admin' | 'ProductionWorker' | 'Supervisor' | 'PlanningEngineer' | 'TestPersonnel' | 'QualityInspector' | 'Technician'

export type User = {
  id: string
  name: string
  username: string
  role: Role
  avatar?: string
}

export type JobOrder = {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'completed' | 'on_hold'
  progress: number
  assignedTo: string[]
  devices: string[]
  createdAt: string
  updatedAt?: string
  dueDate?: string
  priority?: 'Critical' | 'High' | 'Medium' | 'Low'
  assignedSupervisor?: string
  assignedTechnicians?: string[]
  totalDevices?: number
  completedDevices?: number
  [key: string]: any // Allow additional properties for dashboard extensions
}

export type TaskEntry = {
  id: string
  jobOrderId: string
  operationId: string
  technicianId: string
  serialNumbers?: string[]
  startTime: string
  endTime?: string
  standardTime: number
  actualTime?: number
  notes?: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
}

export type ProductionWorkLog = {
  id: string
  jobOrderId: string
  workerId: string
  stage: 'sub_assembly' | 'installation' | 'final_touch' | 'packing'
  taskName: string
  deviceId: string
  serialNumber: string
  startTime: string
  endTime?: string
  standardTime: number
  actualTime?: number
  notes?: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  createdAt: string
}

export type TestLog = {
  id: string
  jobOrderId: string
  testPersonnelId: string
  deviceId: string
  serialNumber: string
  testType: 'nitrogen' | 'immersion' | 'ess' | 'control_unit' | 'adjustment'
  testResult: 'pass' | 'fail' | 'needs_review'
  measurements?: Record<string, any>
  notes?: string
  testDate: string
  createdAt: string
}

export type QualityInspection = {
  id: string
  jobOrderId: string
  inspectorId: string
  deviceId: string
  serialNumber: string
  inspectionPoint: 'after_sub_assembly' | 'after_installation' | 'after_test' | 'final'
  result: 'pass' | 'fail' | 'rework_required' | 'pending'
  defectsFound?: string[]
  notes?: string
  inspectionDate: string
  createdAt: string
}

export type Device = {
  id: string
  serialNumber: string
  jobOrderId: string
  currentStage: 'sub_assembly' | 'installation' | 'testing' | 'final_touch' | 'packing' | 'completed'
  qualityStatus: 'pending' | 'pass' | 'fail' | 'under_review'
  assignedTo?: string[]
  createdAt: string
  updatedAt?: string
}

export type TaskCompletion = {
  id: string
  jobOrderId: string
  technicianId: string
  operation: string
  actualTimeMinutes: number
  standardTimeMinutes: number
  efficiencyPercentage: number
  serialNumbers: string[]
  notes: string
  files: TaskCompletionFile[]
  status: 'submitted' | 'approved' | 'rejected'
  createdAt: string
}

export type TaskCompletionFile = {
  id: string
  originalName: string
  storedName: string
  path: string
  size: number
  uploadedAt: string
}
