export const Role = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  RECEPTIONIST: 'RECEPTIONIST',
  PHARMACIST: 'PHARMACIST',
  STAFF: 'STAFF'
} as const;

export type Role = (typeof Role)[keyof typeof Role];
