export enum UserRole {
  Teacher = 'teacher',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
