import type { Appointment, Dispensation, Doctor, HospitalUser, Invoice, Medicine, Patient, Vital, Ward } from '@/types/hospital';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

type DispensePayload = {
  patientId: string;
  invoiceId?: string;
  items: Array<{
    medicineId: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
};

/** Thrown when the API can't be reached: offline, asleep, or still starting up. */
export class ApiUnreachableError extends Error {
  constructor() {
    super(
      "Can't reach the HMS server. The demo server sleeps when nobody has used it for a while and takes about a minute to wake up. Please wait a moment and try again."
    );
    this.name = 'ApiUnreachableError';
  }
}

/** Resolves true when the API answers its health check within `timeoutMs`. */
export async function pingApi(timeoutMs = 8000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store', signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include'
    });
  } catch {
    throw new ApiUnreachableError();
  }

  // The hosting proxy answers 502/503/504 while the API is asleep or booting.
  if ([502, 503, 504].includes(response.status)) {
    throw new ApiUnreachableError();
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
    const text = await response.text();
    let human = text;
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json.message)) {
        human = json.message.join('\n');
      } else if (typeof json.message === 'string') {
        human = json.message;
      }
    } catch {
      // not JSON — use raw text as-is
    }
    throw new Error(human || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

type ApiInvoice = {
  id: string;
  invoiceNo: string;
  patientId: string;
  patient?: Patient;
  status: Invoice['status'];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  paymentMode?: string;
  createdAt: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    amountCents: number;
  }>;
};

type ApiAppointment = {
  id: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  date: string;
  time: string;
  status: Appointment['status'];
  type?: string;
  notes?: string;
};

type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  department?: string | null;
  status?: HospitalUser['status'];
  createdAt?: string;
};

function invoiceFromApi(invoice: ApiInvoice): Invoice {
  return {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    patientId: invoice.patientId,
    patientName: invoice.patient?.name ?? invoice.patientId,
    status: invoice.status,
    date: invoice.createdAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPriceCents / 100,
      amount: item.amountCents / 100
    })),
    subtotal: invoice.subtotalCents / 100,
    discount: invoice.discountCents / 100,
    tax: invoice.taxCents / 100,
    total: invoice.totalCents / 100,
    paymentMode: invoice.paymentMode
  };
}

function invoiceToApi(invoice: Partial<Invoice>) {
  const items = invoice.items?.length
    ? invoice.items
    : [{ description: 'Consultation Fee', quantity: 1, unitPrice: 1500, amount: 1500 }];
  return {
    invoiceNo: invoice.invoiceNo,
    patientId: invoice.patientId,
    status: invoice.status ?? 'DRAFT',
    discountCents: Math.round((invoice.discount ?? 0) * 100),
    taxCents: Math.round((invoice.tax ?? 0) * 100),
    paymentMode: invoice.paymentMode,
    items: items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: Math.round(item.unitPrice * 100),
      amountCents: Math.round(item.amount * 100),
      sourceType: 'MANUAL'
    }))
  };
}

function appointmentFromApi(appointment: ApiAppointment): Appointment {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    patientName: appointment.patient?.name ?? appointment.patientId,
    doctorId: appointment.doctorId,
    doctorName: appointment.doctor?.name ?? appointment.doctorId,
    date: appointment.date.slice(0, 10),
    time: appointment.time,
    status: appointment.status,
    type: appointment.type ?? 'In-Person',
    notes: appointment.notes
  };
}

function appointmentToApi(appointment: Partial<Appointment>) {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    date: appointment.date,
    time: appointment.time,
    status: appointment.status ?? 'Pending',
    type: appointment.type ?? 'In-Person',
    notes: appointment.notes
  };
}

function userRoleFromApi(role: string): HospitalUser['role'] {
  const roles: Record<string, HospitalUser['role']> = {
    ADMIN: 'Admin',
    DOCTOR: 'Doctor',
    RECEPTIONIST: 'Receptionist',
    PHARMACIST: 'Pharmacist',
    STAFF: 'Staff'
  };
  return roles[role] ?? 'Staff';
}

function userRoleToApi(role: HospitalUser['role']) {
  const roles: Record<HospitalUser['role'], string> = {
    Admin: 'ADMIN',
    Doctor: 'DOCTOR',
    Receptionist: 'RECEPTIONIST',
    Pharmacist: 'PHARMACIST',
    Staff: 'STAFF'
  };
  return roles[role];
}

function userFromApi(user: ApiUser): HospitalUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: userRoleFromApi(user.role),
    phone: user.phone ?? '',
    department: user.department ?? '',
    joinDate: user.createdAt ? user.createdAt.slice(0, 10) : '',
    status: user.status ?? 'Active'
  };
}

function userToApi(user: Partial<HospitalUser>) {
  return {
    name: user.name,
    email: user.email,
    role: user.role ? userRoleToApi(user.role) : 'STAFF',
    phone: user.phone,
    department: user.department,
    status: user.status ?? 'Active'
  };
}

