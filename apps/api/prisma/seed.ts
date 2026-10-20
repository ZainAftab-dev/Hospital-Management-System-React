import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@zmhospital.com' },
    update: {
      phone: '0300-1112233',
      department: 'Administration',
      status: 'Active'
    },
    create: {
      name: 'Administrator',
      email: 'admin@zmhospital.com',
      passwordHash: await hash('Admin@12345', 12),
      role: 'ADMIN',
      phone: '0300-1112233',
      department: 'Administration',
      status: 'Active'
    }
  });

  await prisma.user.upsert({
    where: { email: 'pharmacy@zmhospital.com' },
    update: {
      phone: '0300-4455667',
      department: 'Pharmacy',
      status: 'Active'
    },
    create: {
      name: 'Pharmacy Desk',
      email: 'pharmacy@zmhospital.com',
      passwordHash: await hash('Pharmacy@12345', 12),
      role: 'PHARMACIST',
      phone: '0300-4455667',
      department: 'Pharmacy',
      status: 'Active'
    }
  });

  const users = [
    ['reception@zmhospital.com', 'Reception Desk', 'Reception@12345', 'RECEPTIONIST', '0321-9988776', 'Front Desk'],
    ['dr.aisha@zmhospital.com', 'Dr. Aisha Malik', 'Doctor@12345', 'DOCTOR', '0321-7788900', 'Gynecology'],
    ['staff@zmhospital.com', 'General Staff', 'Staff@12345', 'STAFF', '0312-5544332', 'Operations']
  ] as const;

  for (const [email, name, password, role, phone, department] of users) {
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

  const patients = [
    ['P001', 'Ahmed Raza', 45, 'Male', '0301-4478123', 'ahmed.raza@gmail.com', 'Model Town, Lahore', 'Hypertension', 'B+', 'N/A'],
    ['P002', 'Ayesha Malik', 32, 'Female', '0321-7782451', 'ayesha.malik@yahoo.com', 'DHA Phase 5, Lahore', 'Migraine', 'O+', 'Penicillin'],
    ['P003', 'Bilal Hussain', 27, 'Male', '0333-5569012', 'bilal.hussain@gmail.com', 'Gulshan-e-Iqbal, Karachi', 'Asthma', 'A+', 'Dust allergy'],
    ['P004', 'Fatima Noor', 54, 'Female', '0345-1129087', 'fatima.noor@hotmail.com', 'Satellite Town, Rawalpindi', 'Diabetes Type 2', 'AB+', 'N/A'],
    ['P005', 'Hassan Ali', 61, 'Male', '0300-6723419', 'hassan.ali@gmail.com', 'University Road, Peshawar', 'Cardiac follow-up', 'O-', 'Aspirin'],
    ['P006', 'Sana Tariq', 24, 'Female', '0312-2298754', 'sana.tariq@gmail.com', 'F-10, Islamabad', 'Anemia', 'A-', 'N/A'],
    ['P007', 'Usman Qureshi', 39, 'Male', '0336-9182745', 'usman.q@hotmail.com', 'Cantt, Multan', 'Back pain', 'B-', 'N/A'],
    ['P008', 'Zainab Shah', 29, 'Female', '0342-7812309', 'zainab.shah@gmail.com', 'Clifton, Karachi', 'Pregnancy checkup', 'O+', 'N/A'],
    ['P009', 'Imran Siddiqui', 48, 'Male', '0308-3345678', 'imran.siddiqui@yahoo.com', 'Saddar, Hyderabad', 'Gastritis', 'A+', 'Seafood allergy'],
    ['P010', 'Mariam Javed', 36, 'Female', '0320-9981234', 'mariam.javed@gmail.com', 'Johar Town, Lahore', 'Thyroid disorder', 'B+', 'N/A'],
    ['P011', 'Omar Farooq', 52, 'Male', '0315-4421987', 'omar.farooq@gmail.com', 'Bahria Town, Rawalpindi', 'Chronic kidney disease', 'AB-', 'Contrast dye'],
    ['P012', 'Hina Aslam', 41, 'Female', '0331-7156402', 'hina.aslam@hotmail.com', 'Nazimabad, Karachi', 'Arthritis', 'O+', 'Ibuprofen sensitivity'],
    ['P013', 'Tahir Mehmood', 58, 'Male', '0302-8706543', 'tahir.mehmood@yahoo.com', 'Samanabad, Faisalabad', 'COPD', 'A-', 'Smoke sensitivity'],
    ['P014', 'Nimra Khan', 18, 'Female', '0340-2233198', 'nimra.khan@gmail.com', 'Gulberg, Lahore', 'Tonsillitis', 'B+', 'N/A'],
    ['P015', 'Rashid Iqbal', 66, 'Male', '0309-6420175', 'rashid.iqbal@gmail.com', 'Quetta Cantt, Quetta', 'Stroke rehabilitation', 'O-', 'N/A'],
    ['P016', 'Mahnoor Sheikh', 21, 'Female', '0317-8845091', 'mahnoor.sheikh@gmail.com', 'North Nazimabad, Karachi', 'Acne treatment', 'AB+', 'N/A'],
    ['P017', 'Danish Akram', 34, 'Male', '0322-7198430', 'danish.akram@hotmail.com', 'Wapda Town, Lahore', 'Appendicitis review', 'A+', 'N/A'],
    ['P018', 'Sadia Bibi', 47, 'Female', '0334-1802765', 'sadia.bibi@gmail.com', 'Mardan Road, Peshawar', 'Gallstones', 'B-', 'Sulfa drugs'],
    ['P019', 'Kamran Butt', 43, 'Male', '0304-5654321', 'kamran.butt@yahoo.com', 'DHA Phase 2, Islamabad', 'High cholesterol', 'O+', 'N/A'],
    ['P020', 'Laiba Ahmed', 30, 'Female', '0346-9901235', 'laiba.ahmed@gmail.com', 'People Colony, Faisalabad', 'Dengue follow-up', 'A+', 'N/A']
  ] as const;

  for (const [id, name, age, gender, contact, email, address, disease, bloodGroup, allergies] of patients) {
    await prisma.patient.upsert({
      where: { id },
      update: { name, age, gender, contact, email, address, disease, bloodGroup, allergies },
      create: { id, name, age, gender, contact, email, address, disease, bloodGroup, allergies }
    });
  }

  const doctors = [
    ['D001', 'Dr. Muhammad Ali', 42, 'Male', '0300-1133557', 'dr.ali@zmhospital.com', 'Mall Road, Lahore', 'Cardiology', 'MBBS, FCPS Cardiology', 'yes', '2500'],
    ['D002', 'Dr. Aisha Malik', 38, 'Female', '0321-7788900', 'dr.aisha@zmhospital.com', 'DHA, Lahore', 'Gynecology', 'MBBS, FCPS Gynecology', 'yes', '2200'],
    ['D003', 'Dr. Imran Khan', 35, 'Male', '0333-1256789', 'dr.imran@zmhospital.com', 'Gulberg, Lahore', 'Orthopedics', 'MBBS, FCPS Orthopedics', 'no', '2300'],
    ['D004', 'Dr. Hira Nasir', 40, 'Female', '0345-4567890', 'dr.hira@zmhospital.com', 'Saddar, Lahore', 'General Surgery', 'MBBS, MS Surgery', 'yes', '2400'],
    ['D005', 'Dr. Salman Ahmed', 46, 'Male', '0302-9876501', 'dr.salman@zmhospital.com', 'Clifton, Karachi', 'Neurology', 'MBBS, FCPS Neurology', 'yes', '3000'],
    ['D006', 'Dr. Zohra Fatima', 36, 'Female', '0311-6543209', 'dr.zohra@zmhospital.com', 'Johar Town, Lahore', 'Pediatrics', 'MBBS, FCPS Pediatrics', 'yes', '1800'],
    ['D007', 'Dr. Usama Qureshi', 44, 'Male', '0336-7012345', 'dr.usama@zmhospital.com', 'F-8, Islamabad', 'ENT', 'MBBS, FCPS ENT', 'yes', '1800'],
    ['D008', 'Dr. Sana Javed', 39, 'Female', '0342-5098712', 'dr.sana@zmhospital.com', 'Gulshan-e-Iqbal, Karachi', 'Dermatology', 'MBBS, MCPS Dermatology', 'yes', '2000'],
    ['D009', 'Dr. Farhan Siddiqui', 50, 'Male', '0308-7766554', 'dr.farhan@zmhospital.com', 'Satellite Town, Rawalpindi', 'Urology', 'MBBS, FCPS Urology', 'no', '2600'],
    ['D010', 'Dr. Maryam Saeed', 37, 'Female', '0320-1122448', 'dr.maryam@zmhospital.com', 'Cantt, Multan', 'Psychiatry', 'MBBS, FCPS Psychiatry', 'yes', '2100'],
    ['D011', 'Dr. Nabeel Akhtar', 48, 'Male', '0315-2233449', 'dr.nabeel@zmhospital.com', 'University Road, Peshawar', 'Pulmonology', 'MBBS, FCPS Pulmonology', 'yes', '2500'],
    ['D012', 'Dr. Rabia Noor', 34, 'Female', '0331-9988772', 'dr.rabia@zmhospital.com', 'Bahria Town, Rawalpindi', 'Radiology', 'MBBS, FCPS Radiology', 'yes', '1700'],
    ['D013', 'Dr. Asad Mehmood', 53, 'Male', '0301-6677889', 'dr.asad@zmhospital.com', 'Samanabad, Faisalabad', 'Nephrology', 'MBBS, FCPS Nephrology', 'yes', '2800'],
    ['D014', 'Dr. Kinza Tariq', 33, 'Female', '0340-6655443', 'dr.kinza@zmhospital.com', 'DHA Phase 2, Islamabad', 'Endocrinology', 'MBBS, FCPS Medicine', 'yes', '2400'],
    ['D015', 'Dr. Faisal Raza', 45, 'Male', '0309-7788123', 'dr.faisal@zmhospital.com', 'Quetta Cantt, Quetta', 'Gastroenterology', 'MBBS, FCPS Gastroenterology', 'yes', '2600'],
    ['D016', 'Dr. Laiba Ahmed', 32, 'Female', '0317-3456781', 'dr.laiba@zmhospital.com', 'North Nazimabad, Karachi', 'Ophthalmology', 'MBBS, FCPS Ophthalmology', 'no', '1900'],
    ['D017', 'Dr. Hamza Butt', 41, 'Male', '0322-4567891', 'dr.hamza@zmhospital.com', 'Wapda Town, Lahore', 'Emergency Medicine', 'MBBS, MCPS Emergency Medicine', 'yes', '1600'],
    ['D018', 'Dr. Sadia Iqbal', 47, 'Female', '0334-7654320', 'dr.sadia@zmhospital.com', 'Hyderabad Saddar, Hyderabad', 'Oncology', 'MBBS, FCPS Oncology', 'yes', '3200'],
    ['D019', 'Dr. Kamran Shah', 43, 'Male', '0304-1239876', 'dr.kamran@zmhospital.com', 'People Colony, Faisalabad', 'Anesthesiology', 'MBBS, FCPS Anesthesia', 'yes', '1800'],
    ['D020', 'Dr. Nimra Aslam', 35, 'Female', '0346-5512309', 'dr.nimra@zmhospital.com', 'Model Town, Lahore', 'Family Medicine', 'MBBS, MRCGP Int.', 'yes', '1500']
  ] as const;

  for (const [id, name, age, gender, contact, email, address, specialization, qualification, availability, consultationFee] of doctors) {
    await prisma.doctor.upsert({
      where: { id },
      update: { name, age, gender, contact, email, address, specialization, qualification, availability, consultationFee },
      create: { id, name, age, gender, contact, email, address, specialization, qualification, availability, consultationFee }
    });
  }

  const appointments = [
    ['APT001', 'P001', 'D001', '2026-05-12', '10:00', 'Confirmed', 'Blood pressure follow-up'],
    ['APT002', 'P002', 'D005', '2026-05-12', '11:30', 'Pending', 'Migraine assessment'],
    ['APT003', 'P004', 'D014', '2026-05-13', '09:45', 'Confirmed', 'Diabetes review'],
    ['APT004', 'P008', 'D002', '2026-05-13', '14:00', 'Confirmed', 'Antenatal checkup'],
    ['APT005', 'P013', 'D011', '2026-05-14', '12:15', 'Pending', 'Breathing difficulty follow-up'],
    ['APT006', 'P016', 'D008', '2026-05-14', '15:30', 'Confirmed', 'Skin treatment review'],
    ['APT007', 'P018', 'D015', '2026-05-15', '10:30', 'Pending', 'Gallstone consultation'],
    ['APT008', 'P020', 'D017', '2026-05-15', '16:00', 'Confirmed', 'Dengue recovery follow-up']
  ] as const;

  for (const [id, patientId, doctorId, date, time, status, notes] of appointments) {
    await prisma.appointment.upsert({
      where: { id },
      update: { patientId, doctorId, date: new Date(date), time, status, notes },
      create: { id, patientId, doctorId, date: new Date(date), time, status, notes }
    });
  }

  const wards = [
    ['W001', 'ICU', 12, 11],
    ['W002', 'Cardiology', 25, 21],
    ['W003', 'General', 60, 46],
    ['W004', 'Pediatrics', 24, 14],
    ['W005', 'Maternity', 30, 14]
  ] as const;

  for (const [id, name, totalBeds, occupiedBeds] of wards) {
    await prisma.ward.upsert({
      where: { id },
      update: { name, totalBeds, occupiedBeds },
      create: { id, name, totalBeds, occupiedBeds }
    });
  }

  // Six vitals readings per patient for the first five patients, oldest first, two hours apart.
  const vitalsBase = [
    ['P001', 76, 132, 84, 97, 36.7],
    ['P002', 82, 118, 76, 98, 36.9],
    ['P003', 71, 124, 80, 99, 36.6],
    ['P004', 88, 140, 90, 96, 37.2],
    ['P005', 74, 116, 74, 98, 36.8]
  ] as const;
  const readingOffsets = [0, 2, -1, 3, 1, 0];
  const firstReading = new Date('2026-05-12T04:00:00Z');

  for (const [patientId, heartRate, systolic, diastolic, spo2, temperatureC] of vitalsBase) {
    const existing = await prisma.vital.count({ where: { patientId } });
    if (existing > 0) continue;
    await prisma.vital.createMany({
      data: readingOffsets.map((offset, index) => ({
        patientId,
        heartRate: heartRate + offset * 2,
        systolic: systolic + offset,
        diastolic: diastolic + Math.round(offset / 2),
        spo2,
        temperatureC: Math.round((temperatureC + offset * 0.05) * 10) / 10,
        recordedAt: new Date(firstReading.getTime() + index * 2 * 60 * 60 * 1000)
      }))
    });
  }

  const invoices = [
    ['B001', 'P001', 'PAID', 'Consultation Fee - Cardiology', 1, 250000],
    ['B002', 'P004', 'UNPAID', 'Diabetes Review and Lab Advice', 1, 240000],
    ['B003', 'P008', 'PAID', 'Gynecology Consultation', 1, 220000],
    ['B004', 'P013', 'UNPAID', 'Pulmonology Consultation', 1, 250000],
    ['B005', 'P020', 'DRAFT', 'Emergency Follow-up', 1, 160000]
  ] as const;

  for (const [invoiceNo, patientId, status, description, quantity, amountCents] of invoices) {
    const existing = await prisma.invoice.findUnique({ where: { invoiceNo } });
    if (!existing) {
      await prisma.invoice.create({
        data: {
          invoiceNo,
          patientId,
          status,
          subtotalCents: amountCents,
          discountCents: 0,
          taxCents: 0,
          totalCents: amountCents,
          items: {
            create: {
              description,
              quantity,
              unitPriceCents: amountCents,
              amountCents,
              sourceType: 'CONSULTATION'
            }
          }
        }
      });
    }
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
  ] as const;

  for (const [id, name, manufacturer, category, priceCents, quantity, description] of medicines) {
    await prisma.medicine.upsert({
      where: { id },
      update: { name, manufacturer, category, priceCents, quantity, reorderLevel: 20, description },
      create: { id, name, manufacturer, category, priceCents, quantity, reorderLevel: 20, description }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
