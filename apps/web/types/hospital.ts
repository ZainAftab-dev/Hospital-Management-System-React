export type Role = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PHARMACIST' | 'STAFF';

export type HospitalUser = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Doctor' | 'Receptionist' | 'Pharmacist' | 'Staff';
  phone: string;
  department: string;
  joinDate: string;
  status: 'Active' | 'Inactive' | 'Suspended';
};

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  email?: string;
  address?: string;
  disease?: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  photoUrl?: string;
  status?: 'Stable' | 'Critical' | 'Emergency' | 'Under Observation' | 'Discharged';
};

export type Doctor = {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  email?: string;
  address?: string;
  specialization: string;
  qualification: string;
  availability: string;
  consultationFee: string;
  licenseNumber?: string;
};

export type Medicine = {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  priceCents: number;
  quantity: number;
  reorderLevel: number;
  description?: string;
  expiryDate?: string;
  batchNumber?: string;
  unit?: string;
};

export type CartItem = {
  medicine: Medicine;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
};

export type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type Invoice = {
  id: string;
  invoiceNo: string;
  patientId: string;
  patientName: string;
  status: 'PAID' | 'UNPAID' | 'DRAFT' | 'CANCELLED';
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMode?: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed';
  type?: string;
  notes?: string;
};
