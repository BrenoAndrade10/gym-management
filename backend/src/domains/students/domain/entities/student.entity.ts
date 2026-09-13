export enum StudentStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate?: string;
  enrollmentDate: string;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
}
