import { UserRole } from '@/backend/action_utils.type'

export const ADMIN_ONLY = [UserRole.ADMIN] as const
export const STAFF_ROLES = [UserRole.ADMIN, UserRole.SUB_ADMIN] as const

export const isBackendStaffRole = (role: unknown): boolean =>
  STAFF_ROLES.some(candidate => candidate === String(role))
