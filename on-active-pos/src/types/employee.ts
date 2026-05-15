export type EmployeeRole = 'salesman' | 'till_operator' | 'supervisor' | 'manager' | 'admin';

export interface Employee {
  id: string;
  store_id: string;
  full_name: string;
  role: EmployeeRole;
  email?: string;
  phone?: string;
  is_active: boolean;
}

// Roles that see the TILL layout
export const TILL_ROLES: EmployeeRole[] = ['till_operator', 'supervisor', 'manager', 'admin'];
// Roles that see the SALESMAN layout
export const SALESMAN_ROLES: EmployeeRole[] = ['salesman'];

export function isTillRole(role: EmployeeRole): boolean {
  return TILL_ROLES.includes(role);
}

export function isSalesmanRole(role: EmployeeRole): boolean {
  return SALESMAN_ROLES.includes(role);
}
