import type { Appointment, Doctor, Invoice, Medicine, Patient } from '@/types/hospital';

export const patients: Patient[] = [
  {
    id: 'P001',
    name: 'John Doe',
    age: 34,
    gender: 'Male',
    contact: '123-456-7890',
    email: 'john@example.com',
    address: 'Main Street, Lahore',
    disease: 'Follow-up',
    bloodGroup: 'O+',
    allergies: 'N/A'
  },
  {
    id: 'P1749894421320',
    name: 'Zain Ahmed',
    age: 19,
    gender: 'Male',
    contact: '037274859372',
    email: 'zain@gmail.com',
    address: 'Gulberg, Lahore',
    disease: 'Headache',
    bloodGroup: 'A+',
    allergies: 'Penicillin'
  },
  {
    id: 'P002',
    name: 'Sarah Khan',
    age: 28,
    gender: 'Female',
    contact: '042-5678-9012',
    email: 'sarah.khan@gmail.com',
    address: 'DHA Phase 5, Lahore',
    disease: 'Diabetes',
    bloodGroup: 'B+',
    allergies: 'N/A'
  },
  {
    id: 'P003',
    name: 'Ahmed Hassan',
    age: 45,
    gender: 'Male',
    contact: '03215-6789-123',
    email: 'ahmed.hassan@yahoo.com',
    address: 'Model Town, Lahore',
    disease: 'Hypertension',
    bloodGroup: 'AB+',
    allergies: 'Aspirin'
  },
  {
    id: 'P004',
    name: 'Fatima Malik',
    age: 32,
    gender: 'Female',
    contact: '03415-2345-678',
    email: 'fatima.malik@gmail.com',
    address: 'Iqbal Town, Lahore',
    disease: 'Thyroid',
    bloodGroup: 'O-',
    allergies: 'N/A'
  },
  {
    id: 'P005',
    name: 'Hassan Ali',
    age: 56,
    gender: 'Male',
    contact: '042-3456-7890',
    email: 'hassan.ali@hotmail.com',
    address: 'Sadar Bazaar, Lahore',
    disease: 'Cardiac Issue',
    bloodGroup: 'A-',
    allergies: 'Multiple Drug Allergies'
  }
];

export const doctors: Doctor[] = [
  {
    id: 'D1749897910328',
    name: 'Dr. Zohra Fatima',
    age: 36,
    gender: 'Female',
    contact: '03749-472-834',
    email: 'dr.zohra@zmhospital.com',
    address: 'Johar Town, Lahore',
    specialization: 'Neurology',
    qualification: 'MBBS, FCPS',
    availability: 'yes',
    consultationFee: '1600'
  },
  {
    id: 'D001',
    name: 'Dr. Muhammad Ali',
    age: 42,
    gender: 'Male',
    contact: '03215-678-9012',
    email: 'dr.ali@zmhospital.com',
    address: 'Mall Road, Lahore',
    specialization: 'Cardiology',
    qualification: 'MBBS, MD',
    availability: 'yes',
    consultationFee: '1500'
  },
  {
    id: 'D002',
    name: 'Dr. Aisha Malik',
    age: 38,
    gender: 'Female',
    contact: '03415-567-8901',
    email: 'dr.aisha@zmhospital.com',
    address: 'DHA, Lahore',
    specialization: 'Gynecology',
    qualification: 'MBBS, FCPS',
    availability: 'yes',
    consultationFee: '1200'
  },
  {
    id: 'D003',
    name: 'Dr. Imran Khan',
    age: 35,
    gender: 'Male',
    contact: '03315-789-0123',
    email: 'dr.imran@zmhospital.com',
    address: 'Gulberg, Lahore',
    specialization: 'Orthopedics',
    qualification: 'MBBS, FCPS',
    availability: 'no',
    consultationFee: '1800'
  },
  {
    id: 'D004',
    name: 'Dr. Hira Nasir',
    age: 40,
    gender: 'Female',
    contact: '03215-456-7890',
    email: 'dr.hira@zmhospital.com',
    address: 'Sadar Bazar, Lahore',
    specialization: 'General Surgery',
    qualification: 'MBBS, MS',
    availability: 'yes',
    consultationFee: '2000'
  }
];

