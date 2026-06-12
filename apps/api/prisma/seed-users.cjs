const { hash } = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
}

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('encrypt=false', 'encrypt=DANGER_PLAINTEXT');
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function upsertUser({ email, name, password, role, phone, department }) {
  await prisma.user.upsert({
    where: { email },
    update: { name, role, phone, department, status: 'Active' },
    create: {
      name,
      email,
      passwordHash: await hash(password, 12),
      role,
      phone,
      department,
      status: 'Active'
    }
  });
}

const medicines = [
  ['M001', 'Paracetamol 500mg', 'GSK Pakistan', 'Pain Relief', 12000, 180, 'Fever and mild pain tablet'],
  ['M002', 'Amoxicillin 500mg', 'Sami Pharma', 'Antibiotics', 28000, 90, 'Broad-spectrum antibiotic capsule'],
  ['M003', 'Ibuprofen 400mg', 'High-Q Pharma', 'Pain Relief', 18000, 110, 'Anti-inflammatory pain tablet'],
  ['M004', 'Cetirizine 10mg', 'Getz Pharma', 'Antihistamine', 9500, 140, 'Allergy relief tablet'],
  ['M005', 'Diclofenac 50mg', 'Hilton Pharma', 'Pain Relief', 15000, 75, 'NSAID pain relief tablet'],
  ['M006', 'Azithromycin 250mg', 'Searle', 'Antibiotics', 42000, 65, 'Macrolide antibiotic tablet'],
  ['M007', 'Cefixime 400mg', 'Martin Dow', 'Antibiotics', 52000, 55, 'Cephalosporin antibiotic capsule'],
  ['M008', 'Metformin 500mg', 'Getz Pharma', 'Diabetes', 16000, 130, 'Blood sugar control tablet'],
  ['M009', 'Glimepiride 2mg', 'Sami Pharma', 'Diabetes', 21000, 100, 'Diabetes management tablet'],
  ['M010', 'Insulin Regular 10ml', 'Lilly Pakistan', 'Diabetes', 125000, 35, 'Injectable insulin vial'],
  ['M011', 'Amlodipine 5mg', 'CCL Pharma', 'Cardiology', 14500, 120, 'Blood pressure control tablet'],
  ['M012', 'Losartan 50mg', 'PharmEvo', 'Cardiology', 22000, 95, 'Hypertension management tablet'],
  ['M013', 'Atorvastatin 20mg', 'Getz Pharma', 'Cardiology', 30000, 85, 'Cholesterol lowering tablet'],
  ['M014', 'Aspirin 75mg', 'Bayer Pakistan', 'Cardiology', 8000, 160, 'Antiplatelet tablet'],
  ['M015', 'Omeprazole 20mg', 'OBS Pharma', 'Gastroenterology', 19000, 115, 'Acidity and reflux capsule'],
  ['M016', 'Esomeprazole 40mg', 'Searle', 'Gastroenterology', 33000, 70, 'Proton pump inhibitor capsule'],
  ['M017', 'Domperidone 10mg', 'High-Q Pharma', 'Gastroenterology', 11000, 100, 'Nausea relief tablet'],
  ['M018', 'ORS Sachet', 'Ferozsons', 'Emergency', 3500, 220, 'Oral rehydration salts'],
  ['M019', 'Salbutamol Inhaler', 'GSK Pakistan', 'Respiratory', 45000, 60, 'Asthma rescue inhaler'],
  ['M020', 'Montelukast 10mg', 'PharmEvo', 'Respiratory', 28000, 80, 'Asthma and allergy tablet'],
  ['M021', 'Budesonide Nebulizer', 'Sami Pharma', 'Respiratory', 68000, 45, 'Nebulizer solution ampoules'],
  ['M022', 'Iron Folic Acid', 'Wilsons Pharma', 'Supplements', 9000, 150, 'Iron and folate supplement'],
  ['M023', 'Calcium Vitamin D3', 'Getz Pharma', 'Supplements', 24000, 125, 'Bone health supplement'],
  ['M024', 'Vitamin C 500mg', 'Martin Dow', 'Supplements', 12000, 140, 'Immune support tablet'],
  ['M025', 'Loratadine 10mg', 'Hilton Pharma', 'Antihistamine', 13000, 90, 'Non-drowsy allergy tablet'],
  ['M026', 'Hydrocortisone Cream', 'Searle', 'Dermatology', 17500, 70, 'Skin inflammation cream'],
  ['M027', 'Clotrimazole Cream', 'CCL Pharma', 'Dermatology', 16000, 65, 'Antifungal skin cream'],
  ['M028', 'Povidone Iodine Solution', 'Brookes Pharma', 'Emergency', 22000, 75, 'Antiseptic wound solution'],
  ['M029', 'Normal Saline 500ml', 'Otsuka Pakistan', 'Emergency', 18000, 95, 'IV fluid bottle'],
  ['M030', 'Lactulose Syrup', 'Abbott Pakistan', 'Gastroenterology', 26000, 55, 'Constipation relief syrup']
];

async function seedMedicines() {
  const medicineIds = medicines.map(([id]) => id);

  for (const [id, name, manufacturer, category, priceCents, quantity, description] of medicines) {
    await prisma.medicine.upsert({
      where: { id },
      update: { name, manufacturer, category, priceCents, quantity, reorderLevel: 20, description },
      create: { id, name, manufacturer, category, priceCents, quantity, reorderLevel: 20, description }
    });
  }

  await prisma.medicine.deleteMany({
    where: {
      id: { notIn: medicineIds }
    }
  });
}

async function main() {
  await upsertUser({
    email: 'admin@zmhospital.com',
    name: 'Administrator',
    password: 'Admin@12345',
    role: 'ADMIN',
    phone: '0300-1112233',
    department: 'Administration'
  });

  await upsertUser({
    email: 'pharmacy@zmhospital.com',
    name: 'Pharmacy Desk',
    password: 'Pharmacy@12345',
    role: 'PHARMACIST',
    phone: '0300-4455667',
    department: 'Pharmacy'
  });

  await upsertUser({
    email: 'reception@zmhospital.com',
    name: 'Reception Desk',
    password: 'Reception@12345',
    role: 'RECEPTIONIST',
    phone: '0321-9988776',
    department: 'Front Desk'
  });

  await upsertUser({
    email: 'dr.aisha@zmhospital.com',
    name: 'Dr. Aisha Malik',
    password: 'Doctor@12345',
    role: 'DOCTOR',
    phone: '0321-7788900',
    department: 'Gynecology'
  });

  await upsertUser({
    email: 'staff@zmhospital.com',
    name: 'General Staff',
    password: 'Staff@12345',
    role: 'STAFF',
    phone: '0312-5544332',
    department: 'Operations'
  });

  await seedMedicines();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