export const hospitalApi = {
  login: (email: string, password: string) =>
    request<{ user: { id: string; name: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  me: () =>
    request<{ id: string; name: string; role: string; email: string }>('/auth/me'),
  patients: () => request<Patient[]>('/patients'),
  createPatient: (patient: Patient) =>
    request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(patient)
    }),
  updatePatient: (id: string, patient: Patient) =>
    request<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patient)
    }),
  deletePatient: (id: string) => request<Patient>(`/patients/${id}`, { method: 'DELETE' }),
  users: () => request<ApiUser[]>('/users').then((items) => items.map(userFromApi)),
  createUser: (user: HospitalUser, password?: string) =>
    request<ApiUser>('/users', {
      method: 'POST',
      body: JSON.stringify({ ...userToApi(user), ...(password ? { password } : {}) })
    }).then(userFromApi),
  updateUser: (id: string, user: HospitalUser, password?: string) =>
    request<ApiUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...userToApi(user), ...(password ? { password } : {}) })
    }).then(userFromApi),
  deleteUser: (id: string) => request<ApiUser>(`/users/${id}`, { method: 'DELETE' }).then(userFromApi),
  doctors: () => request<Doctor[]>('/doctors'),
  createDoctor: (doctor: Doctor) =>
    request<Doctor>('/doctors', {
      method: 'POST',
      body: JSON.stringify(doctor)
    }),
  updateDoctor: (id: string, doctor: Doctor) =>
    request<Doctor>(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctor)
    }),
  deleteDoctor: (id: string) => request<Doctor>(`/doctors/${id}`, { method: 'DELETE' }),
  appointments: () => request<ApiAppointment[]>('/appointments').then((items) => items.map(appointmentFromApi)),
  createAppointment: (appointment: Appointment) =>
    request<ApiAppointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentToApi(appointment))
    }).then(appointmentFromApi),
  updateAppointment: (id: string, appointment: Appointment) =>
    request<ApiAppointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentToApi(appointment))
    }).then(appointmentFromApi),
  deleteAppointment: (id: string) => request<ApiAppointment>(`/appointments/${id}`, { method: 'DELETE' }).then(appointmentFromApi),
  invoices: () => request<ApiInvoice[]>('/billing').then((items) => items.map(invoiceFromApi)),
  createInvoice: (invoice: Partial<Invoice>) =>
    request<ApiInvoice>('/billing', {
      method: 'POST',
      body: JSON.stringify(invoiceToApi(invoice))
    }).then(invoiceFromApi),
  updateInvoice: (id: string, invoice: Partial<Invoice>) =>
    request<ApiInvoice>(`/billing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceToApi(invoice))
    }).then(invoiceFromApi),
  updateInvoiceStatus: (id: string, status: Invoice['status']) =>
    request<ApiInvoice>(`/billing/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }).then(invoiceFromApi),
  deleteInvoice: (id: string) => request<ApiInvoice>(`/billing/${id}`, { method: 'DELETE' }).then(invoiceFromApi),
  medicines: (params: { search?: string; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    const suffix = query.toString() ? `?${query}` : '';
    return request<Medicine[]>(`/pharmacy/medicines${suffix}`);
  },
  createMedicine: (medicine: Medicine) =>
    request<Medicine>('/pharmacy/medicines', {
      method: 'POST',
      body: JSON.stringify(medicine)
    }),
  updateMedicine: (id: string, medicine: Medicine) =>
    request<Medicine>(`/pharmacy/medicines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(medicine)
    }),
  deleteMedicine: (id: string) => request<Medicine>(`/pharmacy/medicines/${id}`, { method: 'DELETE' }),
  dispense: (payload: DispensePayload) =>
    request<{ dispensation: unknown; invoice: ApiInvoice }>('/pharmacy/dispense', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then((result) => ({ ...result, invoice: invoiceFromApi(result.invoice) })),
  wards: () => request<Ward[]>('/wards'),
  updateWardOccupancy: (id: string, occupiedBeds: number) =>
    request<Ward>(`/wards/${id}/occupancy`, {
      method: 'PATCH',
      body: JSON.stringify({ occupiedBeds })
    }),
  vitals: (patientId: string, take = 12) => request<Vital[]>(`/patients/${encodeURIComponent(patientId)}/vitals?take=${take}`),
  recordVital: (patientId: string, vital: Omit<Vital, 'id' | 'patientId' | 'recordedAt'>) =>
    request<Vital>(`/patients/${encodeURIComponent(patientId)}/vitals`, {
      method: 'POST',
      body: JSON.stringify(vital)
    }),
  dispensations: (patientId?: string, take = 5) => {
    const query = new URLSearchParams({ take: String(take) });
    if (patientId) query.set('patientId', patientId);
    return request<Dispensation[]>(`/pharmacy/dispensations?${query}`);
  }
};