export const medicines: Medicine[] = [
  {
    id: 'M001',
    name: 'Paracetamol',
    manufacturer: 'ABC Pharma',
    category: 'Pain Relief',
    priceCents: 599,
    quantity: 100,
    reorderLevel: 20,
    description: 'Pain relief medication'
  },
  {
    id: 'M002',
    name: 'Amoxicillin',
    manufacturer: 'XYZ Pharma',
    category: 'Antibiotics',
    priceCents: 1250,
    quantity: 50,
    reorderLevel: 20,
    description: 'Antibiotic capsule'
  },
  {
    id: 'M003',
    name: 'Ibuprofen',
    manufacturer: 'MNO Pharma',
    category: 'Pain Relief',
    priceCents: 725,
    quantity: 75,
    reorderLevel: 20,
    description: 'Anti-inflammatory tablet'
  },
  {
    id: 'M004',
    name: 'Cetirizine',
    manufacturer: 'PQR Pharma',
    category: 'Antihistamine',
    priceCents: 899,
    quantity: 60,
    reorderLevel: 20,
    description: 'Allergy relief tablet'
  },
  {
    id: 'M1749978705381',
    name: 'Diclofenac',
    manufacturer: 'HealWell Pharma',
    category: 'Pain Relief',
    priceCents: 675,
    quantity: 8,
    reorderLevel: 20,
    description: 'NSAID pain relief'
  },
  {
    id: 'M005',
    name: 'Metformin',
    manufacturer: 'Roche',
    category: 'Antidiabetic',
    priceCents: 450,
    quantity: 120,
    reorderLevel: 30,
    description: 'Diabetes management'
  },
  {
    id: 'M006',
    name: 'Lisinopril',
    manufacturer: 'Cipla',
    category: 'Antihypertensive',
    priceCents: 1100,
    quantity: 40,
    reorderLevel: 20,
    description: 'Blood pressure control'
  },
  {
    id: 'M007',
    name: 'Aspirin',
    manufacturer: 'Bayer',
    category: 'Antiplatelet',
    priceCents: 350,
    quantity: 200,
    reorderLevel: 50,
    description: 'Heart and blood vessel protection'
  }
];

export const invoices: Invoice[] = [
  {
    id: 'INV001',
    invoiceNo: 'B001',
    patientId: 'P001',
    patientName: 'John Doe',
    status: 'PAID',
    date: '16-06-2025',
    items: [
      { description: 'Consultation Fee', quantity: 1, unitPrice: 5000, amount: 5000 },
      { description: 'Medicine - Paracetamol', quantity: 2, unitPrice: 5.99, amount: 11.98 },
      { description: 'Blood Test', quantity: 1, unitPrice: 3500, amount: 3500 }
    ],
    subtotal: 8511.98,
    discount: 0,
    tax: 0,
    total: 8511.98
  },
  {
    id: 'INV002',
    invoiceNo: 'B002',
    patientId: 'P002',
    patientName: 'Sarah Khan',
    status: 'PAID',
    date: '18-06-2025',
    items: [
      { description: 'Consultation Fee', quantity: 1, unitPrice: 1500, amount: 1500 },
      { description: 'Medicine - Metformin', quantity: 1, unitPrice: 4.5, amount: 4.5 },
      { description: 'Lab Test - Blood Sugar', quantity: 1, unitPrice: 2500, amount: 2500 }
    ],
    subtotal: 4004.5,
    discount: 0,
    tax: 0,
    total: 4004.5
  },
  {
    id: 'INV003',
    invoiceNo: 'B003',
    patientId: 'P003',
    patientName: 'Ahmed Hassan',
    status: 'UNPAID',
    date: '20-06-2025',
    items: [
      { description: 'Consultation Fee', quantity: 1, unitPrice: 2000, amount: 2000 },
      { description: 'Medicine - Lisinopril', quantity: 1, unitPrice: 11, amount: 11 },
      { description: 'ECG Test', quantity: 1, unitPrice: 4000, amount: 4000 }
    ],
    subtotal: 6011,
    discount: 0,
    tax: 0,
    total: 6011
  }
];

export const appointments: Appointment[] = [
  {
    id: 'APT001',
    patientId: 'P001',
    patientName: 'John Doe',
    doctorId: 'D001',
    doctorName: 'Dr. Muhammad Ali',
    date: '2026-05-12',
    time: '10:00',
    status: 'Confirmed',
    notes: 'Follow-up for cardiac checkup'
  },
  {
    id: 'APT002',
    patientId: 'P002',
    patientName: 'Sarah Khan',
    doctorId: 'D002',
    doctorName: 'Dr. Aisha Malik',
    date: '2026-05-13',
    time: '14:00',
    status: 'Confirmed',
    notes: 'Diabetes management consultation'
  },
  {
    id: 'APT003',
    patientId: 'P003',
    patientName: 'Ahmed Hassan',
    doctorId: 'D001',
    doctorName: 'Dr. Muhammad Ali',
    date: '2026-05-14',
    time: '11:00',
    status: 'Pending',
    notes: 'Initial consultation for hypertension'
  }
];
