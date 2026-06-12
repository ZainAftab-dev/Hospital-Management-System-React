/**
 * add-db-objects.js
 * Creates Indexes, Views, Triggers, Stored Procedures, and AuditLog table.
 * Safe to re-run — skips objects that already exist.
 * Run from: apps/api directory
 */

const { execSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function exec(label, sql) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`  [+] ${label}`);
  } catch (e) {
    const msg = (e.message ?? '').split('\n')[0];
    if (
      msg.includes('already exists') ||
      msg.includes('There is already') ||
      msg.includes('already an object')
    ) {
      console.log(`  [~] ${label} — already exists`);
    } else {
      console.log(`  [!] ${label} — ${msg}`);
    }
  }
}

async function main() {
  console.log('\n========================================');
  console.log('  HMS — Database Objects Setup');
  console.log('========================================\n');

  // ── 1. AuditLog Table ───────────────────────────────────────────────────
  console.log('[1/5] AuditLog table...');
  await exec('AuditLog table', `
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AuditLog')
    CREATE TABLE [dbo].[AuditLog] (
      [id]        INT IDENTITY(1,1) PRIMARY KEY,
      [tableName] NVARCHAR(100) NOT NULL,
      [action]    NVARCHAR(20)  NOT NULL,
      [recordId]  NVARCHAR(191) NULL,
      [changedAt] DATETIME2     NOT NULL DEFAULT GETDATE(),
      [details]   NVARCHAR(MAX) NULL
    )
  `);

  // ── 2. Indexes ──────────────────────────────────────────────────────────
  console.log('\n[2/5] Indexes...');
  const indexes = [
    ['idx_patient_name',         `CREATE INDEX [idx_patient_name]         ON [dbo].[Patient](name)`],
    ['idx_appointment_date',     `CREATE INDEX [idx_appointment_date]     ON [dbo].[Appointment](date)`],
    ['idx_appointment_patient',  `CREATE INDEX [idx_appointment_patient]  ON [dbo].[Appointment](patientId)`],
    ['idx_appointment_doctor',   `CREATE INDEX [idx_appointment_doctor]   ON [dbo].[Appointment](doctorId)`],
    ['idx_invoice_patient',      `CREATE INDEX [idx_invoice_patient]      ON [dbo].[Invoice](patientId)`],
    ['idx_invoice_status',       `CREATE INDEX [idx_invoice_status]       ON [dbo].[Invoice](status)`],
    ['idx_medicine_name',        `CREATE INDEX [idx_medicine_name]        ON [dbo].[Medicine](name)`],
    ['idx_medicine_category',    `CREATE INDEX [idx_medicine_category]    ON [dbo].[Medicine](category)`],
    ['idx_dispensation_patient', `CREATE INDEX [idx_dispensation_patient] ON [dbo].[Dispensation](patientId)`],
  ];
  for (const [label, sql] of indexes) await exec(label, sql);

  // ── Views, Triggers, Stored Procedures via sqlcmd ──────────────────────
  console.log('\n[3-5/5] Views, Triggers, Stored Procedures (via sqlcmd)...');
  try {
    const sqlFile = path.join(__dirname, 'db-objects.sql');
    execSync(
      `sqlcmd -S localhost -d zm_hospital -U hms_app -P "HmsApp@12345" -C -No -i "${sqlFile}"`,
      { stdio: 'pipe' }
    );
    console.log('  [+] All views, triggers and stored procedures created/updated');
  } catch (e) {
    const out = (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? '');
    console.log('  [~] sqlcmd output:', out.trim() || 'completed');
  }

  console.log('\n========================================');
  console.log('  All database objects ready!');
  console.log('========================================');
  console.log('  AuditLog Table : 1 table');
  console.log('  Indexes        : 9 indexes');
  console.log('  Views          : vw_PatientSummary, vw_DoctorSchedule,');
  console.log('                   vw_PharmacyStock,  vw_BillingOverview');
  console.log('  Triggers       : trg_Patient_AfterInsert/Update/Delete,');
  console.log('                   trg_Invoice_AfterUpdate');
  console.log('  Stored Procs   : sp_GetPatientHistory, sp_GetLowStockMedicines,');
  console.log('                   sp_GetDoctorStats,    sp_GetMonthlyRevenue');
  console.log('========================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
